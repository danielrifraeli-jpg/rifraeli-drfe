import React, { useState } from "react";
import { FinancialState, Transaction } from "../types";
import { Printer, Calendar, FileText, CheckCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ReportPanelProps {
  state: FinancialState;
}

export default function ReportPanel({ state }: ReportPanelProps) {
  const { transactions, investments, emergencyReserve } = state;

  // Extract all available months from transactions
  const availableMonths = Array.from(
    new Set(transactions.map((t) => t.date.substring(0, 7)))
  ).sort().reverse();

  // Default to the latest month or today's month
  const todayMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths.length > 0 ? availableMonths[0] : todayMonth
  );

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter(
    (t) => t.date.substring(0, 7) === selectedMonth
  );

  const incomes = monthTransactions.filter((t) => t.type === "income");
  const expenses = monthTransactions.filter((t) => t.type === "expense");

  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncomes - totalExpenses;

  // Expenses grouped by category in the selected month
  const expensesByCategory = expenses.reduce((acc: { [key: string]: number }, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Current global asset summary
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalWealth = totalInvested + emergencyReserve.currentAmount + netSavings;

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 15);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Selector and Action card (Hidden during print) */}
      <div className="bg-[#111111] p-5 rounded border border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1a1a1a] text-[#d4af37] rounded border border-[#222222]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base uppercase tracking-wider font-mono">Relatórios Consolidados</h3>
            <p className="text-xs text-gray-500 font-mono">Consolidação e exportação de relatórios mensais</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#0a0a0a] border border-[#222222] text-white text-xs font-semibold py-2.5 px-4 rounded outline-none focus:border-[#d4af37] cursor-pointer font-mono"
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))
            ) : (
              <option value={todayMonth}>{getMonthName(todayMonth)}</option>
            )}
          </select>

          <button
            onClick={handlePrint}
            className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold py-2.5 px-4 rounded flex items-center gap-2 cursor-pointer transition uppercase tracking-wider font-mono"
          >
            <Printer className="h-4 w-4" />
            <span>EXPORTAR PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="bg-[#111111] p-6 md:p-10 rounded border border-[#222222] shadow-xl print-full print-card">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] pb-6 mb-6">
          <div>
            <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest font-mono">
              Relatório de Auditoria Pessoal
            </span>
            <h1 className="text-2xl font-black text-white mt-1 uppercase serif-heading tracking-wider">
              Consolidado Mensal
            </h1>
            <p className="text-xs text-gray-500 font-medium font-mono mt-0.5">
              Referência: <span className="font-bold text-[#d4af37] capitalize font-mono">{getMonthName(selectedMonth)}</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-left sm:text-right">
            <span className="text-lg font-black text-white font-mono uppercase tracking-widest">RIFRAELI S.A.</span>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center sm:justify-end gap-1 font-semibold mt-0.5">
              <CheckCircle className="h-3 w-3" /> Criptografia Ponta a Ponta Ativa
            </p>
          </div>
        </div>

        {/* 1. Monthly Financial Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Incomes */}
          <div className="border border-[#222222] p-4.5 rounded bg-[#0a0a0a]">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1 font-mono">
              Ingressos de Capital (+)
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatBRL(totalIncomes)}
            </span>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">{incomes.length} lançamentos ativos</p>
          </div>

          {/* Total Expenses */}
          <div className="border border-[#222222] p-4.5 rounded bg-[#0a0a0a]">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1 font-mono">
              Saídas de Caixa (-)
            </span>
            <span className="text-xl font-bold font-mono text-rose-400">
              {formatBRL(totalExpenses)}
            </span>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">{expenses.length} lançamentos ativos</p>
          </div>

          {/* Net Balance */}
          <div className={`border p-4.5 rounded bg-[#0a0a0a] ${netSavings >= 0 ? "border-emerald-900/30" : "border-rose-900/30"}`}>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1 font-mono">
              Saldo Líquido Periódico
            </span>
            <span className={`text-xl font-bold font-mono ${netSavings >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netSavings >= 0 ? "+" : ""} {formatBRL(netSavings)}
            </span>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">Aproveitamento: {totalIncomes > 0 ? ((netSavings / totalIncomes) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        {/* 2. Categorical Distribution */}
        <div className="mb-8 page-break-inside-avoid">
          <h3 className="font-extrabold text-sm uppercase text-white tracking-wider mb-4 border-b border-[#222222] pb-1.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-3 bg-[#d4af37] rounded-sm" />
            Gastos por Categoria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3.5">
              {Object.keys(expensesByCategory).length > 0 ? (
                Object.keys(expensesByCategory).map((cat) => {
                  const val = expensesByCategory[cat];
                  const pct = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-300 font-mono">
                        <span className="font-semibold">{cat}</span>
                        <span className="font-bold text-[#d4af37]">
                          {formatBRL(val)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1c1c1c] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#d4af37] rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 py-4 font-mono uppercase tracking-wider">Nenhuma despesa registrada neste período.</p>
              )}
            </div>

            <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded text-xs space-y-2.5 flex flex-col justify-center">
              <span className="font-bold text-[#d4af37] text-[10px] uppercase tracking-wider block mb-1 font-mono">
                Auditoria de Alocação de Capital
              </span>
              <p className="text-gray-400 leading-relaxed font-sans">
                Neste período de <strong className="text-white capitalize">{getMonthName(selectedMonth)}</strong>, você obteve um superávit de <strong className="text-emerald-400 font-bold font-mono">{formatBRL(netSavings)}</strong>, o que equivale a um aproveitamento orçamentário de <strong className="text-white font-bold">{totalIncomes > 0 ? ((netSavings / totalIncomes) * 100).toFixed(1) : 0}%</strong> de suas receitas brutas acumuladas.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Detailed Transaction Logs */}
        <div className="mb-8 page-break-inside-avoid">
          <h3 className="font-extrabold text-sm uppercase text-white tracking-wider mb-4 border-b border-[#222222] pb-1.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-3 bg-[#d4af37] rounded-sm" />
            Detalhamento de Fluxo de Caixa
          </h3>
          <div className="border border-[#222222] rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0c0c0c] border-b border-[#222222] text-gray-400 font-mono font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {monthTransactions.length > 0 ? (
                  monthTransactions
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-[#161616] transition">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500">
                          {t.date.split("-").reverse().join("/")}
                        </td>
                        <td className="py-2.5 px-4 text-white font-semibold">{t.description}</td>
                        <td className="py-2.5 px-4 text-gray-400">{t.category}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold font-mono ${
                            t.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"} {formatBRL(t.amount)}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500 font-mono uppercase tracking-wider">
                      Nenhuma transação registrada neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Document Footer / Legal */}
        <div className="border-t border-[#222222] pt-5 mt-10 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-gray-500 font-mono">
          <span>Emitido digitalmente via RIFRAELI S.A. • danielrifraeli@gmail.com</span>
          <span className="mt-1 sm:mt-0 font-bold text-[#d4af37]">
            Criptografia de Ponta a Ponta Ativa • Segurança Máxima Garantida
          </span>
        </div>
      </div>
    </div>
  );
}
