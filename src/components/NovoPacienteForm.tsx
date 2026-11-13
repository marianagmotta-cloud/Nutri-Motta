import React, { useState, useMemo } from 'react';
import { createPaciente, type CreatePacienteInput } from '../lib/db';
import {
  User,
  HeartPulse,
  Coffee,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  Info
} from 'lucide-react';

interface NovoPacienteFormProps {
  nutricionistaId: string;
  onSuccess: (newPatientId: string) => void;
  onCancel: () => void;
}

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  nutricionistaId,
  onSuccess,
  onCancel,
}) => {
  const [currentTab, setCurrentTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ABA 1 — PESSOAL
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // ABA 2 — CLÍNICO
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // ABA 3 — HÁBITOS
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcordaRaw, setHorarioAcordaRaw] = useState('');
  const [horarioDormeRaw, setHorarioDormeRaw] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState(false);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Formatação de telefone / whatsapp
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Conversão de horário flexível (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00, 2230 -> 22:30)
  const formatTimeInput = (val: string): string => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 1) {
      return `0${clean}:00`;
    }
    if (clean.length === 2) {
      const num = parseInt(clean, 10);
      if (num < 24) return `${clean}:00`;
      return `0${clean[0]}:${clean[1]}0`;
    }
    if (clean.length === 3) {
      const h = `0${clean[0]}`;
      const m = clean.slice(1);
      return `${h}:${m}`;
    }
    if (clean.length >= 4) {
      const h = clean.slice(0, 2);
      const m = clean.slice(2, 4);
      return `${h}:${m}`;
    }
    return val;
  };

  // Cálculo da idade
  const idade = useMemo(() => {
    if (!dataNascimento) return null;
    const parts = dataNascimento.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // Cálculo automático do IMC
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso.replace(',', '.'));
    const aCm = parseFloat(altura.replace(',', '.'));
    if (!p || !aCm || p <= 0 || aCm <= 0) return null;
    const aM = aCm > 3 ? aCm / 100 : aCm; // caso o usuário digite em metros ou cm
    const imc = p / (aM * aM);
    if (!isFinite(imc) || imc <= 0) return null;

    let classificacao = '';
    let cor = 'text-slate-700';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      cor = 'text-amber-600';
    } else if (imc < 24.9) {
      classificacao = 'Peso adequado';
      cor = 'text-emerald-600';
    } else if (imc < 29.9) {
      classificacao = 'Sobrepeso';
      cor = 'text-amber-600';
    } else if (imc < 34.9) {
      classificacao = 'Obesidade Grau I';
      cor = 'text-orange-600';
    } else if (imc < 39.9) {
      classificacao = 'Obesidade Grau II';
      cor = 'text-rose-600';
    } else {
      classificacao = 'Obesidade Grau III';
      cor = 'text-rose-700';
    }

    return { valor: imc.toFixed(1), classificacao, cor };
  }, [peso, altura]);

  // Handler de seleção múltipla com suporte a "Nenhum"
  const toggleSelection = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    const withoutNenhum = currentList.filter((x) => x !== 'Nenhum');
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((x) => x !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  const handleAddCustom = (
    value: string,
    setValue: (v: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const withoutNenhum = list.filter((x) => x !== 'Nenhum');
    if (!withoutNenhum.includes(trimmed)) {
      setList([...withoutNenhum, trimmed]);
    }
    setValue('');
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNome = nome.trim();
    if (!cleanNome) {
      setCurrentTab('pessoal');
      setErrorMessage('O campo "Nome completo" é obrigatório.');
      return;
    }

    setSubmitting(true);

    try {
      const pNum = peso ? parseFloat(peso.replace(',', '.')) : null;
      let aNum = altura ? parseFloat(altura.replace(',', '.')) : null;
      // Normalizar altura: se foi digitado em cm (ex: 175), converter para metros (1.75) ou manter padrão
      if (aNum && aNum > 3) {
        aNum = parseFloat((aNum / 100).toFixed(2));
      }

      const input: CreatePacienteInput = {
        nutricionista_id: nutricionistaId,
        nome: cleanNome,
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        telefone: telefone || undefined,
        whatsapp: whatsapp || undefined,
        email: email.trim().toLowerCase() || undefined,
        peso_inicial: pNum,
        altura: aNum,
        objetivos,
        objetivo_texto: objetivoTexto.trim() || undefined,
        nivel_atividade: nivelAtividade || undefined,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcordaRaw ? formatTimeInput(horarioAcordaRaw) : undefined,
        horario_dorme: horarioDormeRaw ? formatTimeInput(horarioDormeRaw) : undefined,
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() || undefined : undefined,
        observacoes: observacoes.trim() || undefined,
      };

      const newId = await createPaciente(input);
      onSuccess(newId);
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      setErrorMessage(err?.message || 'Falha ao salvar paciente. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Topo do Formulário */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cadastrar Novo Paciente</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Preencha os dados cadastrais, clínicos e hábitos alimentares do paciente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Atenção</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="px-6 pt-4 border-b border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={() => setCurrentTab('pessoal')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            currentTab === 'pessoal'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">Obrigatório*</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('clinico')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            currentTab === 'clinico'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('habitos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
            currentTab === 'habitos'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        {/* ===================== ABA 1: PESSOAL ===================== */}
        {currentTab === 'pessoal' && (
          <div className="space-y-6 max-w-3xl">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Silva Sauro"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Data de Nascimento e Idade calculada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Data de Nascimento
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                {idade !== null && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Idade calculada: {idade} anos
                  </p>
                )}
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sexo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Feminino', 'Masculino', 'Outro'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSexo(item)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        sexo === item
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="(11) 4000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="paciente@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentTab('clinico')}
                className="px-5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Avançar para Clínico</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== ABA 2: CLÍNICO ===================== */}
        {currentTab === 'clinico' && (
          <div className="space-y-8 max-w-3xl">
            {/* Medidas antropométricas básicas com IMC em tempo real */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Peso atual
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 72.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 175"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC Calculado (somente leitura) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    IMC Calculado
                  </span>
                  {imcCalculado ? (
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className={`text-xl font-extrabold ${imcCalculado.cor}`}>
                        {imcCalculado.valor}
                      </span>
                      <span className={`text-xs font-semibold ${imcCalculado.cor}`}>
                        • {imcCalculado.classificacao}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block mt-1">
                      Informe peso e altura
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Objetivo Principal (Múltipla escolha)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Emagrecer',
                  'Ganhar massa',
                  'Controlar diabetes',
                  'Saúde geral',
                  'Performance esportiva',
                  'Reeducação alimentar',
                ].map((obj) => {
                  const selected = objetivos.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggleSelection(objetivos, setObjetivos, obj)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {obj}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Objetivo complementar ou observações adicionais..."
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                className="w-full mt-2.5 px-4 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Nível de Atividade Física */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nível de Atividade Física
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  'Sedentário',
                  'Levemente ativo',
                  'Moderadamente ativo',
                  'Muito ativo',
                  'Extremamente ativo',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNivelAtividade(item)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                      nivelAtividade === item
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias ou Condições */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Patologias ou Condições de Saúde
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Nenhum',
                  'Diabetes',
                  'Hipertensão',
                  'Hipotireoidismo',
                  'Hipertireoidismo',
                  'Síndrome do ovário policístico',
                  'Doença celíaca',
                  'Colesterol alto',
                  ...patologias.filter(
                    (p) =>
                      ![
                        'Nenhum',
                        'Diabetes',
                        'Hipertensão',
                        'Hipotireoidismo',
                        'Hipertireoidismo',
                        'Síndrome do ovário policístico',
                        'Doença celíaca',
                        'Colesterol alto',
                      ].includes(p)
                  ),
                ].map((pat) => {
                  const selected = patologias.includes(pat);
                  return (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => toggleSelection(patologias, setPatologias, pat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {pat}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Adicionar outra patologia..."
                  value={customPatologia}
                  onChange={(e) => setCustomPatologia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(customPatologia, setCustomPatologia, patologias, setPatologias);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleAddCustom(customPatologia, setCustomPatologia, patologias, setPatologias)
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Restrições Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Nenhum',
                  'Lactose',
                  'Glúten',
                  'Açúcar',
                  'Carne vermelha',
                  'Frutos do mar',
                  ...restricoes.filter(
                    (r) =>
                      !['Nenhum', 'Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].includes(r)
                  ),
                ].map((item) => {
                  const selected = restricoes.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSelection(restricoes, setRestricoes, item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Adicionar outra restrição..."
                  value={customRestricao}
                  onChange={(e) => setCustomRestricao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(customRestricao, setCustomRestricao, restricoes, setRestricoes);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleAddCustom(customRestricao, setCustomRestricao, restricoes, setRestricoes)
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alergias Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Nenhum',
                  'Amendoim',
                  'Leite',
                  'Ovo',
                  'Soja',
                  'Trigo',
                  'Frutos do mar',
                  ...alergias.filter(
                    (a) =>
                      !['Nenhum', 'Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].includes(a)
                  ),
                ].map((item) => {
                  const selected = alergias.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSelection(alergias, setAlergias, item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Adicionar outra alergia..."
                  value={customAlergia}
                  onChange={(e) => setCustomAlergia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(customAlergia, setCustomAlergia, alergias, setAlergias);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleAddCustom(customAlergia, setCustomAlergia, alergias, setAlergias)
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Medicamentos e Suplementos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medicamentos contínuos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levotiroxina 50mcg, Losartana..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  className="w-full p-3 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Suplementos em uso
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Creatina 5g, Vitamina D 2000UI..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  className="w-full p-3 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentTab('pessoal')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Pessoal</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('habitos')}
                className="px-5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Avançar para Hábitos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== ABA 3: HÁBITOS ===================== */}
        {currentTab === 'habitos' && (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Quantas refeições faz por dia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Refeições por dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 4"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Quantidade de água por dia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Água ingerida por dia
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full pl-4 pr-16 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    litros
                  </span>
                </div>
              </div>
            </div>

            {/* Horários automáticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Horário que acorda
                </label>
                <input
                  type="text"
                  placeholder="Ex: 6 ou 630"
                  value={horarioAcordaRaw}
                  onChange={(e) => setHorarioAcordaRaw(e.target.value)}
                  onBlur={() => setHorarioAcordaRaw(formatTimeInput(horarioAcordaRaw))}
                  className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Formatado automaticamente (ex: 630 → 06:30)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Horário que dorme
                </label>
                <input
                  type="text"
                  placeholder="Ex: 23 ou 2230"
                  value={horarioDormeRaw}
                  onChange={(e) => setHorarioDormeRaw(e.target.value)}
                  onBlur={() => setHorarioDormeRaw(formatTimeInput(horarioDormeRaw))}
                  className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Formatado automaticamente (ex: 2230 → 22:30)
                </span>
              </div>
            </div>

            {/* Pratica Atividade Física */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">
                    Pratica atividade física regularmente?
                  </span>
                  <span className="text-xs text-slate-500">
                    Marque caso o paciente realize exercícios físicos habituais.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPraticaAtividade(true)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      praticaAtividade
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPraticaAtividade(false);
                      setAtividadeDescricao('');
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      !praticaAtividade
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {praticaAtividade && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Qual atividade e frequência semanal?
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Musculação 4x na semana, corrida aos sábados"
                    value={atividadeDescricao}
                    onChange={(e) => setAtividadeDescricao(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              )}
            </div>

            {/* Observações gerais */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações gerais
              </label>
              <textarea
                rows={3}
                placeholder="Preferências alimentares, histórico familiar, rotina ou observações da consulta..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentTab('clinico')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Clínico</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cadastrando paciente...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Concluir e Salvar Paciente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

