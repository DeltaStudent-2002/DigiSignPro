import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentViewer = () => {
  const { id } = useParams();
  const [currentDocument, setCurrentDocument] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });
  const [currentPage, setCurrentPage] = useState(1);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [signedPdfPath, setSignedPdfPath] = useState(null);
  const containerRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDocument();
    fetchSignatures();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`/api/docs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentDocument(res.data);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatures = async () => {
    try {
      const res = await axios.get(`/api/signatures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSignatures(res.data);
    } catch (err) {
      console.error('Failed to load signatures');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleAddSignature = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSignaturePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setShowSignatureModal(true);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - signaturePosition.x,
      y: e.clientY - signaturePosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSignaturePosition({
        x: e.clientX - rect.left - dragOffset.x,
        y: e.clientY - rect.top - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveSignature = async () => {
    try {
      await axios.post('/api/signatures', {
        documentId: id,
        pageNumber: currentPage,
        x: signaturePosition.x,
        y: signaturePosition.y,
        signerName,
        signerEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSignatureModal(false);
      setSignerName('');
      setSignerEmail('');
      fetchSignatures();
    } catch (err) {
      alert('Failed to add signature');
    }
  };

  const handleSignDocument = (signatureId) => {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white;padding:24px;border-radius:12px;width:90%;max-width:420px;font-family:system-ui,sans-serif;';
    modalContent.innerHTML = `
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:600;">Design Your Signature</h3>
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:#374151;">Signature Text</label>
        <input type="text" id="sigText" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;" placeholder="Enter your signature" />
      </div>
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:#374151;">Font Family</label>
        <select id="sigFont" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;">
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Arial">Arial</option>
        </select>
      </div>
      
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <div style="flex:1;">
          <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:#374151;">Font Size</label>
          <input type="number" id="sigSize" value="18" min="10" max="48" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;" />
        </div>
        <div style="flex:1;">
          <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:#374151;">Color</label>
          <input type="color" id="sigColor" value="#000000" style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;padding:2px;box-sizing:border-box;" />
        </div>
      </div>
      
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="sigBold" style="width:16px;height:16px;margin-right:6px;" />
          <span style="font-size:14px;font-weight:500;">Bold</span>
        </label>
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="sigItalic" style="width:16px;height:16px;margin-right:6px;" />
          <span style="font-size:14px;font-weight:500;">Italic</span>
        </label>
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:#374151;">Preview</label>
        <div id="sigPreview" style="padding:12px;border:2px dashed #d1d5db;border-radius:6px;background:#f9fafb;text-align:center;min-height:50px;display:flex;align-items:center;justify-content:center;font-family:Helvetica;font-size:18px;color:#000000;">Your signature here</div>
      </div>
      
      <div style="display:flex;gap:8px;">
        <button id="confirmBtn" style="flex:1;background:#2563eb;color:white;border:none;padding:12px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">Sign Document</button>
        <button id="cancelBtn" style="flex:1;background:#e5e7eb;color:#374151;border:none;padding:12px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">Cancel</button>
      </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Get elements
    const sigText = modalContent.querySelector('#sigText');
    const sigFont = modalContent.querySelector('#sigFont');
    const sigSize = modalContent.querySelector('#sigSize');
    const sigColor = modalContent.querySelector('#sigColor');
    const sigBold = modalContent.querySelector('#sigBold');
    const sigItalic = modalContent.querySelector('#sigItalic');
    const sigPreview = modalContent.querySelector('#sigPreview');
    
    // Update preview
    const updatePreview = () => {
      sigPreview.textContent = sigText.value || 'Your signature here';
      sigPreview.style.fontFamily = sigFont.value;
      sigPreview.style.fontSize = sigSize.value + 'px';
      sigPreview.style.color = sigColor.value;
      sigPreview.style.fontWeight = sigBold.checked ? 'bold' : 'normal';
      sigPreview.style.fontStyle = sigItalic.checked ? 'italic' : 'normal';
    };
    
    sigText.addEventListener('input', updatePreview);
    sigFont.addEventListener('change', updatePreview);
    sigSize.addEventListener('input', updatePreview);
    sigColor.addEventListener('input', updatePreview);
    sigBold.addEventListener('change', updatePreview);
    sigItalic.addEventListener('change', updatePreview);
    
    // Confirm sign
    modalContent.querySelector('#confirmBtn').addEventListener('click', async () => {
      const signatureText = sigText.value;
      if (!signatureText) {
        alert('Please enter your signature text');
        return;
      }
      
      const fontFamily = sigFont.value;
      const fontSize = parseInt(sigSize.value);
      const color = sigColor.value;
      const isBold = sigBold.checked;
      const isItalic = sigItalic.checked;
      
      document.body.removeChild(modalOverlay);
      
      try {
        await axios.put(`/api/signatures/${signatureId}/sign`, {
          signatureText,
          fontFamily,
          fontSize,
          color,
          isBold,
          isItalic
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSignatures();
        alert('Document signed successfully!');
      } catch (err) {
        alert('Failed to sign: ' + (err.response?.data?.message || err.message));
      }
    });
    
    // Cancel
    modalContent.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
    });
  };

  const handleGenerateSignedPdf = async () => {
    try {
      const res = await axios.post(`/api/signatures/generate-signed-pdf/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSignedPdfPath(res.data.signedPath);
      alert('Signed PDF generated successfully!');
      fetchDocument();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to generate signed PDF';
      alert(errorMessage);
    }
  };

  const handleDownloadSignedPdf = () => {
    if (signedPdfPath) {
      window.open(signedPdfPath, '_blank');
    } else if (currentDocument?.signedPath) {
      window.open(currentDocument.signedPath, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentDocument?.originalName}</h1>
            <p className="text-sm text-gray-500">Status: {currentDocument?.status}</p>
          </div>
          <div className="flex gap-2">
            {(signedPdfPath || currentDocument?.signedPath) && (
              <button onClick={handleDownloadSignedPdf} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Download Signed PDF
              </button>
            )}
            <button onClick={handleGenerateSignedPdf} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Generate Signed PDF
            </button>
            <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Back</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
                <span>Page {currentPage} of {numPages}</span>
                <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
              </div>

              <div ref={containerRef} className="relative cursor-crosshair" onClick={(e) => {!showSignatureModal && handleAddSignature(e)}} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <Document file={`http://localhost:5001/${currentDocument?.filepath}`} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => console.error('PDF load error:', error)}>
                  <Page pageNumber={currentPage} width={600} renderAnnotationLayer={false} renderTextLayer={false} />
                </Document>

                {signatures.filter(sig => sig.pageNumber === currentPage).map((sig) => (
                  <div key={sig._id} style={{position:'absolute',left:sig.x,top:sig.y,width:sig.width,height:sig.height,border:sig.status!=='signed'?'1px dashed blue':'none',cursor:sig.status!=='signed'?'pointer':'default'}}>
                    {sig.status === 'signed' ? (
                      <span style={{
                        fontFamily: sig.fontFamily || 'Helvetica',
                        fontSize: (sig.fontSize || 16) + 'px',
                        color: sig.color || '#000000',
                        fontWeight: sig.isBold ? 'bold' : 'normal',
                        fontStyle: sig.isItalic ? 'italic' : 'normal'
                      }}>{sig.signatureText}</span>
                    ) : (
                      <button onClick={() => handleSignDocument(sig._id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Sign</button>
                    )}
                  </div>
                ))}

                {showSignatureModal && (
                  <div style={{position:'absolute',left:signaturePosition.x,top:signaturePosition.y,width:200,height:50,border:'1px dashed blue'}} onMouseDown={handleMouseDown}>
                    <span className="text-xs text-blue-600">Drag to move</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Signatures</h3>
            {signatures.length === 0 ? (
              <p className="text-gray-500">Click on the document to add signature fields</p>
            ) : (
              <div className="space-y-3">
                {signatures.map((sig) => (
                  <div key={sig._id} className="border rounded p-3">
                    <p className="font-medium">{sig.signerName}</p>
                    <p className="text-sm text-gray-500">{sig.signerEmail}</p>
                    <p className="text-xs text-gray-400">Page {sig.pageNumber}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${sig.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {sig.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Signature Field</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Signer Name</label>
              <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Enter signer name" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Signer Email</label>
              <input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Enter signer email" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveSignature} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
              <button onClick={() => setShowSignatureModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;

