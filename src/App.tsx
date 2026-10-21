import { LogOut, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AuthScreen } from './components/Auth/AuthScreen.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

function AuthenticatedDashboard() {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <header className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Wallet className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Coin</h1>
              <p className="text-sm text-zinc-400">Personal Finance Tracker</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair"
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <section className="space-y-4">
          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-sm text-zinc-300">
            <p>Ready for fast, offline-first mobile expense tracking.</p>
          </div>

          <button
            type="button"
            onClick={() => toast.success('Tooling initialized successfully!')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Test Toast Notification</span>
          </button>
        </section>
      </div>
    </main>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <AuthenticatedDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
