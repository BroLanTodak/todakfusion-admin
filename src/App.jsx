import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import VisionMission from './pages/VisionMission';
import BusinessCanvas from './pages/BusinessCanvas';
import OKR from './pages/OKR';
import SWOT from './pages/SWOT';
import StrategicFoundation from './pages/StrategicFoundation';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="strategic-foundation" element={<StrategicFoundation />} />
              <Route path="vision-mission" element={<VisionMission />} />
              <Route path="canvas" element={<BusinessCanvas />} />
              <Route path="okr" element={<OKR />} />
              <Route path="swot" element={<SWOT />} />
              <Route path="users" element={<Users />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;