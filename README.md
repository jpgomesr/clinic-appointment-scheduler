# clinic-appointment-scheduler

Teste técnico — Time de Foundation, Clinicorp.

Agenda de clínica com atualização em tempo real: a recepção deixa a agenda aberta em mais de uma
tela, e criar/mover/cancelar um agendamento em uma tela precisa refletir nas outras sem F5.

## Stack e decisões

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Backend | Node.js + Express + TypeScript | Ecossistema que domino bem, tipagem ajuda numa regra de negócio (sobreposição de horários) que precisa ser confiável. Cada módulo (`auth`, `appointments`, `professionals`) é organizado em camadas `routes → controller → service → repository`, isolando o acesso a dados (Drizzle) da regra de negócio. |
| Autenticação | JWT + bcrypt, token em cookie httpOnly | Sessão que sobrevive a reload sem expor o token a JS no cliente (mitiga XSS); `cookie-parser` no Express e o mesmo cookie é lido no handshake do Socket.IO. |
| Tempo real | Socket.IO | Abstrai reconexão e fallback de transporte; o handshake é autenticado lendo o cookie JWT (`parseCookie` + `jwt.verify`). Eventos de agendamento são broadcast global (`io.emit`) para todos os clientes autenticados — não há conceito de clínica no modelo de dados hoje, então isolar por room não se aplica. |
| Banco | PostgreSQL + Drizzle ORM | Dados relacionais (hoje `users`, `professionals` e `appointments`); Drizzle dá migrations tipadas e a regra "sem sobreposição" é reforçada por uma constraint `EXCLUDE` do Postgres. |
| Frontend | React + Vite + TypeScript | Build rápido em dev, tipagem compartilhando os contratos da API. |
| Infra local | Docker Compose (api + web + postgres) | Sobe o ambiente inteiro com um comando, sem exigir Postgres instalado na máquina. |

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

- [x] Backend Express + TS com auth completa: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` — bcrypt para hash de senha, JWT emitido em cookie httpOnly, middleware `authToken` protegendo rotas.
- [x] Banco modelado com Drizzle ORM: tabelas `users`, `professionals` e `appointments` (com migrations geradas) e conectado à API via `db/client.ts`.
- [x] CRUD de agendamentos (`POST/GET/PUT/DELETE /appointments`, com filtro por profissional/data na listagem) e regra de não sobreposição validada em duas camadas — checagem na aplicação e constraint `EXCLUDE USING gist` no Postgres.
- [x] Listagem de profissionais (`GET /professionals`); CRUD de profissionais está fora do escopo, então são populados via seed rodado na migration.
- [x] Socket.IO configurado, autenticando o handshake pelo mesmo cookie JWT do REST, com broadcast global dos eventos de agendamento (`appointment:created`, `appointment:updated`, `appointment:cancelled`) emitidos a cada mutação real de agendamento.
- [x] `docker-compose.yaml` com api, web e Postgres (com healthcheck).
- [x] Frontend React + Vite com roteamento (`PrivateRoute`/`PublicRoute`), `AuthContext`/`SocketContext`, telas de Login e Signup.
- [x] Tela de **Agenda** (`web/src/pages/Agenda/`): visualização do dia agrupada por hora, filtro por
  profissional, navegação entre dias, criação/edição via diálogo, cancelamento com confirmação, e
  atualização em tempo real assinando os eventos de socket que o backend emite — sem precisar de F5
  em nenhuma das telas abertas.

## Próximos passos

As 5 regras funcionais do enunciado já estão prontas. Ainda dentro do prazo, o próximo passo é:

1. **Testes** — pelo menos da regra de sobreposição, que é a parte mais sensível a bug, e um teste de
   integração cobrindo o fluxo de tempo real (criar em uma "sessão", ver refletido em outra).

Se o prazo acabar antes de os testes ficarem prontos, o corte é esse: sem testes automatizados, mas
com as 5 regras funcionais do enunciado com prioridade absoluta. O polimento visual (CSS) não entra
nesse corte, já que é gerado com apoio de IA e não consome tempo significativo do prazo.

## Uso de IA

Usei IA (Claude) como apoio pontual durante o desenvolvimento: para tirar dúvidas, decidir entre
opções técnicas (como a escolha do Drizzle como ORM), traduzir conhecimento prévio de Java para o
ecossistema Node.js/TypeScript, e também para gerar a parte visual (CSS) das telas, agilizando esse
ponto para focar o tempo nas regras de negócio. Também usei IA como apoio na geração da documentação
(este README e os de `api/` e `web/`), a partir das decisões e do estado real do projeto. As decisões
e o código foram revisados e são de minha responsabilidade.
