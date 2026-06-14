import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { mockTasks, mockUsers } from './data/mock';
import type { Priority, Status, Task } from './tipos';

type ViewMode = 'quadro' | 'arvore' | 'carga';
type PriorityFilter = Priority | 'Todas';
type AssigneeFilter = string | 'Todos';

const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

const tarefaVazia: Omit<Task, 'id'> = {
  title: '',
  description: '',
  status: 'A Fazer',
  assigneeId: '1',
  deadline: '',
  priority: 'Média',
  blocksTasks: [],
  estimatedHours: 0,
};

const ordemColunas: Record<Status, number> = {
  'A Fazer': 0,
  'Em Andamento': 1,
  Revisão: 2,
  Concluído: 3,
};

const hojeTimestamp = Date.now();

const isTask = (value: unknown): value is Task => {
  if (!value || typeof value !== 'object') return false;

  const task = value as Partial<Task>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    typeof task.status === 'string' &&
    colunas.includes(task.status as Status) &&
    typeof task.assigneeId === 'string' &&
    typeof task.deadline === 'string' &&
    typeof task.priority === 'string' &&
    ['Baixa', 'Média', 'Alta'].includes(task.priority)
  );
};

const getEstimatedHours = (task: Task) => task.estimatedHours ?? 0;

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const tarefasSalvas = localStorage.getItem('kanban_tasks');
      const parsed: unknown = tarefasSalvas ? JSON.parse(tarefasSalvas) : null;
      if (Array.isArray(parsed) && parsed.every(isTask)) return parsed;
    } catch (error) {
      console.error('Cache ignorado.', error);
    }

    return mockTasks;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Task | null>(null);
  const [novaTarefa, setNovaTarefa] = useState<Partial<Task>>(tarefaVazia);
  const [buscaTitulo, setBuscaTitulo] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<PriorityFilter>('Todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState<AssigneeFilter>('Todos');
  const [modoVisao, setModoVisao] = useState<ViewMode>('quadro');
  const [filtroGargaloAtivo, setFiltroGargaloAtivo] = useState(false);
  const [filtroRiscoAtivo, setFiltroRiscoAtivo] = useState(false);

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const getUserName = (id: string) => {
    const user = mockUsers.find((usuario) => usuario.id === id);
    return user ? user.name : 'Desconhecido';
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setTarefaEditando(null);
    setNovaTarefa(tarefaVazia);
  };

  const salvarTarefa = (e: FormEvent) => {
    e.preventDefault();

    if (tarefaEditando) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === tarefaEditando.id
            ? {
                ...task,
                ...novaTarefa,
                blocksTasks: novaTarefa.blocksTasks ?? [],
                estimatedHours: novaTarefa.estimatedHours ?? 0,
              }
            : task,
        ),
      );
    } else {
      const tarefaCriada: Task = {
        ...tarefaVazia,
        ...novaTarefa,
        id: `t${Date.now()}`,
        title: novaTarefa.title || 'Sem título',
        status: novaTarefa.status ?? 'A Fazer',
        assigneeId: novaTarefa.assigneeId || '1',
        priority: novaTarefa.priority ?? 'Média',
        blocksTasks: novaTarefa.blocksTasks ?? [],
        estimatedHours: novaTarefa.estimatedHours ?? 0,
      };

      setTasks((prev) => [...prev, tarefaCriada]);
    }

    fecharModal();
  };

  const abrirParaCriar = () => {
    setTarefaEditando(null);
    setNovaTarefa(tarefaVazia);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (task: Task) => {
    setTarefaEditando(task);
    setNovaTarefa(task);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, novaColuna: Status) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    const tarefaMovida = tasks.find((t) => t.id === idDaTarefa);

    if (!tarefaMovida) return;

    const destinoIndex = ordemColunas[novaColuna];
    const tarefasBloqueadoras = tasks.filter((t) => t.blocksTasks?.includes(tarefaMovida.id));

    for (const bloqueadora of tarefasBloqueadoras) {
      const bloqueadoraIndex = ordemColunas[bloqueadora.status];
      if (destinoIndex > bloqueadoraIndex) {
        alert(
          `Ação bloqueada!\n\nA tarefa "${tarefaMovida.title}" não pode ir para "${novaColuna}" pois depende da conclusão da tarefa "${bloqueadora.title}" (que está em "${bloqueadora.status}").`,
        );
        return;
      }
    }

    setTasks((prev) => prev.map((task) => (task.id === idDaTarefa ? { ...task, status: novaColuna } : task)));
  };

  const handleDropUser = (e: React.DragEvent, novoAssigneeId: string) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    if (!idDaTarefa) return;

    setTasks((prev) => prev.map((task) => (task.id === idDaTarefa ? { ...task, assigneeId: novoAssigneeId } : task)));
  };

  const handleDropDelete = (e: React.DragEvent) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    if (idDaTarefa) {
      setTasks((prev) => prev.filter((task) => task.id !== idDaTarefa));
    }
  };

  const listagemGargalos = tasks.filter(
    (task) => (task.status === 'Revisão' || task.status === 'Em Andamento') && task.priority === 'Alta',
  );
  const qtdGargalos = listagemGargalos.length;

  const listagemRiscoPrazo = tasks.filter((task) => {
    if (task.status === 'Concluído' || !task.deadline) return false;

    const diferencaDias = Math.ceil((new Date(task.deadline).getTime() - hojeTimestamp) / (1000 * 60 * 60 * 24));
    return diferencaDias <= 2;
  });
  const qtdRiscoPrazo = listagemRiscoPrazo.length;

  const cargasHorariasUsuarios = mockUsers.map((user) => {
    const tarefasUser = tasks.filter((task) => task.assigneeId === user.id && task.status !== 'Concluído');
    return tarefasUser.reduce((acc, task) => acc + getEstimatedHours(task), 0);
  });

  const mediaHorasEquipe = cargasHorariasUsuarios.reduce((acc, horas) => acc + horas, 0) / mockUsers.length || 0;
  const somatorioDesviosAbsolutos = cargasHorariasUsuarios.reduce(
    (acc, horas) => acc + Math.abs(horas - mediaHorasEquipe),
    0,
  );
  const indiceDesbalanceamento = Math.round(somatorioDesviosAbsolutos / mockUsers.length || 0);

  const capacidadeMapeada = mockUsers.map((user) => {
    const tarefasUser = tasks.filter((task) => task.assigneeId === user.id && task.status !== 'Concluído');
    const totalHoras = tarefasUser.reduce((acc, task) => acc + getEstimatedHours(task), 0);
    return { user, tarefasUser, totalHoras };
  });
  const cargasRankeadas = [...capacidadeMapeada].sort((a, b) => b.totalHoras - a.totalHoras);

  const filtrarTarefas = (lista: Task[]) => {
    return lista
      .filter((task) => task.title.toLowerCase().includes(buscaTitulo.toLowerCase()))
      .filter((task) => filtroPrioridade === 'Todas' || task.priority === filtroPrioridade)
      .filter((task) => filtroResponsavel === 'Todos' || task.assigneeId === filtroResponsavel)
      .filter(
        (task) =>
          !filtroGargaloAtivo ||
          ((task.status === 'Revisão' || task.status === 'Em Andamento') && task.priority === 'Alta'),
      )
      .filter((task) => {
        if (!filtroRiscoAtivo) return true;
        if (task.status === 'Concluído' || !task.deadline) return false;

        const diferencaDias = Math.ceil((new Date(task.deadline).getTime() - hojeTimestamp) / (1000 * 60 * 60 * 24));
        return diferencaDias <= 2;
      });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '32px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Quadro de Atividades</h1>
            <p style={{ color: '#4b5563', marginTop: '4px', margin: '4px 0 0 0' }}>Gestão de produtividade e gargalos</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setModoVisao('quadro')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'quadro' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'quadro' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'quadro' ? '#1f2937' : '#4b5563' }}>Quadro</button>
              <button onClick={() => setModoVisao('arvore')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'arvore' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'arvore' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'arvore' ? '#1f2937' : '#4b5563' }}>Árvore</button>
              <button onClick={() => setModoVisao('carga')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'carga' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'carga' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'carga' ? '#1f2937' : '#4b5563' }}>Carga</button>
            </div>
            <button onClick={abrirParaCriar} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 24px', borderRadius: '8px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}>+ Nova Tarefa</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div
            onClick={() => {
              setFiltroRiscoAtivo(false);
              setFiltroGargaloAtivo(!filtroGargaloAtivo);
            }}
            style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: filtroGargaloAtivo ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #ef4444', cursor: 'pointer', outline: filtroGargaloAtivo ? '2px solid #ef4444' : 'none', transform: filtroGargaloAtivo ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Gargalos Ativos</h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{filtroGargaloAtivo ? '(Limpar filtro)' : '(Filtrar)'}</span>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', marginBottom: 0 }}>{qtdGargalos}</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', marginBottom: 0 }}>{filtroGargaloAtivo ? 'Exibindo retenções críticas de alta prioridade' : 'Tarefas prioritárias travadas'}</p>
          </div>

          <div
            onClick={() => {
              setFiltroGargaloAtivo(false);
              setFiltroRiscoAtivo(!filtroRiscoAtivo);
            }}
            style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: filtroRiscoAtivo ? '0 4px 12px rgba(234, 179, 8, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #eab308', cursor: 'pointer', outline: filtroRiscoAtivo ? '2px solid #eab308' : 'none', transform: filtroRiscoAtivo ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Alertas de Prazo</h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{filtroRiscoAtivo ? '(Limpar filtro)' : '(Filtrar)'}</span>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', marginBottom: 0 }}>{qtdRiscoPrazo}</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px', marginBottom: 0 }}>{filtroRiscoAtivo ? 'Prazos expirando em até 48h' : 'Risco iminente de atraso'}</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #22c55e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Desbalanceamento</h3>
              <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', marginBottom: 0 }}>{indiceDesbalanceamento}</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '4px', marginBottom: 0 }}>Desvio médio de esforço do time</p>
          </div>
        </div>

        {modoVisao === 'quadro' && (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <input type="text" placeholder="Pesquisar por título..." style={{ width: '100%', maxWidth: '333px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', outline: 'none' }} value={buscaTitulo} onChange={(e) => setBuscaTitulo(e.target.value)} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '666px' }}>
              <select style={{ width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff', outline: 'none' }} value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value as PriorityFilter)}>
                <option value="Todas">Todas as Prioridades</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
              <select style={{ width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff', outline: 'none' }} value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)}>
                <option value="Todos">Todos os Responsáveis</option>
                {mockUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {modoVisao === 'quadro' ? (
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start', width: '100%' }}>
            {colunas.map((coluna) => (
              <div key={coluna} style={{ backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '8px', minWidth: '280px', flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, coluna)}>
                <h2 style={{ fontWeight: '700', fontSize: '1.125rem', color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', margin: 0 }}>
                  {coluna}
                  <span style={{ backgroundColor: '#9ca3af', color: '#ffffff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '9999px' }}>
                    {filtrarTarefas(tasks.filter((task) => task.status === coluna)).length}
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtrarTarefas(tasks.filter((task) => task.status === coluna)).map((task) => (
                    <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => abrirParaEditar(task)} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #3b82f6', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <h3 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{task.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>{task.description}</p>
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#4b5563' }}><strong>Responsável:</strong> {getUserName(task.assigneeId)}</div>
                      {task.blocksTasks && task.blocksTasks.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>Bloqueia {task.blocksTasks.length} tarefa(s)</div>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#4b5563' }}><strong>Tempo Previsto:</strong> {getEstimatedHours(task)}</div>
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '500', color: '#9ca3af' }}>
                        <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>{task.deadline || 'Sem prazo'}</span>
                        <span style={{ color: task.priority === 'Alta' ? '#ef4444' : task.priority === 'Média' ? '#eab308' : '#3b82f6' }}>{task.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : modoVisao === 'arvore' ? (
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Árvore de Dependências entre Tarefas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', width: '100%' }}>
              {filtrarTarefas(tasks).map((task) => (
                <div key={task.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div onClick={() => abrirParaEditar(task)} style={{ backgroundColor: '#eff6ff', border: '2px solid #60a5fa', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.25' }}>{task.title}</span>
                      <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid', textTransform: 'uppercase', color: task.priority === 'Alta' ? '#b91c1c' : task.priority === 'Média' ? '#854d0e' : '#1d4ed8', backgroundColor: task.priority === 'Alta' ? '#fef2f2' : task.priority === 'Média' ? '#fef9c3' : '#eff6ff', borderColor: task.priority === 'Alta' ? '#fecaca' : task.priority === 'Média' ? '#854d0e' : '#1d4ed8' }}>{task.priority}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563' }}><span style={{ fontWeight: '600' }}>Responsável:</span> {getUserName(task.assigneeId)}</div>
                    <span style={{ fontSize: '0.625rem', alignSelf: 'flex-start', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase', fontWeight: '700' }}>{task.status}</span>
                  </div>
                  {task.blocksTasks && task.blocksTasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '32px', borderLeft: '2px dotted #9ca3af', marginLeft: '24px', marginTop: '-4px', paddingTop: '16px', gap: '16px', position: 'relative', width: 'calc(100% - 24px)' }}>
                      {task.blocksTasks.map((blockId) => {
                        const blockedTask = tasks.find((t) => t.id === blockId);
                        if (!blockedTask) return null;

                        return (
                          <div key={blockedTask.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                            <div style={{ width: '16px', height: '2px', borderBottom: '2px dashed #9ca3af', position: 'absolute', left: '-32px', top: '50%' }}><div style={{ position: 'absolute', right: '0', top: '-4px', width: '6px', height: '6px', borderRight: '2px solid #9ca3af', borderBottom: '2px solid #9ca3af', transform: 'rotate(-45deg)' }} /></div>
                            <div onClick={() => abrirParaEditar(blockedTask)} style={{ backgroundColor: '#ffffff', border: '2px solid #d1d5db', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'border-color 0.2s', boxSizing: 'border-box' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.75rem', lineHeight: '1.25' }}>{blockedTask.title}</span>
                                <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid', textTransform: 'uppercase', color: blockedTask.priority === 'Alta' ? '#b91c1c' : blockedTask.priority === 'Média' ? '#854d0e' : '#1d4ed8', backgroundColor: blockedTask.priority === 'Alta' ? '#fef2f2' : blockedTask.priority === 'Média' ? '#fef9c3' : '#eff6ff', borderColor: blockedTask.priority === 'Alta' ? '#fecaca' : blockedTask.priority === 'Média' ? '#fef08a' : '#bfdbfe' }}>{blockedTask.priority}</span>
                              </div>
                              <div style={{ fontSize: '0.625rem', color: '#4b5563' }}><span style={{ fontWeight: '600' }}>Responsável:</span> {getUserName(blockedTask.assigneeId)}</div>
                              <span style={{ fontSize: '0.55rem', alignSelf: 'flex-start', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: '9999px', textTransform: 'uppercase', fontWeight: '700', border: '1px solid #e5e7eb' }}>{blockedTask.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Carga de Trabalho (Horas Previstas por Colaborador)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', width: '100%' }}>
              {cargasRankeadas.map((item) => {
                let faixaBorda = '#e5e7eb';
                let faixaFundo = '#f9fafb';
                let faixaTexto = '#4b5563';
                let indicadorTexto = 'Carga equilibrada';

                if (mediaHorasEquipe > 0) {
                  const percentual = item.totalHoras / mediaHorasEquipe;
                  if (percentual > 1.25) {
                    faixaBorda = '#fca5a5';
                    faixaFundo = '#fef2f2';
                    faixaTexto = '#991b1b';
                    indicadorTexto = 'Muita carga';
                  } else if (percentual < 0.75) {
                    faixaBorda = '#86efac';
                    faixaFundo = '#f0fdf4';
                    faixaTexto = '#14532d';
                    indicadorTexto = 'Pouca carga';
                  } else {
                    faixaBorda = '#fde047';
                    faixaFundo = '#feffe0';
                    faixaTexto = '#713f12';
                    indicadorTexto = 'Carga normal';
                  }
                }

                const tarefasFiltradasUser = filtrarTarefas(item.tarefasUser);

                return (
                  <div key={item.user.id} onDragOver={handleDragOver} onDrop={(e) => handleDropUser(e, item.user.id)} style={{ border: '2px solid', borderColor: faixaBorda, padding: '14px', borderRadius: '10px', backgroundColor: faixaFundo, transition: 'all 0.3s', display: 'flex', flexDirection: 'column', minHeight: '240px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }} title={item.user.name}>{item.user.name}</span>
                      <span>Total: {item.totalHoras}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '600', padding: '3px 6px', borderRadius: '9999px', backgroundColor: faixaBorda, color: faixaTexto, alignSelf: 'flex-start' }}>{indicadorTexto}</span>
                    </div>
                    {tarefasFiltradasUser.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                        {tarefasFiltradasUser.map((task) => (
                          <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => abrirParaEditar(task)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.725rem', cursor: 'pointer', boxShadow: '0 1px 1px rgba(0,0,0,0.01)' }}>
                            <span style={{ fontWeight: '500', paddingRight: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={task.title}>{task.title}</span>
                            <span style={{ color: '#2563eb', fontWeight: '700', backgroundColor: '#eff6ff', padding: '1px 5px', borderRadius: '4px', fontSize: '0.6875rem', flexShrink: 0 }}>{getEstimatedHours(task)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>Nenhuma tarefa</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modoVisao !== 'arvore' && (
        <div onDragOver={handleDragOver} onDrop={handleDropDelete} title="Arraste e solte um cartão aqui para excluí-lo" style={{ position: 'fixed', bottom: '32px', right: '32px', width: '56px', height: '56px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid white', zIndex: 99999 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', zIndex: 2147483648 }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 16px 0' }}>{tarefaEditando ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
            <form onSubmit={salvarTarefa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Título da Tarefa *</label>
                <input type="text" required placeholder="Ex: Revisar relatório mensal" style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.title ?? ''} onChange={(e) => setNovaTarefa({ ...novaTarefa, title: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Descrição</label>
                <textarea rows={3} placeholder="Descreva o que precisa ser feito..." style={{ marginTop: '4px', width: '100%', resize: 'none', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.description ?? ''} onChange={(e) => setNovaTarefa({ ...novaTarefa, description: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Coluna Inicial / Status</label>
                <select style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.status ?? 'A Fazer'} onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value as Status })}>{colunas.map((coluna) => <option key={coluna} value={coluna}>{coluna}</option>)}</select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Responsável</label>
                <select style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.assigneeId ?? '1'} onChange={(e) => setNovaTarefa({ ...novaTarefa, assigneeId: e.target.value })}>{mockUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Tempo estipulado (horas)</label>
                <input type="number" min="0" style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.estimatedHours ?? 0} onChange={(e) => setNovaTarefa({ ...novaTarefa, estimatedHours: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Bloqueia outras tarefas</label>
                <select multiple style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none', height: '80px', boxSizing: 'border-box' }} value={novaTarefa.blocksTasks ?? []} onChange={(e) => { const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value); setNovaTarefa({ ...novaTarefa, blocksTasks: selectedOptions }); }}>{tasks.filter((task) => task.id !== novaTarefa.id).map((taskOption) => <option key={taskOption.id} value={taskOption.id}>{taskOption.title}</option>)}</select>
                <span style={{ fontSize: '0.625rem', color: '#9ca3af', display: 'block', marginTop: '4px' }}>Segure Ctrl (ou Cmd) para selecionar múltiplas tarefas</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Prazo</label>
                  <input type="date" style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.deadline ?? ''} onChange={(e) => setNovaTarefa({ ...novaTarefa, deadline: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Prioridade</label>
                  <select style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }} value={novaTarefa.priority ?? 'Média'} onChange={(e) => setNovaTarefa({ ...novaTarefa, priority: e.target.value as Priority })}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option></select>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={fecharModal} style={{ borderRadius: '6px', padding: '8px 16px', color: '#4b5563', backgroundColor: 'transparent', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'background-color 0.2s' }}>Cancelar</button>
                <button type="submit" style={{ borderRadius: '6px', padding: '8px 16px', fontWeight: '500', color: '#ffffff', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}>{tarefaEditando ? 'Salvar Alterações' : 'Salvar Tarefa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
