import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ override: process.env.NODE_ENV !== "production" });

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.info(`WTF: WHAT THE FIT backend listening on http://localhost:${port}`));
