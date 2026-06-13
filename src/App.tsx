import { useState, useEffect } from 'react';
import { mockTasks, mockUsers } from './data/mock';
import type { Status, Priority, Task } from './tipos';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const tarefasSalvas = localStorage.getItem('kanban_tasks');
      if (tarefasSalvas) {
        const parsed = JSON.parse(tarefasSalvas);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Cache ignorado.", error);
    }
    return mockTasks;
  });

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [novaTarefa, setNovaTarefa] = useState<Partial<Task>>({
    title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média'
  });

  const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

  const getUserName = (id: string) => {
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : 'Desconhecido';
  };

  const salvarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    const tarefaCriada: Task = {
      id: `t${Date.now()}`,
      title: novaTarefa.title || 'Sem título',
      description: novaTarefa.description || '',
      status: novaTarefa.status as Status,
      assigneeId: novaTarefa.assigneeId || '1',
      deadline: novaTarefa.deadline || '',
      priority: novaTarefa.priority as Priority,
    };
    setTasks(prev => {
      const updated = [...prev, tarefaCriada];
      return updated;
    });
    setIsModalOpen(false);
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média' });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, novaColuna: Status) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    setTasks(prev => prev.map(task => task.id === idDaTarefa ? { ...task, status: novaColuna } : task));
  };

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
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quadro de Atividades</h1>
          <p className="text-gray-600">Gestão de produtividade e gargalos</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova Tarefa
        </button>
      </header>

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

      <div className="flex gap-6 overflow-x-auto pb-4">
        {colunas.map((coluna) => (
          <div
            key={coluna}
            className="bg-gray-200 p-4 rounded-lg min-w-[300px] w-[300px] flex flex-col max-h-[600px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, coluna)}
          >
            <h2 className="font-bold text-lg mb-4 text-gray-700 flex justify-between items-center">
              {coluna}
              <span className="bg-gray-400 text-white text-xs py-1 px-2 rounded-full">
                {tasks.filter(t => t.status === coluna).length}
              </span>
            </h2>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {tasks
                .filter((task) => task.status === coluna)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
                  >
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>

                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Responsável:</strong> {getUserName(task.assigneeId)}
                    </div>

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

      {/* JANELA DO MODAL FORÇADA NO ESTILO BRUTO (INLINE CSS) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2147483647, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '8px', 
            width: '100%', maxWidth: '450px', zIndex: 2147483648
          }}>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Criar Nova Tarefa</h2>

            <form onSubmit={salvarTarefa} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisar relatório mensal"
                  className="mt-1 w-full rounded border border-gray-300 p-2"
                  value={novaTarefa.title}
                  onChange={e => setNovaTarefa({ ...novaTarefa, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que precisa ser feito..."
                  className="mt-1 w-full resize-none rounded border border-gray-300 p-2"
                  value={novaTarefa.description}
                  onChange={e => setNovaTarefa({ ...novaTarefa, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Coluna Inicial</label>
                <select
                  className="mt-1 w-full rounded border border-gray-300 p-2"
                  value={novaTarefa.status}
                  onChange={e => setNovaTarefa({ ...novaTarefa, status: e.target.value as Status })}
                >
                  {colunas.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Responsável</label>
                <select
                  className="mt-1 w-full rounded border border-gray-300 p-2"
                  value={novaTarefa.assigneeId}
                  onChange={e => setNovaTarefa({ ...novaTarefa, assigneeId: e.target.value })}
                >
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Prazo</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                    value={novaTarefa.deadline}
                    onChange={e => setNovaTarefa({ ...novaTarefa, deadline: e.target.value })}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <select
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                    value={novaTarefa.priority}
                    onChange={e => setNovaTarefa({ ...novaTarefa, priority: e.target.value as Priority })}
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
                  className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
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