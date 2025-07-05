const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

async function generatePDF() {
  // Load HTML template
  const templatePath = path.join(__dirname, 'contract_template_minimal.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Compile with Handlebars
  const template = handlebars.compile(templateHtml);

  // Sample data (normally injected from dashboard)
  const data = {
    Customer_Name: "Acme Corp",
    Dealer_Name: "Best Dealers Inc.",
    Rep_Name: "Jane Doe",
    Start_Date: "2025-07-01",
    Contract_Effective_Date: "2025-07-01",
    Monthly_Subscription_Fee: "299.99",
    includeDCA: true,
    includeJITR: true,
    includeQR: false,
    includeESW: true,
    Devices_Table: [
      { Model: "HP LaserJet Pro M404n", Serial: "SN123456", Volume: "25,000" },
      { Model: "Canon iR-ADV C3530i", Serial: "CN789012", Volume: "15,000" }
    ],
    Guardrails_Table: [
      ["Max Devices", "10"],
      ["Min Devices", "2"],
      ["Max Monthly Volume", "50,000 pages"],
      ["Min Monthly Volume", "10,000 pages"]
    ]
  };

  // Inject data
  const html = template(data);

  // Launch Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: 'Subscription_Contract.pdf', format: 'letter', printBackground: true });
  await browser.close();

  console.log('✅ PDF generated: Subscription_Contract.pdf');
}

generatePDF().catch(console.error);
