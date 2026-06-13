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
    title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: [], estimatedHours: 0
  } as any);

  // ESTADOS DE BUSCA, FILTROS E MODO DE VISUALIZAÇÃO
  const [buscaTitulo, setBuscaTitulo] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('Todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos');
  const [modoVisao, setModoVisao] = useState<'quadro' | 'arvore' | 'carga'>('quadro');

  const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

  const getUserName = (id: string) => {
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : 'Desconhecido';
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setTarefaEditando(null);
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: [], estimatedHours: 0 } as any);
  };

  const salvarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tarefaEditando) {
      setTasks(prev => prev.map(task => 
        task.id === tarefaEditando.id 
          ? { ...task, ...novaTarefa, blocksTasks: novaTarefa.blocksTasks || [], estimatedHours: (novaTarefa as any).estimatedHours || 0 } as Task 
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
        estimatedHours: (novaTarefa as any).estimatedHours || 0,
      };
      setTasks(prev => [...prev, tarefaCriada]);
    }
    
    fecharModal();
  };

  const abrirParaCriar = () => {
    setTarefaEditando(null);
    setNovaTarefa({ title: '', description: '', status: 'A Fazer', assigneeId: '1', deadline: '', priority: 'Média', blocksTasks: [], estimatedHours: 0 } as any);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (task: Task) => {
    setTarefaEditando(task);
    setNovaTarefa(task);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // LÓGICA DE DRAG & DROP COM VALIDAÇÃO DE BLOQUEIO DE TAREFAS
  const handleDrop = (e: React.DragEvent, novaColuna: Status) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    const tarefaMovida = tasks.find(t => t.id === idDaTarefa);
    
    if (!tarefaMovida) return;

    const ordemColunas: Record<Status, number> = {
      'A Fazer': 0,
      'Em Andamento': 1,
      'Revisão': 2,
      'Concluído': 3
    };

    const destinoIndex = ordemColunas[novaColuna];
    let violacao = false;
    let mensagemViolacao = '';

    const tarefasBloqueadoras = tasks.filter(t => t.blocksTasks && t.blocksTasks.includes(tarefaMovida.id));
    
    for (const bloq of tarefasBloqueadoras) {
      const bloqIndex = ordemColunas[bloq.status];
      if (destinoIndex > bloqIndex) {
        violacao = true;
        mensagemViolacao = `⚠️ Ação Bloqueada!\n\nA tarefa "${tarefaMovida.title}" não pode ir para "${novaColuna}" pois depende da conclusão da tarefa "${bloq.title}" (que está em "${bloq.status}").`;
        break;
      }
    }

    if (violacao) {
      alert(mensagemViolacao);
      return;
    }

    setTasks(prev => prev.map(task => task.id === idDaTarefa ? { ...task, status: novaColuna } : task));
  };

  // DRAG & DROP PARA MODIFICAR RESPONSÁVEL NO PAINEL DE CARGA
  const handleDropUser = (e: React.DragEvent, novoAssigneeId: string) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    if (!idDaTarefa) return;
    setTasks(prev => prev.map(task => task.id === idDaTarefa ? { ...task, assigneeId: novoAssigneeId } : task));
  };

  const handleDropDelete = (e: React.DragEvent) => {
    const idDaTarefa = e.dataTransfer.getData('taskId');
    if (idDaTarefa) {
      setTasks(prev => prev.filter(task => task.id !== idDaTarefa));
    }
  };

  // Métrica dos cards superiores
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

  // Métricas baseadas em Horas (Esforço)
  const totalHorasGeral = tasks.reduce((acc, t) => acc + ((t as any).estimatedHours || 0), 0);
  const totalHorasConcluidas = tasks.filter(t => t.status === 'Concluído').reduce((acc, t) => acc + ((t as any).estimatedHours || 0), 0);
  const percentualProdutividade = totalHorasGeral > 0 ? Math.round((totalHorasConcluidas / totalHorasGeral) * 100) : 0;

  // Cálculos para o painel de carga de trabalho
  const cargasPorUsuario = mockUsers.map(user => {
    const tarefasUser = tasks.filter(t => t.assigneeId === user.id && t.status !== 'Concluído');
    const totalHoras = tarefasUser.reduce((acc, t) => acc + ((t as any).estimatedHours || 0), 0);
    return { user, tarefasUser, totalHoras };
  });

  const mediaGeralHoras = cargasPorUsuario.reduce((acc, item) => acc + item.totalHoras, 0) / mockUsers.length || 0;
  const cargasRankeadas = [...cargasPorUsuario].sort((a, b) => b.totalHoras - a.totalHoras);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '32px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* WRAPPER PRINCIPAL PARA LIMITAR LARGURA E CENTRALIZAR NA TELA */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* HEADER */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Quadro de Atividades</h1>
            <p style={{ color: '#4b5563', marginTop: '4px', margin: '4px 0 0 0' }}>Gestão de produtividade e gargalos</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setModoVisao('quadro')}
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'quadro' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'quadro' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'quadro' ? '#1f2937' : '#4b5563' }}
              >
                Quadro
              </button>
              <button
                onClick={() => setModoVisao('arvore')}
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'arvore' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'arvore' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'arvore' ? '#1f2937' : '#4b5563' }}
              >
                Árvore
              </button>
              <button
                onClick={() => setModoVisao('carga')}
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s', backgroundColor: modoVisao === 'carga' ? '#ffffff' : 'transparent', boxShadow: modoVisao === 'carga' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', color: modoVisao === 'carga' ? '#1f2937' : '#4b5563' }}
              >
                Carga
              </button>
            </div>

            <button
              onClick={abrirParaCriar}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 24px', borderRadius: '8px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        {/* CARDS DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Tarefas com Prazo Crítico</h3>
            <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', marginBottom: 0 }}>{tarefasCriticas}</p>
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', marginBottom: 0 }}>Risco de estouro de prazo</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #eab308' }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Maior Sobrecarga</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 0 }}>{sobrecargaTexto}</p>
            <p style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px', marginBottom: 0 }}>Funcionário mais demandado</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #22c55e' }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>Produtividade (Horas Concluídas)</h3>
            <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginTop: '8px', marginBottom: 0 }}>{percentualProdutividade}%</p>
            <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '4px', marginBottom: 0 }}>Progresso geral de esforço do time</p>
          </div>
        </div>

        {/* PAINEL DE BUSCA E FILTROS (Visível apenas no modo Quadro) */}
        {modoVisao === 'quadro' && (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              type="text"
              placeholder="Pesquisar por título..."
              style={{ width: '100%', maxWidth: '333px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', outline: 'none' }}
              value={buscaTitulo}
              onChange={e => setBuscaTitulo(e.target.value)}
            />
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '666px' }}>
              <select
                style={{ width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff', outline: 'none' }}
                value={filtroPrioridade}
                onChange={e => setFiltroPrioridade(e.target.value)}
              >
                <option value="Todas">Todas as Prioridades</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>

              <select
                style={{ width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff', outline: 'none' }}
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
        )}

        {/* MODOS DE VISUALIZAÇÃO */}
        {modoVisao === 'quadro' ? (
          /* KANBAN HORIZONTAL - CATEGORIAS LADO A LADO */
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start', width: '100%' }}>
            {colunas.map((coluna) => (
              <div
                key={coluna}
                style={{ backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '8px', minWidth: '280px', flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, coluna)}
              >
                <h2 style={{ fontWeight: '700', fontSize: '1.125rem', color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', margin: 0 }}>
                  {coluna}
                  <span style={{ backgroundColor: '#9ca3af', color: '#ffffff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '9999px' }}>
                    {tasks
                      .filter(t => t.status === coluna)
                      .filter(t => t.title.toLowerCase().includes(buscaTitulo.toLowerCase()))
                      .filter(t => filtroPrioridade === 'Todas' || t.priority === filtroPrioridade)
                      .filter(t => filtroResponsavel === 'Todos' || t.assigneeId === filtroResponsavel)
                      .length}
                  </span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tasks
                    .filter((task) => task.status === coluna)
                    .filter(task => task.title.toLowerCase().includes(buscaTitulo.toLowerCase()))
                    .filter(task => filtroPrioridade === 'Todas' || task.priority === filtroPrioridade)
                    .filter(task => filtroResponsavel === 'Todos' || task.assigneeId === filtroResponsavel)
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => abrirParaEditar(task)}
                        style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderLeft: '4px solid #3b82f6', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <h3 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{task.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>{task.description}</p>

                        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#4b5563' }}>
                          <strong>Responsável:</strong> {getUserName(task.assigneeId)}
                        </div>

                        {task.blocksTasks && task.blocksTasks.length > 0 && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>
                            ⚠️ Bloqueia {task.blocksTasks.length} tarefa(s)
                          </div>
                        )}

                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#4b5563' }}>
                          <strong>Tempo Previsto:</strong> {(task as any).estimatedHours || 0}h
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '500', color: '#9ca3af' }}>
                          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                            📅 {task.deadline || 'Sem prazo'}
                          </span>
                          <span style={{ color: task.priority === 'Alta' ? '#ef4444' : task.priority === 'Média' ? '#eab308' : '#3b82f6' }}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : modoVisao === 'arvore' ? (
          /* VISUALIZAÇÃO EM ÁRVORE - GRID LADO A LADO COM AS DEPENDÊNCIAS */
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Árvore de Dependências entre Tarefas</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', width: '100%' }}>
              {tasks.map(task => (
                <div key={task.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
                  
                  {/* CAIXA DA TAREFA PRINCIPAL (BLOQUEADORA) */}
                  <div 
                    onClick={() => abrirParaEditar(task)}
                    style={{ backgroundColor: '#eff6ff', border: '2px solid #60a5fa', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 10 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.25' }}>{task.title}</span>
                      <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid', textTransform: 'uppercase', color: task.priority === 'Alta' ? '#b91c1c' : task.priority === 'Média' ? '#854d0e' : '#1d4ed8', backgroundColor: task.priority === 'Alta' ? '#fef2f2' : task.priority === 'Média' ? '#fef9c3' : '#eff6ff', borderColor: task.priority === 'Alta' ? '#fecaca' : task.priority === 'Média' ? '#fef08a' : '#bfdbfe' }}>
                        {task.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                      <span style={{ fontWeight: '600' }}>Responsável:</span> {getUserName(task.assigneeId)}
                    </div>
                    <span style={{ fontSize: '0.625rem', alignSelf: 'flex-start', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase', fontWeight: '700' }}>
                      {task.status}
                    </span>
                  </div>

                  {/* RAMIFICAÇÃO PARA OS FILHOS DEPENDENTES */}
                  {task.blocksTasks && task.blocksTasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '32px', borderLeft: '2px dotted #9ca3af', marginLeft: '24px', marginTop: '-4px', paddingTop: '16px', gap: '16px', position: 'relative', width: 'calc(100% - 24px)' }}>
                      {task.blocksTasks.map(blockId => {
                        const blockedTask = tasks.find(t => t.id === blockId);
                        if (!blockedTask) return null;
                        return (
                          <div key={blockedTask.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                            <div style={{ width: '16px', height: '2px', borderBottom: '2px dashed #9ca3af', position: 'absolute', left: '-32px', top: '50%' }}>
                              <div style={{ position: 'absolute', right: '0', top: '-4px', width: '6px', height: '6px', borderRight: '2px solid #9ca3af', borderBottom: '2px solid #9ca3af', transform: 'rotate(-45deg)' }}></div>
                            </div>
                            
                            <div 
                              onClick={() => abrirParaEditar(blockedTask)}
                              style={{ backgroundColor: '#ffffff', border: '2px solid #d1d5db', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.75rem', lineHeight: '1.25' }}>{blockedTask.title}</span>
                                <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid', textTransform: 'uppercase', color: blockedTask.priority === 'Alta' ? '#b91c1c' : blockedTask.priority === 'Média' ? '#854d0e' : '#1d4ed8', backgroundColor: blockedTask.priority === 'Alta' ? '#fef2f2' : blockedTask.priority === 'Média' ? '#fef9c3' : '#eff6ff', borderColor: blockedTask.priority === 'Alta' ? '#fecaca' : blockedTask.priority === 'Média' ? '#fef08a' : '#bfdbfe' }}>
                                  {blockedTask.priority}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.625rem', color: '#4b5563' }}>
                                <span style={{ fontWeight: '600' }}>Responsável:</span> {getUserName(blockedTask.assigneeId)}
                              </div>
                              <span style={{ fontSize: '0.55rem', alignSelf: 'flex-start', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 6px', borderRadius: '9999px', textTransform: 'uppercase', fontWeight: '700', border: '1px solid #e5e7eb' }}>
                                {blockedTask.status}
                              </span>
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
          /* VISUALIZAÇÃO DE CARGA DE TRABALHO EM GRID RESPONSIVO */
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Carga de Trabalho (Horas Previstas por Colaborador)</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', width: '100%' }}>
              {cargasRankeadas.map(item => {
                let faixaBorda = '#e5e7eb';
                let faixaFundo = '#f9fafb';
                let faixaTexto = '#4b5563';
                let indicadorTexto = 'Carga Equilibrada';

                if (mediaGeralHoras > 0) {
                  const percentual = item.totalHoras / mediaGeralHoras;
                  if (percentual > 1.25) {
                    faixaBorda = '#fca5a5';
                    faixaFundo = '#fef2f2';
                    faixaTexto = '#991b1b';
                    indicadorTexto = '🔴 Muita carga';
                  } else if (percentual < 0.75) {
                    faixaBorda = '#86efac';
                    faixaFundo = '#f0fdf4';
                    faixaTexto = '#14532d';
                    indicadorTexto = '🟢 Pouca carga';
                  } else {
                    faixaBorda = '#fde047';
                    faixaFundo = '#feffe0';
                    faixaTexto = '#713f12';
                    indicadorTexto = '🟡 Carga normal';
                  }
                }

                return (
                  <div 
                    key={item.user.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropUser(e, item.user.id)}
                    style={{ border: '2px solid', borderColor: faixaBorda, padding: '14px', borderRadius: '10px', backgroundColor: faixaFundo, transition: 'all 0.3s', display: 'flex', flexDirection: 'column', minHeight: '240px', boxSizing: 'border-box' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }} title={item.user.name}>{item.user.name}</span>
                      <span>Total: {item.totalHoras}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '600', padding: '3px 6px', borderRadius: '9999px', backgroundColor: faixaBorda, color: faixaTexto, alignSelf: 'flex-start' }}>
                        {indicadorTexto}
                      </span>
                    </div>

                    {item.tarefasUser.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                        {item.tarefasUser.map(t => (
                          <div 
                            key={t.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onClick={() => abrirParaEditar(t)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.725rem', cursor: 'pointer', boxShadow: '0 1px 1px rgba(0,0,0,0.01)' }}
                          >
                            <span style={{ fontWeight: '500', paddingRight: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={t.title}>
                              {t.title}
                            </span>
                            <span style={{ color: '#2563eb', fontWeight: '700', backgroundColor: '#eff6ff', padding: '1px 5px', borderRadius: '4px', fontSize: '0.6875rem', flexShrink: 0 }}>
                              {(t as any).estimatedHours || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>Nenhuma tarefa</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* LIXEIRA FLUTUANTE CONDICIONAL - OCULTA NO MODO ÁRVORE */}
      {modoVisao !== 'arvore' && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropDelete}
          title="Arraste e solte um cartão aqui para excluí-lo"
          style={{ position: 'fixed', bottom: '32px', right: '32px', width: '56px', height: '56px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '2px solid white', zIndex: 99999 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>
      )}

      {/* MODAL DE TAREFA */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', zIndex: 2147483648 }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 16px 0' }}>
              {tarefaEditando ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h2>

            <form onSubmit={salvarTarefa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisar relatório mensal"
                  style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }}
                  value={novaTarefa.title || ''}
                  onChange={e => setNovaTarefa({ ...novaTarefa, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que precisa ser feito..."
                  style={{ marginTop: '4px', width: '100%', resize: 'none', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }}
                  value={novaTarefa.description || ''}
                  onChange={e => setNovaTarefa({ ...novaTarefa, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Coluna Inicial / Status</label>
                <select
                  style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                  value={novaTarefa.status || 'A Fazer'}
                  onChange={e => setNovaTarefa({ ...novaTarefa, status: e.target.value as Status })}
                >
                  {colunas.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Responsável</label>
                <select
                  style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                  value={novaTarefa.assigneeId || '1'}
                  onChange={e => setNovaTarefa({ ...novaTarefa, assigneeId: e.target.value })}
                >
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Tempo estipulado (horas)</label>
                <input
                  type="number"
                  min="0"
                  style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', outline: 'none', boxSizing: 'border-box' }}
                  value={(novaTarefa as any).estimatedHours || 0}
                  onChange={e => setNovaTarefa({ ...novaTarefa, estimatedHours: Number(e.target.value) } as any)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Bloqueia outras tarefas</label>
                <select
                  multiple
                  style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none', height: '80px', boxSizing: 'border-box' }}
                  value={novaTarefa.blocksTasks || []}
                  onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setNovaTarefa({ ...novaTarefa, blocksTasks: selectedOptions });
                  }}
                >
                  {tasks
                    .filter(t => t.id !== novaTarefa.id)
                    .map(taskOption => (
                      <option key={taskOption.id} value={taskOption.id}>
                        {taskOption.title}
                      </option>
                    ))}
                </select>
                <span style={{ fontSize: '0.625rem', color: '#9ca3af', display: 'block', marginTop: '4px' }}>Segure Ctrl (ou Cmd) para selecionar múltiplas tarefas</span>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Prazo</label>
                  <input
                    type="date"
                    style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    value={novaTarefa.deadline || ''}
                    onChange={e => setNovaTarefa({ ...novaTarefa, deadline: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Prioridade</label>
                  <select
                    style={{ marginTop: '4px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', padding: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                    value={novaTarefa.priority || 'Média'}
                    onChange={e => setNovaTarefa({ ...TarefaEditandoObj(tarefaEditando), priority: e.target.value as Priority } as any)}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  style={{ borderRadius: '6px', padding: '8px 16px', color: '#4b5563', backgroundColor: 'transparent', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ borderRadius: '6px', padding: '8px 16px', fontWeight: '500', color: '#ffffff', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
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

function TarefaEditandoObj(val: any) {
  return val || {};
}