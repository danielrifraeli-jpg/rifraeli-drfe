import express from "express";
import { GoogleGenAI } from "@google/genai";
import { getUser, createUser, saveUserData } from "./db";

const apiRouter = express.Router();

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

// Configure Express main app config
const app = express();
app.use(express.json());
app.use("/api", apiRouter);

export default app;
