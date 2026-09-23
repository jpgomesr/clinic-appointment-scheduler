# clinic-appointment-scheduler

Teste técnico — Time de Foundation, Clinicorp.

Agenda de clínica com atualização em tempo real: a recepção deixa a agenda aberta em mais de uma
tela, e criar/mover/cancelar um agendamento em uma tela precisa refletir nas outras sem F5.

## Stack e decisões

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Backend | Node.js + Express + TypeScript | Ecossistema que domino bem, tipagem ajuda numa regra de negócio (sobreposição de horários) que precisa ser confiável. |
| Autenticação | JWT + bcrypt, token em cookie httpOnly | Sessão que sobrevive a reload sem expor o token a JS no cliente (mitiga XSS); `cookie-parser` no Express e o mesmo cookie é lido no handshake do Socket.IO. |
| Tempo real | Socket.IO | Abstrai reconexão e fallback de transporte; o handshake é autenticado lendo o cookie JWT (`parseCookie` + `jwt.verify`), e uso rooms (`join:clinic`) para isolar eventos por clínica. |
| Banco | PostgreSQL + Drizzle ORM | Dados relacionais (usuários, e em breve profissionais/agendamentos); Drizzle dá migrations tipadas e a regra "sem sobreposição" pode se beneficiar de constraints/transações do Postgres. |
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

Auth e a base de tempo real já estão funcionais; as regras de negócio da agenda ainda não. Hoje existe:

- [x] Backend Express + TS com auth completa: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` — bcrypt para hash de senha, JWT emitido em cookie httpOnly, middleware `authToken` protegendo rotas.
- [x] Banco modelado com Drizzle ORM (tabela `users` com migration gerada) e conectado à API via `db/client.ts`.
- [x] Socket.IO configurado, autenticando o handshake pelo mesmo cookie JWT do REST, com suporte a rooms (`join:clinic`).
- [x] `docker-compose.yaml` com api, web e Postgres (com healthcheck).
- [x] Frontend React + Vite com roteamento (`PrivateRoute`/`PublicRoute`), `AuthContext`/`SocketContext`, telas de Login e Signup, e uma Home autenticada que já abre a conexão de socket — ainda sem telas do produto (agenda).

## O que falta (e o que eu faria a seguir)

Priorizei deixar auth real, WS autenticado e Docker prontos antes de implementar as regras de negócio
da agenda em si. Ainda faltam, em ordem de prioridade:

1. **Modelagem do banco da agenda** — tabelas `professionals` e `appointments` (com migrations Drizzle), relacionando com `users`. Como o CRUD de profissionais está fora do escopo do teste, `professionals` será populada via seed rodado na migration (sem tela/endpoint de cadastro).
2. **CRUD de agendamentos** — criar, mover (mudar horário) e cancelar.
3. **Regra de não sobreposição** — validar no backend antes de gravar; se der tempo, reforçar com uma constraint `EXCLUDE` no Postgres para não depender só da aplicação sob concorrência.
4. **Broadcast em tempo real** — emitir eventos (`appointment:created`, `appointment:moved`, `appointment:cancelled`) na room da agenda do profissional/dia a cada mutação, e o frontend atualizando a lista ao receber.
5. **Tela de agenda no frontend** — listagem do dia por profissional, ações de criar/mover/cancelar, conectada ao socket já disponível via `SocketContext`.
6. **Testes** — pelo menos da regra de sobreposição, que é a parte mais sensível a bug.

Se o prazo apertar, o corte seria: sem testes automatizados, mas as 5 regras funcionais do enunciado
(auth, agenda do dia, criar/mover/cancelar, sem sobreposição, tempo real) teriam prioridade absoluta.
O polimento visual (CSS) não entra nesse corte, já que é gerado com apoio de IA e não consome tempo
significativo do prazo.

## Uso de IA

Usei IA (Claude) como apoio pontual durante o desenvolvimento: para tirar dúvidas, decidir entre
opções técnicas (como a escolha do Drizzle como ORM), traduzir conhecimento prévio de Java para o
ecossistema Node.js/TypeScript, e também para gerar a parte visual (CSS) das telas, agilizando esse
ponto para focar o tempo nas regras de negócio. Também usei IA como apoio na geração da documentação
(este README e os de `api/` e `web/`), a partir das decisões e do estado real do projeto. As decisões
e o código foram revisados e são de minha responsabilidade.
