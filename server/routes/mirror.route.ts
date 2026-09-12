import { Router } from "express";
import { analyzeOutfitWithGemini, GeminiConfigurationError } from "../gemini/mirrorAnalyzer.js";
import { concernTypes, type MirrorAnalysisRequest } from "../types/mirror.js";
import { AppError } from "../utils/app-error.js";
import { parseBase64Image } from "../utils/image.js";

export const mirrorRouter = Router();
mirrorRouter.post("/analyze", (req, res, next) => {
  const run = async (): Promise<void> => {
    try {
    const { image, concern } = req.body ?? {};
    if (typeof concern !== "string" || !concernTypes.includes(concern as MirrorAnalysisRequest["concern"])) throw new AppError(400, "INVALID_REQUEST", "A valid concern is required.");
    const normalizedImage = parseBase64Image(image, req.body?.mimeType);
    res.json(await analyzeOutfitWithGemini(normalizedImage, concern as MirrorAnalysisRequest["concern"]));
    } catch (error) {
      if (error instanceof GeminiConfigurationError) next(new AppError(503, "AI_NOT_CONFIGURED", "Gemini analysis is not configured. Set GEMINI_API_KEY on the server."));
      else next(error);
    }
  };
  void run();
Continue working in the existing `fitsme-ai` repository.

Current backend already includes:

* Express + TypeScript
* Gemini multimodal outfit analysis
* `POST /api/mirror/analyze`
* Gemini outfit transformation
* `POST /api/mirror/transform`
* body-positive AI guardrails

We are under a strict hackathon deadline.

Your next task is to implement **Vonage Video API support for the "Ask My Person" feature**.

Do NOT redesign existing architecture.
Do NOT rewrite Gemini functionality.
Do NOT build unnecessary infrastructure.

---

# FEATURE

Feature name:

**Ask My Person**

Concept:

After fitsme.ai analyzes an outfit and provides styling options, the user can optionally invite a trusted friend to join a live video session and give a human second opinion.

The philosophy is:

**AI gives context. A person gives perspective. The user makes the decision.**

This is NOT a social network.

It is a simple temporary 1-to-1 video room.

---

# USER EXPERIENCE

Expected flow:

User receives outfit recommendation
→ clicks "Ask My Person"
→ fitsme.ai creates a temporary video room
→ user receives/shareable room code or invite link
→ friend opens link
→ both join Vonage video session
→ live video conversation
→ user returns to final outfit choice

Keep this extremely simple for the hackathon.

No accounts.
No friend lists.
No permanent rooms.
No recordings.
No chat history.

---

# VONAGE ARCHITECTURE

Use the official Vonage Video API.

Server responsibilities:

1. Authenticate using Vonage Application ID + private key.
2. Create Vonage Video sessions.
3. Generate short-lived client tokens.
4. Return client-safe credentials.

Frontend responsibilities:

1. Receive application ID, session ID and token.
2. Initialize Vonage/OpenTok JavaScript client.
3. Connect.
4. Publish local camera/microphone.
5. Subscribe to remote streams.

Never expose the Vonage private key to the browser.

---

# ENVIRONMENT VARIABLES

Use:

```env
VONAGE_APPLICATION_ID=
VONAGE_PRIVATE_KEY=
```

Optional if implementation needs it:

```env
VONAGE_PRIVATE_KEY_PATH=
```

Prefer whichever matches the current Vonage Node server SDK cleanly.

Do not hardcode credentials.

Do not commit private keys.

Ensure appropriate private key filenames are ignored by `.gitignore`.

---

# CURRENT VONAGE SDK

Use Vonage's official server SDK/support for Video API.

Verify the current Node.js package/API available in this project environment before coding.

Do not blindly use old deprecated examples if the currently installed SDK has a newer interface.

If a dedicated Vonage Video/OpenTok server package is required, add the smallest official dependency necessary.

Document the dependency clearly.

---

# ROUTE 1 — CREATE ROOM

Create:

`POST /api/video/session`

No request body should be required for the basic MVP.

Expected response:

```json
{
  "success": true,
  "room": {
    "sessionId": "vonage-session-id",
    "applicationId": "vonage-application-id"
  }
}
```

The server creates a new Vonage video session.

Use a reasonable media mode suitable for a simple 1-to-1 video call.

Do NOT enable recording/archive.

Do NOT permanently store sessions.

---

# ROUTE 2 — GENERATE JOIN TOKEN

Create:

`POST /api/video/token`

Request:

```json
{
  "sessionId": "vonage-session-id",
  "role": "publisher"
}
```

For MVP, role may default to publisher.

Return:

```json
{
  "success": true,
  "credentials": {
    "applicationId": "vonage-application-id",
    "sessionId": "vonage-session-id",
    "token": "short-lived-vonage-token"
  }
}
```

Both user and friend should be able to publish audio/video.

Do not give unnecessary moderator privileges.

Use short-lived tokens.

A token lifetime around 30–60 minutes is appropriate for this temporary hackathon room if supported by the SDK.

---

# OPTIONAL FAST ROUTE

Because this is a hackathon and we want minimal frontend work, you MAY additionally create:

`POST /api/video/join`

Request:

```json
{
  "sessionId": "optional-existing-session"
}
```

Behavior:

If sessionId is absent:

* create session
* generate token

If sessionId exists:

* generate token for that session

Response:

```json
{
  "success": true,
  "credentials": {
    "applicationId": "...",
    "sessionId": "...",
    "token": "..."
  }
}
```

If adding this route makes frontend integration easier, implement it.

Do not remove the explicit session/token routes if already created.

---

# SHAREABLE ROOM IDENTIFIER

For hackathon MVP, the actual Vonage session ID may be long and unsuitable for a URL.

Create a simple temporary room identifier only if it can be done WITHOUT a database.

Example:

`?session=<URL_ENCODED_SESSION_ID>`

OR another stateless encoded representation.

Do NOT build Redis.
Do NOT build a database.
Do NOT create persistent room tables.

If securely encoding a room identifier adds significant complexity, use the session ID directly for the demo.

Speed is more important.

---

# SECURITY RULES

Absolutely never return:

* private key
* server JWT signing material
* environment variables
* secrets

The browser may receive only:

* applicationId
* sessionId
* client token

Validate incoming session IDs before generating tokens.

Apply reasonable input length limits.

---

# ERROR HANDLING

Use the existing structured error format.

Recommended codes:

* `VIDEO_NOT_CONFIGURED`
* `VIDEO_SESSION_FAILED`
* `VIDEO_TOKEN_FAILED`
* `INVALID_SESSION`
* `INVALID_REQUEST`

Example:

```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_CONFIGURED",
    "message": "Video calling is not configured."
  }
}
```

Do not expose Vonage internals, stack traces, private keys, or raw provider errors to clients.

---

# SERVICE STRUCTURE

Keep Vonage logic separate from routes.

Suggested:

```text
server/
  vonage/
    video.service.ts
```

or equivalent consistent with existing architecture.

Suggested responsibilities:

```ts
createVideoSession()
generateVideoToken(sessionId)
```

Routes should remain thin.

---

# FRONTEND INTEGRATION CONTRACT

The frontend team is using React/Lovable.

Provide clear documentation for how they should integrate.

They should use Vonage/OpenTok JavaScript client functionality to:

1. Initialize:

`OT.initSession(applicationId, sessionId)`

2. Connect using token.

3. Initialize publisher.

4. Publish local stream.

5. Listen for `streamCreated`.

6. Subscribe to remote stream.

Current Vonage documentation uses the client session initialized with the Application ID + Session ID, followed by connection with the generated token.

---

# FRONTEND COMPONENT EXPECTATION

DO NOT redesign the frontend.

But document expected component behavior.

Suggested UI:

```text
┌────────────────────────────────────┐
│          Ask My Person             │
│                                    │
│   ┌─────────┐    ┌─────────────┐  │
│   │   Me    │    │ My Person   │  │
│   │ video   │    │   video     │  │
│   └─────────┘    └─────────────┘  │
│                                    │
│     🎤        📹        Leave      │
└────────────────────────────────────┘
```

Required controls:

* microphone on/off
* camera on/off
* leave

Required states:

* requesting permissions
* connecting
* connected
* waiting for friend
* friend joined
* disconnected
* error

Do NOT add:

* text chat
* reactions
* screen sharing
* recording
* virtual backgrounds

unless already trivial.

---

# SHARE FLOW

Frontend should be able to show:

**"Ask someone you trust."**

Then:

**Copy invite**

Possible URL:

`https://fitsme.ai/person?session=<encoded-session-id>`

For local demo:

`http://localhost:5173/person?session=<...>`

Do not hardcode production domain if unavailable.

Use frontend base URL configuration.

---

# PRIVACY COPY

Include documentation for frontend copy:

"Your video call is temporary and isn't recorded by fitsme.ai."

Do not claim Vonage itself stores absolutely nothing.

Only state that fitsme.ai does not intentionally enable recording or archive the session.

---

# TOKEN SECURITY

Generate tokens SERVER-SIDE ONLY.

Never put:

`VONAGE_PRIVATE_KEY`

in React/Vite/Lovable environment variables.

Never use a `VITE_` variable for a private key.

The Application ID is client-safe.

Token is temporary and may be returned to the browser.

Private key is server-only.

---

# DEVELOPMENT FALLBACK

We are under time pressure.

If Vonage credentials are unavailable, implement a lightweight demo mode only if necessary.

Optional:

```env
VIDEO_DEMO_MODE=true
```

In demo mode:

* session creation may return clearly marked demo credentials/status
* frontend can render the video room UI without connecting

BUT:

Do not pretend a fake video connection is real.

Real Vonage integration is strongly preferred.

---

# VALIDATION

Test logically for:

### Case 1

Create room with valid credentials.

Expected:
session ID returned.

### Case 2

Generate token for valid session.

Expected:
application ID, session ID, token.

### Case 3

Missing Vonage configuration.

Expected:
`VIDEO_NOT_CONFIGURED`.

### Case 4

Missing/invalid session ID.

Expected:
400 structured error.

### Case 5

Private key.

Confirm it is NEVER returned or logged.

---

# README

Update README with:

## Ask My Person

Explain:

* Vonage architecture
* required environment variables
* how to create a Vonage Video application
* session endpoint
* token endpoint
* example requests/responses
* client connection flow
* privacy behavior
* troubleshooting

---

# DO NOT BUILD

Do NOT add:

* authentication
* database
* user accounts
* contacts
* friend lists
* permanent rooms
* call history
* recordings
* messaging
* notification service
* SMS invitations
* email invitations

We only need a temporary 1-to-1 video call.

---

# PRESERVE EXISTING FEATURES

Do not break:

`GET /api/health`

`POST /api/mirror/analyze`

`POST /api/mirror/transform`

Do not modify Gemini code unless required for compilation.

---

# TIME PRIORITY

This must be hackathon-fast.

Priority order:

1. Session creation
2. Token generation
3. Clean API contract
4. Server-side credential security
5. Documentation
6. Everything else

If something optional threatens the core integration, skip it.

---

# FINAL OUTPUT

At completion, tell me ONLY:

1. Files changed
2. Dependency added
3. Routes added
4. Exact environment variables required
5. Whether real Vonage session creation is wired
6. Whether real token generation is wired
7. Frontend integration instructions
8. Any blocker

If Node/npm is unavailable, still write the implementation and document exact commands required to install/test.

Commit as:

`feat: add ask my person video backend`

Do NOT proceed to another feature.
});
