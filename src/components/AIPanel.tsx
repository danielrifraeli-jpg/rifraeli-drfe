import React, { useState } from "react";
import { FinancialState } from "../types";
import { Sparkles, Brain, RefreshCw, Send, HelpCircle, CheckCircle } from "lucide-react";

interface AIPanelProps {
  state: FinancialState;
}

export default function AIPanel({ state }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>("");
  const [error, setError] = useState("");

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Compile statistics to send to Gemini
  const compileSummaryData = () => {
    const { transactions, investments, goals, emergencyReserve } = state;

    const totalIncomes = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncomes - totalExpenses;
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const emergencyAmount = emergencyReserve.currentAmount;

    // Avg monthly expenses
    const expenseMonths = Array.from(
      new Set(transactions.filter((t) => t.type === "expense").map((t) => t.date.substring(0, 7)))
    );
    const activeMonthsCount = Math.max(expenseMonths.length, 1);
    const avgMonthlyExpense = totalExpenses / activeMonthsCount;
    const targetReserve = avgMonthlyExpense * emergencyReserve.monthlyExpenseFactor;
    const reserveProgress = targetReserve > 0 ? (emergencyAmount / targetReserve) * 100 : 0;

    // Expenses by category
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc: { [key: string]: number }, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Goals formatted
    const goalsList = goals.map((g) => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      progress: (g.currentAmount / g.targetAmount) * 100,
      deadline: g.deadline,
    }));

    return {
      netBalance,
      totalIncomes,
      totalExpenses,
      totalInvested,
      emergencyReserve: emergencyAmount,
      emergencyReserveTarget: targetReserve,
      emergencyReserveProgress: reserveProgress,
      expensesByCategory,
      investmentCount: investments.length,
      goals: goalsList,
    };
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    setError("");
    setAdvice("");

    try {
      const summary = compileSummaryData();

      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível obter resposta da IA.");
      }

      setAdvice(data.advice);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão ao servidor de Inteligência Artificial.");
    } finally {
      setLoading(false);
    }
  };

  // Safe and clean custom Markdown compiler to render Gemini response styled in Tailwind
  const renderFormattedAdvice = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headers like ### or ##
      if (trimmed.startsWith("###")) {
        return (
          <h5 key={idx} className="text-sm font-bold text-white mt-5 mb-2.5 flex items-center gap-1.5 border-b border-[#222222] pb-1 font-mono uppercase tracking-wider">
            <CheckCircle className="h-4 w-4 text-[#d4af37]" />
            {trimmed.replace(/^###\s*/, "")}
          </h5>
        );
      }
      if (trimmed.startsWith("##") || trimmed.startsWith("#")) {
        return (
          <h4 key={idx} className="text-base font-extrabold text-[#d4af37] mt-7 mb-3.5 flex items-center gap-2 border-b border-[#222222] pb-1.5 font-mono uppercase tracking-widest">
            <span className="w-1.5 h-4 bg-[#d4af37] rounded" />
            {trimmed.replace(/^##?\s*/, "")}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // Handle bolding inside bullets like "**Texto**: rest"
        const content = trimmed.replace(/^[-*]\s*/, "");
        return (
          <li key={idx} className="text-gray-300 text-sm ml-5 list-disc mb-1.5 pl-1 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }

      // Standard paragraphs
      if (trimmed === "") {
        return <div key={idx} className="h-3" />;
      }

      return (
        <p key={idx} className="text-gray-300 text-sm leading-relaxed mb-2.5">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Small helper to parse markdown bold tags `**word**`
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      // Every odd index is a bold group
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-[#d4af37]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Advisor Welcome Panel */}
      <div className="bg-[#111111] text-white p-6 rounded border border-[#222222] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 py-1 px-2.5 rounded text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Diagnóstico Ativo</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight serif-heading uppercase tracking-wider">Milhão Advisor 🧠</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-sans">
              Consolide todos os seus dados de despesas, investimentos e metas financeiras. Nosso assistente inteligente fará uma varredura completa da sua saúde financeira para traçar o melhor plano estratégico rumo ao seu milhão.
            </p>
          </div>

          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="bg-[#d4af37] hover:bg-[#c49f27] disabled:bg-[#d4af37]/30 text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded flex items-center justify-center gap-2.5 transition cursor-pointer self-start md:self-auto flex-shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                <span>Analisando Números...</span>
              </>
            ) : (
              <>
                <Brain className="h-4.5 w-4.5" />
                <span>GERAR DIAGNÓSTICO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advice Display Area */}
      {loading && (
        <div className="bg-[#111111] p-8 rounded border border-[#222222] flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-[#222222] border-t-[#d4af37] rounded-full animate-spin" />
            <Brain className="h-6 w-6 text-[#d4af37] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-sm font-mono uppercase tracking-wider">Consultando Inteligência...</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal font-mono">
              Processando fluxo de caixa, fundo de segurança e alocação de ativos...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-[#2a1215] border border-rose-900/30 text-rose-200 p-5 rounded text-sm flex items-start gap-3 font-mono">
          <span className="text-xl">⚠️</span>
          <div>
            <span className="font-bold block mb-1 uppercase tracking-wider text-xs">Erro de Conexão</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {advice && !loading && (
        <div className="bg-[#111111] p-6 md:p-8 rounded border border-[#222222] space-y-1">
          <div className="flex items-center justify-between border-b border-[#222222] pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-[#d4af37]" />
              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Relatório de Diagnóstico Financeiro</h4>
            </div>
            <button
              onClick={handleGetAdvice}
              className="p-2 hover:bg-[#1c1c1c] border border-[#222222] text-gray-400 rounded transition cursor-pointer"
              title="Gerar outro diagnóstico"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="prose prose-invert max-w-none">
            {renderFormattedAdvice(advice)}
          </div>
        </div>
      )}

      {/* Placeholder before asking */}
      {!advice && !loading && !error && (
        <div className="bg-[#111111] p-12 rounded border border-[#222222] flex flex-col items-center justify-center text-center max-w-xl mx-auto py-16">
          <div className="p-4 bg-[#0a0a0a] text-gray-500 rounded border border-[#222222] mb-4">
            <HelpCircle className="h-10 w-10 text-gray-600" />
          </div>
          <h4 className="font-bold text-white text-sm font-mono uppercase tracking-wider">Nenhum Diagnóstico Solicitado</h4>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed max-w-xs font-sans">
            Clique no botão acima para submeter seu orçamento ao Milhão Advisor de IA e obter recomendações detalhadas baseadas nos seus números.
          </p>
        </div>
      )}
    </div>
  );
}
