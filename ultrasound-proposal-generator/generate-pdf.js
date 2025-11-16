#!/usr/bin/env node

/**
 * Ultrasound Sales Proposal PDF Generator
 * Generates professional PDF proposals for pre-owned ultrasound equipment
 */

const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');

// Define fonts
const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js'
  }
};

/**
 * Generate PDF from template JSON
 */
function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...\n');

    // Load the proposal template
    const templatePath = path.join(__dirname, 'proposal-template.json');
    console.log(`📄 Loading template from: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file not found: proposal-template.json');
    }

    const docDefinition = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    console.log('✓ Template loaded successfully\n');

    // Create PDF printer
    console.log('🖨️  Initializing PDF printer...');
    const printer = new PdfPrinter(fonts);

    // Generate PDF document
    console.log('📝 Generating PDF document...');
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // Output file path
    const outputPath = path.join(__dirname, 'output', 'Ultrasound_Sales_Proposal.pdf');

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✓ Created output directory: ${outputDir}`);
    }

    // Write to file
    const writeStream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    writeStream.on('finish', () => {
      console.log('\n✅ PDF generated successfully!');
      console.log(`📁 Output location: ${outputPath}`);
      console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);
      console.log('🎉 Done! Your proposal is ready to send.\n');
    });

    writeStream.on('error', (err) => {
      console.error('❌ Error writing PDF:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Ultrasound Sales Proposal Generator v1.0            ║');
  console.log('║  @Chandrubmec - Pre-Owned Medical Equipment          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  generatePDF();
}

module.exports = { generatePDF };
