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
| Tarefas | Tarefas pessoais do dia para marcar (o trabalho fica separado, no módulo Trabalho): rotina fixa (todo dia, dias úteis ou dias escolhidos) e tarefas avulsas de um dia; sequência de dias com tudo feito e % dos últimos 7 dias |
| Visão geral | Tarefas de hoje, pilares em dia, saldo do mês, páginas e treinos da semana, gráfico de evolução, calendário e tabela de status |
| 01 · Financeiro | Fatura do mês (o arquivo fica guardado), receita x despesas, gastos por categoria, metas com aportes em R$ |
| 02 · Estudos | Meta de páginas por dia, sequência, últimos 14 dias, livros com previsão de término |
| 03 · Emocional | Check-in semanal, nota de 1 a 5 por pilar, insights e 3 perguntas fixas |
| 04 · Saúde | Treinos da semana, últimas 6 semanas, horas de sono e energia, hábito diário, recordes pessoais |
| 05 · Trabalho | Demandas do trabalho (e-mails de @gerar.org.br lidos do Gmail a cada 5 minutos + demandas anotadas à mão, com status nova, em andamento e concluída), expediente de hoje (auxiliar administrativo na Gerar, 13:30 às 17:30) com tempo restante, ponto da semana (trabalhei, folga, falta, entrada e saída), horas na semana, rotina do trabalho, registro semanal (entregas, aprendizados, onde preciso de ajuda) e objetivos profissionais |

### Quando um pilar está "em dia"

- **Financeiro**: mês com lançamentos ou fatura enviada
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
