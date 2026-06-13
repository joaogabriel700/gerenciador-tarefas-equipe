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
  const [tarefaEditando, setTarefaEditando] = useState<Task | null>(null);

  const [novaTarefa, setNovaTarefa] = useState<Partial<Task>>({
    title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: []
  });

  const [buscaTitulo, setBuscaTitulo] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('Todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos');

  const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

  const getUserName = (id: string) => {
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : 'Desconhecido';
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setTarefaEditando(null);
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: [] });
  };

  const salvarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tarefaEditando) {
      setTasks(prev => prev.map(task => 
        task.id === tarefaEditando.id 
          ? { ...task, ...novaTarefa } as Task 
          : task
      ));
    } else {
      const tarefaCriada: Task = {
        id: `t${Date.now()}`,
        title: novaTarefa.title || 'Sem título',
        description: novaTarefa.description || '',
        status: novaTarefa.status as Status,
        assigneeId: novaTarefa.assigneeId || '1',
        deadline: novaTarefa.deadline || '',
        priority: novaTarefa.priority as Priority,
        blocksTasks: novaTarefa.blocksTasks || [],
      };
      setTasks(prev => [...prev, tarefaCriada]);
    }
    
    fecharModal();
  };

  const abrirParaCriar = () => {
    setTarefaEditando(null);
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: [] });
    setIsModalOpen(true);
  };

  const abrirParaEditar = (task: Task) => {
    setTarefaEditando(task);
    setNovaTarefa(task);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, novaColuna: Status) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    setTasks(prev => prev.map(task => task.id === idDaTarefa ? { ...task, status: novaColuna } : task));
  };

  const handleDropDelete = (e: React.DragEvent) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    if (idDaTarefa) {
      setTasks(prev => prev.filter(task => task.id !== idDaTarefa));
    }
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {/* HEADER */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quadro de Atividades</h1>
          <p className="text-gray-500 mt-1">Gestão de produtividade e gargalos operacionais</p>
        </div>
        <button
          onClick={abrirParaCriar}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
        >
          + Nova Tarefa
        </button>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-red-500">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tarefas com Prazo Crítico</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{tarefasCriticas}</p>
          <p className="text-xs text-red-600 mt-2 font-medium">Risco de estouro de prazo</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Maior Sobrecarga</h3>
          <p className="text-lg font-bold text-gray-900 mt-2 truncate" title={sobrecargaTexto}>{sobrecargaTexto}</p>
          <p className="text-xs text-yellow-700 mt-2 font-medium">Funcionário mais demandado</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Produtividade (Concluídas)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{concluidas} / {tasks.length}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">Progresso geral do time</p>
        </div>
      </div>

      {/* PAINEL DE BUSCA E FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Pesquisar por título..."
            className="w-full border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            value={buscaTitulo}
            onChange={e => setBuscaTitulo(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute right-3.5 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col sm:flex-row gap-3">
          <select
            className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={filtroPrioridade}
            onChange={e => setFiltroPrioridade(e.target.value)}
          >
            <option value="Todas">Todas as Prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>

          <select
            className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={filtroResponsavel}
            onChange={e => setFiltroResponsavel(e.target.value)}
          >
            <option value="Todos">Todos os Responsáveis</option>
            {mockUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* COLUNAS DO KANBAN */}
      <div className="flex gap-6 overflow-x-auto pb-6 items-start">
        {colunas.map((coluna) => (
          <div
            key={coluna}
            className="bg-gray-100/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/60 min-w-[320px] w-[320px] flex flex-col max-h-[600px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, coluna)}
          >
            <h2 className="font-bold text-base mb-4 text-gray-900 flex justify-between items-center px-1">
              <span>{coluna}</span>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold py-0.5 px-2.5 rounded-full">
                {tasks
                  .filter(t => t.status === coluna)
                  .filter(t => t.title.toLowerCase().includes(buscaTitulo.toLowerCase()))
                  .filter(t => filtroPrioridade === 'Todas' || t.priority === filtroPrioridade)
                  .filter(t => filtroResponsavel === 'Todos' || t.assigneeId === filtroResponsavel)
                  .length}
              </span>
            </h2>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2 custom-scrollbar min-h-[100px]">
              {tasks
                .filter(task => task.status === coluna)
                .filter(task => task.title.toLowerCase().includes(buscaTitulo.toLowerCase()))
                .filter(task => filtroPrioridade === 'Todas' || task.priority === filtroPrioridade)
                .filter(task => filtroResponsavel === 'Todos' || task.assigneeId === filtroResponsavel)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => abrirParaEditar(task)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-500 hover:shadow-md hover:border-gray-200 cursor-pointer transition-all flex flex-col gap-2"
                  >
                    <h3 className="font-semibold text-gray-900 leading-snug">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                    )}

                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium text-gray-400">Responsável:</span> {getUserName(task.assigneeId)}
                    </div>

                    {/* ALERTA DE BLOQUEIO DE TAREFAS */}
                    {task.blocksTasks && task.blocksTasks.length > 0 && (
                      <div className="mt-1 p-1.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 font-semibold">
                        ⚠️ Bloqueia {task.blocksTasks.length} tarefa(s)
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs font-medium text-gray-400 pt-2 border-t border-gray-50 mt-1">
                      <span className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        📅 {task.deadline || 'Sem prazo'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        task.priority === 'Alta' ? 'text-red-700 bg-red-50 border border-red-100' :
                        task.priority === 'Média' ? 'text-yellow-700 bg-yellow-50 border border-yellow-100' : 
                        'text-blue-700 bg-blue-50 border border-blue-100'
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

      {/* LIXEIRA FLUTUANTE */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropDelete}
        title="Arraste e solte um cartão aqui para excluí-lo"
        className="fixed bottom-8 right-8 bg-red-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:bg-red-700 transition-all border-2 border-white z-[10000] hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </div>

      {/* MODAL DE TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              {tarefaEditando ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h2>

            <form onSubmit={salvarTarefa} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisar relatório mensal"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  value={novaTarefa.title || ''}
                  onChange={e => setNovaTarefa({ ...novaTarefa, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que precisa ser feito..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  value={novaTarefa.description || ''}
                  onChange={e => setNovaTarefa({ ...novaTarefa, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Coluna / Status Inicial</label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={novaTarefa.status || 'A Fazer'}
                  onChange={e => setNovaTarefa({ ...novaTarefa, status: e.target.value as Status })}
                >
                  {colunas.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Responsável</label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={novaTarefa.assigneeId || '1'}
                  onChange={e => setNovaTarefa({ ...novaTarefa, assigneeId: e.target.value })}
                >
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* CAMPO DE DEPENDÊNCIAS / BLOQUEIO DE TAREFAS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bloqueia outras tarefas</label>
                <select
                  multiple
                  className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={novaTarefa.blocksTasks || []}
                  onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setNovaTarefa({ ...novaTarefa, blocksTasks: selectedOptions });
                  }}
                >
                  {tasks
                    .filter(t => t.id !== novaTarefa.id) // Impede que a tarefa bloqueie a si mesma
                    .map(taskOption => (
                      <option key={taskOption.id} value={taskOption.id}>
                        {taskOption.title}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-gray-400 block mt-1">Segure Ctrl (ou Cmd) para selecionar mais de uma tarefa</span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700">Prazo</label>
                  <input
                    type="date"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={novaTarefa.deadline || ''}
                    onChange={e => setNovaTarefa({ ...novaTarefa, deadline: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700">Prioridade</label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-gray-200 p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={novaTarefa.priority || 'Média'}
                    onChange={e => setNovaTarefa({ ...novaTarefa, priority: e.target.value as Priority })}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer border border-gray-200/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {tarefaEditando ? 'Salvar Alterações' : 'Salvar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}