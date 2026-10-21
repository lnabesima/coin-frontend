import { ArrowRight, Eye, EyeOff, Loader2, Wallet } from 'lucide-react';
import { type ChangeEvent, type SubmitEvent, useState } from 'react';
import { isApiError } from '../../api/errors.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export function AuthScreen() {
  const { login, isLoading } = useAuth();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;
    const trimmed = apiKey.trim();
    if (trimmed.length === 0) {
      setError('Por favor, informe a chave de acesso.');
      return;
    }

    setError(null);

    try {
      await login(trimmed);
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 401) {
        setError('Chave de acesso inválida ou expirada.');
      } else if (err instanceof RangeError) {
        setError('Por favor, informe a chave de acesso.');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <header className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Wallet className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Coin</h1>
            <p className="text-sm text-zinc-400">Personal Finance Tracker</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-300 mb-2">
              Chave de Acesso (API Key)
            </label>
            <div className="relative">
              <input
                id="apiKey"
                name="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="off"
                spellCheck={false}
                autoCorrect="off"
                placeholder="Cole sua chave aqui..."
                aria-describedby={error ? 'auth-error' : undefined}
                className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition duration-150 pr-12 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition duration-150 p-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              id="auth-error"
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm"
            >
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300/90 text-xs">
              <Loader2
                className="w-4 h-4 animate-spin shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <span>Conectando à nuvem... Servidores em repouso podem levar alguns segundos.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-950/40 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
