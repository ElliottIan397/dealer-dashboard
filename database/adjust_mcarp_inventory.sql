CREATE OR REPLACE FUNCTION adjust_mcarp_inventory(
  p_monitor text,
  p_serial_number text,
  p_color text,
  p_corrected_qty integer,
  p_reason text,
  p_source text DEFAULT 'MCARP_DASHBOARD'
)
RETURNS TABLE(
  old_qty integer,
  new_qty integer,
  adjustment_qty integer,
  transaction_id bigint,
  fulfillment_requirement_id bigint,
  queue_action text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_inventory device_inventory%ROWTYPE;
  v_request ekm_consumable_requests%ROWTYPE;
  v_old_qty integer;
  v_delta integer;
  v_transaction_id bigint;
  v_requirement_id bigint;
  v_requirement_status text;
  v_requirement_reason text;
  v_already_queued boolean;
  v_queue_action text := 'NONE';
BEGIN
  p_monitor := NULLIF(BTRIM(p_monitor), '');
  p_serial_number := NULLIF(BTRIM(p_serial_number), '');
  p_color := INITCAP(NULLIF(BTRIM(p_color), ''));
  p_reason := NULLIF(BTRIM(p_reason), '');
  p_source := COALESCE(NULLIF(BTRIM(p_source), ''), 'MCARP_DASHBOARD');

  IF p_monitor IS NULL
     OR p_serial_number IS NULL
     OR p_color IS NULL
     OR p_reason IS NULL THEN
    RAISE EXCEPTION
      'monitor, serial number, color and adjustment reason are required';
  END IF;

  IF p_corrected_qty IS NULL OR p_corrected_qty < 0 THEN
    RAISE EXCEPTION
      'corrected quantity must be a whole number of zero or greater';
  END IF;

  SELECT di.*
    INTO v_inventory
  FROM device_inventory di
  WHERE di.monitor = p_monitor
    AND di.serial_number = p_serial_number
    AND LOWER(di.color) = LOWER(p_color)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Inventory position not found for monitor %, serial %, color %',
      p_monitor, p_serial_number, p_color;
  END IF;

  v_old_qty := v_inventory.on_hand_qty;
  v_delta := p_corrected_qty - v_old_qty;

  IF v_delta = 0 THEN
    RETURN QUERY
    SELECT
      v_old_qty,
      p_corrected_qty,
      0,
      NULL::bigint,
      NULL::bigint,
      'NO_CHANGE'::text;
    RETURN;
  END IF;

  INSERT INTO inventory_transactions (
    monitor,
    serial_number,
    color,
    sku,
    event_type,
    quantity,
    event_date,
    source,
    reference
  ) VALUES (
    v_inventory.monitor,
    v_inventory.serial_number,
    v_inventory.color,
    v_inventory.sku,
    'ADJUSTMENT',
    v_delta,
    NOW(),
    p_source,
    LEFT(
      'Inventory adjustment: '
      || v_old_qty
      || ' -> '
      || p_corrected_qty
      || ' | '
      || p_reason,
      255
    )
  )
  RETURNING id INTO v_transaction_id;

  UPDATE device_inventory di
  SET on_hand_qty = p_corrected_qty,
      reconciliation_required = false,
      updated_at = NOW()
  WHERE di.id = v_inventory.id;

  IF p_corrected_qty > 0 THEN
    WITH cancelled AS (
      UPDATE fulfillment_requirements fr
      SET status = 'CANCELLED',
          reason = CONCAT_WS(
            ' | ',
            NULLIF(fr.reason, ''),
            'Inventory adjustment raised on-hand above zero'
          ),
          updated_at = NOW()
      WHERE fr.monitor = p_monitor
        AND fr.serial_number = p_serial_number
        AND LOWER(fr.color) = LOWER(p_color)
        AND fr.status IN ('PENDING_REVIEW', 'HELD')
      RETURNING fr.id
    )
    SELECT MAX(id)
      INTO v_requirement_id
    FROM cancelled;

    IF v_requirement_id IS NULL THEN
      v_queue_action := 'NO_OPEN_REQUIREMENT';
    ELSE
      v_queue_action := 'CANCELLED_OPEN_REQUIREMENT';
    END IF;

  ELSE
    SELECT e.*
      INTO v_request
    FROM ekm_consumable_requests e
    WHERE e.monitor = p_monitor
      AND e.serial_number = p_serial_number
      AND LOWER(e.color) = LOWER(p_color)
      AND e.is_current = true
      AND e.replaced_at IS NULL
    ORDER BY e.request_date DESC, e.id DESC
    LIMIT 1;

    IF NOT FOUND THEN
      v_queue_action := 'NO_CURRENT_EKM_REQUEST';

    ELSIF v_request.fulfillment_requirement_id IS NOT NULL THEN
      SELECT fr.status, fr.reason
        INTO v_requirement_status, v_requirement_reason
      FROM fulfillment_requirements fr
      WHERE fr.id = v_request.fulfillment_requirement_id;

      v_requirement_id := v_request.fulfillment_requirement_id;

      IF v_requirement_status = 'CANCELLED'
         AND v_requirement_reason LIKE
           '%Inventory adjustment raised on-hand above zero%' THEN
        UPDATE fulfillment_requirements fr
        SET status = 'PENDING_REVIEW',
            reason = CONCAT_WS(
              ' | ',
              NULLIF(fr.reason, ''),
              'Reopened after inventory adjustment reduced on-hand to zero'
            ),
            updated_at = NOW()
        WHERE fr.id = v_requirement_id;

        v_queue_action := 'REOPENED_REQUIREMENT';
      ELSE
        v_queue_action := 'REQUIREMENT_ALREADY_LINKED';
      END IF;

    ELSE
      BEGIN
        SELECT
          q.requirement_id,
          q.already_queued
        INTO
          v_requirement_id,
          v_already_queued
        FROM queue_fulfillment_requirement(
          p_monitor => v_request.monitor,
          p_serial_number => v_request.serial_number,
          p_color => v_request.color,
          p_detected_sku => COALESCE(
            NULLIF(BTRIM(v_request.order_sku), ''),
            v_inventory.sku
          ),
          p_source_reference => v_request.source_reference,
          p_triggered_at => v_request.request_date,
          p_needed_by_date => CASE
            WHEN v_request.request_days_left IS NULL THEN NULL
            ELSE v_request.request_date::date
              + GREATEST(
                  0,
                  ROUND(v_request.request_days_left)::integer
                )
          END,
          p_reason => COALESCE(
            NULLIF(BTRIM(v_request.request_reason), ''),
            'EKM replenishment requirement'
          ),
          p_source => 'EKM_CONSUMABLE_REQUEST',
          p_recommended_sku => COALESCE(
            NULLIF(BTRIM(v_request.order_sku), ''),
            v_inventory.sku
          ),
          p_quantity => 1
        ) q;

        UPDATE fulfillment_requirements fr
        SET source_order_description = v_request.order_description,
            source_request_level = v_request.request_level,
            source_request_days_left = v_request.request_days_left,
            updated_at = NOW()
        WHERE fr.id = v_requirement_id;

        UPDATE ekm_consumable_requests e
        SET fulfillment_requirement_id = v_requirement_id,
            queue_error = NULL,
            updated_at = NOW()
        WHERE e.id = v_request.id;

        v_queue_action := CASE
          WHEN v_already_queued THEN 'REQUIREMENT_ALREADY_QUEUED'
          ELSE 'QUEUED_REQUIREMENT'
        END;

      EXCEPTION WHEN OTHERS THEN
        UPDATE ekm_consumable_requests e
        SET queue_error = SQLERRM,
            updated_at = NOW()
        WHERE e.id = v_request.id;

        v_queue_action := 'QUEUE_ERROR: ' || SQLERRM;
      END;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_old_qty,
    p_corrected_qty,
    v_delta,
    v_transaction_id,
    v_requirement_id,
    v_queue_action;
END;
$function$;
