import { useState } from 'react';
import { mockTasks, mockUsers } from './data/mock';
import type { Status } from './tipos';

export default function App() {
  const [tasks] = useState(mockTasks);
  const colunas: Status[] = ['A Fazer', 'Em Andamento', 'Revisão', 'Concluído'];

  const getUserName = (id: string) => {
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : 'Desconhecido';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quadro de Atividades</h1>
        <p className="text-gray-600">Gestão do time</p>
      </header>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {colunas.map((coluna) => (
          <div key={coluna} className="bg-gray-200 p-4 rounded-lg min-w-[300px] w-[300px]">
            <h2 className="font-bold text-lg mb-4 text-gray-700">{coluna}</h2>
            
            <div className="flex flex-col gap-3">
              {tasks
                .filter((task) => task.status === coluna)
                .map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Responsável:</strong> {getUserName(task.assigneeId)}
                    </div>

                    {(task.blocksTasks || task.blocksUsers) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
                        {task.blocksTasks && <p>⚠️ Bloqueia {task.blocksTasks.length} tarefa(s)</p>}
                        {task.blocksUsers && <p>🛑 Trava {task.blocksUsers.length} funcionário(s)</p>}
                      </div>
                    )}

                    <div className="mt-3 flex justify-between text-xs font-medium text-gray-400">
                      <span>Prazo: {task.deadline}</span>
                      <span>Prioridade: {task.priority}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}