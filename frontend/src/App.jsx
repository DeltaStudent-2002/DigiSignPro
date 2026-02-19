import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentUpload from './pages/DocumentUpload';
import DocumentViewer from './pages/DocumentViewer';
import PublicSign from './pages/PublicSign';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login setAuth={setAuth} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register setAuth={setAuth} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Dashboard setAuth={setAuth} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/upload" 
            element={isAuthenticated ? <DocumentUpload /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/document/:id" 
            element={isAuthenticated ? <DocumentViewer /> : <Navigate to="/login" />} 
          />
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
