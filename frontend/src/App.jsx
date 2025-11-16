
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import EditorPage from './components/EditorPage';
import PublicCvPage from './components/PublicCvPage'; 
import ProtectedRoute from './components/ProtectedRoute';
import GuidePage from './components/GuidePage'; 
import ComparisonPage from './components/ComparisonPage'; 

import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <div className="antialiased">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/view/:shareLink" element={<PublicCvPage />} /> 
          

          <Route path="/editor/new" element={<EditorPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/editor/:cvId" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />
          <Route path="/compare/:cvId1/:cvId2" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;