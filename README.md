# clinic-appointment-scheduler

Teste técnico — Time de Foundation, Clinicorp.

Agenda de clínica com atualização em tempo real: a recepção deixa a agenda aberta em mais de uma
tela, e criar/mover/cancelar um agendamento em uma tela precisa refletir nas outras sem F5.

## Stack e decisões

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Backend | Node.js + Express + TypeScript | Venho de Java, mas já tenho experiência em Node/TS; tipagem ajuda numa regra de negócio (sobreposição de horários) que precisa ser confiável. Usei IA como apoio para traduzir alguns padrões de Java para o ecossistema Node/TS (ver "Uso de IA" abaixo). Cada módulo (`auth`, `appointments`, `professionals`) é organizado em camadas `routes → controller → service → repository`, isolando o acesso a dados (Drizzle) da regra de negócio. |
| Autenticação | JWT + bcrypt, token via `Authorization: Bearer` | Sessão restaurável entre reloads (`localStorage` no cliente). Cookie httpOnly foi descartado porque `web` e `api` rodam em subdomínios diferentes do `onrender.com` em produção (sites diferentes para o navegador), e o ITP do iOS/WebKit bloqueia cookies cross-site mesmo com `SameSite=None; Secure` — quebrava o login só em iPhone/iPad. |
| Tempo real | Socket.IO | Abstrai reconexão e fallback de transporte; o handshake é autenticado lendo o mesmo token JWT do REST (`socket.handshake.auth.token` + `jwt.verify`). Eventos de agendamento são broadcast global (`io.emit`) para todos os clientes autenticados — não há conceito de clínica no modelo de dados hoje, então isolar por room não se aplica. |
| Banco | PostgreSQL + Drizzle ORM | Dados relacionais (hoje `users`, `professionals` e `appointments`); Drizzle dá migrations tipadas e a regra "sem sobreposição" é reforçada por uma constraint `EXCLUDE` do Postgres. |
| Frontend | React + Vite + TypeScript | Build rápido em dev, tipagem espelhando os contratos da API (`web/src/types/appointment.ts`). |
| Infra local | Docker Compose (api + web + postgres) | Sobe o ambiente inteiro com um comando, sem exigir Postgres instalado na máquina. |

## Decisões de implementação

Além das escolhas de stack acima, algumas decisões de implementação valem o registro — detalhe de
cada uma em `api/README.md` ou `web/README.md`:

- **Sobreposição validada em duas camadas.** A checagem na aplicação
  (`appointments.service.ts`, em `create`/`edit`) dá uma resposta 409 amigável; a constraint
  `EXCLUDE USING gist` no Postgres é a fonte da verdade contra condição de corrida (duas criações
  concorrentes passando pela checagem da aplicação ao mesmo tempo). Ver "Regra de não sobreposição"
  em [`api/README.md`](api/README.md).
- **Cancelamento por soft delete (`deletedAt`), não apaga a linha.** Mantém histórico dos
  agendamentos cancelados em vez de perder o registro. `users` usa o mesmo mecanismo, e além de
  preservar histórico, permite recadastro com o mesmo e-mail (índice único parcial
  `WHERE deleted_at IS NULL`) e bloqueia usuários desativados de autenticar ou usar um token já
  emitido. Ver "Regra de não sobreposição" e a seção de auth em [`api/README.md`](api/README.md).
- **Tratamento de erro centralizado** (`shared/middleware/error-handler.ts`, único middleware
  final). Resposta consistente para `AppError`, `ZodError`, conflito de constraint do Postgres, JSON
  malformado e erro genérico — sem vazar detalhe interno — incluindo rotas inexistentes, que também
  passam pelo mesmo middleware em vez de montar a resposta 404 na mão. Ver "Tratamento de erros" em
  [`api/README.md`](api/README.md).
- **Agenda recarrega ao reconectar o socket.** O servidor não reenvia eventos perdidos durante uma
  queda de conexão, então ao reconectar (evento `reconnect` do Manager) a tela busca o dia de novo em
  vez de continuar com estado desatualizado. Ver "Tela de Agenda" em [`web/README.md`](web/README.md).
- **Fila de eventos de socket durante o carregamento inicial** (`useDayAppointments.ts`). Evita que
  um evento de socket chegado enquanto a lista ainda está carregando seja perdido quando o `GET`
  (mais lento) resolver por cima depois. Ver `useDayAppointments.ts` em [`web/README.md`](web/README.md).
- **Profissionais sem CRUD, populados via seed.** Fora do escopo das 5 regras funcionais do
  enunciado; a prioridade foi dada às regras obrigatórias (ver "Próximos passos" abaixo).
- **Testes de API com repositórios mockados, sem Postgres real.** Roda rápido e sem exigir infra nos
  testes; o trade-off é que a própria constraint `EXCLUDE` (fonte da verdade contra condição de
  corrida) não é exercitada pelos testes atuais — coerente com o item 1 de "Próximos passos" (teste
  de integração de tempo real). Ver "Testes" em [`api/README.md`](api/README.md).

## Deploy

A versão apresentada está no ar no Render:

- Web: https://appointments-lxpz.onrender.com/
- API: https://clinic-appointment-scheduler.onrender.com

Os serviços estão no plano gratuito, que hiberna após um período sem uso — o primeiro acesso pode
levar cerca de 1 minuto enquanto a API acorda (o socket conecta logo em seguida). Para ver o tempo
real, abra o front em duas abas ou dois navegadores, entre com a mesma conta (ou crie uma em
"Cadastre-se") e crie, mova ou cancele um agendamento em uma delas.

## Como rodar localmente

### Opção 1 — Docker Compose (recomendado)

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000
- Postgres: localhost:5432 (usuário/senha/banco definidos em `docker-compose.yaml`)

O container `api` aplica as migrations do Drizzle automaticamente antes de subir o servidor — não é
preciso rodar nada manualmente.

### Opção 2 — sem Docker (dev)

Requer um Postgres rodando localmente (ou `docker run postgres:16-alpine`) com as credenciais de `api/.env`.

```bash
# API
cd api
npm install
npm run dev   # http://localhost:3000

# Web (em outro terminal)
cd web
npm install
npm run dev   # http://localhost:5173
```

## Estrutura do projeto

```
api/    Backend Express + Socket.IO (autenticação, agenda, tempo real)
web/    Frontend React + Vite
docker-compose.yaml   Orquestração local (api, web, postgres)
```

## Status atual

As 5 regras funcionais do enunciado (auth, agenda do dia, criar/mover/cancelar, sem sobreposição,
tempo real) estão implementadas de ponta a ponta, backend e frontend. Hoje existe:

- [x] Backend Express + TS com auth completa: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` — bcrypt para hash de senha, JWT retornado no corpo da resposta e enviado via `Authorization: Bearer`, middleware `authToken` protegendo rotas.
- [x] Banco modelado com Drizzle ORM: tabelas `users`, `professionals` e `appointments` (com migrations geradas) e conectado à API via `db/client.ts`.
- [x] CRUD de agendamentos (`POST/GET/PUT/DELETE /appointments`, com filtro por profissional/data na listagem) e regra de não sobreposição validada em duas camadas — checagem na aplicação e constraint `EXCLUDE USING gist` no Postgres.
- [x] Listagem de profissionais (`GET /professionals`); CRUD de profissionais está fora do escopo, então são populados via seed rodado na migration.
- [x] Socket.IO configurado, autenticando o handshake pelo mesmo token JWT do REST, com broadcast global dos eventos de agendamento (`appointment:created`, `appointment:updated`, `appointment:cancelled`) emitidos a cada mutação real de agendamento.
- [x] `docker-compose.yaml` com api, web e Postgres (com healthcheck).
- [x] Frontend React + Vite com roteamento (`PrivateRoute`/`PublicRoute`), `AuthContext`/`SocketContext`, telas de Login e Signup.
- [x] Tela de **Agenda** (`web/src/pages/Agenda/`): visualização do dia agrupada por hora, filtro por
  profissional, navegação entre dias, criação/edição via diálogo, cancelamento com confirmação, e
  atualização em tempo real assinando os eventos de socket que o backend emite — sem precisar de F5
  em nenhuma das telas abertas.
- [x] Resiliência da tela aberta o dia todo: ao reconectar o socket (queda de rede, notebook que
  dormiu, restart da API) a agenda do dia é recarregada, já que eventos emitidos durante a queda
  não são reenviados; e sessão expirada (401 no REST ou handshake do socket recusado) leva de volta
  ao login em vez de deixar a tela quebrada.
- [x] Testes automatizados da API (`node:test` + `supertest`, rodados via `npm test` em `api/`): teste
  unitário da regra de sobreposição e testes de integração HTTP de autenticação, agendamentos e
  tratamento de erros centralizado — ver "Testes" em `api/README.md`.

## Próximos passos

As 5 regras funcionais do enunciado já estão prontas, com testes cobrindo a regra de sobreposição e o
tratamento de erros HTTP da API. Ainda falta:

1. **Teste de integração de tempo real** — cobrindo o fluxo do Socket.IO de ponta a ponta (criar um
   agendamento em uma "sessão" e ver refletido em outra).
2. **Testes de frontend** — hoje `web/` não tem nenhum teste automatizado.

Se o prazo acabar antes de esses testes ficarem prontos, o corte é esse: as 5 regras funcionais do
enunciado e os testes de backend já entregues têm prioridade absoluta sobre o restante. O polimento
visual (CSS) não entra nesse corte, já que é gerado com apoio de IA e não consome tempo significativo
do prazo.

Além disso, ficaram de fora por escopo e seriam os próximos passos num projeto real:

3. **Controle de edição concorrente** — hoje a última gravação vence: se uma recepção está com o
   diálogo de edição aberto e outra move o mesmo agendamento, o salvar da primeira sobrescreve a
   mudança sem aviso (o card é atualizado pelo socket, mas o diálogo aberto não). Faria controle
   otimista: coluna `updated_at` (ou `version`), o front manda o valor que leu e o
   `UPDATE ... WHERE id = ? AND updated_at = ?` devolve 409 "alterado por outra pessoa" quando não
   bate; e o diálogo aberto avisaria ao receber `appointment:updated|cancelled` do mesmo id.
4. **Logout com revogação** — o logout hoje é stateless: o JWT continua válido até expirar (8h).
   Faria access token curto + refresh token rotativo, com revogação no servidor.
5. **Escala horizontal do tempo real** — `io.emit` só alcança clientes conectados na mesma
   instância. Com mais de uma instância, usaria o `@socket.io/redis-adapter` (ou `LISTEN/NOTIFY`
   do Postgres) para propagar os eventos entre elas.
6. **Isolamento por clínica** — os eventos são broadcast global porque o modelo não tem clínica;
   com multi-tenant, cada clínica viraria uma room do Socket.IO.
7. **Datas com fuso** — trocar `timestamp` por `timestamptz` e fazer a API receber o intervalo
   (`from`/`to` em ISO) em vez de uma data UTC, eliminando a compensação de fuso feita no front.
8. **Modelo do agendamento mais completo** — paciente, descrição e status, além de CRUD de
   profissionais (hoje populados por seed).
9. **Rate limit no login** — proteger `/auth/login` e `/auth/signup` contra força bruta.

## Uso de IA

Usei IA (Claude) como apoio pontual durante o desenvolvimento: para tirar dúvidas, decidir entre
opções técnicas (como a escolha do Drizzle como ORM), traduzir conhecimento prévio de Java para o
ecossistema Node.js/TypeScript, e também para gerar a parte visual (CSS) das telas, agilizando esse
ponto para focar o tempo nas regras de negócio. Também usei IA como apoio na geração da documentação
(este README e os de `api/` e `web/`), a partir das decisões e do estado real do projeto. As decisões
e o código foram revisados e são de minha responsabilidade.
