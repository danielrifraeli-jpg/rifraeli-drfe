import React, { useState } from "react";
import { Transaction } from "../types";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react";

interface TransactionsPanelProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, "id">) => void;
  onEditTransaction: (id: string, t: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

const CATEGORIES = [
  "Salário",
  "Dividendos",
  "Freelance",
  "Moradia",
  "Alimentação",
  "Lazer",
  "Saúde",
  "Transporte",
  "Educação",
  "Pessoal",
  "Outros",
];

export default function TransactionsPanel({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  isAddModalOpen = false,
  onCloseAddModal,
}: TransactionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // State for modals
  const [showAddForm, setShowAddForm] = useState(isAddModalOpen);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);

  // Form states
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formCategory, setFormCategory] = useState("Alimentação");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formIsEmergency, setFormIsEmergency] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Extract all available years dynamically for the filter
  const availableYears = Array.from(
    new Set(transactions.map((t) => t.date.substring(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Day options: "all" + "01" through "31"
  const dayOptions = ["all", ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"))];

  // Month options with Portuguese labels
  const monthOptions = [
    { value: "all", label: "Todos os Meses" },
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  // Handle opening Add Modal
  const openAddModal = () => {
    setFormType("expense");
    setFormCategory("Alimentação");
    setFormCustomCategory("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormIsEmergency(false);
    setShowAddForm(true);
  };

  // Handle editing click
  const handleEditClick = (item: Transaction) => {
    setEditingItem(item);
    setFormType(item.type);
    if (CATEGORIES.includes(item.category)) {
      setFormCategory(item.category);
      setFormCustomCategory("");
    } else {
      setFormCategory("Outros");
      setFormCustomCategory(item.category);
    }
    setFormAmount(item.amount.toString());
    setFormDate(item.date);
    setFormDescription(item.description);
    setFormIsEmergency(!!item.isEmergencyReserve);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(formAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }

    const finalCategory =
      formCategory === "Outros" && formCustomCategory.trim()
        ? formCustomCategory.trim()
        : formCategory;

    const payload = {
      type: formType,
      category: finalCategory,
      amount: finalAmount,
      date: formDate,
      description: formDescription.trim() || `${formType === "income" ? "Entrada" : "Saída"} - ${finalCategory}`,
      isEmergencyReserve: formIsEmergency,
    };

    if (editingItem) {
      onEditTransaction(editingItem.id, payload);
      setEditingItem(null);
    } else {
      onAddTransaction(payload);
      setShowAddForm(false);
      if (onCloseAddModal) onCloseAddModal();
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    const tYear = t.date.substring(0, 4);
    const tMonth = t.date.substring(5, 7);
    const tDay = t.date.substring(8, 10);

    const matchesDay = dayFilter === "all" || tDay === dayFilter;
    const matchesMonth = monthFilter === "all" || tMonth === monthFilter;
    const matchesYear = yearFilter === "all" || tYear === yearFilter;

    return matchesSearch && matchesType && matchesCategory && matchesDay && matchesMonth && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-theme-card p-5 rounded border border-theme-card-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <input
            type="text"
            placeholder="Pesquisar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-theme-input border border-theme-card-border focus:border-[#d4af37] outline-none rounded text-sm text-theme-title placeholder:text-theme-muted/50 font-medium transition font-mono animate-fade-in"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Type */}
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="bg-theme-input border border-theme-card-border text-theme-text text-xs font-semibold py-2.5 px-3.5 rounded outline-none focus:border-[#d4af37] transition cursor-pointer font-mono"
          >
            <option value="all">Todos os Tipos</option>
            <option value="income">Entradas (+)</option>
            <option value="expense">Saídas (-)</option>
          </select>

          {/* Filter Day */}
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="bg-theme-input border border-theme-card-border text-theme-text text-xs font-semibold py-2.5 px-3.5 rounded outline-none focus:border-[#d4af37] transition cursor-pointer font-mono"
          >
            <option value="all">Todos os Dias</option>
            {dayOptions.filter(d => d !== "all").map((d) => (
              <option key={d} value={d}>
                Dia {d}
              </option>
            ))}
          </select>

          {/* Filter Month */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-theme-input border border-theme-card-border text-theme-text text-xs font-semibold py-2.5 px-3.5 rounded outline-none focus:border-[#d4af37] transition cursor-pointer font-mono"
          >
            {monthOptions.map((mo) => (
              <option key={mo.value} value={mo.value}>
                {mo.label}
              </option>
            ))}
          </select>

          {/* Filter Year */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-theme-input border border-theme-card-border text-theme-text text-xs font-semibold py-2.5 px-3.5 rounded outline-none focus:border-[#d4af37] transition cursor-pointer font-mono"
          >
            <option value="all">Todos os Anos</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Filter Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-theme-input border border-theme-card-border text-theme-text text-xs font-semibold py-2.5 px-3.5 rounded outline-none focus:border-[#d4af37] transition cursor-pointer font-mono"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={openAddModal}
            className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold py-2.5 px-4 rounded flex items-center gap-2 cursor-pointer transition uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            <span>LANÇAR</span>
          </button>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-theme-card rounded border border-theme-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-theme-table-header border-b border-theme-card-border text-theme-muted text-[10px] font-bold uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6">Descrição</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6 text-right">Valor</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-card-border text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-theme-hover transition">
                      <td className="py-4 px-6 font-mono text-xs text-theme-muted">
                        {t.date.split("-").reverse().join("/")}
                      </td>
                      <td className="py-4 px-6 font-medium text-theme-title">
                        <div className="flex flex-col">
                          <span>{t.description}</span>
                          {t.isEmergencyReserve && (
                            <span className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1 font-mono">
                              <AlertCircle className="h-3 w-3" /> Fundo de Emergência
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-theme-bg text-theme-text border border-theme-card-border text-xs font-mono px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            t.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {t.type === "income" ? (
                            <>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>Entrada</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3.5 w-3.5" />
                              <span>Saída</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-bold font-mono ${
                          t.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"} {formatBRL(t.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-1.5 text-theme-muted hover:text-[#d4af37] hover:bg-theme-hover rounded transition cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tem certeza que deseja apagar este lançamento?")) {
                                onDeleteTransaction(t.id);
                              }
                            }}
                            className="p-1.5 text-theme-muted hover:text-rose-400 hover:bg-rose-950/20 rounded transition cursor-pointer"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-theme-muted font-mono uppercase tracking-wider text-xs">
                    Nenhum lançamento registrado para estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-theme-card border border-theme-card-border rounded shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300">
            <div className="bg-theme-sidebar border-b border-theme-card-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-theme-title text-base uppercase tracking-wider serif-heading">
                {editingItem ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="p-1.5 text-theme-muted hover:text-theme-title rounded transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-theme-bg p-1 border border-theme-card-border rounded">
                <button
                  type="button"
                  onClick={() => setFormType("expense")}
                  className={`py-2 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer outline-none ${
                    formType === "expense"
                      ? "bg-theme-card text-rose-400 border border-rose-900/30 shadow-sm"
                      : "text-theme-muted hover:text-theme-title"
                  }`}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Saída (Despesa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("income")}
                  className={`py-2 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer outline-none ${
                    formType === "income"
                      ? "bg-theme-card text-emerald-400 border border-emerald-900/30 shadow-sm"
                      : "text-theme-muted hover:text-theme-title"
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Entrada (Receita)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-medium text-sm focus:ring-0 transition cursor-pointer font-mono"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-mono font-medium text-sm transition"
                  />
                </div>
              </div>

              {/* Custom Category Input (if Outros is selected) */}
              {formCategory === "Outros" && (
                <div className="animate-fade-in">
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Nome da Categoria Personalizada
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="Ex: Presentes, Academia, Pet, etc."
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-medium text-sm transition font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Data do Lançamento
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-mono font-medium text-sm transition"
                  />
                </div>

                {/* Link to Emergency Reserve */}
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-theme-input border border-theme-card-border hover:border-[#d4af37]/40 w-full py-2.5 px-3.5 rounded transition">
                    <input
                      type="checkbox"
                      checked={formIsEmergency}
                      onChange={(e) => setFormIsEmergency(e.target.checked)}
                      className="rounded border-theme-card-border text-[#d4af37] focus:ring-0 focus:ring-offset-0 bg-theme-input h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-theme-text font-bold text-xs">Reserva de Segurança</span>
                      <span className="text-[9px] text-theme-muted font-mono">Vincular a este fundo</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Descrição / Detalhes
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Uber para o aeroporto, Dividendos recebidos, etc."
                  className="w-full bg-theme-input border border-theme-card-border focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-theme-text font-medium text-sm transition"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-theme-card-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="bg-theme-bg hover:bg-theme-hover border border-theme-card-border text-theme-text text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  {editingItem ? "Salvar" : "Adicionar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
