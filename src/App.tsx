import { useEffect, useState } from 'react';
import { authClient } from './lib/auth-client';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { NutriLogo } from './components/NutriLogo';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (error || !data?.user) {
          setUser(null);
        } else {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Erro na verificação de sessão:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Visual de carregamento com o logotipo animado alegre
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-amber-50/50 to-teal-50/80 flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100/50 flex flex-col items-center animate-float">
          <NutriLogo size="lg" />
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mt-6">
            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Iniciando ambiente seguro...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
