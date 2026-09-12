# fitsme.ai

Backend foundation for **fitsme.ai**, a fashion experimentation product built on the principle: *Your body doesn't need an algorithm.* The service focuses on clothing, styling, comfort, and personal expression; it does not assess or modify bodies.

## Architecture

The existing frontend (if present) remains in `src/`. This Node.js + TypeScript Express backend is isolated in `server/`:

- `server/routes` — API endpoints
- `server/services` — application logic and current mock analysis
- `server/middleware` — logging and predictable error responses
- `server/types` — reusable API contracts
- `server/gemini` and `server/vonage` — reserved for future integrations

Gemini and Vonage are deliberately not integrated in this phase. `POST /api/mirror/analyze` returns stable **mock data** so the frontend can build against the contract.

## Backend setup

Requires Node.js 20+.

```powershell
npm install
Copy-Item .env.example .env
npm run server
```

The local server listens on `http://localhost:3001` by default. Configure `FRONTEND_ORIGIN` in `.env` for the Lovable development URL (default: `http://localhost:5173`).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port, default `3001` |
| `NODE_ENV` | Runtime environment |
| `FRONTEND_ORIGIN` | Allowed frontend origin for CORS |
| `GEMINI_API_KEY` | Reserved for the next phase; never expose to the frontend |
| `VONAGE_APPLICATION_ID` | Reserved for a future phase |
| `VONAGE_PRIVATE_KEY` | Reserved for a future phase |

## Development commands

```powershell
npm run server      # start with file watching
npm run typecheck   # TypeScript validation
```

## API

### `GET /api/health`

```json
{"success":true,"service":"fitsme.ai backend","status":"healthy"}
```

### `POST /api/mirror/analyze`

Accepted `concern` values: `fit`, `colors`, `silhouette`, `styling`, `something_off`, `dont_know`, `body`.

```powershell
curl.exe -X POST http://localhost:3001/api/mirror/analyze `
  -H "Content-Type: application/json" `
  -d "{\"image\":\"data:image/jpeg;base64,mock-image-data\",\"concern\":\"fit\"}"
```

The result is MOCK data with `analysis`, three `styleDirections`, and explicit safety guardrails. Image content is accepted but is not stored, logged, or processed in this phase.

Invalid requests receive a predictable error:

```json
{"success":false,"error":{"code":"INVALID_REQUEST","message":"A valid image is required."}}
```

## Security notes

- `.env` files and secrets are ignored by Git.
- Request logs record method, route, status, and duration only—never body data or images.
- CORS defaults to the local frontend in development and denies cross-origin browser access in production until `FRONTEND_ORIGIN` is configured.
- Errors do not expose stack traces or secret values.
