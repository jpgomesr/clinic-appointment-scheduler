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
│   ├── api.ts                 Wrapper de fetch (credentials: "include", tratamento de erro via ApiError)
│   └── socket.ts               Instância do socket.io-client (autoConnect: false)
└── pages/
    ├── Login/                 Tela de login
    ├── Signup/                 Tela de cadastro
    └── Home/                   Home autenticada (abre a conexão de socket; ainda sem telas da agenda)
```

## Fluxo de autenticação

1. No mount, `AuthProvider` chama `GET /auth/me`; a sessão é validada pelo cookie httpOnly, então não
   há token para gerenciar manualmente no cliente.
2. `PrivateRoute`/`PublicRoute` usam `user`/`loading` do `AuthContext` para redirecionar entre
   `/login`, `/signup` e `/` (Home).
3. Ao autenticar (login/signup), a API seta o cookie de sessão e o `AuthContext` guarda o usuário
   retornado; o `SocketProvider` reage a essa mudança e conecta o socket.
4. `logout` chama `POST /auth/logout` (limpa o cookie no servidor) e limpa o usuário no contexto, o
   que desconecta o socket.

## Status

Ainda não há telas de agenda (listagem/criação/movimentação/cancelamento de agendamentos) — apenas
auth e a base de conexão em tempo real. Ver "O que falta" no README raiz do repositório.

## Uso de IA

Esta documentação foi gerada com apoio de IA (Claude), a partir das decisões e do estado real do
código. Ver "Uso de IA" no README raiz do repositório.
