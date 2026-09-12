# WTF — What The Fit

> Your body does not need an algorithm. Sometimes it is not you—it is just the fit.

WTF is a body-positive AI styling experience that helps people understand why an outfit may feel wrong without criticizing their body. Users capture an outfit, choose what feels off, receive clothing-focused feedback from Google Gemini, explore three styling directions, and generate a visual restyle that keeps the person unchanged.

## Why it matters

Most fashion tools optimize bodies toward a narrow ideal. WTF changes the question from “What is wrong with me?” to “What can I change about the clothes?” The experience focuses on practical variables such as fit, proportion, color, layering, fabric behavior, accessories, and garment silhouette.

## Key features

- Camera-based outfit capture directly in the browser
- AI outfit analysis powered by Google Gemini
- Seven concern paths: fit, colors, silhouette, styling, something feels off, uncertainty, and body discomfort
- Three actionable directions: Comfort, Confidence, and Experiment
- AI-generated before-and-after outfit visualization
- Explicit guardrails against body judgment, weight estimation, and body-modification advice
- Responsive editorial interface with clear loading and error states
- In-memory image processing; uploaded images are not saved by the application

## User journey

1. Capture an outfit photo.
2. Select what feels off about the look.
3. Receive a supportive, clothing-centered analysis.
4. Compare three styling directions.
5. Generate a restyled image while preserving identity and body.
6. Review the original and transformed outfits side by side.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, custom CSS |
| UI | Lucide React and reusable UI components |
| Backend | Node.js, Express 5, TypeScript |
| AI | Google Gemini through `@google/genai` |
| Development | tsx, npm |

## Architecture

```text
Browser camera / uploaded image
            |
            v
      React + Vite UI
            |
            | POST /api/mirror/analyze
            | POST /api/mirror/transform
            v
      Express API server
            |
            v
       Google Gemini
       |           |
       |           +-- outfit image transformation
       +-------------- structured outfit analysis
```

The Vite development server runs on port `5173` and proxies `/api` requests to the Express server on port `3001`.

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- A Gemini API key from Google AI Studio
- A browser with camera permission

### Installation

```powershell
git clone <your-repository-url>
cd fitsme.ai-
npm install
Copy-Item .env.example .env
```

Open `.env` and add your private Gemini key:

```env
PORT=3001
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_private_gemini_api_key
```

Never commit `.env` or paste a live API key into `.env.example`. The repository ignores private environment files.

### Run the application

Start the backend in the first terminal:

```powershell
npm run server
```

Start the frontend in a second terminal:

```powershell
npm run dev
```

Open `http://localhost:5173`. The API health check is available at `http://localhost:3001/api/health`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend development server |
| `npm run server` | Start the Express API with file watching |
| `npm run typecheck` | Run TypeScript validation |
| `npm run build` | Validate the TypeScript project |
| `npm start` | Run a previously compiled production server |

## API overview

### Health check

```http
GET /api/health
```

```json
{
  "success": true,
  "service": "WTF: WHAT THE FIT backend",
  "status": "healthy"
}
```

### Analyze an outfit

```http
POST /api/mirror/analyze
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,...",
  "concern": "fit"
}
```

Supported concerns are `fit`, `colors`, `silhouette`, `styling`, `something_off`, `dont_know`, and `body`. Supported image formats are JPEG, PNG, and WebP, with a decoded size limit of 6 MB. The response contains an analysis, three styling directions, and safety-guardrail flags.

### Transform an outfit

```http
POST /api/mirror/transform
Content-Type: application/json
```

```json
{
  "image": "data:image/jpeg;base64,...",
  "direction": "confidence",
  "changes": ["Add one structured focal layer"]
}
```

The response contains a base64 data URL for the transformed image and the changes applied.

## Responsible AI and privacy

WTF is designed to evaluate clothes, not people. Gemini is instructed never to estimate or criticize weight, measurements, body shape, age, ethnicity, health, attractiveness, or physical fitness. Generated text is validated against additional safety rules, and invalid analysis is replaced with a neutral styling fallback.

Transformation prompts require Gemini to preserve the person’s identity, face, skin tone, hair, body proportions, pose, expression, environment, and camera framing while changing only clothing and styling. These guardrails express the product’s intended behavior; generative output should still be reviewed critically.

Images are processed in memory and sent to Gemini for the requested operation. This project does not write uploaded photos to disk or log their contents.

## Error handling

| Code | Meaning |
| --- | --- |
| `INVALID_REQUEST` | The request is missing valid input |
| `AI_NOT_CONFIGURED` | `GEMINI_API_KEY` is missing from the backend environment |
| `AI_TIMEOUT` | Image transformation exceeded the provider timeout |
| `TRANSFORMATION_FAILED` | Gemini did not return a usable transformed image |

If `AI_NOT_CONFIGURED` appears, confirm the key is in `.env`—not `.env.example`—and fully restart the backend process.

## Project structure

```text
fitsme.ai-/
|-- public/                  Static assets
|-- server/
|   |-- gemini/              Analysis and transformation integrations
|   |-- middleware/          Logging and error handling
|   |-- routes/              API endpoints
|   |-- services/            Safe fallback analysis
|   |-- types/               API and domain types
|   `-- utils/               Image parsing and application errors
|-- src/
|   |-- components/          Reusable interface components
|   |-- hooks/               React hooks
|   |-- lib/                 Shared frontend utilities
|   `-- App.tsx              Main guided styling experience
|-- .env.example             Safe environment-variable template
|-- vite.config.ts           Vite configuration and API proxy
`-- package.json             Dependencies and scripts
```

## Future improvements

- Optional file upload when a camera is unavailable
- Saved styling sessions with explicit user consent
- Accessibility and cross-device camera testing
- More granular styling controls before transformation
- Automated API, safety, and end-to-end tests

## Team

Built for the GDG Hackathon. Add team-member names, roles, a live demo URL, and the final repository URL here before submission.

## License

This hackathon project does not currently declare an open-source license. Add a license before redistributing or accepting external contributions.
