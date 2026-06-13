import type { User, Task } from '../tipos';

export const mockUsers: User[] = [
  { id: '1', name: 'Ricardo (Dono)', role: 'Gestor' },
  { id: '2', name: 'Ana Silva', role: 'Desenvolvedora' },
  { id: '3', name: 'Carlos Costa', role: 'Designer' },
  { id: '4', name: 'Beatriz Souza', role: 'Marketing' },
  { id: '5', name: 'Marcos Paulo', role: 'Vendas' },
  { id: '6', name: 'Juliana Lima', role: 'Suporte' },
  { id: '7', name: 'Fernando Dias', role: 'Desenvolvedor' },
  { id: '8', name: 'Camila Rocha', role: 'Financeiro' },
  { id: '9', name: 'Lucas Mendes', role: 'Produto' },
  { id: '10', name: 'Mariana Alves', role: 'RH' },
];

export const mockTasks: Task[] = [
  { 
    id: 't1', 
    title: 'Ajustar layout do site', 
    description: 'Corrigir responsividade na home', 
    status: 'Em Andamento', 
    assigneeId: '2', 
    deadline: '2026-06-14', 
    priority: 'Alta', 
    blocksTasks: ['t2'],
    estimatedHours: 8 
  },
  { 
    id: 't2', 
    title: 'Criar banners da campanha', 
    description: 'Banners para redes sociais', 
    status: 'A Fazer', 
    assigneeId: '3', 
    deadline: '2026-06-15', 
    priority: 'Média',
    estimatedHours: 6
  },
  { 
    id: 't3', 
    title: 'Reunião de alinhamento', 
    description: 'Definir metas', 
    status: 'Concluído', 
    assigneeId: '1', 
    deadline: '2026-06-10', 
    priority: 'Alta', 
    blocksUsers: ['4', '5'],
    estimatedHours: 2 
  },
  { 
    id: 't4', 
    title: 'Responder chamados', 
    description: 'Zerar a fila', 
    status: 'Em Andamento', 
    assigneeId: '6', 
    deadline: '2026-06-13', 
    priority: 'Alta',
    estimatedHours: 4 
  },
  { 
    id: 't5', 
    title: 'Atualizar planilhas', 
    description: 'Fechamento', 
    status: 'Revisão', 
    assigneeId: '8', 
    deadline: '2026-06-12', 
    priority: 'Média', 
    blocksTasks: ['t6'], 
    blocksUsers: ['1'],
    estimatedHours: 5 
  },
  { 
    id: 't6', 
    title: 'Prospecção de clientes', 
    description: 'Ligar leads', 
    status: 'A Fazer', 
    assigneeId: '5', 
    deadline: '2026-06-16', 
    priority: 'Média',
    estimatedHours: 12 
  },
  { 
    id: 't7', 
    title: 'Revisar código da API', 
    description: 'Code review', 
    status: 'A Fazer', 
    assigneeId: '7', 
    deadline: '2026-06-14', 
    priority: 'Baixa',
    estimatedHours: 4 
  },
  {
    id: 't8',
    title: 'Refatorar Banco de Dados',
    description: 'Otimizar queries lentas do dashboard principal',
    status: 'A Fazer',
    assigneeId: '2', 
    deadline: '2026-06-13', 
    priority: 'Alta',
    blocksTasks: ['t9'], 
    estimatedHours: 16
  },
  {
    id: 't9',
    title: 'Homologar ambiente de Staging',
    description: 'Validar a migração com dados reais simulados',
    status: 'A Fazer',
    assigneeId: '9', // Lucas Mendes - Total: 10h (Intermediário / Carga Normal)
    deadline: '2026-06-18',
    priority: 'Média',
    estimatedHours: 4
  },
  {
    id: 't10',
    title: 'Desenhar Mockups do App Mobile',
    description: 'Fluxo completo de checkout simplificado',
    status: 'Revisão',
    assigneeId: '3',
    deadline: '2026-06-17',
    priority: 'Alta',
    estimatedHours: 10
  },
  {
    id: 't11',
    title: 'Estruturar Script de Vendas (Outbound)',
    description: 'Definir pitch inicial focado em grandes contas',
    status: 'Em Andamento',
    assigneeId: '5',
    deadline: '2026-06-15',
    priority: 'Média',
    blocksTasks: ['t12'], 
    estimatedHours: 8
  },
  {
    id: 't12',
    title: 'Treinar Equipe comercial',
    description: 'Simulação prática do novo pitch de vendas',
    status: 'A Fazer',
    assigneeId: '5',
    deadline: '2026-06-19',
    priority: 'Média',
    blocksTasks: ['t13'], 
    estimatedHours: 4
  },
  {
    id: 't13',
    title: 'Disparar nova cadência de e-mails',
    description: 'Lançar sequência automatizada para 200 leads qualificados',
    status: 'A Fazer',
    assigneeId: '4',
    deadline: '2026-06-22',
    priority: 'Baixa',
    estimatedHours: 3
  },
  
  {
    id: 't14',
    title: 'Mapeamento de User Stories',
    description: 'Documentar fluxos secundários identificados no refinamento',
    status: 'A Fazer',
    assigneeId: '9', 
    deadline: '2026-06-20',
    priority: 'Média',
    estimatedHours: 6
  },
  {
    id: 't15',
    title: 'Conciliação Bancária Trimestral',
    description: 'Auditoria de entradas e saídas pendentes da plataforma externa',
    status: 'A Fazer',
    assigneeId: '8', 
    deadline: '2026-06-19',
    priority: 'Média',
    estimatedHours: 5
  }
];