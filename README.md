# clinic-appointment-scheduler

Teste técnico — Time de Foundation, Clinicorp.

Agenda de clínica com atualização em tempo real: a recepção deixa a agenda aberta em mais de uma
tela, e criar/mover/cancelar um agendamento em uma tela precisa refletir nas outras sem F5.

## Stack e decisões

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Backend | Node.js + Express + TypeScript | Ecossistema que domino bem, tipagem ajuda numa regra de negócio (sobreposição de horários) que precisa ser confiável. Cada módulo (`auth`, `appointments`, `professionals`) é organizado em camadas `routes → controller → service → repository`, isolando o acesso a dados (Drizzle) da regra de negócio. |
| Autenticação | JWT + bcrypt, token via `Authorization: Bearer` | Sessão restaurável entre reloads (`localStorage` no cliente). Cookie httpOnly foi descartado porque `web` e `api` rodam em subdomínios diferentes do `onrender.com` em produção (sites diferentes para o navegador), e o ITP do iOS/WebKit bloqueia cookies cross-site mesmo com `SameSite=None; Secure` — quebrava o login só em iPhone/iPad. |
| Tempo real | Socket.IO | Abstrai reconexão e fallback de transporte; o handshake é autenticado lendo o mesmo token JWT do REST (`socket.handshake.auth.token` + `jwt.verify`). Eventos de agendamento são broadcast global (`io.emit`) para todos os clientes autenticados — não há conceito de clínica no modelo de dados hoje, então isolar por room não se aplica. |
| Banco | PostgreSQL + Drizzle ORM | Dados relacionais (hoje `users`, `professionals` e `appointments`); Drizzle dá migrations tipadas e a regra "sem sobreposição" é reforçada por uma constraint `EXCLUDE` do Postgres. |
| Frontend | React + Vite + TypeScript | Build rápido em dev, tipagem compartilhando os contratos da API. |
| Infra local | Docker Compose (api + web + postgres) | Sobe o ambiente inteiro com um comando, sem exigir Postgres instalado na máquina. |

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

3. **Logout com revogação** — o logout hoje é stateless: o JWT continua válido até expirar (8h).
   Faria access token curto + refresh token rotativo, com revogação no servidor.
4. **Escala horizontal do tempo real** — `io.emit` só alcança clientes conectados na mesma
   instância. Com mais de uma instância, usaria o `@socket.io/redis-adapter` (ou `LISTEN/NOTIFY`
   do Postgres) para propagar os eventos entre elas.
5. **Isolamento por clínica** — os eventos são broadcast global porque o modelo não tem clínica;
   com multi-tenant, cada clínica viraria uma room do Socket.IO.
6. **Datas com fuso** — trocar `timestamp` por `timestamptz` e fazer a API receber o intervalo
   (`from`/`to` em ISO) em vez de uma data UTC, eliminando a compensação de fuso feita no front.
7. **Modelo do agendamento mais completo** — paciente, descrição e status, além de CRUD de
   profissionais (hoje populados por seed).
8. **Rate limit no login** — proteger `/auth/login` e `/auth/signup` contra força bruta.

## Uso de IA

Usei IA (Claude) como apoio pontual durante o desenvolvimento: para tirar dúvidas, decidir entre
opções técnicas (como a escolha do Drizzle como ORM), traduzir conhecimento prévio de Java para o
ecossistema Node.js/TypeScript, e também para gerar a parte visual (CSS) das telas, agilizando esse
ponto para focar o tempo nas regras de negócio. Também usei IA como apoio na geração da documentação
(este README e os de `api/` e `web/`), a partir das decisões e do estado real do projeto. As decisões
e o código foram revisados e são de minha responsabilidade.
