import React, { useEffect, useState, useCallback } from 'react';
import { getPacientesList, type PacienteListItem, sql } from '../lib/db';
import { NovoPacienteForm } from './NovoPacienteForm';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  Target,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Activity,
  Trash2
} from 'lucide-react';

interface PacientesManagerProps {
  nutricionistaId: string;
  initialSelectedPatientId?: string | null;
  onClearInitialPatient?: () => void;
}

export const PacientesManager: React.FC<PacientesManagerProps> = ({
  nutricionistaId,
  initialSelectedPatientId,
  onClearInitialPatient,
}) => {
  const [view, setView] = useState<'list' | 'create' | 'profile'>('list');
  const [patients, setPatients] = useState<PacienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Carregar lista de pacientes
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPacientesList(nutricionistaId);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [nutricionistaId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Se veio redirecionado com paciente já selecionado (ex: pelo dashboard)
  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
      setView('profile');
      if (onClearInitialPatient) onClearInitialPatient();
    }
  }, [initialSelectedPatientId, onClearInitialPatient]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setView('profile');
  };

  const handleCreateSuccess = (newPatientId: string) => {
    loadPatients();
    setSelectedPatientId(newPatientId);
    setView('profile');
    setSuccessBanner('Paciente cadastrado com sucesso!');
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Nenhuma consulta registrada';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchName = p.nome.toLowerCase().includes(q);
    const matchObj =
      p.objetivos?.some((o) => o.toLowerCase().includes(q)) ||
      (p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(q));
    return matchName || matchObj;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Banner de Sucesso */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {view === 'create'
              ? 'Novo Paciente'
              : view === 'profile'
              ? 'Prontuário do Paciente'
              : 'Pacientes'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {view === 'create'
              ? 'Preencha os dados nas abas para cadastrar um novo paciente'
              : view === 'profile'
              ? 'Histórico completo, plano alimentar e anamnese clínica'
              : 'Gerencie e acompanhe todos os pacientes cadastrados sob seus cuidados'}
          </p>
        </div>

        {view !== 'list' && (
          <button
            type="button"
            onClick={() => {
              setView('list');
              setSelectedPatientId(null);
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Lista</span>
          </button>
        )}
      </div>

      {/* RENDERIZAÇÃO DA VIEW ATIVA */}
      {view === 'create' && (
        <NovoPacienteForm
          nutricionistaId={nutricionistaId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'profile' && selectedPatientId && (
        <PatientFullProfile
          patientId={selectedPatientId}
          nutricionistaId={nutricionistaId}
          onBack={() => {
            setView('list');
            setSelectedPatientId(null);
          }}
          onDeleteSuccess={() => {
            loadPatients();
            setView('list');
            setSelectedPatientId(null);
          }}
        />
      )}

      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Barra de Busca + Botão Novo Paciente */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do paciente ou objetivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            <button
              onClick={() => setView('create')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </button>
          </div>

          {/* Lista de Pacientes */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Carregando pacientes...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                {search ? (
                  <>
                    <h3 className="text-slate-800 font-semibold text-sm">Nenhum paciente encontrado</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Nenhum resultado corresponde à busca "{search}".
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-slate-800 font-semibold text-sm">
                      Nenhum paciente cadastrado ainda
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                      Clique no botão "Novo Paciente" acima para registrar seu primeiro atendimento.
                    </p>
                    <button
                      onClick={() => setView('create')}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Cadastrar agora
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredPatients.map((paciente) => {
                const objetivosExibidos =
                  paciente.objetivos && paciente.objetivos.length > 0
                    ? paciente.objetivos.join(', ')
                    : paciente.objetivo_texto || 'Objetivo não informado';

                return (
                  <div
                    key={paciente.id}
                    onClick={() => handleSelectPatient(paciente.id)}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                        {paciente.nome.charAt(0).toUpperCase()}
                      </div>

                      {/* Informações Principais */}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition truncate">
                          {paciente.nome}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          {/* Objetivo */}
                          <span className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-xs">
                            <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{objetivosExibidos}</span>
                          </span>

                          <span className="hidden sm:inline text-slate-300">•</span>

                          {/* Data da Última Consulta */}
                          <span className="flex items-center gap-1 text-slate-400 shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {paciente.ultima_consulta
                                ? `Última consulta: ${formatDate(paciente.ultima_consulta)}`
                                : 'Sem consulta registrada'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 hidden sm:inline transition">
                        Acessar prontuário
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMPONENTE DO PERFIL COMPLETO DO PACIENTE
// ==========================================
const PatientFullProfile: React.FC<{
  patientId: string;
  nutricionistaId: string;
  onBack: () => void;
  onDeleteSuccess: () => void;
}> = ({ patientId, nutricionistaId, onBack, onDeleteSuccess }) => {
  const [patient, setPatient] = useState<any>(null);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (sql) {
          const pRes = await sql`
            SELECT * FROM public.pacientes 
            WHERE id = ${patientId} AND nutricionista_id = ${nutricionistaId}
          `;
          if (pRes.length > 0) {
            setPatient(pRes[0]);
          }

          const cRes = await sql`
            SELECT * FROM public.consultas
            WHERE paciente_id = ${patientId}
            ORDER BY data_consulta DESC
          `;
          setConsultas(cRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId, nutricionistaId]);

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza de que deseja remover este paciente? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      if (sql) {
        await sql`DELETE FROM public.pacientes WHERE id = ${patientId} AND nutricionista_id = ${nutricionistaId}`;
        onDeleteSuccess();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir paciente.');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span>Carregando dados do paciente...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <p className="font-semibold">Paciente não encontrado ou sem permissão de acesso.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  // Idade
  const calcularIdade = (data?: string) => {
    if (!data) return null;
    const birth = new Date(data);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? `${age} anos` : null;
  };

  // IMC
  const imc =
    patient.peso_inicial && patient.altura
      ? (
          patient.peso_inicial /
          ((patient.altura > 3 ? patient.altura / 100 : patient.altura) ** 2)
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL / CABEÇALHO DO PACIENTE */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shadow-emerald-600/20 shrink-0">
              {patient.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{patient.nome}</h2>
                {patient.sexo && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {patient.sexo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                {patient.data_nascimento && (
                  <span>
                    Nasc.: {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}{' '}
                    {calcularIdade(patient.data_nascimento) ? `(${calcularIdade(patient.data_nascimento)})` : ''}
                  </span>
                )}
                <span>•</span>
                <span>Cadastrado em: {new Date(patient.created_at).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* CONTATOS & MEDIDAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              WhatsApp
            </span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block truncate">
              {patient.whatsapp || 'Não informado'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Telefone
            </span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block truncate">
              {patient.telefone || 'Não informado'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Email
            </span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block truncate">
              {patient.email || 'Não informado'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Peso / Altura / IMC
            </span>
            <span className="text-sm font-bold text-emerald-700 mt-1 block">
              {patient.peso_inicial ? `${patient.peso_inicial}kg` : '-'} /{' '}
              {patient.altura ? `${patient.altura}m` : '-'} {imc ? `(IMC: ${imc})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* DETALHES CLÍNICOS E HÁBITOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco Clínico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Quadro Clínico e Objetivos</h3>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Objetivos</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {patient.objetivos && patient.objetivos.length > 0 ? (
                patient.objetivos.map((obj: string) => (
                  <span
                    key={obj}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100"
                  >
                    {obj}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Não especificado</span>
              )}
            </div>
            {patient.objetivo_texto && (
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {patient.objetivo_texto}
              </p>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Nível de Atividade Física
            </span>
            <p className="text-xs font-medium text-slate-800 mt-1">
              {patient.nivel_atividade || 'Não informado'}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Patologias</span>
            <p className="text-xs text-slate-700 mt-1">
              {patient.patologias && patient.patologias.length > 0
                ? patient.patologias.join(', ')
                : 'Nenhuma informada'}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Restrições Alimentares
            </span>
            <p className="text-xs text-slate-700 mt-1">
              {patient.restricoes_alimentares && patient.restricoes_alimentares.length > 0
                ? patient.restricoes_alimentares.join(', ')
                : 'Nenhuma informada'}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Alergias</span>
            <p className="text-xs text-slate-700 mt-1">
              {patient.alergias && patient.alergias.length > 0
                ? patient.alergias.join(', ')
                : 'Nenhuma informada'}
            </p>
          </div>

          {(patient.medicamentos || patient.suplementos) && (
            <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
              {patient.medicamentos && (
                <p>
                  <strong className="text-slate-700">Medicamentos:</strong>{' '}
                  <span className="text-slate-600">{patient.medicamentos}</span>
                </p>
              )}
              {patient.suplementos && (
                <p>
                  <strong className="text-slate-700">Suplementos:</strong>{' '}
                  <span className="text-slate-600">{patient.suplementos}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bloco Hábitos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm">Hábitos e Rotina</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Refeições / dia
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {patient.refeicoes_por_dia ? `${patient.refeicoes_por_dia} refeições` : 'Não informado'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Água ingerida
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {patient.litros_agua ? `${patient.litros_agua} litros` : 'Não informado'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Horário que Acorda
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {patient.horario_acorda || 'Não informado'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Horário que Dorme
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {patient.horario_dorme || 'Não informado'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Prática de Atividades Físicas
            </span>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              {patient.atividade_fisica ? 'Sim' : 'Não'}
              {patient.atividade_fisica_descricao ? ` — ${patient.atividade_fisica_descricao}` : ''}
            </p>
          </div>

          {patient.observacoes && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 block uppercase">Observações</span>
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-xl">
                {patient.observacoes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* HISTÓRICO DE CONSULTAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Histórico de Consultas Realizadas</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total: {consultas.length} consulta(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {consultas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma consulta registrada para este paciente ainda.
            </div>
          ) : (
            consultas.map((c) => (
              <div key={c.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">
                    Data: {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs text-slate-500">
                    Peso: {c.peso ? `${c.peso} kg` : 'N/I'} • Cintura:{' '}
                    {c.cintura ? `${c.cintura} cm` : 'N/I'} • Quadril:{' '}
                    {c.quadril ? `${c.quadril} cm` : 'N/I'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-600 block">
                    {c.proximo_retorno
                      ? `Retorno agendado: ${new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}`
                      : 'Sem retorno agendado'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

