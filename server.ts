import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "secure_db.json");

app.use(express.json());

// Initialize secure local database if it doesn't exist
function initDatabase() {
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
          encryptedData: "", // To be seeded by the client upon first login
        },
      },
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    console.log("Banco de dados seguro inicializado com o usuário padrão 'rifraeli'.");
  }
}

initDatabase();

// Help function to read/write DB
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Erro ao ler banco de dados:", err);
  }
  return { users: {} };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao escrever no banco de dados:", err);
  }
}

// ---------------------------------------------------------------------------
// API ENDPOINTS
// ---------------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor de pé e seguro!" });
});

// 2. Authentication: Login
app.post("/api/auth/login", (req, res) => {
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) {
    return res.status(400).json({ error: "Nome de usuário e hash de senha são obrigatórios." });
  }

  const db = readDb();
  const user = db.users[username.toLowerCase().trim()];

  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }

  // Compare hashes (case-insensitive for safety, but exact match is standard)
  if (user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }

  // Login successful - send encrypted financial data blob
  res.json({
    username: user.username,
    encryptedData: user.encryptedData || "",
  });
});

// 3. Authentication: Register (Optional, for creating additional accounts)
app.post("/api/auth/register", (req, res) => {
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) {
    return res.status(400).json({ error: "Nome de usuário e hash de senha são obrigatórios." });
  }

  const db = readDb();
  const lowerUsername = username.toLowerCase().trim();

  if (db.users[lowerUsername]) {
    return res.status(400).json({ error: "Este nome de usuário já está cadastrado." });
  }

  db.users[lowerUsername] = {
    username: username.trim(),
    passwordHash: passwordHash,
    encryptedData: "",
  };

  writeDb(db);

  res.status(201).json({ message: "Usuário registrado com sucesso!" });
});

// 4. Save Encrypted Financial Data
app.post("/api/data/save", (req, res) => {
  const { username, passwordHash, encryptedData } = req.body;

  if (!username || !passwordHash || encryptedData === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  const db = readDb();
  const user = db.users[username.toLowerCase().trim()];

  if (!user || user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  // Save the client-side encrypted blob
  user.encryptedData = encryptedData;
  writeDb(db);

  res.json({ success: true, message: "Dados financeiros salvos e criptografados com sucesso!" });
});

// 5. Intelligent Financial Advisor API (Gemini-3.5-Flash Proxy)
app.post("/api/ai/advisor", async (req, res) => {
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

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSET SERVING
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
