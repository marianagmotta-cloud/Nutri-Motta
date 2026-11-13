import React, { useEffect, useState, useCallback } from 'react';
import { authClient } from '../lib/auth-client';
import { getDashboardMetrics, type DashboardMetrics } from '../lib/db';
import { PacientesManager } from './PacientesManager';
import { NutriLogo } from './NutriLogo';
import {
  LogOut,
  Users,
  Calendar,
  AlertCircle,
  LayoutDashboard,
  UserCheck,
  ChevronRight,
  Clock,
  RefreshCw,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes'>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [loading, setLoading] = useState(true);
  const [initialPatientForProfile, setInitialPatientForProfile] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getDashboardMetrics(user.id);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
    onLogout();
  };

  const handlePatientClick = (patientId: string) => {
    setInitialPatientForProfile(patientId);
    setActiveTab('pacientes');
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex">
      {/* Menu Lateral Fixo com estilo moderno e leve */}
      <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-emerald-100/60 flex flex-col fixed inset-y-0 left-0 z-40 shadow-xs">
        {/* Topo do Menu: Logotipo Animado Nutri Motta */}
        <div className="h-18 px-5 border-b border-emerald-50 flex items-center">
          <NutriLogo size="sm" />
        </div>

        {/* Itens de Navegação com cantos modernos e cores alegres */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setInitialPatientForProfile(null);
              fetchMetrics();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pacientes');
              setInitialPatientForProfile(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer ${
              activeTab === 'pacientes'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'pacientes' ? 'text-white' : 'text-slate-400'}`} />
            <span>Pacientes</span>
          </button>
        </nav>

        {/* Rodapé do Menu com Perfil do Usuário e Logout */}
        <div className="p-4 border-t border-emerald-50/80 bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-emerald-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || 'Nutricionista'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair do sistema"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-slate-200/80 hover:border-rose-200 bg-white shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal (compensando a largura do menu fixo) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Barra superior de status */}
        {/* Barra superior de status estilizada */}
        <header className="h-18 bg-white/80 backdrop-blur-md border-b border-emerald-100/60 sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {activeTab === 'dashboard' ? 'Painel de Controle' : 'Gerenciamento de Pacientes'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'dashboard' && (
              <button
                onClick={fetchMetrics}
                disabled={loading}
                title="Atualizar dados em tempo real"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/80 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Atualizar</span>
              </button>
            )}
          </div>
        </header>

        {/* Corpo do conteúdo */}
        <main className="p-8 flex-1">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8 max-w-6xl">
              {/* Saudação com boas-vindas alegres */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/15 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase inline-flex items-center gap-1.5 backdrop-blur-xs mb-2">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Consultório Digital
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Olá, {user?.name || 'Nutricionista'}! 🌿
                    </h1>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                      Seu painel clínico Nutri Motta está ativo e conectado. Monitore os indicadores de saúde e acompanhamento dos seus pacientes em tempo real.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid dos Cards Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 — Total de pacientes ativos */}
                <div
                  onClick={() => setActiveTab('pacientes')}
                  className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-md shadow-emerald-900/5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-700 transition">
                      Pacientes Ativos
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">
                      {loading ? '...' : metrics.totalPacientes}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">cadastrados</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Vinculados à sua conta
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                  </div>
                </div>

                {/* Card 2 — Consultas da semana */}
                <div className="bg-white p-6 rounded-3xl border border-teal-100/80 shadow-md shadow-teal-900/5 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Consultas da Semana
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 flex items-center justify-center shadow-xs">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">
                      {loading ? '...' : metrics.consultasSemana}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">nesta semana</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Semana corrente (seg a dom)
                    </span>
                  </div>
                </div>

                {/* Card 3 (Métrica Rápida) — Pacientes sem retorno */}
                <div className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-md shadow-amber-900/5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      Sem Retorno (&gt; 30 dias)
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 flex items-center justify-center shadow-xs">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-700">
                      {loading ? '...' : metrics.pacientesSemRetorno.length}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">necessitam contato</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Sem agendamento futuro
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3 — Pacientes sem retorno (Lista Detalhada) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Pacientes sem Retorno</h3>
                      <p className="text-xs text-slate-500">
                        Última consulta realizada há mais de 30 dias e sem próximo retorno agendado
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {metrics.pacientesSemRetorno.length} pendente(s)
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando pacientes...</span>
                    </div>
                  ) : metrics.pacientesSemRetorno.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <p className="text-slate-700 font-semibold text-sm">
                        Nenhum paciente sem retorno no momento
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Todos os seus pacientes estão com consultas recentes ou retornos agendados!
                      </p>
                    </div>
                  ) : (
                    metrics.pacientesSemRetorno.map((paciente) => (
                      <button
                        key={paciente.id}
                        onClick={() => handlePatientClick(paciente.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-emerald-100 group-hover:text-emerald-700 transition">
                            {paciente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition flex items-center gap-1.5">
                              {paciente.nome}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>Última consulta: {formatDate(paciente.ultimaConsulta)}</span>
                              <span>•</span>
                              <span className="text-amber-600 font-medium">
                                {paciente.diasSemConsulta} dias atrás
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition hidden sm:inline">
                            Ver perfil
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Área Completa de Pacientes */
            <PacientesManager
              nutricionistaId={user.id}
              initialSelectedPatientId={initialPatientForProfile}
              onClearInitialPatient={() => setInitialPatientForProfile(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
