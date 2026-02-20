import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
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
      setDocument(res.data);
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
      fetchSignatures();
    } catch (err) {
      alert('Failed to add signature');
    }
  };

  const handleSignDocument = async (signatureId) => {
    const signatureText = prompt('Enter your signature text:');
    if (!signatureText) return;

    try {
      await axios.put(`/api/signatures/${signatureId}/sign`, {
        signatureText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSignatures();
    } catch (err) {
      alert('Failed to sign');
    }
  };

  const handleGenerateSignedPdf = async () => {
    try {
      const res = await axios.post(`/api/signatures/${id}/generate-signed-pdf`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSignedPdfPath(res.data.signedPath);
      alert('Signed PDF generated successfully!');
      fetchDocument();
    } catch (err) {
      alert('Failed to generate signed PDF');
    }
  };

  const handleDownloadSignedPdf = () => {
    if (signedPdfPath) {
      window.open(signedPdfPath, '_blank');
    } else if (document?.signedPath) {
      window.open(document.signedPath, '_blank');
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document?.originalName}</h1>
            <p className="text-sm text-gray-500">Status: {document?.status}</p>
          </div>
          <div className="flex gap-2">
            {(signedPdfPath || document?.signedPath) && (
              <button
                onClick={handleDownloadSignedPdf}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download Signed PDF
              </button>
            )}
            <button
              onClick={handleGenerateSignedPdf}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate Signed PDF
            </button>
            <Link
              to="/"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4">
              {/* Page Navigation */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {numPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* PDF Container */}
              <div 
                ref={containerRef}
                className="relative cursor-crosshair"
                onClick={(e) => {
                  if (!showSignatureModal) handleAddSignature(e);
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <Document
                  file={document?.filepath}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page 
                    pageNumber={currentPage} 
                    width={600}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Document>

                {/* Existing Signatures */}
                {signatures
                  .filter(sig => sig.pageNumber === currentPage)
                  .map((sig) => (
                    <div
                      key={sig._id}
                      className={`signature-overlay ${sig.status === 'signed' ? 'signed' : ''}`}
                      style={{
                        left: sig.x,
                        top: sig.y,
                        width: sig.width,
                        height: sig.height
                      }}
                    >
                      {sig.status === 'signed' ? (
                        <span className="text-xs text-green-600">{sig.signatureText}</span>
                      ) : (
                        <button
                          onClick={() => handleSignDocument(sig._id)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Sign
                        </button>
                      )}
                    </div>
                  ))}

                {/* New Signature Placeholder */}
                {showSignatureModal && (
                  <div
                    className="signature-overlay"
                    style={{
                      left: signaturePosition.x,
                      top: signaturePosition.y,
                      width: 200,
                      height: 50
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <span className="text-xs text-blue-600">Drag to move</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                    <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                      sig.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Signature Field</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signer Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter signer name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signer Email
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter signer email"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSignature}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
