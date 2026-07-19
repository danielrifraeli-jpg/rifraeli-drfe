import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";

export interface User {
  username: string;
  passwordHash: string;
  encryptedData: string;
}

// Check for PostgreSQL credentials
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let pool: pg.Pool | null = null;
let pgInitialized = false;

// Resolve JSON local database path (use /tmp on serverless environments to avoid read-only FS errors)
const isServerless = !!process.env.VERCEL || !!process.env.LAMBDA_TASK_ROOT;
const DB_FILE = isServerless 
  ? path.join("/tmp", "secure_db.json") 
  : path.join(process.cwd(), "secure_db.json");

/**
 * Initializes the PostgreSQL database pool and creates the users table if it doesn't exist.
 * Lazy-loaded to prevent startup crashes if keys are missing or invalid.
 */
async function initPg(): Promise<pg.Pool | null> {
  if (!dbUrl) return null;
  if (pool) return pool;

  try {
    // Configure connection with safe defaults
    pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Standard for hosted PostgreSQL services like Neon/Vercel/Supabase
      },
      connectionTimeoutMillis: 5000,
    });

    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        encrypted_data TEXT DEFAULT ''
      );
    `);

    // Ensure default admin/user 'rifraeli' exists
    const res = await pool.query("SELECT * FROM users WHERE username = $1", ["rifraeli"]);
    if (res.rows.length === 0) {
      const defaultPasswordHash = crypto
        .createHash("sha256")
        .update("milhao123")
        .digest("hex");

      await pool.query(
        "INSERT INTO users (username, password_hash, encrypted_data) VALUES ($1, $2, $3)",
        ["rifraeli", defaultPasswordHash, ""]
      );
      console.log("[DB] Usuário padrão 'rifraeli' cadastrado no PostgreSQL.");
    }

    pgInitialized = true;
    console.log("[DB] PostgreSQL conectado e inicializado com sucesso.");
    return pool;
  } catch (err) {
    console.error("[DB] Falha ao inicializar PostgreSQL, usando fallback local:", err);
    pool = null;
    return null;
  }
}

/**
 * Fallback local JSON database operations
 */
function initLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultPasswordHash = crypto
      .createHash("sha256")
      .update("milhao123")
      .digest("hex");

    const initialDb = {
      users: {
        rifraeli: {
          username: "rifraeli",
          passwordHash: defaultPasswordHash,
          encryptedData: "",
        },
      },
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
      console.log(`[DB] Banco de dados local inicializado em: ${DB_FILE}`);
    } catch (err) {
      console.error("[DB] Falha ao criar arquivo de banco local:", err);
    }
  }
}

function readLocalDb(): { users: Record<string, User> } {
  initLocalDb();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[DB] Erro ao ler banco local:", err);
  }
  return { users: {} };
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Erro ao escrever no banco local:", err);
  }
}

/**
 * HIGH-LEVEL DATABASE INTERFACE
 */

export async function getUser(username: string): Promise<User | null> {
  const normalized = username.toLowerCase().trim();
  
  // Try PostgreSQL first
  const pgPool = await initPg();
  if (pgPool) {
    try {
      const res = await pgPool.query("SELECT username, password_hash as \"passwordHash\", encrypted_data as \"encryptedData\" FROM users WHERE username = $1", [normalized]);
      if (res.rows.length > 0) {
        return res.rows[0] as User;
      }
      return null;
    } catch (err) {
      console.error("[DB] Erro ao consultar usuário no PostgreSQL, buscando local:", err);
    }
  }

  // Local fallback
  const db = readLocalDb();
  return db.users[normalized] || null;
}

export async function createUser(username: string, passwordHash: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();

  // Try PostgreSQL first
  const pgPool = await initPg();
  if (pgPool) {
    try {
      await pgPool.query(
        "INSERT INTO users (username, password_hash, encrypted_data) VALUES ($1, $2, $3)",
        [normalized, passwordHash, ""]
      );
      return true;
    } catch (err: any) {
      console.error("[DB] Erro ao cadastrar usuário no PostgreSQL, tentando local:", err);
    }
  }

  // Local fallback
  const db = readLocalDb();
  if (db.users[normalized]) {
    return false; // Already exists
  }

  db.users[normalized] = {
    username: username.trim(),
    passwordHash: passwordHash,
    encryptedData: "",
  };
  writeLocalDb(db);
  return true;
}

export async function saveUserData(username: string, encryptedData: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();

  // Try PostgreSQL first
  const pgPool = await initPg();
  if (pgPool) {
    try {
      await pgPool.query(
        "UPDATE users SET encrypted_data = $1 WHERE username = $2",
        [encryptedData, normalized]
      );
      return true;
    } catch (err) {
      console.error("[DB] Erro ao atualizar dados no PostgreSQL, salvando local:", err);
    }
  }

  // Local fallback
  const db = readLocalDb();
  const user = db.users[normalized];
  if (!user) return false;

  user.encryptedData = encryptedData;
  writeLocalDb(db);
  return true;
}
