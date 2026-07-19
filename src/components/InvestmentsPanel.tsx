import React, { useState } from "react";
import { Investment } from "../types";
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Briefcase,
  PieChart as PieIcon,
  Calendar,
  Percent,
} from "lucide-react";

interface InvestmentsPanelProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, "id">) => void;
  onEditInvestment: (id: string, inv: Partial<Investment>) => void;
  onDeleteInvestment: (id: string) => void;
}

const INVESTMENT_TYPES = ["Renda Fixa", "Ações", "FIIs", "Cripto", "Exterior", "Outros"];

export default function InvestmentsPanel({
  investments,
  onAddInvestment,
  onEditInvestment,
  onDeleteInvestment,
}: InvestmentsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);

  // Form fields state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<any>("Renda Fixa");
  const [formAmount, setFormAmount] = useState("");
  const [formYieldRate, setFormYieldRate] = useState("");
  const [formPurchaseDate, setFormPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Calculations
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);

  // Weighted average yield rate
  const weightedYield =
    totalInvested > 0
      ? investments.reduce((sum, i) => sum + i.amount * i.yieldRate, 0) / totalInvested
      : 0;

  const openAddModal = () => {
    setFormName("");
    setFormType("Renda Fixa");
    setFormAmount("");
    setFormYieldRate("");
    setFormPurchaseDate(new Date().toISOString().split("T")[0]);
    setShowAddForm(true);
  };

  const handleEditClick = (item: Investment) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormAmount(item.amount.toString());
    setFormYieldRate(item.yieldRate.toString());
    setFormPurchaseDate(item.purchaseDate);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(formAmount);
    const finalYield = parseFloat(formYieldRate);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert("Por favor, insira um valor investido válido.");
      return;
    }
    if (isNaN(finalYield) || finalYield < 0) {
      alert("Por favor, insira uma rentabilidade estimada válida.");
      return;
    }

    const payload = {
      name: formName.trim(),
      type: formType,
      amount: finalAmount,
      yieldRate: finalYield,
      purchaseDate: formPurchaseDate,
    };

    if (editingItem) {
      onEditInvestment(editingItem.id, payload);
      setEditingItem(null);
    } else {
      onAddInvestment(payload);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Investments Header with Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invested */}
        <div className="bg-[#111111] p-5 rounded border border-[#222222] flex items-center gap-4">
          <div className="p-3.5 bg-[#1a1a1a] text-[#d4af37] rounded border border-[#222222]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider font-mono">Total Custodiado</span>
            <span className="text-xl font-bold font-mono text-white">{formatBRL(totalInvested)}</span>
          </div>
        </div>

        {/* Weighted average yield */}
        <div className="bg-[#111111] p-5 rounded border border-[#222222] flex items-center gap-4">
          <div className="p-3.5 bg-[#1a1a1a] text-[#d4af37] rounded border border-[#222222]">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider font-mono">Rentabilidade Ponderada</span>
            <span className="text-xl font-bold font-mono text-white">{weightedYield.toFixed(2)}% <span className="text-xs font-normal text-gray-500 font-mono">a.a.</span></span>
          </div>
        </div>

        {/* Add asset shortcut */}
        <div className="bg-[#1a1505] hover:bg-[#251e06] p-5 rounded border border-[#d4af37]/30 flex items-center justify-between text-white cursor-pointer transition" onClick={openAddModal}>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#d4af37]/10 text-[#d4af37] rounded border border-[#d4af37]/20">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#d4af37]/60 block font-bold uppercase tracking-wider font-mono">Adicionar Novo</span>
              <span className="text-base font-bold text-[#d4af37] uppercase tracking-wider">CADASTRAR ATIVO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation visualizer & list */}
      <div className="bg-[#111111] rounded border border-[#222222] overflow-hidden">
        <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-[#0a0a0a]">
          <h4 className="font-semibold text-white text-sm uppercase tracking-wider font-mono">Minha Carteira de Ativos</h4>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{investments.length} Ativos Ativos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-[#222222] text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Ativo</th>
                <th className="py-4 px-6">Tipo / Classe</th>
                <th className="py-4 px-6">Data de Compra</th>
                <th className="py-4 px-6 text-right">Rentabilidade Est.</th>
                <th className="py-4 px-6 text-right">Valor Atual</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-sm">
              {investments.length > 0 ? (
                investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#161616] transition">
                    <td className="py-4 px-6 font-bold text-white font-mono">{inv.name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-[#1f1f1f] text-gray-300 border border-[#333333] text-xs font-mono px-2 py-0.5 rounded">
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-mono text-xs">
                      {inv.purchaseDate.split("-").reverse().join("/")}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold font-mono text-emerald-400">
                      {inv.yieldRate.toFixed(1)}% a.a.
                    </td>
                    <td className="py-4 px-6 text-right font-bold font-mono text-[#d4af37]">
                      {formatBRL(inv.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(inv)}
                          className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-[#1c1c1c] rounded transition cursor-pointer"
                          title="Editar ativo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Tem certeza que deseja apagar este investimento de sua carteira?")) {
                              onDeleteInvestment(inv.id);
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition cursor-pointer"
                          title="Excluir ativo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-mono uppercase tracking-wider text-xs">
                    Nenhum investimento registrado na carteira.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Investment Form Modal */}
      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#111111] border border-[#222222] rounded shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#0a0a0a] border-b border-[#222222] px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-base uppercase tracking-wider serif-heading">
                {editingItem ? "Editar Ativo" : "Cadastrar Ativo na Carteira"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-gray-500 hover:text-white rounded transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Nome do Ativo / Investimento
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Tesouro Selic 2029, CDB Inter, Ações WEG..."
                  className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-white font-medium text-sm transition font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Investment Type */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Classe do Ativo
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-white font-medium text-sm transition cursor-pointer font-mono"
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Valor Atual Alocado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-white font-mono font-medium text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yield Rate */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Rentabilidade Estimada (% a.a.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formYieldRate}
                      onChange={(e) => setFormYieldRate(e.target.value)}
                      placeholder="12.5"
                      className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] rounded py-2.5 pl-3.5 pr-8 outline-none text-white font-mono font-medium text-sm transition"
                    />
                    <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Data de Aquisição
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] rounded py-2.5 px-3.5 outline-none text-white font-mono font-medium text-sm transition"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                  }}
                  className="bg-[#1c1c1c] hover:bg-[#252525] border border-[#333333] text-gray-300 text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-bold uppercase tracking-wider py-2.5 px-4.5 rounded transition cursor-pointer"
                >
                  {editingItem ? "Salvar" : "Adicionar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
