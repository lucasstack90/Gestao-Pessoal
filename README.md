# Gestão Pessoal · Painel da Vida

Painel pessoal para acompanhar e desenvolver **5 pilares da vida**: financeiro, estudos,
emocional, saúde e trabalho, além das tarefas do dia. Visual com azul elétrico como cor de destaque (menu, seleções, barras e progresso), cartões arredondados,
botões em pílula e modo escuro quase preto, que acompanha o tema do aparelho.

## Onde usar

O painel está hospedado no Claude como Artifact:
**https://claude.ai/artifact/DsSeW5h4HJHPctApsmkcn6**

Abra esse link logado na sua conta Claude, no celular ou no computador: os dados ficam
salvos no banco do próprio Artifact, na sua conta, e aparecem iguais nos dois aparelhos.
O link é privado (só você abre), a menos que seja compartilhado pelo menu Share.

O código-fonte é o arquivo `painel-da-vida.html`. Fora do Claude ele também abre no navegador,
mas aí os dados ficam salvos só naquele navegador.

## Pilares

| Pilar | O que acompanha |
|---|---|
| Tarefas | Tarefas pessoais do dia para marcar, cada uma com horário opcional (ordenadas por horário, com aviso de atrasada e "próxima"), prioridades do dia com estrela (até 3), painel da semana e programação em outros dias (o trabalho fica separado, no módulo Trabalho): rotina fixa (todo dia, dias úteis ou dias escolhidos) e tarefas avulsas de um dia; sequência de dias com tudo feito e % dos últimos 7 dias |
| Visão geral | Resumo do dia preparado às 5h (demandas do e-mail + o que está no painel), tarefas de hoje, pilares em dia, saldo do mês, páginas e treinos da semana, gráfico de evolução, calendário e tabela de status |
| 01 · Financeiro | Fatura do mês (o arquivo fica guardado), receita x despesas, gastos por categoria com limite e aviso a partir de 80%, gastos fixos e parcelas com o total comprometido nos próximos 6 meses, metas com aportes em R$ |
| 02 · Estudos | Cronômetro de foco (25, 45, 60 min ou livre) com registro de tempo por livro e meta diária, anotações e frases de cada livro, lista "quero ler", meta de páginas por dia, sequência, últimos 14 dias e livros com previsão de término |
| 03 · Emocional | Check-in semanal, nota de 1 a 5 por pilar, insights e 3 perguntas fixas |
| 04 · Saúde | Treinos da semana, últimas 6 semanas, horas de sono e energia, hábito diário, recordes pessoais |
| 05 · Trabalho | Demandas do trabalho (e-mails de @gerar.org.br lidos do Gmail a cada 5 minutos + demandas anotadas à mão, com status nova, em andamento e concluída), expediente de hoje (auxiliar administrativo na Gerar, 13:30 às 17:30) com tempo restante, ponto da semana (trabalhei, folga, falta, entrada e saída), horas na semana, rotina do trabalho, registro semanal (entregas, aprendizados, onde preciso de ajuda) e objetivos profissionais |

### Quando um pilar está "em dia"

- **Financeiro**: mês com lançamentos ou fatura enviada e nenhuma categoria acima do limite
- **Estudos**: meta de páginas cumprida ontem ou hoje
- **Emocional**: check-in da semana feito
- **Saúde**: treinos no ritmo da meta semanal até hoje
- **Trabalho**: ponto marcado até ontem e nenhuma demanda nova parada há mais de 1 dia

## Como os dados são guardados

No Claude, cada pessoa logada tem uma área privada no banco do Artifact (`data/users/<id>`), dividida em:
`config` (metas, dados do trabalho, objetivos profissionais, rotina fixa, livros, recordes, categorias, metas financeiras), `d-AAAA-MM` (registros diários do mês, incluindo tarefas marcadas),
`f-AAAA-MM` (finanças do mês) e `w-AAAA` (check-ins semanais do ano).

## Integração com o Gmail

O módulo Trabalho lê o Gmail conectado à conta Claude (conector Gmail, ferramenta `search_threads`, só leitura).
Busca usada: `in:inbox from:<domínio> after:<início do acompanhamento>` (domínio padrão `gerar.org.br`).

- Só entram e-mails que estão na **caixa de entrada** e chegaram **a partir do dia em que o Gmail foi conectado**
  (ou do dia em que você tocar em "Começar a contar de hoje", em Configurações).
- Se a última mensagem da conversa é sua (você respondeu), a demanda é concluída sozinha e nem entra como nova.
- Se o e-mail sai da caixa de entrada (arquivado ou apagado), a demanda nova é concluída sozinha.
- Se a pessoa responde de novo, a demanda volta como "nova resposta".

O painel confere a cada 5 minutos enquanto está aberto e avisa com um número no menu, uma faixa no topo e
o número no título da aba. Nada é alterado no Gmail. As demandas ficam no documento `demands` do banco.

## Foco, anotações e orçamento

**Foco nos estudos.** O cronômetro conta na página; o horário de início fica guardado no navegador, então um
recarregamento não perde o foco em andamento. Ao terminar (ou parar), o tempo vira um registro do dia, ligado ao
livro escolhido. Menos de 1 minuto não é registrado. Também dá para registrar minutos à mão. Registros ficam em
`days[data].focus`, e as anotações e frases em documentos `n-<livro>` do banco (um por livro).

**Orçamento por categoria.** O limite fica em `finance.budgets`. Para cada categoria, o gasto considerado é o
maior valor entre o que você lançou e o que já está comprometido (fixos + parcelas), para não contar duas vezes
uma parcela que já veio na fatura. Aviso (faixa e número no menu) a partir de 80% do limite e alerta vermelho acima de 100%.
Parcelas: a parcela de um mês é `(mês − início)` dentro do total; o gráfico mostra os próximos 6 meses.

## Resumo diário das 5h

Uma tarefa agendada no Claude ("Resumo diário do Painel da Vida") roda todo dia às 4h50 (horário de Brasília, para estar
pronto às 5h). Ela lê, com a sua conta, a área do painel no banco (`data/users/me`) e, quando o conector do Gmail
está disponível na execução, os e-mails de trabalho da caixa de entrada (últimos 3 dias, sem as conversas que você já respondeu).
Depois grava o documento `brief` e manda um push no celular. O painel mostra o cartão **Resumo do dia** no topo da Visão geral.

- Para ler o Gmail, o conector **Gmail** precisa estar ligado na própria rotina (tela de Rotinas do Claude Code na web); a criação pela ferramenta não anexa conectores. Sem ele, o resumo sai só com o painel e avisa "Não consegui ler o Gmail hoje".
- A tarefa só escreve no documento `brief`. Nunca envia, apaga, arquiva nem marca e-mails.
- O painel ignora o `brief` na sincronização (só os documentos que ele conhece são gravados ou apagados).
- Formato do `brief`: `v`, `date` (AAAA-MM-DD), `generatedAt` (ms), `headline`, `summary`,
  `priorities[{title, detail, source, go}]`, `emails[{from, subject, ask, attach, url}]`, `watch[]`.
- Texto vindo de e-mail é exibido como texto puro e só links do Gmail são aceitos.

## Curso do trabalho

O expediente tem 4 dias (seg, ter, qui e sex) e a quarta é o **curso do próprio trabalho**. Em Configurações → Trabalho dá para
escolher os dias de expediente, os dias de curso (um dia não fica nos dois), o nome e o horário do curso. No Ponto da semana cada
dia pode ser marcado como Trabalhei, Curso, Folga ou Falta. O curso conta nas horas da semana, aparece como "Curso de hoje" com
contagem regressiva, tem anotações por dia (`days[data].courseNote`) e a rotina do trabalho tem os dias editáveis (por exemplo, tirar a quarta).
Dados antigos (expediente de seg a sex, sem curso) são migrados sozinhos: a quarta passa a ser dia de curso.

## Horário nas tarefas

Cada tarefa (da rotina, avulsa ou do trabalho) pode ter um horário opcional (`time`, "HH:MM"), definido ao criar ou editado no campo de hora
da própria linha. Na rotina o horário vale para todos os dias; numa avulsa vale só para ela. As tarefas do dia ficam ordenadas por horário
(sem horário vêm depois), o horário fica vermelho quando passa e a tarefa ainda não foi feita, e o cartão mostra "próxima: ... (em 25 min)".
O painel não envia notificação no horário: o aviso é visual, enquanto o painel está aberto, e o resumo das 5h cita os horários do dia.

## Organização da semana (métodos pesquisados)

Escolhi, a partir de uma pesquisa na web, os métodos que cabem no painel:

- **Ivy Lee / "o mais importante primeiro"**: estrela de **prioridade do dia** (até 3 por dia, limite aplicado pelo painel); aviso quando há mais de
  6 tarefas pendentes; botão **Levar pendentes para o dia seguinte** (o que sobrou vai para a lista de amanhã).
- **Revisão e planejamento semanal**: cartão **Semana** com os 7 dias (tarefas, horários e estrelas de cada dia, toque para abrir o dia) e **Foco da
  semana** com até 3 prioridades (`weeks[segunda].top`).
- **Time blocking**: já coberto pelo horário nas tarefas; o resumo das 5h avisa conflitos com expediente e curso.
- **Programar em outros dias**: ao criar, marque "Também em:" (próximos 6 dias); numa tarefa avulsa, o botão de calendário copia ou move para outros dias.

Ficaram de fora por enquanto: matriz de Eisenhower (importante x urgente), caixa de entrada GTD, dia temático e agrupamento de tarefas parecidas.

## Foto de perfil

No canto superior direito de todas as telas fica o **avatar** (a foto, ou as iniciais do nome quando não há foto). Ao tocar, abre o perfil: escolher ou trocar a
foto (no celular o sistema oferece câmera ou galeria), enquadrar arrastando e aproximando, salvar, remover e editar o nome. A foto é redimensionada
para 256x256 (JPEG, cerca de 10 a 40 KB) e fica no documento `photo` do banco, então aparece igual no celular e no computador. O painel só aceita `data:image`
e ignora qualquer outro valor nesse documento. "Carregar exemplo" e "Apagar tudo" não removem a foto.
