import { useState } from 'react';
import { mockTasks, mockUsers } from './data/mock';
import type { Status, Priority, Task } from './tipos';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado que guarda as informações que o usuário digita no modal
  const [novaTarefa, setNovaTarefa] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'A Fazer',
    assigneeId: '1', // Puxa o Ricardo por padrão
    deadline: '',
    priority: 'Média'
  });

  const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

  const getUserName = (id: string) => {
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : 'Desconhecido';
  };

  // Função que roda quando clicamos em "Salvar" no modal
  const salvarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tarefaCriada: Task = {
      id: `t${Date.now()}`, // Gera um ID falso baseado no horário
      title: novaTarefa.title || 'Sem título',
      description: novaTarefa.description || '',
      status: novaTarefa.status as Status,
      assigneeId: novaTarefa.assigneeId || '1',
      deadline: novaTarefa.deadline || '',
      priority: novaTarefa.priority as Priority,
    };

    setTasks([...tasks, tarefaCriada]); // Adiciona a nova tarefa na lista existente
    setIsModalOpen(false); // Fecha o modal
    
    // Limpa o formulário para a próxima vez
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média' }); 
  };

  // --- CÁLCULO DOS KPIs ---
  const tarefasCriticas = tasks.filter(t => t.priority === 'Alta' && t.status !== 'Concluído').length;

  const tarefasAtivas = tasks.filter(t => t.status !== 'Concluído');
  const contagemSobrecarga = tarefasAtivas.reduce((acc, task) => {
    acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const idsOrdenados = Object.keys(contagemSobrecarga).sort((a, b) => contagemSobrecarga[b] - contagemSobrecarga[a]);
  const idMaisSobrecargado = idsOrdenados.length > 0 ? idsOrdenados[0] : null;
  const sobrecargaTexto = idMaisSobrecargado 
    ? `${getUserName(idMaisSobrecargado)} (${contagemSobrecarga[idMaisSobrecargado]} tarefas)`
    : 'Nenhuma';

  const concluidas = tasks.filter(t => t.status === 'Concluído').length;

  return (
    <div className="min-h-screen bg-gray-100 p-8 relative">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quadro de Atividades</h1>
          <p className="text-gray-600">Gestão de produtividade e gargalos</p>
        </div>
        
        {/* BOTÃO NOVA TAREFA */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova Tarefa
        </button>
      </header>

      {/* PAINEL DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Tarefas com Prazo Crítico</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{tarefasCriticas}</p>
          <p className="text-xs text-red-500 mt-1">Risco de estouro de prazo</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">Maior Sobrecarga</h3>
          <p className="text-xl font-bold text-gray-800 mt-2 truncate">{sobrecargaTexto}</p>
          <p className="text-xs text-yellow-600 mt-1">Funcionário mais demandado</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Produtividade (Concluídas)</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{concluidas} / {tasks.length}</p>
          <p className="text-xs text-green-500 mt-1">Progresso geral do time</p>
        </div>
      </div>

      {/* KANBAN */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {colunas.map((coluna) => (
          <div key={coluna} className="bg-gray-200 p-4 rounded-lg min-w-[300px] w-[300px] flex flex-col max-h-[600px]">
            <h2 className="font-bold text-lg mb-4 text-gray-700 flex justify-between items-center">
              {coluna}
              <span className="bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded-full">
                {tasks.filter(t => t.status === coluna).length}
              </span>
            </h2>
            
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {tasks
                .filter((task) => task.status === coluna)
                .map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Responsável:</strong> {getUserName(task.assigneeId)}
                    </div>

                    {(task.blocksTasks || task.blocksUsers) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
                        {task.blocksTasks && <p>⚠️ Bloqueia {task.blocksTasks.length} tarefa(s)</p>}
                        {task.blocksUsers && <p>🛑 Trava {task.blocksUsers.length} funcionário(s)</p>}
                      </div>
                    )}

                    <div className="mt-3 flex justify-between items-center text-xs font-medium text-gray-400">
                      <span className="bg-gray-100 px-2 py-1 rounded">📅 {task.deadline || 'Sem prazo'}</span>
                      <span className={`${
                        task.priority === 'Alta' ? 'text-red-500' : 
                        task.priority === 'Média' ? 'text-yellow-500' : 'text-blue-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE NOVA TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Criar Nova Tarefa</h2>
            
            <form onSubmit={salvarTarefa} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título da Tarefa</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                  value={novaTarefa.title}
                  onChange={e => setNovaTarefa({...novaTarefa, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Responsável</label>
                <select 
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                  value={novaTarefa.assigneeId}
                  onChange={e => setNovaTarefa({...novaTarefa, assigneeId: e.target.value})}
                >
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Prazo</label>
                  <input 
                    type="date" 
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-sm"
                    value={novaTarefa.deadline}
                    onChange={e => setNovaTarefa({...novaTarefa, deadline: e.target.value})}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <select 
                    className="mt-1 w-full p-2 border border-gray-300 rounded text-sm"
                    value={novaTarefa.priority}
                    onChange={e => setNovaTarefa({...novaTarefa, priority: e.target.value as Priority})}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}