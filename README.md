# Gerenciador de Atividades de Equipe

Ferramenta de gestão de atividades criada para ajudar Ricardo, dono de uma PME com um time de 10 pessoas, a acompanhar o trabalho da equipe de forma mais clara, organizada e orientada por dados.

A proposta é centralizar tarefas, responsáveis, prazos, prioridades, dependências e carga de trabalho em uma única interface, reduzindo a dependência de planilhas, papéis e mensagens soltas em grupos de WhatsApp.

## Problema

No cenário apresentado, Ricardo enfrenta dores comuns em times pequenos e médios:

- o trabalho fica espalhado em diferentes lugares;
- ele não sabe com clareza o que está realmente em andamento;
- algumas pessoas ficam sobrecarregadas enquanto outras ficam ociosas;
- prazos estouram sem aviso prévio;
- as reuniões são baseadas em percepções subjetivas, sem indicadores concretos.

O objetivo da solução é transformar essas dores em visibilidade, controle e tomada de decisão.

## Solução Proposta

A solução desenvolvida é um painel de gestão de atividades com foco em acompanhamento visual e indicadores de decisão.

O sistema permite que Ricardo registre tarefas, defina responsáveis, acompanhe prazos, atribua prioridades, estime esforço em horas e visualize dependências entre atividades. Além disso, a ferramenta apresenta indicadores no topo da tela para destacar riscos, gargalos e desequilíbrios na carga de trabalho.

A interface foi organizada em três modos principais:

- **Quadro:** visão Kanban das tarefas por status;
- **Árvore:** visualização das dependências entre tarefas;
- **Carga:** distribuição de horas previstas por colaborador.

Com isso, Ricardo consegue sair de uma gestão baseada em "achismos" para uma rotina mais objetiva, visual e orientada por dados.

## Metodologia Escolhida

A solução foi inspirada principalmente no **Kanban**, com apoio de conceitos de gestão de capacidade e priorização.

O Kanban foi escolhido porque resolve diretamente a dor de visualizar o trabalho em andamento. As colunas **A Fazer**, **Em Andamento**, **Revisão** e **Concluído** permitem que Ricardo entenda rapidamente em que etapa cada atividade está e onde o fluxo pode estar travando.

Além do Kanban, foram incorporados indicadores de prazo, gargalo e carga de trabalho. Apenas visualizar tarefas não seria suficiente para resolver o problema do case, já que Ricardo também precisa identificar sobrecarga, risco de atraso e pontos de atenção antes que eles virem problemas maiores.

Não implementei Scrum completo ou gestão formal de sprints porque o contexto apresentado é de uma PME que precisa primeiro ganhar clareza operacional. A escolha foi por uma solução mais simples, direta e fácil de adotar.

## Funcionalidades

A ferramenta possui as seguintes funcionalidades:

- criação de tarefas;
- edição de tarefas existentes;
- movimentação de tarefas por drag and drop entre colunas;
- exclusão de tarefas ao arrastar para a lixeira;
- cadastro de responsável;
- cadastro de prazo;
- cadastro de prioridade;
- cadastro de horas estimadas;
- cadastro de dependências entre tarefas;
- bloqueio de avanço quando uma tarefa depende de outra ainda pendente;
- filtro por título;
- filtro por prioridade;
- filtro por responsável;
- visão Kanban;
- visão em árvore de dependências;
- visão de carga de trabalho por colaborador;
- indicadores estratégicos no topo do painel;
- persistência local com localStorage;
- dados fictícios para demonstrar o funcionamento ao iniciar o projeto.

## Indicadores / KPIs

Os indicadores foram escolhidos com foco em decisão. A ideia não é mostrar números apenas por mostrar, mas oferecer sinais que ajudem Ricardo a agir.

Além de exibir os números, os cards de **Gargalos Ativos** e **Alertas de Prazo** podem ser clicados para filtrar a visualização e mostrar as tarefas relacionadas ao indicador.

### Gargalos Ativos

Este indicador mede quantas tarefas de alta prioridade estão em etapas intermediárias do fluxo, como **Em Andamento** ou **Revisão**.

Ele ajuda Ricardo a identificar tarefas importantes que podem estar ficando presas no processo. Ao olhar esse número, Ricardo pode decidir se precisa destravar uma revisão, redistribuir trabalho ou priorizar uma entrega crítica.

### Alertas de Prazo

Este indicador mede quantas tarefas ainda não concluídas estão com prazo próximo, considerando tarefas que vencem em até 48 horas.

Ele ajuda Ricardo a agir antes que o prazo estoure. Ao olhar esse número, ele pode decidir quais tarefas precisam de atenção imediata, quais responsáveis devem ser acionados e se alguma prioridade precisa ser alterada.

### Desbalanceamento de Esforço

Este indicador mede a diferença média entre a carga de horas pendentes de cada colaborador e a média do time.

Na prática, ele mostra o quanto a distribuição de trabalho está desigual. Se o número estiver alto, significa que algumas pessoas estão muito acima ou muito abaixo da carga média. Com isso, Ricardo pode decidir se precisa redistribuir tarefas para equilibrar melhor o time.

### Carga por Colaborador

Além do indicador geral de desbalanceamento, a visão de carga mostra o total de horas previstas em tarefas pendentes para cada pessoa.

Essa visão ajuda Ricardo a decidir para quem atribuir novas tarefas e quais colaboradores podem estar sobrecarregados ou com capacidade disponível.

## Como Rodar Localmente

Com Node.js instalado, instale as dependências e inicie o projeto:

```bash
npm install
npm run dev
```

Acesse no navegador o endereço exibido no terminal pelo Vite, normalmente:

```txt
http://localhost:5173
```

Se as dependências já estiverem instaladas e a pasta do projeto já estiver aberta no terminal, basta rodar:

```bash
npm run dev
```

## Dados de Exemplo

O projeto já vem com dados fictícios para demonstrar a solução funcionando desde o primeiro acesso.

Foram cadastrados 10 colaboradores e tarefas com diferentes responsáveis, prazos, prioridades, status, horas estimadas e dependências. Isso permite avaliar o painel sem precisar começar com uma tela vazia.

As alterações feitas durante o uso ficam salvas no localStorage do navegador, permitindo que as tarefas criadas ou editadas permaneçam disponíveis ao recarregar a página.

## Decisões Técnicas

O projeto foi desenvolvido com **React**, **TypeScript** e **Vite**.

O React foi escolhido por facilitar a construção de uma interface interativa, com atualização dinâmica das tarefas, filtros, indicadores e modos de visualização.

O TypeScript foi utilizado para trazer mais segurança na modelagem das entidades principais do sistema, como tarefas, usuários, status e prioridades.

O Vite foi escolhido por oferecer uma configuração simples e rápida para desenvolvimento front-end, o que fazia sentido dentro do prazo do desafio.

A persistência foi feita com **localStorage**. Essa escolha permite manter o projeto simples, funcional e fácil de rodar, sem exigir backend ou banco de dados. Para o escopo do desafio, isso foi suficiente para demonstrar a experiência principal da ferramenta.

## Uso de IA

Usei ferramentas de IA como apoio relevante durante o desenvolvimento, principalmente para acelerar a implementação em TypeScript/React, corrigir problemas de tipagem, revisar erros de lint e organizar partes da interface.

Mesmo com esse apoio, busquei entender as decisões principais da solução: o problema do Ricardo, a escolha do Kanban, os indicadores usados, os cortes de escopo e o funcionamento geral da ferramenta.

## O Que Foi Cortado Pelo Prazo

Para manter o escopo viável dentro do prazo, algumas funcionalidades ficaram fora da primeira versão:

- autenticação de usuários;
- backend com banco de dados real;
- permissões por perfil;
- notificações automáticas;
- histórico detalhado de alterações nas tarefas;
- testes automatizados;
- gráficos históricos de produtividade;
- organização por projetos ou clientes;
- comentários dentro das tarefas;
- anexos em tarefas.

Esses cortes foram feitos para priorizar a entrega de uma solução funcional de ponta a ponta, com foco nas dores principais do Ricardo.

## O Que Eu Faria Com Mais Tempo

Com mais tempo, eu evoluiria a solução com:

- backend e banco de dados para persistência real;
- autenticação e níveis de permissão;
- dashboard histórico com evolução semanal dos indicadores;
- notificações para tarefas próximas do vencimento;
- limite de WIP por coluna do Kanban;
- agrupamento por projetos, clientes ou áreas;
- comentários e histórico de atividade em cada tarefa;
- testes automatizados;
- componentes reutilizáveis para melhorar a organização do front-end;
- cálculo mais refinado de capacidade por pessoa, considerando disponibilidade individual e complexidade das tarefas.

## Como A Solução Responde às Dores do Ricardo

| Dor do Ricardo | Como a solução responde |
|---|---|
| O trabalho fica espalhado em planilha, papel e WhatsApp | Centraliza tarefas, responsáveis, prazos, prioridades e status em um único painel |
| Ele não sabe o que está em andamento de verdade | O quadro Kanban mostra o estado atual de cada tarefa |
| Tem gente sobrecarregada e gente ociosa | A visão de carga mostra horas pendentes por colaborador |
| Prazos estouram sem aviso | O KPI de alertas de prazo destaca tarefas próximas do vencimento |
| As reuniões não têm números concretos | Os KPIs oferecem dados objetivos sobre gargalos, prazos e carga do time |

## Status do Projeto

O projeto está funcional para o escopo do desafio técnico.

Ele permite registrar, acompanhar e analisar o trabalho de um time fictício, trazendo visibilidade sobre andamento, prazos, gargalos, dependências e carga de trabalho. A solução prioriza simplicidade, clareza operacional e indicadores úteis para tomada de decisão.
