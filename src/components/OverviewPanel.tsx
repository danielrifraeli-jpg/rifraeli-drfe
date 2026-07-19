import React from "react";
import { FinancialState, Transaction } from "../types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface OverviewPanelProps {
  state: FinancialState;
  onNavigateToTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
}

const COLORS = ["#d4af37", "#a6801e", "#e2c569", "#785a10", "#f59e0b", "#64748b"];

export default function OverviewPanel({
  state,
  onNavigateToTab,
  onOpenAddTransaction,
}: OverviewPanelProps) {
  const { transactions, investments, goals, emergencyReserve } = state;

  // Calculate high-level financial metrics
  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBankBalance = totalIncomes - totalExpenses;
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const emergencyAmount = emergencyReserve.currentAmount;
  const totalWealth = totalInvested + emergencyAmount + netBankBalance;

  // Formatter for BRL currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Prepare data for Asset Allocation Chart (Investments)
  const investmentAllocation = investments.reduce((acc: { [key: string]: number }, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.amount;
    return acc;
  }, {});

  const pieData = Object.keys(investmentAllocation).map((key) => ({
    name: key,
    value: investmentAllocation[key],
  }));

  // Prepare data for monthly cash flow (grouped by month-year)
  const cashFlowByMonth = transactions.reduce((acc: { [key: string]: { income: number; expense: number } }, t) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { income: 0, expense: 0 };
    }
    if (t.type === "income") {
      acc[month].income += t.amount;
    } else {
      acc[month].expense += t.amount;
    }
    return acc;
  }, {});

  const barData = Object.keys(cashFlowByMonth)
    .sort()
    .map((month) => {
      const [year, m] = month.split("-");
      const label = `${m}/${year.substring(2)}`;
      return {
        name: label,
        Receitas: cashFlowByMonth[month].income,
        Despesas: cashFlowByMonth[month].expense,
      };
    });

  // Calculate Average Monthly Expense
  // Sort transactions by date and calculate average over active months
  const expenseMonths = Array.from(new Set(transactions.filter(t => t.type === "expense").map(t => t.date.substring(0, 7))));
  const activeMonthsCount = Math.max(expenseMonths.length, 1);
  const avgMonthlyExpense = totalExpenses / activeMonthsCount;

  // Emergency Reserve Calculations
  const targetReserve = avgMonthlyExpense * emergencyReserve.monthlyExpenseFactor;
  const reserveProgressPercent = targetReserve > 0 ? (emergencyAmount / targetReserve) * 100 : 0;
  const coverageMonths = avgMonthlyExpense > 0 ? emergencyAmount / avgMonthlyExpense : 0;

  // Get last 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Wealth */}
        <div id="card-patrimonio" className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col justify-between transition hover:border-theme-border">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-xs uppercase tracking-wider font-semibold">Patrimônio Total</span>
            <div className="p-2 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-[#d4af37]">{formatBRL(totalWealth)}</h3>
            <p className="text-[10px] text-theme-muted mt-1 uppercase tracking-wider">
              Conta + Investido + Reserva
            </p>
          </div>
        </div>

        {/* Total Incomes */}
        <div id="card-receitas" className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col justify-between transition hover:border-theme-border">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-xs uppercase tracking-wider font-semibold">Entradas Totais</span>
            <div className="p-2 bg-emerald-950/30 text-emerald-400 border border-emerald-900/20 rounded">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-theme-title">{formatBRL(totalIncomes)}</h3>
            <p className="text-[10px] text-emerald-400 mt-1 font-mono uppercase tracking-wider flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              <span>Salários, dividendos, extras</span>
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div id="card-despesas" className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col justify-between transition hover:border-theme-border">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-xs uppercase tracking-wider font-semibold">Saídas Totais</span>
            <div className="p-2 bg-rose-950/30 text-rose-400 border border-rose-900/20 rounded">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-theme-title">{formatBRL(totalExpenses)}</h3>
            <p className="text-[10px] text-rose-400 mt-1 font-mono uppercase tracking-wider flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" />
              <span>Gastos gerais debitados</span>
            </p>
          </div>
        </div>

        {/* Total Invested */}
        <div id="card-investido" className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col justify-between transition hover:border-theme-border">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-xs uppercase tracking-wider font-semibold">Total Alocado</span>
            <div className="p-2 bg-blue-950/30 text-blue-400 border border-blue-900/20 rounded">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-theme-title">{formatBRL(totalInvested)}</h3>
            <p className="text-[10px] text-theme-muted mt-1 uppercase tracking-wider">
              Renda Fixa, Ações e FIIs
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Graph */}
        <div id="chart-fluxo-caixa" className="bg-theme-card p-5 rounded border border-theme-card-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-theme-title text-sm uppercase tracking-wider serif-heading">Fluxo de Caixa Mensal</h4>
            <span className="text-[10px] font-medium text-theme-muted uppercase tracking-widest font-mono">Auditoria de Período</span>
          </div>
          <div className="h-80 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatBRL(Number(value)), ""]}
                    contentStyle={{ backgroundColor: "var(--bg-input)", borderRadius: "4px", border: "1px solid var(--border-card)", color: "var(--text-main)" }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Receitas" fill="#d4af37" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-theme-muted">
                <p className="text-sm font-mono uppercase tracking-wider">Sem dados de transações históricos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Allocation Graph */}
        <div id="chart-alocacao" className="bg-theme-card p-5 rounded border border-theme-card-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-theme-title text-sm uppercase tracking-wider serif-heading">Alocação de Ativos</h4>
            <button
              onClick={() => onNavigateToTab("investments")}
              className="text-xs font-semibold text-[#d4af37] hover:text-[#c49f27] hover:underline uppercase tracking-wider font-mono"
            >
              Carteira
            </button>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatBRL(Number(value)), ""]}
                    contentStyle={{ backgroundColor: "var(--bg-input)", borderRadius: "4px", border: "1px solid var(--border-card)", color: "var(--text-main)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-theme-muted">
                <p className="text-xs font-mono uppercase tracking-wider text-center">Nenhum investimento indexado.</p>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-theme-muted uppercase tracking-widest font-mono">Total</span>
                <span className="text-sm font-bold font-mono text-theme-title">{formatBRL(totalInvested)}</span>
              </div>
            )}
          </div>
          {/* Pie Chart Legend */}
          <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-theme-muted">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-theme-title">
                  {((item.value / totalInvested) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Reserve & Last Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Reserve Overview Card */}
        <div id="card-reserva-detalhes" className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-theme-title text-sm uppercase tracking-wider serif-heading">Reserva de Segurança</h4>
              <button
                onClick={() => onNavigateToTab("goals")}
                className="text-xs font-semibold text-[#d4af37] hover:text-[#c49f27] hover:underline uppercase tracking-wider font-mono"
              >
                Configurar
              </button>
            </div>
            <p className="text-xs text-theme-text leading-relaxed mb-4">
              A reserva ideal de liquidez deve cobrir <strong className="text-[#d4af37]">{emergencyReserve.monthlyExpenseFactor} meses</strong> do seu custo de vida médio mensal avaliado em <strong className="text-theme-title">{formatBRL(avgMonthlyExpense)}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5 bg-theme-bg p-4 rounded border border-theme-card-border">
              <div>
                <span className="text-[10px] text-theme-muted uppercase tracking-wider block font-mono">Acumulado</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{formatBRL(emergencyAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-theme-muted uppercase tracking-wider block font-mono">Meta Blindada</span>
                <span className="text-lg font-bold font-mono text-[#d4af37]">{formatBRL(targetReserve)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-theme-muted font-mono text-[10px] uppercase tracking-wider">Cobertura Calculada</span>
                <span className="text-[#d4af37] font-bold font-mono">
                  {reserveProgressPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-theme-bg border border-theme-card-border rounded overflow-hidden">
                <div
                  className="h-full bg-[#d4af37] rounded transition-all duration-500"
                  style={{ width: `${Math.min(reserveProgressPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-theme-border flex items-center gap-2.5 text-xs text-theme-muted">
            <AlertCircle className="h-4.5 w-4.5 text-[#d4af37] flex-shrink-0" />
            <span>
              Sua provisão cobre atualmente <strong className="text-theme-title font-semibold font-mono">{coverageMonths.toFixed(1)} meses</strong> do orçamento de custeio corrente.
            </span>
          </div>
        </div>

        {/* Recent Transactions List Card */}
        <div id="card-recentes" className="bg-theme-card p-5 rounded border border-theme-card-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-theme-title text-sm uppercase tracking-wider serif-heading">Últimos Lançamentos</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddTransaction}
                className="inline-flex items-center gap-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/20 font-bold text-xs py-1 px-3 rounded transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>LANÇAR</span>
              </button>
              <button
                onClick={() => onNavigateToTab("transactions")}
                className="text-xs font-semibold text-theme-muted hover:text-theme-title hover:underline uppercase tracking-wider font-mono"
              >
                Todos
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded hover:bg-theme-hover transition border border-theme-card-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${
                        t.type === "income" 
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                          : "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                      }`}
                    >
                      {t.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-theme-muted font-mono block">
                        {t.date.split("-").reverse().join("/")} • {t.category}
                      </span>
                      <span className="text-theme-title font-medium text-sm">{t.description}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"} {formatBRL(t.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-theme-muted text-center">
                <p className="text-sm font-mono uppercase tracking-wider">Nenhum lançamento no extrato.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
