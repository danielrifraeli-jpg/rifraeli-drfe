import { FinancialState, Transaction, Investment, FinancialGoal } from "../types";

export const getSeedData = (): FinancialState => {
  const transactions: Transaction[] = [
    {
      id: "t-1",
      type: "income",
      category: "Salário",
      amount: 8500,
      date: "2026-07-05",
      description: "Salário Líquido Mensal - Tech Corp",
    },
    {
      id: "t-2",
      type: "income",
      category: "Dividendos",
      amount: 420.5,
      date: "2026-07-15",
      description: "Rendimentos de FIIs e Dividendos Ações",
    },
    {
      id: "t-3",
      type: "income",
      category: "Freelance",
      amount: 1800,
      date: "2026-07-12",
      description: "Desenvolvimento de Landing Page",
    },
    {
      id: "t-4",
      type: "expense",
      category: "Moradia",
      amount: 2400,
      date: "2026-07-10",
      description: "Aluguel e Taxa de Condomínio",
    },
    {
      id: "t-5",
      type: "expense",
      category: "Alimentação",
      amount: 850,
      date: "2026-07-08",
      description: "Compras Mensais de Supermercado",
    },
    {
      id: "t-6",
      type: "expense",
      category: "Lazer",
      amount: 75.9,
      date: "2026-07-01",
      description: "Assinaturas de Streaming (Netflix & Spotify)",
    },
    {
      id: "t-7",
      type: "expense",
      category: "Alimentação",
      amount: 220,
      date: "2026-07-14",
      description: "Jantar de Aniversário - Restaurante",
    },
    {
      id: "t-8",
      type: "expense",
      category: "Saúde",
      amount: 130,
      date: "2026-07-02",
      description: "Mensalidade da Academia",
    },
    {
      id: "t-9",
      type: "expense",
      category: "Moradia",
      amount: 180,
      date: "2026-07-11",
      description: "Conta de Energia Elétrica",
    },
    {
      id: "t-10",
      type: "expense",
      category: "Transporte",
      amount: 250,
      date: "2026-07-07",
      description: "Abastecimento do Carro (Combustível)",
    },
    {
      id: "t-11",
      type: "expense",
      category: "Pessoal",
      amount: 320,
      date: "2026-07-16",
      description: "Compra de Roupas de Inverno",
    },
  ];

  const investments: Investment[] = [
    {
      id: "i-1",
      name: "Tesouro Selic 2029 (Reserva Principal)",
      type: "Renda Fixa",
      amount: 25000,
      yieldRate: 10.75,
      purchaseDate: "2025-01-10",
    },
    {
      id: "i-2",
      name: "Ações WEG S.A. (WEGE3)",
      type: "Ações",
      amount: 8400,
      yieldRate: 14.5,
      purchaseDate: "2025-06-15",
    },
    {
      id: "i-3",
      name: "FII HGLG11 (Logística)",
      type: "FIIs",
      amount: 12300,
      yieldRate: 9.8,
      purchaseDate: "2025-03-20",
    },
    {
      id: "i-4",
      name: "Bitcoin (BTC) - Carteira Fria",
      type: "Cripto",
      amount: 6800,
      yieldRate: 35.0,
      purchaseDate: "2026-02-05",
    },
  ];

  const goals: FinancialGoal[] = [
    {
      id: "g-1",
      name: "Rumo ao Primeiro Milhão",
      targetAmount: 1000000,
      currentAmount: 52500, // Total de investimentos + reserva atual
      deadline: "2036-12",
    },
    {
      id: "g-2",
      name: "Reserva de Emergência Ideal",
      targetAmount: 26500,
      currentAmount: 18000,
      deadline: "2026-12",
    },
    {
      id: "g-3",
      name: "Viagem para Europa",
      targetAmount: 15000,
      currentAmount: 4500,
      deadline: "2027-06",
    },
  ];

  return {
    transactions,
    investments,
    goals,
    emergencyReserve: {
      currentAmount: 18000,
      monthlyExpenseFactor: 6, // 6 meses de despesas médias recomendadas
    },
    lastUpdated: new Date().toISOString(),
  };
};
