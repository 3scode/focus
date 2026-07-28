import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"

// Bun punya global WebSocket, gak perlu install 'ws' package
neonConfig.webSocketConstructor = WebSocket

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle({ client: pool })
