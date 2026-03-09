# TODO - Fix Signed PDF Generation

## Task: Fix coordinate system mismatch between frontend display and PDF generation

### Steps:
- [x] 1. Update backend (signatures.js) to handle scaled coordinates and PDF dimensions
- [x] 2. Update frontend (DocumentViewer.jsx) to send scaled coordinates and page dimensions
- [ ] 3. Test the fix by generating a signed PDF

### Details:
- Frontend displays PDF at 600px width but captures coordinates at display scale
- Backend uses pdf-lib with original PDF dimensions (not scaled)
- Need to scale coordinates and handle Y-axis flip (PDF uses bottom-left origin)

### Changes Made:
1. **Backend (signatures.js)**:
   - Updated POST /api/signatures to accept and store PDF metadata (displayWidth, pdfPageWidth, pdfPageHeight)
   - Updated generate-signed-pdf endpoint with proper coordinate conversion logic
   - Handles coordinate scaling from display to actual PDF page size
   - Properly flips Y-axis (HTML top-left to PDF bottom-left origin)

2. **Backend (Signature model)**:
   - Added new fields: pdfPageWidth, pdfPageHeight, displayWidth, scaleFactor

3. **Frontend (DocumentViewer.jsx)**:
   - Added pdfPageDimensions state to store actual PDF page dimensions
   - Updated onDocumentLoadSuccess to capture page dimensions from react-pdf
   - Updated handleSaveSignature to send PDF metadata along with signature data

