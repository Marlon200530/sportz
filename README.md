# Sportz API

Sportz API e uma API Node.js para gestao de partidas desportivas e comentarios em tempo real. O projecto usa Express para HTTP, Drizzle ORM para acesso a PostgreSQL, Zod para validacao, WebSocket para eventos em tempo real e Arcjet para proteccao de requests.

## Tecnologias

- Node.js com ES Modules
- Express
- PostgreSQL
- Drizzle ORM
- Zod
- ws
- Arcjet

## Requisitos

- Node.js 20 ou superior
- PostgreSQL
- npm

## Instalacao

```bash
npm install
```

## Variaveis de ambiente

Crie um ficheiro `.env` na raiz do projecto com as variaveis necessarias:

```env
DATABASE_URL=postgres://user:password@localhost:5432/sportz_db
PORT=3000
HOST=0.0.0.0
PREFIXAPI=api/v1
ARCJET_KEY=ajkey_your_key
ARCJET_MODE=DRY_RUN
ARCJET_ENV=development
```

Notas:

- `DATABASE_URL` e obrigatoria para a ligacao ao PostgreSQL.
- `PREFIXAPI` define o prefixo das rotas HTTP.
- `ARCJET_MODE=DRY_RUN` e recomendado em desenvolvimento.
- Em producao, remova `ARCJET_ENV=development` e use `ARCJET_MODE=LIVE`.
- Nao versionar ficheiros `.env` com credenciais reais.

## Base de dados

Gerar migracoes:

```bash
npm run generate
```

Executar migracoes:

```bash
npm run migrate
```

## Execucao

Ambiente de desenvolvimento:

```bash
npm run dev
```

Ambiente de producao:

```bash
npm start
```

Por defeito, a API fica disponivel em:

```text
http://localhost:3000
```

O WebSocket fica disponivel em:

```text
ws://localhost:3000/ws
```

## Estrutura principal

```text
src/
  app.js
  server.js
  controllers/
  services/
  repositories/
  routes/
  validation/
  middleware/
  ws/
  db/
  utils/
```

## Rotas HTTP

Considerando `PREFIXAPI=api/v1`, as rotas principais sao:

### Health check

```http
GET /
```

### Matches

```http
GET /api/v1/matches
GET /api/v1/matches/:id
POST /api/v1/matches
```

Exemplo de criacao de match:

```json
{
  "sport": "football",
  "homeTeam": "Manchester City",
  "awayTeam": "Liverpool",
  "startTime": "2026-05-01T12:00:00.000Z",
  "endTime": "2026-05-01T13:45:00.000Z"
}
```

### Commentary

```http
GET /api/v1/matches/:id/commentary
GET /api/v1/matches/:id/commentary/:commentaryId
POST /api/v1/matches/:id/commentary
```

Exemplo de criacao de comentario:

```json
{
  "minute": 12,
  "sequence": 1,
  "period": "first_half",
  "eventType": "goal",
  "actor": "Erling Haaland",
  "team": "Manchester City",
  "message": "Goal scored by Erling Haaland.",
  "metadata": {
    "assist": "Kevin De Bruyne"
  },
  "tags": ["goal", "home_team"]
}
```

## WebSocket

O servidor WebSocket esta disponivel em:

```text
ws://localhost:3000/ws
```

Ao ligar, o cliente recebe:

```json
{
  "type": "connected",
  "message": "Connected to the server"
}
```

Para receber eventos de comentarios de um match, o cliente deve subscrever esse match:

```json
{
  "type": "subscribe_match",
  "matchId": 1
}
```

Resposta esperada:

```json
{
  "type": "match_subscribed",
  "matchId": 1
}
```

Para cancelar a subscricao:

```json
{
  "type": "unsubscribe_match",
  "matchId": 1
}
```

Quando um comentario e criado para um match subscrito, o cliente recebe:

```json
{
  "type": "commentary_created",
  "matchId": 1,
  "data": {
    "id": 10,
    "matchId": 1,
    "message": "Goal scored by Erling Haaland."
  }
}
```

Eventos de criacao de match sao enviados a todos os clientes ligados:

```json
{
  "type": "match_created",
  "data": {}
}
```

O servidor limita mensagens WebSocket recebidas por cliente para reduzir abuso.

## Seguranca

O projecto usa Arcjet para proteccao de requests HTTP e do handshake WebSocket.

Regras activas:

- Shield
- Token bucket rate limiting

Em desenvolvimento, recomenda-se:

```bash
ARCJET_ENV=development ARCJET_MODE=DRY_RUN npm run dev
```

Em producao, use `ARCJET_MODE=LIVE`. Por defeito, se Arcjet falhar em producao, a API responde com erro de seguranca indisponivel em vez de permitir o request.

## Validacao

Os payloads e parametros sao validados com Zod em:

```text
src/validation/
```

Erros de validacao retornam uma resposta padronizada:

```json
{
  "success": false,
  "error": "Invalid payload",
  "code": "VALIDATION_ERROR",
  "details": {}
}
```

## Scripts

```bash
npm run dev
npm start
npm run generate
npm run migrate
```

## Estado actual

Funcionalidades implementadas:

- Criacao e listagem de matches
- Consulta de match por id
- Criacao e listagem de comentarios por match
- Consulta de comentario por id
- Broadcast WebSocket para matches criados
- Broadcast WebSocket para comentarios apenas a clientes subscritos no match
- Proteccao HTTP e WebSocket com Arcjet

## Licenca

MIT
