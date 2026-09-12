# fitsme.ai

Backend foundation for **fitsme.ai**, a fashion experimentation product built on the principle: *Your body doesn't need an algorithm.* The service focuses on clothing, styling, comfort, and personal expression; it does not assess or modify bodies.

## Architecture

The existing frontend (if present) remains in `src/`. This Node.js + TypeScript Express backend is isolated in `server/`:

- `server/routes` — API endpoints
- `server/services` — application logic and current mock analysis
- `server/middleware` — logging and predictable error responses
- `server/types` — reusable API contracts
- `server/gemini` and `server/vonage` — reserved for future integrations

Gemini analyzes outfit images in this phase. Vonage remains deliberately unintegrated.

## Backend setup

Requires Node.js 20+.

```powershell
npm install
Copy-Item .env.example .env
npm run server
```

The local server listens on `http://localhost:3001` by default. Configure `FRONTEND_ORIGIN` in `.env` for the Lovable development URL (default: `http://localhost:5173`).

To enable outfit analysis, add a Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_server_only_gemini_key
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port, default `3001` |
| `NODE_ENV` | Runtime environment |
| `FRONTEND_ORIGIN` | Allowed frontend origin for CORS |
| `GEMINI_API_KEY` | Required server-only key for Gemini outfit analysis |
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

Accepted `concern` values: `fit`, `colors`, `silhouette`, `styling`, `something_off`, `dont_know`, `body`. Images may be a base64 string with an explicit `mimeType`, or a data URL. JPEG, PNG, and WebP are supported; decoded images are limited to 6 MB.

```powershell
curl.exe -X POST http://localhost:3001/api/mirror/analyze `
  -H "Content-Type: application/json" `
  -d "{\"image\":\"data:image/jpeg;base64,REPLACE_WITH_REAL_BASE64\",\"concern\":\"fit\"}"
```

The result contains `analysis` (including structured outfit observations and a reframe), three `styleDirections`, and explicit safety guardrails. Images are sent in memory to Gemini and are neither saved to disk nor logged.

Example successful response (content varies by outfit):

```json
{
  "success": true,
  "analysis": {
    "summary": "The feeling may be coming more from how the pieces interact than from you.",
    "observations": [{ "category": "proportion", "text": "The garment lengths create competing visual lines." }],
    "reframe": "Styling variables are worth experimenting with before placing the feeling on your body.",
    "bodyModificationSuggested": false
  },
  "styleDirections": [
    { "id": "comfort", "name": "Comfort", "description": "Keep the outfit easy.", "changes": ["Try a softer layer."] },
    { "id": "confidence", "name": "Confidence", "description": "Create a clear focal point.", "changes": ["Add one structured piece."] },
    { "id": "experiment", "name": "Experiment", "description": "Try a different styling direction.", "changes": ["Introduce a contrasting layer."] }
  ],
  "guardrails": { "bodyJudgment": false, "bodyModification": false, "weightEstimation": false }
}
```

Invalid requests receive a predictable error:

```json
{"success":false,"error":{"code":"INVALID_REQUEST","message":"A valid image is required."}}
```

## Security notes

- `.env` files and secrets are ignored by Git.
- Request logs record method, route, status, and duration only—never body data or images.
- CORS defaults to the local frontend in development and denies cross-origin browser access in production until `FRONTEND_ORIGIN` is configured.
- Errors do not expose stack traces or secret values.
- Gemini is instructed and post-validated to discuss garments and styling—not attractiveness, body size, measurements, body type, weight, health, age, ethnicity, or body modification. Unsafe or malformed model output is replaced by a neutral styling fallback.

## Transform endpoint

### `POST /api/mirror/transform`

Creates a visual outfit transformation after a user selects one of the analysis directions: `comfort`, `confidence`, or `experiment`.

```powershell
curl.exe -X POST http://localhost:3001/api/mirror/transform `
  -H "Content-Type: application/json" `
  -d "{\"image\":\"data:image/jpeg;base64,REPLACE_WITH_REAL_BASE64\",\"direction\":\"confidence\",\"changes\":[\"Add a structured outer layer\",\"Create clearer contrast between top and bottom\",\"Add one statement accessory\"]}"
```

The request accepts JPEG, PNG, and WebP images up to 6 MB decoded. `changes` must contain one to six non-empty styling changes from the prior analysis response.

```json
{
  "success": true,
  "transformation": {
    "direction": "confidence",
    "image": "data:image/png;base64,...",
    "changesApplied": ["Add a structured outer layer"],
    "message": "Same you. Different styling."
  },
  "guardrails": { "bodyModified": false, "identityModified": false }
}
```

Gemini is instructed to preserve the person’s identity and body while modifying styling only. These guardrails declare the intended generation constraints; they are not a mathematical verification of identity or body preservation. Transformation errors return `TRANSFORMATION_FAILED`, and a 45-second provider timeout returns `AI_TIMEOUT`; the frontend can continue displaying the textual recommendations.

## Troubleshooting

- `AI_NOT_CONFIGURED`: set `GEMINI_API_KEY` in the server's `.env`, then restart the server.
- `UNSUPPORTED_IMAGE_TYPE`: use `image/jpeg`, `image/png`, or `image/webp`.
- `IMAGE_TOO_LARGE`: use an image no larger than 6 MB after base64 decoding.
- Gemini provider failures intentionally return a safe fallback response so the frontend experience remains available; check server logs for the error name only.
