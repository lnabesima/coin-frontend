import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { AuthScreen } from './components/Auth/AuthScreen.tsx';
import { Dashboard } from './components/Dashboard/Dashboard.tsx';
import { ComponentPlayground } from './components/Dev/ComponentPlayground.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <Dashboard />;
}

export default function App() {
  const [showPlayground, setShowPlayground] = useState(false);

  if (import.meta.env.DEV && showPlayground) {
    return <ComponentPlayground onClose={() => setShowPlayground(false)} />;
  }

  return (
    <AuthProvider>
      <AppContent />
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => setShowPlayground(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold backdrop-blur shadow-lg transition cursor-pointer"
          aria-label="Abrir Dev Sandbox"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Dev Sandbox</span>
        </button>
      )}
    </AuthProvider>
  );
}
