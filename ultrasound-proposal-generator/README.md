# 🏥 Ultrasound Sales Proposal Generator

Professional PDF proposal generator for pre-owned ultrasound equipment sales. Built with PDFMake for high-quality, customizable medical equipment proposals.

## 📋 Overview

This tool generates professional sales proposals for Philips iU22 xMATRIX ultrasound systems with OB/GYN focused configurations. The generated PDF includes:

- Complete system specifications
- Probe configuration details (C5-1, V6-2, L17-5, 3D9-3V)
- Comprehensive pricing breakdown
- Warranty and support terms
- 30+ key features
- Payment and delivery terms
- Professional formatting with tables and styling

## 🚀 Quick Start

### Option 1: Browser-Based (No Installation Required)

**Easiest method** - Just open the HTML file in your browser:

1. Open `index.html` in any modern web browser
2. Click "Download PDF" to generate and download the proposal
3. Click "Preview in Browser" to view before downloading
4. Click "View Template JSON" to see the raw data

**Advantages:**
- No installation required
- Works offline
- Instant generation
- Cross-platform (Windows, Mac, Linux)

### Option 2: Node.js Script

For automated generation or integration into workflows:

1. **Install Dependencies:**
   ```bash
   cd ultrasound-proposal-generator
   npm install
   ```

2. **Generate PDF:**
   ```bash
   npm run generate
   ```
   Or directly:
   ```bash
   node generate-pdf.js
   ```

3. **Output Location:**
   - PDF will be saved to: `output/Ultrasound_Sales_Proposal.pdf`

**Advantages:**
- Automated generation
- Can be integrated into scripts
- Batch processing capable
- Server-side generation

## 📁 Project Structure

```
ultrasound-proposal-generator/
├── index.html              # Browser-based PDF generator (recommended)
├── generate-pdf.js         # Node.js PDF generator script
├── proposal-template.json  # Proposal data template
├── package.json           # Node.js dependencies
├── README.md              # This file
└── output/                # Generated PDFs (created automatically)
    └── Ultrasound_Sales_Proposal.pdf
```

## 🔧 System Requirements

### For Browser-Based Version:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No other requirements

### For Node.js Version:
- Node.js 14.x or higher
- npm (comes with Node.js)

## 📝 Customization

### Modify Proposal Content

Edit `proposal-template.json` to customize:

1. **Header Information:**
   - Proposal reference number
   - Dates and validity period
   - Client details
   - Contact information

2. **Pricing:**
   ```json
   ["System + 4 Probes (Base)", "", "9,50,000"],
   ["10% Loyalty Discount", "", "(95,000)"]
   ```

3. **Equipment Details:**
   - System model and part numbers
   - Probe specifications
   - Configuration details

4. **Terms & Conditions:**
   - Warranty duration
   - Payment terms
   - Delivery timeline

### Modify Styling

Edit the `styles` section in `proposal-template.json`:

```json
"styles": {
  "header": {
    "fontSize": 16,
    "bold": true,
    "color": "#1B4F72"
  },
  "sectionHeader": {
    "fontSize": 12,
    "bold": true,
    "color": "#1B4F72",
    "decoration": "underline"
  }
}
```

### Add Logo

Replace the placeholder image with your company logo:

```json
{
  "image": "data:image/png;base64,YOUR_BASE64_ENCODED_LOGO",
  "width": 150,
  "alignment": "center"
}
```

**To convert logo to base64:**
- Use online tools like [Base64 Image Encoder](https://www.base64-image.de/)
- Or use command line: `base64 -i logo.png`

## 📊 Proposal Details

### Equipment Configuration

| Item | Model | Type | Frequency |
|------|-------|------|-----------|
| Philips iU22 System | 4535-610-10031 | xMATRIX Cart | Shared Service |
| C5-1 Probe | 4535-616-299 | Convex 2D | 1–5 MHz |
| V6-2 Probe | 98960-539-563 | Convex 4D | 1.9–6.2 MHz |
| L17-5 Probe | 4535-118-975 | Linear 2D | 5–17 MHz |
| 3D9-3V Probe | 4000-0932 | Transvaginal 2D | 3–9 MHz |

### Pricing (Default)

- **Base Price:** ₹9,50,000 + GST
- **10% Discount:** ₹95,000 OFF
- **Final Price:** ₹8,55,000 + GST
- **Total (incl. 18% GST):** ₹10,08,900

### Key Features Included

✓ xMATRIX platform with real-time 3D/4D imaging
✓ PureWave transducers (69% better penetration)
✓ 12-month comprehensive warranty
✓ Free installation & training
✓ DICOM 3.0 compatibility
✓ WHO/Indian fetal growth charts
✓ Tender-compliant documentation

## 🎯 Use Cases

- **Hospital Procurement:** Tender submissions for radiology departments
- **Private Clinics:** Diagnostic center equipment proposals
- **Medical Distributors:** Sales presentations to healthcare facilities
- **Equipment Resellers:** Professional quotations for pre-owned systems

## 🔒 Data Privacy

- All processing happens locally (browser or your machine)
- No data is sent to external servers
- Suitable for confidential business proposals
- Client information remains private

## 📄 Output Format

- **File Format:** PDF (A4 size)
- **Page Margins:** 40pt all sides
- **Font:** Roboto
- **File Size:** ~50-100 KB (depending on logo)
- **Pages:** 3-4 pages

## 🛠️ Troubleshooting

### Browser Version Issues

**Problem:** PDF not generating
**Solution:**
- Ensure JavaScript is enabled
- Try a different browser (Chrome recommended)
- Check browser console for errors (F12)

**Problem:** Fonts look wrong
**Solution:** PDFMake uses standard fonts; they render correctly in the PDF

### Node.js Version Issues

**Problem:** `Module not found` error
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Permission denied
**Solution:**
```bash
chmod +x generate-pdf.js
```

**Problem:** Output directory error
**Solution:** The script creates the `output/` directory automatically

## 🔄 Version History

### Version 1.0 (Current)
- Initial release
- Browser-based generator
- Node.js CLI generator
- Complete proposal template
- Professional styling

## 📞 Support

For support or customization requests:
- **Email:** sales@chandrubmec.com
- **Contact:** +91-XXXXX-XXXXX

## 📜 License

MIT License - Free for commercial and personal use

## 🤝 Credits

**Created by:** @Chandrubmec
**Technology:** PDFMake (MIT License)
**Purpose:** Delivering Quality Pre-Owned Ultrasound Solutions Across India

## 🎓 Advanced Usage

### Batch Generation

Create multiple proposals with different client data:

```javascript
// In Node.js
const proposals = [
  { client: 'Hospital A', price: 850000 },
  { client: 'Hospital B', price: 900000 }
];

proposals.forEach(data => {
  // Modify template and generate
});
```

### Integration with CRM

```javascript
// Fetch data from your CRM
const clientData = await fetchFromCRM(clientId);

// Merge with template
const proposal = { ...template, ...clientData };

// Generate PDF
pdfMake.createPdf(proposal).download();
```

### Email Automation

```javascript
// Generate PDF as blob
pdfMake.createPdf(docDefinition).getBlob((blob) => {
  // Send via email API
  sendEmail({
    to: client.email,
    subject: 'Ultrasound System Proposal',
    attachment: blob
  });
});
```

## 📈 Future Enhancements

- [ ] Multi-language support (Hindi, Tamil)
- [ ] Dynamic pricing calculator
- [ ] Multiple equipment templates
- [ ] Digital signature integration
- [ ] Email sending capability
- [ ] Web-based customization interface
- [ ] Client portal integration

---

**Made with ❤️ for the medical equipment industry**
