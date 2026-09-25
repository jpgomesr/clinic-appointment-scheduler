# Web

Frontend em React + Vite + TypeScript da agenda de clínica. Consome a API REST (`/auth/*`) para
autenticação (token JWT via `Authorization: Bearer`) e o Socket.IO da API para atualização em
tempo real.

## Stack

- **React 19** + **React Router 7**
- **Vite** + **TypeScript**
- **socket.io-client** para tempo real, autenticando o handshake com o mesmo token JWT usado no
  REST (`services/socket.ts`)

## Como rodar

### Com Docker Compose (recomendado)

A partir da raiz do repositório:

```bash
cp web/.env.example web/.env
docker compose up --build
```

A aplicação sobe em http://localhost:8080 (servida por Nginx, ver `Dockerfile`/`nginx.conf`).

### Sem Docker

Requer a API rodando (ver `api/README.md`).

```bash
cd web
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite com HMR |
| `npm run build` | Type-check (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Roda o ESLint |

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL base da API (REST e Socket.IO), ex.: `http://localhost:3000` |

## Estrutura

```
src/
├── App.tsx                 Compõe AuthProvider + SocketProvider + AppRoutes
├── main.tsx                Entry point (ReactDOM + BrowserRouter)
├── routes/
│   ├── AppRoutes.tsx         Definição das rotas
│   ├── PublicRoute.tsx        Redireciona para "/" se já autenticado (usado em /login, /signup)
│   └── PrivateRoute.tsx       Redireciona para /login se não autenticado (usado em "/")
├── contexts/
│   ├── auth-context.ts / AuthContext.tsx     Estado do usuário logado; busca /auth/me no mount,
│   │                                          expõe login/signup/logout
│   └── socket-context.ts / SocketContext.tsx  Conecta o socket quando há usuário logado e o
│                                               desconecta no logout/unmount
├── hooks/
│   ├── useAuth.ts            Acesso ao AuthContext
│   └── useSocket.ts          Acesso ao SocketContext
├── config/
│   └── env.ts                 Fonte única de `API_URL` (lê `VITE_API_URL`, com fallback para
│                                 `http://localhost:3000`), usada por `services/api.ts` e
│                                 `services/socket.ts` para garantir que REST e Socket.IO sempre
│                                 apontem para o mesmo host
├── services/
│   ├── api.ts                 Wrapper de fetch (get/post/put/delete, header Authorization: Bearer,
│   │                            tratamento de erro via ApiError)
│   ├── token.ts                 Ponto único de leitura/escrita do token JWT em localStorage
│   └── socket.ts               Instância do socket.io-client (autoConnect: false, auth com o token)
├── types/
│   └── appointment.ts         Tipos compartilhados (Appointment, Professional, payloads de socket)
└── pages/
    ├── Login/                 Tela de login
    ├── Signup/                 Tela de cadastro
    └── Agenda/                 Tela de agenda (rota "/"), ver seção própria abaixo
```

## Tela de Agenda

`pages/Agenda/Agenda.tsx` é a página autenticada em `/` (substituiu a antiga Home). Composição:

| Arquivo | Responsabilidade |
| --- | --- |
| `Agenda.tsx` | Orquestra o dia selecionado, busca profissionais, assina os eventos de socket e monta o layout |
| `useDayAppointments.ts` | Hook com `useReducer` que carrega os agendamentos do dia (`GET /appointments`, com `AbortController` para cancelar requisições obsoletas) e expõe `upsert`/`remove` para refletir eventos de socket e respostas dos diálogos. Enquanto o `GET` inicial está em andamento, `upsert`/`remove` disparados por eventos de socket são aplicados imediatamente e também enfileirados; ao chegar a resposta do `GET`, a fila é reaplicada por cima do snapshot recém-carregado, evitando que um evento de socket que chegou durante o carregamento seja perdido quando o `GET` (mais lento) resolver depois |
| `AppointmentFormDialog.tsx` | `<dialog>` de criar/editar (`POST`/`PUT /appointments`) |
| `CancelConfirmDialog.tsx` | `<dialog>` de confirmação de cancelamento (`DELETE /appointments/:id`) |
| `DayNav.tsx` | Navegação entre dias |
| `ProfessionalFilter.tsx` | Filtro por profissional |
| `HourColumn.tsx` / `AppointmentCard.tsx` | Agrupamento e exibição dos agendamentos por hora |
| `date-utils.ts` | Conversões de data/hora entre o formato local, os inputs do formulário e o formato UTC usado pela API |

A agenda assina `appointment:created`, `appointment:updated` e `appointment:cancelled` via
`useSocket` e atualiza a lista local (`upsert`/`remove`) sem recarregar a página; se uma
edição/cancelamento chega tarde (404, porque outra tela já alterou o registro), o diálogo mostra o
aviso "Agendamento não encontrado" e remove o item obsoleto da lista. Quando o socket reconecta
(evento `reconnect` do Manager), a agenda chama `reload` do `useDayAppointments` e busca o dia de
novo, já que eventos emitidos durante a queda não são reenviados pelo servidor.

## Fluxo de autenticação

1. Login/signup (`POST /auth/login`, `POST /auth/signup`) devolvem `{ user, token }`; o token (JWT)
   é guardado em `localStorage` via `services/token.ts` e o `AuthContext` guarda o usuário retornado.
2. Toda chamada de `services/api.ts` lê o token salvo e manda `Authorization: Bearer <token>`; o
   handshake do socket (`services/socket.ts`) manda o mesmo token em `auth.token`. Uma resposta 401
   de qualquer request limpa o token guardado e zera o usuário no `AuthContext` (via
   `setUnauthorizedHandler`), levando de volta ao `/login`; um handshake de socket recusado
   (`connect_error` com "Authentication error") faz logout pelo `SocketProvider`.
3. No mount, `AuthProvider` chama `GET /auth/me` (usando o token salvo, se houver) para restaurar a
   sessão entre reloads.
4. `PrivateRoute`/`PublicRoute` usam `user`/`loading` do `AuthContext` para redirecionar entre
   `/login`, `/signup` e `/` (Agenda). O `SocketProvider` reage à mudança de `user` para conectar o
   socket.
5. `logout` chama `POST /auth/logout`, limpa o token guardado e o usuário no contexto (mesmo se a
   chamada falhar), o que desconecta o socket.

> **Por quê não cookie httpOnly:** em produção `web` e `api` rodam em subdomínios diferentes do
> `onrender.com`, que está na Public Suffix List — ou seja, são "sites" diferentes para o
> navegador, e o cookie de sessão é cross-site (third-party). Isso funcionava no Chrome
> (Android/Windows) com `sameSite=none; secure`, mas o ITP do iOS/WebKit bloqueia cookies
> cross-site por padrão independente do `SameSite`, causando "Token não fornecido" só em
> iPhone/iPad. Por isso a sessão passou a usar `Authorization: Bearer` em vez de cookie.

## Status

Auth, tempo real e a tela de Agenda (listagem do dia, criar/editar/cancelar, filtro por profissional)
estão implementados de ponta a ponta. Falta, entre outras coisas, testes automatizados — ver "Próximos
passos" no README raiz do repositório.

## Uso de IA

Esta documentação foi gerada com apoio de IA (Claude), a partir das decisões e do estado real do
código. Ver "Uso de IA" no README raiz do repositório.
