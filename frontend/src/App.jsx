import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentUpload from './pages/DocumentUpload';
import DocumentViewer from './pages/DocumentViewer';
import PublicSign from './pages/PublicSign';
import Landing from './pages/Landing';

function App() {
  // Check for token on initial load
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });

  const setAuth = (bool) => {
    setIsAuthenticated(bool);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes - All accessible without login */}
          <Route 
            path="/" 
            element={<Landing />} 
          />
          <Route 
            path="/login" 
            element={<Login setAuth={setAuth} />} 
          />
          <Route 
            path="/register" 
            element={<Register setAuth={setAuth} />} 
          />
          
          {/* All routes accessible without authentication */}
          <Route 
            path="/dashboard" 
            element={<Dashboard setAuth={setAuth} />} 
          />
          <Route 
            path="/upload" 
            element={<DocumentUpload />} 
          />
          <Route 
            path="/document/:id" 
            element={<DocumentViewer />} 
          />
          
          {/* Public Signing Route */}
          <Route 
            path="/sign/:token" 
            element={<PublicSign />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
