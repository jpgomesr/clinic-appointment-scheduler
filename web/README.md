# Web

Frontend em React + Vite + TypeScript da agenda de clínica. Consome a API REST (`/auth/*`) para
autenticação (cookie httpOnly) e o Socket.IO da API para atualização em tempo real.

## Stack

- **React 19** + **React Router 7**
- **Vite** + **TypeScript**
- **socket.io-client** para tempo real, conectando com `withCredentials: true` (usa o mesmo cookie
  de sessão emitido pela API)

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
├── services/
│   ├── api.ts                 Wrapper de fetch (get/post/put/delete, credentials: "include",
│   │                            tratamento de erro via ApiError)
│   └── socket.ts               Instância do socket.io-client (autoConnect: false)
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
| `useDayAppointments.ts` | Hook com `useReducer` que carrega os agendamentos do dia (`GET /appointments`, com `AbortController` para cancelar requisições obsoletas) e expõe `upsert`/`remove` para refletir eventos de socket e respostas dos diálogos |
| `AppointmentFormDialog.tsx` | `<dialog>` de criar/editar (`POST`/`PUT /appointments`) |
| `CancelConfirmDialog.tsx` | `<dialog>` de confirmação de cancelamento (`DELETE /appointments/:id`) |
| `DayNav.tsx` | Navegação entre dias |
| `ProfessionalFilter.tsx` | Filtro por profissional |
| `HourColumn.tsx` / `AppointmentCard.tsx` | Agrupamento e exibição dos agendamentos por hora |
| `date-utils.ts` | Conversões de data/hora entre o formato local, os inputs do formulário e o formato UTC usado pela API |

A agenda assina `appointment:created`, `appointment:updated` e `appointment:cancelled` via
`useSocket` e atualiza a lista local (`upsert`/`remove`) sem recarregar a página; se uma
edição/cancelamento chega tarde (404, porque outra tela já alterou o registro), o diálogo mostra o
aviso "Agendamento não encontrado" e remove o item obsoleto da lista.

## Fluxo de autenticação

1. No mount, `AuthProvider` chama `GET /auth/me`; a sessão é validada pelo cookie httpOnly, então não
   há token para gerenciar manualmente no cliente.
2. `PrivateRoute`/`PublicRoute` usam `user`/`loading` do `AuthContext` para redirecionar entre
   `/login`, `/signup` e `/` (Agenda).
3. Ao autenticar (login/signup), a API seta o cookie de sessão e o `AuthContext` guarda o usuário
   retornado; o `SocketProvider` reage a essa mudança e conecta o socket.
4. `logout` chama `POST /auth/logout` (limpa o cookie no servidor) e limpa o usuário no contexto, o
   que desconecta o socket.

## Status

Auth, tempo real e a tela de Agenda (listagem do dia, criar/editar/cancelar, filtro por profissional)
estão implementados de ponta a ponta. Falta, entre outras coisas, testes automatizados — ver "O que
falta" no README raiz do repositório.

## Uso de IA

Esta documentação foi gerada com apoio de IA (Claude), a partir das decisões e do estado real do
código. Ver "Uso de IA" no README raiz do repositório.
