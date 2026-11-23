# Gestão Pessoal · Painel da Vida

Painel pessoal para acompanhar e desenvolver **6 pilares da vida** ao longo de 6 meses:
saúde, sono, mente, estudo, finanças e carreira. Visual monocromático: cartões brancos,
um cartão de destaque escuro, botões em pílula e gráficos de barras arredondadas.

## Como usar

Não precisa instalar nada: abra o `index.html` no navegador.
Também pode ser publicado no **GitHub Pages** (Settings → Pages → branch → `/root`).

Na primeira abertura aparecem **dados de exemplo**. Clique em **Começar do zero** para usar com os seus.

## Pilares

| Pilar | O que acompanha |
|---|---|
| Visão geral | Pilares em dia na semana, gráfico de evolução (treinos, sono, leitura), calendário e tabela de status |
| 01 · Saúde | Treinos da semana, últimas 6 semanas, hábito diário com sequência, recordes pessoais |
| 02 · Sono | Horas por noite (− / +), energia ao acordar, rituais diários, média por semana |
| 03 · Mente | Check-in semanal, nota de 1 a 5 por pilar, insights e 3 perguntas fixas |
| 04 · Estudo | Meta de páginas por dia, sequência, últimos 14 dias, livros com projeção de término |
| 05 · Finanças | Fatura do mês, receita x despesas, gastos por categoria, metas com aportes em R$ |
| 06 · Carreira | Frentes de carreira com indicadores e projetos (+10% / −10%) |

### Quando um pilar está "em dia"

- **Saúde**: treinos no ritmo da meta semanal até hoje
- **Sono**: média da semana de no máximo 1h abaixo da meta
- **Mente**: check-in da semana feito
- **Estudo**: meta de páginas cumprida ontem ou hoje
- **Finanças**: mês com lançamentos ou fatura enviada
- **Carreira**: algum projeto avançou nos últimos 7 dias

## Dados

Tudo é salvo **no próprio navegador** (`localStorage`), com histórico por data.
Em **Configurações** dá para ajustar metas, rituais e categorias, além de **exportar e importar backup** (.json).

## Estrutura

```
index.html        página principal
css/styles.css    estilo visual
js/store.js       dados, datas e cálculos (sequências, médias, status)
js/ui.js          componentes (cartões, gráfico de barras, progresso, notas)
js/views.js       telas: visão geral, 6 pilares e configurações
js/app.js         navegação e ações do usuário
```
