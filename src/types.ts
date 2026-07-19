export interface Transaction {
  id: string;
  type: "income" | "expense"; // "entrada" | "saida"
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  isEmergencyReserve?: boolean; // Se contribui para a reserva de emergência
}

export interface Investment {
  id: string;
  name: string;
  type: "Renda Fixa" | "Ações" | "FIIs" | "Cripto" | "Exterior" | "Outros";
  amount: number; // Valor atual investido
  yieldRate: number; // % Rentabilidade anual estimada
  purchaseDate: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM
}

export interface EmergencyReserve {
  currentAmount: number; // Valor guardado especificamente na reserva
  monthlyExpenseFactor: number; // Quantidade de meses de despesa recomendados (ex: 6 meses)
}

export interface FinancialState {
  transactions: Transaction[];
  investments: Investment[];
  goals: FinancialGoal[];
  emergencyReserve: EmergencyReserve;
  lastUpdated: string;
}

export interface UserSession {
  username: string;
  passwordHash: string;
  rawPassword?: string; // Mantido em memória temporária para re-criptografar ao salvar
}
