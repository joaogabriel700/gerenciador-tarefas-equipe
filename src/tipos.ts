export type Status = 'A Fazer' | 'Em Andamento' | 'Revisão' | 'Concluído';
export type Priority = 'Baixa' | 'Média' | 'Alta';

export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  assigneeId: string;
  deadline: string; 
  priority: Priority;
  blocksTasks?: string[]; 
  blocksUsers?: string[]; 
}