import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_DATABASE_URL || '';

export const sql = databaseUrl ? neon(databaseUrl) : null;

export async function syncNutricionista(id: string, nome: string, email: string) {
  if (!sql) return;
  try {
    await sql`
      INSERT INTO public.nutricionistas (id, nome, email, created_at)
      VALUES (${id}, ${nome}, ${email}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET nome = EXCLUDED.nome,
          email = EXCLUDED.email;
    `;
  } catch (error) {
    console.error('Erro ao sincronizar nutricionista no banco:', error);
  }
}

export interface DashboardMetrics {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: Array<{
    id: string;
    nome: string;
    ultimaConsulta: string;
    diasSemConsulta: number;
    whatsapp?: string;
  }>;
}

export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  if (!sql || !nutricionistaId) {
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }

  try {
    // 1. Total de pacientes cadastrados pela nutricionista logada
    const totalPacientesRes = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = totalPacientesRes[0]?.count || 0;

    // 2. Consultas da semana atual (segunda a domingo da semana corrente)
    const consultasSemanaRes = await sql`
      SELECT COUNT(c.id)::int AS count
      FROM public.consultas c
      INNER JOIN public.pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date
    `;
    const consultasSemana = consultasSemanaRes[0]?.count || 0;

    // 3. Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
    const semRetornoRes = await sql`
      WITH ultimas_consultas AS (
        SELECT 
          c.paciente_id,
          MAX(c.data_consulta) AS ultima_data,
          MAX(c.proximo_retorno) AS max_proximo_retorno
        FROM public.consultas c
        INNER JOIN public.pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}
        GROUP BY c.paciente_id
      )
      SELECT 
        p.id,
        p.nome,
        p.whatsapp,
        uc.ultima_data::text AS ultima_consulta,
        (CURRENT_DATE - uc.ultima_data)::int AS dias_sem_consulta
      FROM ultimas_consultas uc
      INNER JOIN public.pacientes p ON uc.paciente_id = p.id
      WHERE uc.ultima_data < (CURRENT_DATE - INTERVAL '30 days')
        AND (uc.max_proximo_retorno IS NULL OR uc.max_proximo_retorno < CURRENT_DATE)
      ORDER BY uc.ultima_data ASC
    `;

    const pacientesSemRetorno = semRetornoRes.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      ultimaConsulta: r.ultima_consulta,
      diasSemConsulta: Number(r.dias_sem_consulta) || 0,
      whatsapp: r.whatsapp || undefined,
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (err) {
    console.error('Erro ao buscar métricas do dashboard:', err);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

export interface PacienteListItem {
  id: string;
  nome: string;
  objetivos?: string[];
  objetivo_texto?: string;
  ultima_consulta?: string;
  whatsapp?: string;
  telefone?: string;
  email?: string;
  created_at: string;
}

export async function getPacientesList(nutricionistaId: string): Promise<PacienteListItem[]> {
  if (!sql || !nutricionistaId) return [];

  try {
    const res = await sql`
      SELECT 
        p.id,
        p.nome,
        p.objetivos,
        p.objetivo_texto,
        p.whatsapp,
        p.telefone,
        p.email,
        p.created_at,
        (
          SELECT MAX(c.data_consulta)::text
          FROM public.consultas c
          WHERE c.paciente_id = p.id
        ) AS ultima_consulta
      FROM public.pacientes p
      WHERE p.nutricionista_id = ${nutricionistaId}
      ORDER BY p.nome ASC
    `;

    return res.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      objetivos: r.objetivos || [],
      objetivo_texto: r.objetivo_texto || '',
      ultima_consulta: r.ultima_consulta || undefined,
      whatsapp: r.whatsapp || undefined,
      telefone: r.telefone || undefined,
      email: r.email || undefined,
      created_at: r.created_at,
    }));
  } catch (err) {
    console.error('Erro ao listar pacientes:', err);
    return [];
  }
}

export interface CreatePacienteInput {
  nutricionista_id: string;
  // Aba 1 - Pessoal
  nome: string;
  data_nascimento?: string;
  sexo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  // Aba 2 - Clínico
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  // Aba 3 - Hábitos
  refeicoes_por_dia?: number | null;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number | null;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
}

export async function createPaciente(input: CreatePacienteInput): Promise<string> {
  if (!sql) throw new Error('Conexão com o banco indisponível');

  const res = await sql`
    INSERT INTO public.pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      telefone,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes,
      created_at
    ) VALUES (
      ${input.nutricionista_id},
      ${input.nome},
      ${input.data_nascimento || null},
      ${input.sexo || null},
      ${input.telefone || null},
      ${input.whatsapp || null},
      ${input.email || null},
      ${input.peso_inicial ?? null},
      ${input.altura ?? null},
      ${input.objetivos && input.objetivos.length > 0 ? input.objetivos : null},
      ${input.objetivo_texto || null},
      ${input.nivel_atividade || null},
      ${input.patologias && input.patologias.length > 0 ? input.patologias : null},
      ${input.restricoes_alimentares && input.restricoes_alimentares.length > 0 ? input.restricoes_alimentares : null},
      ${input.alergias && input.alergias.length > 0 ? input.alergias : null},
      ${input.medicamentos || null},
      ${input.suplementos || null},
      ${input.refeicoes_por_dia ?? null},
      ${input.horario_acorda || null},
      ${input.horario_dorme || null},
      ${input.litros_agua ?? null},
      ${input.atividade_fisica ?? false},
      ${input.atividade_fisica_descricao || null},
      ${input.observacoes || null},
      NOW()
    )
    RETURNING id;
  `;

  if (!res || res.length === 0) {
    throw new Error('Falha ao inserir paciente no banco');
  }

  return res[0].id;
}


