import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { NextApiRequest, NextApiResponse } from 'next';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    // Calculate Volume
    const devices = (data.Devices_Table || []).map((d: any) => ({
      ...d,
      Volume: (d.Black_Annual_Volume ?? 0) + (d.Color_Annual_Volume ?? 0),
    })).sort((a: any, b: any) => b.Volume - a.Volume);

    data.Devices_Table = devices;

    // Load HTML template
    const templatePath = path.join(process.cwd(), 'public', 'Templates', 'contract_template_minimal.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    // Compile and inject
    const template = handlebars.compile(templateHtml);
    const html = template(data);

    // Launch Puppeteer in serverless-compatible mode
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'letter', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Subscription_Contract.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}