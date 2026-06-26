import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/Auth';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import ReviewQueue from './pages/ReviewQueue';
import PipelineBuilder from './pages/PipelineBuilder';
import CustomModels from './pages/CustomModels';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Legacy redirects */}
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/signin" element={<AuthPage />} />

        {/* Internal Application Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/pipelines" element={<PipelineBuilder />} />
          <Route path="/models" element={<CustomModels />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
