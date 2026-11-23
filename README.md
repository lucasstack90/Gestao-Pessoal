# Gestão Pessoal · Painel da Vida

Painel pessoal para acompanhar e desenvolver **4 pilares da vida**: financeiro, estudos,
emocional e saúde. Visual monocromático (cartões brancos, destaque escuro, pílulas e barras
arredondadas), com modo escuro.

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
| Visão geral | Pilares em dia, saldo do mês, páginas e treinos da semana, gráfico de evolução, calendário e tabela de status |
| 01 · Financeiro | Fatura do mês (o arquivo fica guardado), receita x despesas, gastos por categoria, metas com aportes em R$ |
| 02 · Estudos | Meta de páginas por dia, sequência, últimos 14 dias, livros com previsão de término |
| 03 · Emocional | Check-in semanal, nota de 1 a 5 por pilar, insights e 3 perguntas fixas |
| 04 · Saúde | Treinos da semana, últimas 6 semanas, horas de sono e energia, hábito diário, recordes pessoais |

### Quando um pilar está "em dia"

- **Financeiro**: mês com lançamentos ou fatura enviada
- **Estudos**: meta de páginas cumprida ontem ou hoje
- **Emocional**: check-in da semana feito
- **Saúde**: treinos no ritmo da meta semanal até hoje

## Como os dados são guardados

No Claude, cada pessoa logada tem uma área privada no banco do Artifact (`data/users/<id>`), dividida em:
`config` (metas, livros, recordes, categorias, metas financeiras), `d-AAAA-MM` (registros diários do mês),
`f-AAAA-MM` (finanças do mês) e `w-AAAA` (check-ins semanais do ano).
