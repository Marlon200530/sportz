# Relatorio do Modulo Match

## Escopo

Analise e correcao do fluxo de criacao de partidas em:

- `src/controllers/match.controller.js`
- `src/services/match.service.js`
- `src/repositories/match.repository.js`
- `src/routes/match.routes.js`
- `src/validation/matches.js`
- `src/app.js`
- `src/utils/errors.js`

## Problemas encontrados

1. A rota `POST /api/v1/matches` nao estava registrada.
   - O controller de criacao existia, mas nao era chamado por nenhuma rota.

2. A resposta de erro tinha typo.
   - O campo `sucess` estava escrito incorretamente. O padrao correto e `success`.

3. O controller expunha erro interno ao cliente.
   - A resposta retornava o objeto `error` diretamente em `details`, o que pode vazar stack trace, SQL ou dados sensiveis.

4. Erros de validacao eram serializados como string.
   - `JSON.stringify(parsed.error)` dificulta o consumo por clientes da API.

5. O repository continha regra de negocio.
   - O status da partida era calculado dentro do repository. Essa decisao pertence ao service.

6. Nao havia tratamento padronizado de erros.
   - Cada controller precisaria implementar seu proprio `try/catch`, aumentando repeticao e risco de respostas inconsistentes.

7. O endpoint de listagem ficava pendurado.
   - `getMatches` validava a query, mas nao enviava resposta.
   - O service chamava a si mesmo recursivamente.
   - O repository tinha o nome `getaMatches`, diferente do esperado.

## Correcoes aplicadas

1. Registrada a rota de criacao:
   - `POST /api/v1/matches`
   - Implementada em `src/routes/match.routes.js`.

2. Criado utilitario de erros:
   - `AppError` para erros operacionais.
   - `errorHandler` para resposta padronizada.

3. Adicionado middleware global de erro em `src/app.js`.
   - O middleware tambem trata JSON malformado enviado antes de chegar ao controller.

4. Atualizado o controller para:
   - Validar payload com Zod.
   - Retornar detalhes estruturados com `parsed.error.flatten()`.
   - Usar `try/catch` explicitamente.
   - Delegar excecoes ao middleware global com `next(error)`.

5. Atualizado o service para:
   - Validar que `homeTeam` e `awayTeam` sejam diferentes.
   - Calcular o status da partida antes de persistir.
   - Bloquear datas invalidas com erro operacional.

6. Atualizado o repository para:
   - Focar apenas em persistencia.
   - Receber `status` ja calculado pelo service.

7. Atualizada a validacao para:
   - Remover espacos extras de `sport`, `homeTeam` e `awayTeam`.

8. Corrigida a listagem de partidas:
   - `GET /api/v1/matches` agora valida `limit`.
   - O service chama o repository correto.
   - O repository lista partidas ordenadas por `createdAt` descendente.
   - A resposta usa `{ success: true, data: [...] }`.

## Padrao de erro adotado

Resposta de erro operacional:

```json
{
  "success": false,
  "error": "Invalid payload",
  "code": "VALIDATION_ERROR",
  "details": {}
}
```

Resposta de erro inesperado:

```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Recomendacoes futuras

1. Criar testes para:
   - Criacao de partida valida.
   - Payload invalido.
   - Times iguais.
   - `endTime` antes de `startTime`.

2. Adicionar endpoints faltantes:
   - `GET /api/v1/matches/:id`
   - `PATCH /api/v1/matches/:id/score`
   - `PATCH /api/v1/matches/:id/status`

3. Mapear erros especificos do banco:
   - Falha de conexao.
   - Violacao de constraint.
   - Dados inconsistentes.

4. Padronizar a arquitetura dos outros modulos usando o mesmo modelo de service, repository, controller e middleware global.
