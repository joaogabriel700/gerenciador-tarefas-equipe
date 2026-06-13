import { User, Task } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Ricardo', role: 'Gestor' },
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
  { id: 't1', title: 'Ajustar layout do site', description: 'Corrigir responsividade na home', status: 'Em Andamento', assigneeId: '2', deadline: '2026-06-14', priority: 'Alta' },
  { id: 't2', title: 'Criar banners da campanha', description: 'Banners para redes sociais', status: 'A Fazer', assigneeId: '3', deadline: '2026-06-15', priority: 'Média' },
  { id: 't3', title: 'Reunião de alinhamento', description: 'Definir metas do trimestre', status: 'Concluído', assigneeId: '1', deadline: '2026-06-10', priority: 'Alta' },
  { id: 't4', title: 'Responder chamados', description: 'Zerar a fila do suporte', status: 'Em Andamento', assigneeId: '6', deadline: '2026-06-13', priority: 'Alta' },
  { id: 't5', title: 'Atualizar planilhas', description: 'Fechamento do mês', status: 'Revisão', assigneeId: '8', deadline: '2026-06-12', priority: 'Média' },
  { id: 't6', title: 'Prospecção de clientes', description: 'Ligar para 20 leads', status: 'A Fazer', assigneeId: '5', deadline: '2026-06-16', priority: 'Média' },
  { id: 't7', title: 'Revisar código da API', description: 'Code review', status: 'A Fazer', assigneeId: '7', deadline: '2026-06-14', priority: 'Baixa' },
];