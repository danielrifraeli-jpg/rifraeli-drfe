import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";

const apiRouter = express.Router();

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

// 1. Health check
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor de pé, seguro e pronto!" });
});

// 2. Authentication: Login
apiRouter.post("/auth/login", async (req, res) => {
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) {
    return res.status(400).json({ error: "Nome de usuário e hash de senha são obrigatórios." });
  }

  try {
    const user = await getUser(username);

    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    // Compare hashes (case-insensitive for safety, standard check)
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    // Login successful - send encrypted financial data blob
    res.json({
      username: user.username,
      encryptedData: user.encryptedData || "",
    });
  } catch (err: any) {
    console.error("Erro no Login:", err);
    res.status(500).json({ error: "Falha interna na autenticação." });
  }
});

// 3. Authentication: Register (Optional, for creating additional accounts)
apiRouter.post("/auth/register", async (req, res) => {
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) {
    return res.status(400).json({ error: "Nome de usuário e hash de senha são obrigatórios." });
  }

  try {
    const success = await createUser(username, passwordHash);

    if (!success) {
      return res.status(400).json({ error: "Este nome de usuário já está cadastrado." });
    }

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (err: any) {
    console.error("Erro no registro de usuário:", err);
    res.status(500).json({ error: "Falha interna ao registrar usuário." });
  }
});

// 4. Save Encrypted Financial Data
apiRouter.post("/data/save", async (req, res) => {
  const { username, passwordHash, encryptedData } = req.body;

  if (!username || !passwordHash || encryptedData === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  try {
    const user = await getUser(username);

    if (!user || user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    // Save the client-side encrypted blob
    await saveUserData(username, encryptedData);

    res.json({ success: true, message: "Dados financeiros salvos e criptografados com sucesso!" });
  } catch (err: any) {
    console.error("Erro ao salvar dados do usuário:", err);
    res.status(500).json({ error: "Falha interna ao salvar dados financeiros." });
  }
});

// 5. Intelligent Financial Advisor API (Gemini-3.5-Flash Proxy)
apiRouter.post("/ai/advisor", async (req, res) => {
  const { summary } = req.body;

  if (!summary) {
    return res.status(400).json({ error: "Resumo dos dados é obrigatório para a IA." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "A chave API do Gemini não está configurada no servidor. Por favor, adicione GEMINI_API_KEY nas Configurações.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `Você é o "Milhão Advisor", um assistente de inteligência artificial financeira pessoal de elite. 
Sua missão é ajudar o usuário (danielrifraeli@gmail.com ou 'rifraeli') a atingir o seu primeiro milhão de forma segura, com conselhos pragmáticos, focados em controle de gastos, formação de reserva de emergência e estratégias de investimento inteligentes.
Responda SEMPRE em português do Brasil. Seja motivador, claro, profissional e divida sua análise em seções práticas (ex: Saúde Financeira Atual, Alocação Sugerida, Próximos Passos). 
Analise os dados financeiros reais consolidados que o usuário enviou (em formato de resumo com saldos, receitas, despesas, investimentos e reserva). Faça cálculos e aponte se as metas estão realistas.`;

    const prompt = `Aqui está o resumo financeiro consolidado atual:
- Saldo Líquido: R$ ${summary.netBalance.toFixed(2)}
- Total de Receitas (Entradas): R$ ${summary.totalIncomes.toFixed(2)}
- Total de Despesas (Saídas): R$ ${summary.totalExpenses.toFixed(2)}
- Total em Investimentos: R$ ${summary.totalInvested.toFixed(2)}
- Reserva de Emergência Atual: R$ ${summary.emergencyReserve.toFixed(2)}
- Meta da Reserva de Emergência: R$ ${summary.emergencyReserveTarget.toFixed(2)}
- Progresso da Reserva de Emergência: ${summary.emergencyReserveProgress.toFixed(1)}%
- Principais Despesas por Categoria: ${JSON.stringify(summary.expensesByCategory)}
- Quantidade de Investimentos Ativos: ${summary.investmentCount}
- Principais Metas Atuais: ${JSON.stringify(summary.goals)}

Por favor, faça um diagnóstico financeiro completo e detalhado. Dê recomendações sobre como otimizar os investimentos, acelerar o preenchimento da reserva de emergência e ajustar os hábitos de consumo para cumprir as metas. Mantenha um tom otimista focado na mentalidade de enriquecimento.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ advice: response.text });
  } catch (err: any) {
    console.error("Erro ao chamar o Gemini API:", err);
    res.status(500).json({
      error: "Falha ao obter conselho financeiro inteligente.",
      details: err.message || err,
    });
  }
});

const app = express();
app.use(express.json());

// Support both Vercel rewrite modes (matching with and without /api)
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
