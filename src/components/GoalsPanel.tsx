import React, { useState } from "react";
import { FinancialGoal, EmergencyReserve, Transaction } from "../types";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Target,
  Shield,
  Clock,
  ArrowRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface GoalsPanelProps {
  goals: FinancialGoal[];
  emergencyReserve: EmergencyReserve;
  transactions: Transaction[];
  onAddGoal: (g: Omit<FinancialGoal, "id">) => void;
  onEditGoal: (id: string, g: Partial<FinancialGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateEmergencyReserve: (res: EmergencyReserve) => void;
}

export default function GoalsPanel({
  goals,
  emergencyReserve,
  transactions,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateEmergencyReserve,
}: GoalsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialGoal | null>(null);

  // Reserve form states
  const [isEditingReserve, setIsEditingReserve] = useState(false);
  const [reserveAmountInput, setReserveAmountInput] = useState(
    emergencyReserve.currentAmount.toString()
  );
  const [reserveFactorInput, setReserveFactorInput] = useState(
    emergencyReserve.monthlyExpenseFactor.toString()
  );

  // Goal form states
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Calculate average monthly expense for calculations
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseMonths = Array.from(
    new Set(transactions.filter((t) => t.type === "expense").map((t) => t.date.substring(0, 7)))
  );
  const activeMonthsCount = Math.max(expenseMonths.length, 1);
  const avgMonthlyExpense = totalExpenses / activeMonthsCount;

  // Save emergency reserve settings
  const handleSaveReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(reserveAmountInput);
    const finalFactor = parseInt(reserveFactorInput);

    if (isNaN(finalAmount) || finalAmount < 0) {
      alert("Por favor, insira um saldo válido para a reserva.");
      return;
    }
    if (isNaN(finalFactor) || finalFactor <= 0) {
      alert("Por favor, selecione um fator de cobertura válido.");
      return;
    }

    onUpdateEmergencyReserve({
      currentAmount: finalAmount,
      monthlyExpenseFactor: finalFactor,
    });
    setIsEditingReserve(false);
  };

  // Handle goal saving
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTarget = parseFloat(goalTarget);
    const finalCurrent = parseFloat(goalCurrent);

    if (!goalName.trim()) {
      alert("Por favor, preencha o nome da meta.");
      return;
    }
    if (isNaN(finalTarget) || finalTarget <= 0) {
      alert("Por favor, insira um valor de meta válido.");
      return;
    }
    if (isNaN(finalCurrent) || finalCurrent < 0) {
      alert("Por favor, insira um valor acumulado válido.");
      return;
    }
    if (!goalDeadline) {
      alert("Por favor, selecione um prazo limite.");
      return;
    }

    const payload = {
      name: goalName.trim(),
      targetAmount: finalTarget,
      currentAmount: finalCurrent,
      deadline: goalDeadline,
    };

    if (editingItem) {
      onEditGoal(editingItem.id, payload);
      setEditingItem(null);
    } else {
      onAddGoal(payload);
      setShowAddForm(false);
    }
  };

  const openAddModal = () => {
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    // Default deadline: next year same month
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setGoalDeadline(d.toISOString().substring(0, 7)); // YYYY-MM
    setShowAddForm(true);
  };

  const handleEditClick = (g: FinancialGoal) => {
    setEditingItem(g);
    setGoalName(g.name);
    setGoalTarget(g.targetAmount.toString());
    setGoalCurrent(g.currentAmount.toString());
    setGoalDeadline(g.deadline);
  };

  // Helper to calculate required monthly savings
  const calculatePlan = (goal: FinancialGoal) => {
    const target = goal.targetAmount;
    const current = goal.currentAmount;
    const remaining = Math.max(target - current, 0);

    if (remaining <= 0) {
      return { remaining, months: 0, monthlyNeeded: 0, isAchieved: true };
    }

    // Calculate months difference
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    const [deadlineYear, deadlineMonth] = goal.deadline.split("-").map(Number);
    // deadlineMonth is 1-12
    const totalMonthsDiff = (deadlineYear - currentYear) * 12 + (deadlineMonth - 1 - currentMonth);
    const monthsRemaining = Math.max(totalMonthsDiff, 0);

    const monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

    return {
      remaining,
      months: monthsRemaining,
      monthlyNeeded,
      isAchieved: false,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Emergency Reserve Config Card */}
      <div id="section-reserva-config" className="bg-theme-card p-6 rounded border border-theme-card-border">
        <div className="flex items-center gap-3 border-b border-theme-card-border pb-4 mb-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-theme-bg text-[#d4af37] rounded border border-theme-card-border">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-theme-title text-base uppercase tracking-wider font-mono">Fundo de Segurança</h3>
              <p className="text-xs text-theme-muted font-mono">Cobertura e liquidez para contingências</p>
            </div>
          </div>
          {!isEditingReserve && (
            <button
              onClick={() => {
                setReserveAmountInput(emergencyReserve.currentAmount.toString());
                setReserveFactorInput(emergencyReserve.monthlyExpenseFactor.toString());
                setIsEditingReserve(true);
              }}
              className="text-xs font-bold text-[#d4af37] hover:text-[#c49f27] bg-[#1a1505] hover:bg-[#251e06] border border-[#d4af37]/20 py-1.5 px-3 rounded transition cursor-pointer uppercase tracking-wider font-mono"
            >
              AJUSTAR SALDO
            </button>
          )}
        </div>

        {isEditingReserve ? (
          <form onSubmit={handleSaveReserve} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-theme-input border border-theme-card-border rounded animate-fade-in">
            <div>
              <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                Valor Acumulado no Fundo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={reserveAmountInput}
                onChange={(e) => setReserveAmountInput(e.target.value)}
                className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2 px-3 outline-none text-theme-text font-mono font-medium text-sm transition"
              />
            </div>

            <div>
              <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                Meses de Cobertura Desejados
              </label>
              <select
                value={reserveFactorInput}
                onChange={(e) => setReserveFactorInput(e.target.value)}
                className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2 px-3 outline-none text-theme-text font-semibold text-sm transition cursor-pointer font-mono"
              >
                <option value="3">3 Meses (Autônomo estável / CLT)</option>
                <option value="6">6 Meses (Autônomo Geral / Médio)</option>
                <option value="12">12 Meses (Conservador / Empreendedor)</option>
              </select>
            </div>

            <div className="flex items-end gap-2.5">
              <button
                type="submit"
                className="flex-1 bg-[#d4af37] hover:bg-[#c49f27] text-black font-bold py-2 px-3 rounded text-xs cursor-pointer uppercase tracking-wider transition"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingReserve(false)}
                className="bg-theme-bg hover:bg-theme-hover border border-theme-card-border text-theme-text font-semibold py-2 px-3 rounded text-xs cursor-pointer uppercase tracking-wider transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-theme-input p-5 rounded border border-theme-card-border">
            <div>
              <span className="text-[10px] text-theme-muted block mb-0.5 uppercase tracking-wider font-mono">Disponível em Caixa</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatBRL(emergencyReserve.currentAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-muted block mb-0.5 uppercase tracking-wider font-mono">Cobertura Almejada</span>
              <span className="text-base font-bold text-theme-title">
                {emergencyReserve.monthlyExpenseFactor} Meses de Custo de Vida
              </span>
            </div>
            <div>
              <span className="text-[10px] text-theme-muted block mb-0.5 uppercase tracking-wider font-mono">Meta de Reserva Calculada</span>
              <span className="text-base font-bold font-mono text-[#d4af37]">
                {formatBRL(avgMonthlyExpense * emergencyReserve.monthlyExpenseFactor)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Financial Goals list */}
      <div className="bg-theme-card p-6 rounded border border-theme-card-border">
        <div className="flex items-center justify-between border-b border-theme-card-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-theme-bg text-[#d4af37] rounded border border-theme-card-border">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-theme-title text-base uppercase tracking-wider font-mono">Metas Patrimoniais</h3>
              <p className="text-xs text-theme-muted font-mono">Planejamento e progresso de médio a longo prazo</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold py-2 px-3.5 rounded flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#d4af37]/10 transition uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            <span>LANÇAR META</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="space-y-6">
          {goals.length > 0 ? (
            goals.map((g) => {
              const { remaining, months, monthlyNeeded, isAchieved } = calculatePlan(g);
              const progressPercent = (g.currentAmount / g.targetAmount) * 100;

              return (
                <div
                  key={g.id}
                  className="p-5 border border-[#222222] hover:border-[#d4af37]/30 rounded transition bg-[#0c0c0c] space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <span>{g.name}</span>
                        {isAchieved && (
                          <span className="bg-[#1a2c15] text-emerald-400 border border-emerald-900/30 text-[10px] font-bold py-0.5 px-2 rounded uppercase tracking-wider font-mono">
                            Alcançada 🎉
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-gray-600" />
                        <span>
                          Prazo:{" "}
                          <strong className="text-gray-400 font-mono">
                            {g.deadline.split("-").reverse().join("/")}
                          </strong>{" "}
                          ({months} mês/meses restantes)
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(g)}
                        className="p-1.5 text-theme-muted hover:text-[#d4af37] hover:bg-theme-bg rounded transition cursor-pointer"
                        title="Editar meta"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Deseja mesmo excluir esta meta de poupança?")) {
                            onDeleteGoal(g.id);
                          }
                        }}
                        className="p-1.5 text-theme-muted hover:text-rose-400 hover:bg-rose-950/20 rounded transition cursor-pointer"
                        title="Excluir meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress visualization */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium font-mono">
                      <span className="text-theme-muted">
                        Acumulado: <strong className="text-theme-title font-bold font-mono">{formatBRL(g.currentAmount)}</strong> de {formatBRL(g.targetAmount)}
                      </span>
                      <span className="text-[#d4af37] font-bold font-mono">
                        {progressPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-theme-bg border border-theme-card-border rounded overflow-hidden">
                      <div
                        className="h-full bg-[#d4af37] rounded transition-all duration-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly target saving blueprint */}
                  {!isAchieved && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-input p-4 rounded border border-theme-card-border text-xs mt-2">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="h-4.5 w-4.5 text-[#d4af37] flex-shrink-0" />
                        <div>
                          <span className="text-theme-muted block uppercase tracking-wider text-[9px] font-mono">Falta Poupar:</span>
                          <strong className="text-theme-title font-bold font-mono">
                            {formatBRL(remaining)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-theme-muted hidden sm:block" />
                        <div className="bg-theme-card border border-theme-card-border py-1.5 px-3 rounded">
                          <span className="text-theme-muted block uppercase tracking-wider text-[9px] font-mono">Poupança Mensal Sugerida:</span>
                          <strong className="text-emerald-400 font-bold font-mono text-sm block sm:inline">
                            {formatBRL(monthlyNeeded)} <span className="text-[10px] font-normal text-theme-muted">/mês</span>
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-theme-muted font-mono uppercase tracking-wider text-xs">
              Nenhum objetivo patrimonial cadastrado ainda. Planeje seus sonhos aqui.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Goal Modal */}
      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-theme-card border border-theme-card-border rounded shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-theme-input border-b border-theme-card-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-theme-title text-base uppercase tracking-wider serif-heading">
                {editingItem ? "Editar Meta Financeira" : "Criar Nova Meta Financeira"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-theme-muted hover:text-theme-title rounded transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Nome do Objetivo / Meta
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Ex: Comprar Apartamento, Viagem Europa, Aposentadoria..."
                  className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-medium text-sm transition font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Amount */}
                <div>
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Valor Alvo / Final (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-mono font-medium text-sm transition"
                  />
                </div>

                {/* Current Amount */}
                <div>
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Valor já Poupado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-mono font-medium text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Prazo Limite (Mês/Ano)
                </label>
                <input
                  type="month"
                  required
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-mono font-medium text-sm transition font-mono"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-theme-card-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                  }}
                  className="bg-theme-bg hover:bg-theme-hover border border-theme-card-border text-theme-text text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  {editingItem ? "Salvar" : "Adicionar Meta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
