import axios from 'axios';
import jwt from 'jsonwebtoken';
const fs = require('fs-extra');
import path from 'path';
import { gunzipSync } from 'zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = 9221;

app.get('/generate-report', async (req, res) => {
  try {
    await getApps(); // Assuming getApps is the function that generates the report
    res.status(200).send('Report generated successfully');
  } catch (error) {
    res.status(500).send('Error generating report');
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const ISSUER_ID = process.env.ISSUER_ID;
const KEY_ID = process.env.KEY_ID;
const VENDOR_NUMBER = process.env.VENDOR_NUMBER;
const PRIVATE_KEY_PATH = path.join(__dirname, `AuthKey_${KEY_ID}.p8`); // Path to your .p8 private key file
const API_BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

let payload = {
    "iss": ISSUER_ID,
    "iat": Math.round((new Date()).getTime() / 1000),
    "exp": Math.round((new Date()).getTime() / 1000) + 1199,
    "aud": "appstoreconnect-v1"
}

// Generate the JWT
const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  header: {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT'
  },
});

// Function to make a request to the App Store Connect API
// Cosmofy: XXXXXXXXXX
let frequency = 'WEEKLY'
let reportDate = '2024-06-09'
const getApps = async () => {

  try {
    const response = await axios.get(`${API_BASE_URL}/salesReports`, {
      params: {
        'filter[frequency]': frequency,
        'filter[reportDate]': reportDate,
        'filter[reportSubType]': 'SUMMARY',
        'filter[reportType]': 'SALES',
        'filter[vendorNumber]': VENDOR_NUMBER
      },
      headers: {
        'Accept': 'application/a-gzip, application/json',
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer' // Important for handling binary data
    });

    // Define the directory where you want to save the sales reports
    const directoryPath = path.join(__dirname, `sales-reports`);
    await fs.ensureDir(directoryPath); // Ensure the directory exists

     // Extract the gzip file and save the contents to a text file
    const extractedData = gunzipSync(response.data).toString();
    
    /** txt 
    const reportFilePath = path.join(directoryPath, `SALES-REPORT-${frequency}-${reportDate}.txt`);
    await fs.writeFile(reportFilePath, extractedData);
    console.log(`Sales report saved successfully to ${reportFilePath}`);
    **/
    
    // Create a PDF from the extracted data
    let downloads = await createPdf(extractedData, path.join(directoryPath, `SALES-REPORT-${frequency}-${reportDate}.pdf`));
    console.log(`SUCCESS 200: SALES-REPORT-${frequency}-${reportDate}.pdf`);
//    console.log(`Total Downloads: ${downloads}`);

  } catch (error) {
    console.error('Error fetching apps:', error);
  }
};

// Function to create a PDF from the extracted data
const createPdf = async (data: string, pdfPath: string) => {

  const lines = data.split('\n');
  const formUrl = 'https://arryan.xyz/pdf/SalesInvoiceForm.pdf'
  const newDocument = await PDFDocument.create();
  const font = await newDocument.embedFont(StandardFonts.Helvetica);
  const fontSize = 10; // Set the desired font size here
  
  
  let index = 0
  let downloads = 0
  for (let line of lines) {
    if (line.trim() === '') continue; // Skip empty lines
    if (index > 0) {
      const response = await axios.get(formUrl, { responseType: 'arraybuffer' });
      const bytes = response.data;
      const content = await PDFDocument.load(bytes);
      
      /** Start Edit **/
      const form = content.getForm()
      const fields = line.split('\t');
      
      const BEGIN = form.getTextField('BEGIN')
      const END = form.getTextField('END')
      const PLATFORM = form.getTextField('PLATFORM')
      const PLATFORMS = form.getTextField('PLATFORMS')
      const IDENTIFIER = form.getTextField('IDENTIFIER')
      const TYPE = form.getTextField('TYPE')
      const DESCRIPTION = form.getTextField('DESCRIPTION')
      const QUANTITY = form.getTextField('QUANTITY')
      const VERSION = form.getTextField('VERSION')
      const PRODUCT_DESCRIPTION = form.getTextField('PRODUCT_DESCRIPTION')
      const CUSTOMER_CURRENCY = form.getTextField('CUSTOMER_CURRENCY')
      const COUNTRY_CODE = form.getTextField('COUNTRY_CODE')
      const CURRENCY_OF_PROCEEDS = form.getTextField('CURRENCY_OF_PROCEEDS')
      
      const fieldsArray = [BEGIN, END, PLATFORM, PLATFORMS, IDENTIFIER, TYPE, DESCRIPTION, QUANTITY, VERSION, PRODUCT_DESCRIPTION, CUSTOMER_CURRENCY, COUNTRY_CODE, CURRENCY_OF_PROCEEDS];
      fieldsArray.forEach(field => {
        field.updateAppearances(font);
        field.setFontSize(fontSize);
      });
      
      const productInfo = getProductTypeInfo(fields[6]);
      
      if (productInfo) {
        if (productInfo.type == 'Free or paid app') {
          downloads++
        } else if (productInfo.type == 'Re-download') {
          downloads++
        }
        TYPE.setText(productInfo.type)
        DESCRIPTION.setText(productInfo.description)
      }
      
      PRODUCT_DESCRIPTION.setText(`${fields[4]} - ${fields[20]}`)
      VERSION.setText(fields[5])
      IDENTIFIER.setText(fields[6])
      QUANTITY.setText(fields[7])
      BEGIN.setText(fields[9])
      END.setText(fields[10])
      CUSTOMER_CURRENCY.setText(fields[11])
      COUNTRY_CODE.setText(fields[12])
      CURRENCY_OF_PROCEEDS.setText(fields[13])
      PLATFORM.setText(fields[22])
      PLATFORMS.setText(fields[23])
      /** End Edit **/
      
      const [page] = await newDocument.copyPages(content, [0])
      newDocument.addPage(page)
    }
    index++
  }
  
  const pdfBytes = await newDocument.save()
  await fs.writeFile(pdfPath, pdfBytes);
  return downloads
};


type ProductTypeInfo = {
  type: string;
  description: string;
};

const productTypes: Record<string, ProductTypeInfo> = {
  '1': { type: 'Free or paid app', description: 'iOS, iPadOS, visionOS, watchOS' },
  '1-B': { type: 'App Bundle', description: 'iOS, iPadOS, visionOS app bundle' },
  'F1-B': { type: 'App Bundle', description: 'Mac app bundle' },
  '1E': { type: 'Paid app', description: 'Custom iOS app' },
  '1EP': { type: 'Paid app', description: 'Custom iPadOS app' },
  '1EU': { type: 'Paid app', description: 'Custom universal app' },
  '1F': { type: 'Free or paid app', description: 'Universal app, excluding tvOS' },
  '1T': { type: 'Free or paid app', description: 'iPad apps' },
  '3': { type: 'Re-download', description: 'App update (iOS, tvOS, visionOS, watchOS)' },
  '3F': { type: 'Re-download', description: 'Universal app, excluding tvOS' },
  '7': { type: 'Update', description: 'App update (iOS, tvOS, visionOS, watchOS)' },
  '7F': { type: 'Update', description: 'Universal app, excluding tvOS' },
  '7T': { type: 'Update', description: 'App update (iPadOS, visionOS)' },
  'F1': { type: 'Free or paid app', description: 'Mac' },
  'F7': { type: 'Update', description: 'App update (Mac)' },
  'FI1': { type: 'In-App Purchase', description: 'Mac' },
  'IA1': { type: 'In-App Purchase', description: 'In-app purchase (iOS, iPadOS, visionOS)' },
  'IA1-M': { type: 'In-App Purchase', description: 'In-app purchase (Mac)' },
  'IA3': { type: 'Restored In-App Purchase', description: 'Non consumable in-app purchase' },
  'IA9': { type: 'In-App Purchase', description: 'Non-renewing subscription (iOS, iPadOS, visionOS)' },
  'IA9-M': { type: 'In-App Purchase', description: 'Subscription (Mac)' },
  'IAY': { type: 'In-App Purchase', description: 'Auto-renewable subscription (iOS, iPadOS, visionOS)' },
  'IAY-M': { type: 'In-App Purchase', description: 'Auto-renewable subscription (Mac)' },
};

const getProductTypeInfo = (productId: string): ProductTypeInfo | undefined => {
  return productTypes[productId];
};
