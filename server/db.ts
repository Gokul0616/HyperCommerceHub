import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let db: any;
let pool: Pool | null = null;

// Check if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  // Use real database
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("🗄️  Connected to database");
} else {
  // Use demo mode - will be handled by demo storage
  console.log("🔄 Running in demo mode (no DATABASE_URL provided)");
  db = null;
}

export { pool, db };
export const isDemoMode = !process.env.DATABASE_URL;