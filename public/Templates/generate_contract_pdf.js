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

const data = require('./contract_data.json');

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
