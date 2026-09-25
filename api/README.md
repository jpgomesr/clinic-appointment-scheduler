# API

Backend em Node.js + Express + TypeScript da agenda de clínica: autenticação via JWT (token enviado
em `Authorization: Bearer`) e WebSocket (Socket.IO) autenticado pelo mesmo token, para atualização
em tempo real entre telas.

## Stack

- **Express 5** + TypeScript
- **PostgreSQL** + **Drizzle ORM** (migrations em `drizzle/`)
- **Socket.IO** para tempo real, com handshake autenticado por token JWT
- **JWT** (`jsonwebtoken`) + **bcrypt** (`bcryptjs`) para autenticação
- **Zod** para validação de payloads
- **cors** para permitir requisições da origem do `web`

## Como rodar

### Com Docker Compose (recomendado)

A partir da raiz do repositório:

```bash
cp api/.env.example api/.env
docker compose up --build
```

A API sobe em http://localhost:3000. As migrations do Drizzle são aplicadas automaticamente pelo
container antes do servidor iniciar.

### Sem Docker

Requer um Postgres acessível com as credenciais definidas em `api/.env` (por exemplo, subindo só o
serviço `postgres` do `docker-compose.yaml`, ou uma instância local).

```bash
cd api
cp .env.example .env
npm install
npm run db:migrate   # aplica as migrations do Drizzle
npm run dev           # http://localhost:3000
```

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Sobe a API em modo watch (`tsx watch src/index.ts`) |
| `npm run build` | Compila TypeScript para `dist/` (`tsconfig.build.json`) |
| `npm start` | Roda a API já compilada (`node dist/index.js`) |
| `npm run db:generate` | Gera uma nova migration a partir do schema (`src/db/schema.ts`) |
| `npm run db:migrate` | Aplica as migrations pendentes no banco |
| `npm test` | Roda a suíte de testes (`node:test`) em `src/**/*.test.ts` e `test/**/*.test.ts` |

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
| --- | --- |
| `SERVER_PORT` | Porta em que a API escuta (padrão `3000`) — em produção, se `PORT` estiver definida (ex.: injetada pelo Render), ela tem prioridade sobre `SERVER_PORT` |
| `JWT_SECRET` | Segredo usado para assinar/verificar o JWT (REST e handshake do Socket.IO) |
| `DATABASE_URL` | Connection string do Postgres, usada pelo Drizzle |
| `CORS_ORIGIN` | Lista de origens permitidas separadas por vírgula (ex.: `http://localhost:5173,http://localhost:8080`) |
| `NODE_ENV` | Ambiente de execução (`production`/`development`) |

`JWT_SECRET`, `DATABASE_URL` e `CORS_ORIGIN` são obrigatórias e validadas com Zod na inicialização
(`src/config/env.ts`): se alguma faltar, a API não sobe e o erro diz quais variáveis estão faltando.
`CORS_ORIGIN` é obrigatória porque, sem ela, o `cors()` liberaria qualquer origem.

## Estrutura

Os três módulos (`auth`, `appointments`, `professionals`) seguem o mesmo padrão em camadas:
`routes` recebe a requisição e delega para `controller` (handler HTTP), que delega para `service`
(regra de negócio), que delega para `repository` (acesso a dados via Drizzle).

```
src/
├── app.ts                  Configuração do Express (cors, json, rotas)
├── config/env.ts           Validação (Zod) e acesso tipado às variáveis de ambiente
├── index.ts                Bootstrap: cria o HTTP server, sobe o Socket.IO e escuta a porta
├── socket.ts               Setup do Socket.IO: autenticação do handshake via token JWT
├── socket.events.ts         Tipos dos eventos de socket (ServerToClientEvents, SocketData)
├── auth/
│   ├── routes/auth.routes.ts           Rotas de autenticação
│   ├── controller/auth.controller.ts   Handlers HTTP (login, signup, me, logout)
│   ├── service/auth.service.ts         Regras de negócio: hash de senha, emissão/verificação de JWT
│   ├── middleware/auth.middleware.ts   Middleware `authToken` que protege rotas via `Authorization: Bearer`, rejeitando com 401 quando o usuário do token não existe mais ou foi desativado (soft delete)
│   └── dto/                            Schemas Zod de entrada (login, signup)
├── appointments/
│   ├── routes/appointments.routes.ts         Rotas de agendamentos
│   ├── controller/appointments.controller.ts Handlers HTTP (create, getAll, get, edit, delete) + emissão dos eventos de socket
│   ├── service/appointments.service.ts       Regras de negócio: checagem de sobreposição, CRUD, filtros
│   ├── repository/appointments.repository.ts Queries Drizzle: findConflict, insert, edit, softDelete, findById, findByProfessionalIdAndDate
│   └── dto/                                  Schemas Zod (payload de agendamento, filtro de listagem)
├── professionals/
│   ├── routes/professionals.routes.ts         Rota de listagem
│   ├── controller/professionals.controller.ts Handler HTTP (getAll)
│   ├── service/professionals.service.ts       Busca todos os profissionais
│   └── repository/professionals.repository.ts Query Drizzle: findAll
├── types/
│   └── express.d.ts        Augmenta `Express.Locals.io` e `Express.Request.user`
├── shared/
│   ├── errors/app-error.ts            Classe `AppError` (status + message) com factories `badRequest`/`unauthorized`/`notFound`/`conflict`
│   ├── middleware/error-handler.ts    Middleware de erro centralizado (ver "Tratamento de erros" abaixo)
│   └── logger/logger.ts               Logger estruturado (pino)
└── db/
    ├── client.ts             Cliente Drizzle/pg
    └── schema.ts              Tabelas: `users`, `professionals`, `appointments`
drizzle/                      Migrations SQL geradas pelo Drizzle Kit
```

## Tratamento de erros

Erros são centralizados em `shared/middleware/error-handler.ts`, registrado como último middleware em
`app.ts`. Controllers/services lançam `AppError` (via `AppError.badRequest`/`notFound`/`conflict`/...)
ou deixam o erro subir, e o middleware decide a resposta:

- `AppError` → `res.status(err.status).json({ message: err.message })`.
- `ZodError` (payload inválido) → 400 com as mensagens de validação.
- Conflito de exclusion constraint do Postgres (código `23P01`) → 409 com mensagem amigável.
- `SyntaxError` de JSON malformado no body → 400.
- Qualquer outro erro → 500 com mensagem genérica (não vaza detalhe interno) e log via `logger.error`.

Rotas não mapeadas por nenhum router também passam por esse mesmo caminho: o catch-all em `app.ts`
(`app.use((req, res, next) => next(AppError.notFound("Rota não encontrada")))`) delega para o
`errorHandler` em vez de montar a resposta na mão, garantindo que "rota inexistente" tenha o mesmo
formato, logging e comportamento de qualquer outro 404 da API.

## Endpoints

Todas as rotas de auth ficam sob o prefixo `/auth`. O token JWT é entregue no corpo da resposta de
login/signup; o cliente guarda esse token e passa a mandá-lo em `Authorization: Bearer <token>` nas
requisições seguintes (REST e handshake do Socket.IO).

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/auth/signup` | Cria um usuário (`name`, `email`, `password`, `confirmPassword`) e retorna `{ user, token }` |
| `POST` | `/auth/login` | Autentica por `email`/`password` e retorna `{ user, token }` |
| `GET` | `/auth/me` | Retorna o usuário do token enviado em `Authorization` (rota protegida por `authToken`) |
| `POST` | `/auth/logout` | Confirma o logout (invalidação do token é responsabilidade do cliente, que o descarta) |

Rotas de `/appointments` e `/professionals` ficam atrás do middleware `authToken` (exigem sessão
válida).

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/appointments` | Cria um agendamento (`startAt`, `endAt`, `professionalId`); valida `startAt < endAt` e checa sobreposição |
| `GET` | `/appointments` | Lista agendamentos não cancelados, com filtros opcionais `professionalId` e `date` (`YYYY-MM-DD`) |
| `GET` | `/appointments/:id` | Retorna um agendamento por id (404 se não existir ou estiver cancelado) |
| `PUT` | `/appointments/:id` | Edita/move um agendamento (mesma validação de sobreposição, excluindo o próprio registro) |
| `DELETE` | `/appointments/:id` | Cancela um agendamento (soft delete via `deletedAt`) |

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/professionals` | Lista todos os profissionais (sem CRUD; populados via seed na migration `drizzle/0001_parallel_bucky.sql`) |

## Regra de não sobreposição

Um profissional não pode ter dois agendamentos com horários sobrepostos. A validação acontece em
duas camadas:

- **Aplicação** (`appointments.service.ts`, em `create` e `edit`): antes de gravar, chama
  `appointmentsRepository.findConflict` para checar se já existe um agendamento não cancelado do
  mesmo profissional cujo intervalo `[startAt, endAt)` cruza com o novo; se sim, retorna 409
  (`"Horário já ocupado para esse profissional"`). No `edit`, o próprio agendamento sendo editado é
  excluído dessa checagem.
- **Banco** (constraint `appointments_no_overlap`, migration `drizzle/0002_youthful_expediter.sql`):
  `EXCLUDE USING gist` (extensão `btree_gist`) sobre `professional_id` + `tsrange(start_at, end_at)`,
  escopada a `WHERE deleted_at IS NULL` — é a fonte da verdade contra condições de corrida. Se a
  constraint rejeitar a gravação (código Postgres `23P01`), o service converte isso na mesma
  resposta 409 usada na checagem de aplicação.

`appointments` e `users` usam soft delete (`deletedAt`); `professionals` não tem essa coluna.

## Testes

```bash
npm test
```

Testes com `node:test` (nativo do Node), sem subir servidor real nem depender de um Postgres — os
repositórios são mockados com `mock.method`:

- `src/appointments/service/appointments.service.test.ts`: testes unitários do service com
  `appointmentsRepository` mockado, cobrindo criação/edição de agendamento com e sem conflito de
  horário.
- `test/http/auth.test.ts`: testes de integração HTTP (via `supertest`, batendo direto no `app` do
  Express) de autenticação — 400 em payload de signup inválido, 401 em rota protegida sem token ou
  com token inválido.
- `test/http/appointments.test.ts`: testes de integração HTTP do CRUD de agendamentos — 401 sem
  autenticação, 201 ao criar sem conflito, 409 ao criar com conflito de horário.
- `test/http/error-handler.test.ts`: testes de integração HTTP do tratamento de erros centralizado —
  404 de rota inexistente, 400 de JSON malformado, 409 de exclusion constraint do Postgres (`23P01`)
  e 500 genérico sem vazar detalhe interno.

Ainda não há teste de integração real de Socket.IO (criar um agendamento em uma "sessão" e ver
refletido em outra) nem testes rodando contra um Postgres real — ver "Próximos passos" no README raiz.

## Tempo real (Socket.IO)

- O handshake é autenticado lendo o token JWT de `socket.handshake.auth.token` (mandado pelo
  cliente no mesmo `Authorization: Bearer` usado no REST) e validando com `jwt.verify` (ver
  `src/socket.ts`); conexões sem token válido são rejeitadas.
- Não há conceito de clínica no modelo de dados hoje (só `professionals` e `appointments`), então os
  eventos são broadcast global via `io.emit` para todos os clientes autenticados conectados, em vez de
  isolados por room.
- `appointments.controller.ts` emite `appointment:created`, `appointment:updated` e
  `appointment:cancelled` (payloads tipados em `src/socket.events.ts`) após cada mutação bem-sucedida
  de criar/editar/cancelar um agendamento.
- A tela de Agenda no frontend (`web/src/pages/Agenda/Agenda.tsx`) assina esses três eventos via
  `useSocket` e atualiza a lista local sem precisar recarregar a página — ver `web/README.md`.

## Banco de dados

O schema (Drizzle) fica em `src/db/schema.ts`. Hoje há três tabelas: `users`, `professionals` e
`appointments` (com FK para `professionals` e a constraint de não sobreposição descrita acima). Para
alterar o schema:

```bash
npm run db:generate   # gera a migration em drizzle/
npm run db:migrate    # aplica no banco configurado em DATABASE_URL
```

## Uso de IA

Esta documentação foi gerada com apoio de IA (Claude), a partir das decisões e do estado real do
código. Ver "Uso de IA" no README raiz do repositório.
