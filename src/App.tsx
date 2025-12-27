import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLanding } from './components/Auth/AuthForms';
import { PrivateRoute } from './components/Auth/PrivateRoute';
import { MainApp } from './pages/MainApp';
import { Starfield } from './components/Starfield';
import { AnimatePresence } from 'framer-motion';

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
          {/* Global Optimized Starfield Background */}
          <Starfield />

          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Route: Login / SignUp */}
              <Route path="/login" element={<AuthLanding />} />

              {/* Protected Route: Main App */}
              <Route path="/" element={
                <PrivateRoute>
                  <MainApp />
                </PrivateRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </AuthProvider>
    </Router>
  );
};
