import React, { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { syncNutricionista } from '../lib/db';
import { NutriLogo } from './NutriLogo';
import { Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onSuccess: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Por favor, informe um email válido.');
      return;
    }

    if (password.length < 9) {
      setError('A senha deve conter no mínimo 9 caracteres.');
      return;
    }

    if (!isLogin) {
      if (!nome.trim()) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: authError } = await authClient.signIn.email({
          email: cleanEmail,
          password: password,
        });

        if (authError) {
          setError(authError.message || 'Credenciais inválidas. Verifique seu email e senha.');
          setLoading(false);
          return;
        }

        if (data?.user) {
          onSuccess(data.user);
        }
      } else {
        const { data, error: authError } = await authClient.signUp.email({
          email: cleanEmail,
          password: password,
          name: nome.trim(),
        });

        if (authError) {
          setError(authError.message || 'Erro ao criar conta. Tente novamente.');
          setLoading(false);
          return;
        }

        if (data?.user) {
          // Garantir registro imediato do nutricionista no banco
          await syncNutricionista(data.user.id, nome.trim(), cleanEmail);
          onSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Ocorreu um erro inesperado ao conectar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-amber-50/40 to-teal-50/70 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Elementos decorativos de fundo alegres */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Topo / Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <NutriLogo size="xl" />
        </div>

        {/* Card do Formulário */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-950/5 border border-emerald-100/60 p-8 sm:p-9 transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {isLogin ? 'Acessar sua conta' : 'Criar nova conta'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isLogin
                ? 'Insira suas credenciais para gerenciar seus pacientes'
                : 'Cadastre-se para iniciar a gestão clínica nutricional'}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Dra. Maria Silva"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nutri@exemplo.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha (mínimo 9 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle de Modo */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {isLogin ? (
              <p className="text-xs text-slate-600">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Cadastre-se
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Faça login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Ambiente Seguro e Criptografado</span>
        </div>
      </div>
    </div>
  );
};
