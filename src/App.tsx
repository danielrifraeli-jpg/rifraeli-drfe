import { useState, useEffect } from "react";
import {
  FinancialState,
  UserSession,
  Transaction,
  Investment,
  FinancialGoal,
  EmergencyReserve,
} from "./types";
import { encryptData } from "./lib/crypto";

// Import Panels
import Login from "./components/Login";
import OverviewPanel from "./components/OverviewPanel";
import TransactionsPanel from "./components/TransactionsPanel";
import InvestmentsPanel from "./components/InvestmentsPanel";
import GoalsPanel from "./components/GoalsPanel";
import AIPanel from "./components/AIPanel";
import ReportPanel from "./components/ReportPanel";

// Import Icons
import {
  TrendingUp,
  CreditCard,
  Briefcase,
  Target,
  Brain,
  FileText,
  Lock,
  Menu,
  X,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<FinancialState | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isExternalAddModalOpen, setIsExternalAddModalOpen] = useState(false);

  // Auto-save function whenever data changes (non-blocking, client-encrypted)
  const saveFinancialData = async (updatedState: FinancialState) => {
    if (!session || !session.rawPassword) return;

    setSavingStatus("saving");
    try {
      // 1. Encrypt updated state client-side using user's raw password
      const encryptedBlob = await encryptData(updatedState, session.rawPassword);

      // 2. Send the encrypted blob to the server secure database
      const response = await fetch("/api/data/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session.username,
          passwordHash: session.passwordHash,
          encryptedData: encryptedBlob,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de resposta do servidor.");
      }

      setSavingStatus("saved");
    } catch (err) {
      console.error("Erro ao sincronizar dados:", err);
      setSavingStatus("error");
    }
  };

  const handleLoginSuccess = (userSession: UserSession, decryptedData: FinancialState) => {
    setSession(userSession);
    setData(decryptedData);
    setActiveTab("overview");
    setSavingStatus("saved");
  };

  const handleLogout = () => {
    // Clear all states and sensitive memory values
    setSession(null);
    setData(null);
    setActiveTab("overview");
    setSavingStatus("idle");
    setIsMobileMenuOpen(false);
  };

  // ---------------------------------------------------------------------------
  // TRANSCRIPTION & MUTATION ACTIONS (SAVES AUTOMATICALLY WITH E2EE)
  // ---------------------------------------------------------------------------

  // 1. Transactions CRUD
  const handleAddTransaction = (newT: Omit<Transaction, "id">) => {
    if (!data) return;

    const transactionId = `t-${Date.now()}`;
    const fullTransaction: Transaction = { id: transactionId, ...newT };
    const updatedTransactions = [...data.transactions, fullTransaction];

    // If marked as contributing to the emergency reserve, automatically adjust the reserve amount!
    let updatedReserve = { ...data.emergencyReserve };
    if (newT.isEmergencyReserve) {
      if (newT.type === "income") {
        updatedReserve.currentAmount += newT.amount;
      } else {
        updatedReserve.currentAmount = Math.max(updatedReserve.currentAmount - newT.amount, 0);
      }
    }

    const updatedState: FinancialState = {
      ...data,
      transactions: updatedTransactions,
      emergencyReserve: updatedReserve,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleEditTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    if (!data) return;

    const updatedTransactions = data.transactions.map((t) =>
      t.id === id ? { ...t, ...updatedFields } : t
    );

    const updatedState: FinancialState = {
      ...data,
      transactions: updatedTransactions,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!data) return;

    const updatedTransactions = data.transactions.filter((t) => t.id !== id);

    const updatedState: FinancialState = {
      ...data,
      transactions: updatedTransactions,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  // 2. Investments CRUD
  const handleAddInvestment = (newInv: Omit<Investment, "id">) => {
    if (!data) return;

    const investmentId = `i-${Date.now()}`;
    const fullInvestment: Investment = { id: investmentId, ...newInv };
    const updatedInvestments = [...data.investments, fullInvestment];

    const updatedState: FinancialState = {
      ...data,
      investments: updatedInvestments,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleEditInvestment = (id: string, updatedFields: Partial<Investment>) => {
    if (!data) return;

    const updatedInvestments = data.investments.map((i) =>
      i.id === id ? { ...i, ...updatedFields } : i
    );

    const updatedState: FinancialState = {
      ...data,
      investments: updatedInvestments,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleDeleteInvestment = (id: string) => {
    if (!data) return;

    const updatedInvestments = data.investments.filter((i) => i.id !== id);

    const updatedState: FinancialState = {
      ...data,
      investments: updatedInvestments,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  // 3. Goals CRUD
  const handleAddGoal = (newG: Omit<FinancialGoal, "id">) => {
    if (!data) return;

    const goalId = `g-${Date.now()}`;
    const fullGoal: FinancialGoal = { id: goalId, ...newG };
    const updatedGoals = [...data.goals, fullGoal];

    const updatedState: FinancialState = {
      ...data,
      goals: updatedGoals,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleEditGoal = (id: string, updatedFields: Partial<FinancialGoal>) => {
    if (!data) return;

    const updatedGoals = data.goals.map((g) =>
      g.id === id ? { ...g, ...updatedFields } : g
    );

    const updatedState: FinancialState = {
      ...data,
      goals: updatedGoals,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  const handleDeleteGoal = (id: string) => {
    if (!data) return;

    const updatedGoals = data.goals.filter((g) => g.id !== id);

    const updatedState: FinancialState = {
      ...data,
      goals: updatedGoals,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  // 4. Emergency Reserve CRUD
  const handleUpdateEmergencyReserve = (newReserve: EmergencyReserve) => {
    if (!data) return;

    const updatedState: FinancialState = {
      ...data,
      emergencyReserve: newReserve,
      lastUpdated: new Date().toISOString(),
    };

    setData(updatedState);
    saveFinancialData(updatedState);
  };

  // ---------------------------------------------------------------------------
  // INTERFACES & SHELL
  // ---------------------------------------------------------------------------

  if (!session || !data) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Links definition
  const navItems = [
    { id: "overview", name: "Visão Geral", icon: TrendingUp },
    { id: "transactions", name: "Lançamentos", icon: CreditCard },
    { id: "investments", name: "Investimentos", icon: Briefcase },
    { id: "goals", name: "Metas e Reserva", icon: Target },
    { id: "ai", name: "Milhão Advisor (IA)", icon: Brain },
    { id: "report", name: "Exportar Relatório", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col md:flex-row relative">
      
      {/* 1. SIDEBAR (Persistent on Desktop, hidden on print) */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex-shrink-0 z-20 no-print p-6">
        {/* Brand/Title */}
        <div className="mb-10">
          <h1 className="serif-heading text-2xl font-bold text-[#d4af37] tracking-tighter italic">RIFRAELI</h1>
          <p className="text-[9px] tracking-[0.2em] text-gray-500 font-semibold">PRESTIGE FINANCE</p>
        </div>

        {/* Nav list */}
        <nav className="flex-1 space-y-4">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 py-1.5 transition cursor-pointer text-left outline-none ${
                  isActive
                    ? "text-white border-l-3 border-[#d4af37] pl-3 -ml-6 font-semibold"
                    : "hover:text-white text-gray-500 pl-3 font-medium"
                }`}
              >
                <IconComp className={`h-4 w-4 ${isActive ? "text-[#d4af37]" : "text-gray-500"}`} />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Encryption metadata */}
        <div className="mt-auto pt-6 border-t border-gray-900 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Sessão Segura</span>
            </div>
            <p className="text-[11px] mt-1 text-gray-600 font-mono">RSA-4096: AES-256-GCM</p>
          </div>

          {/* Sync indicator */}
          <div className="text-[10px] font-mono">
            {savingStatus === "saving" && (
              <span className="text-amber-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> CRIPTOGRAFANDO...
              </span>
            )}
            {savingStatus === "saved" && (
              <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                ● SINCRONIZADO
              </span>
            )}
            {savingStatus === "error" && (
              <span className="text-rose-500 flex items-center gap-1 font-semibold animate-pulse">
                ● ERRO SYNC
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#111111] hover:bg-rose-950/20 border border-[#222222] hover:border-rose-900/30 text-[10px] uppercase tracking-wider font-bold py-2 px-3 rounded transition cursor-pointer text-gray-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION (Hidden during print) */}
      <header className="md:hidden flex items-center justify-between h-16 bg-[#070707] text-white px-4 border-b border-[#1a1a1a] z-30 no-print flex-shrink-0">
        <div className="flex flex-col">
          <span className="serif-heading text-lg font-bold text-[#d4af37] italic leading-none">RIFRAELI</span>
          <span className="text-[8px] tracking-[0.1em] text-gray-500 mt-1 uppercase font-semibold">PRESTIGE FINANCE</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          {savingStatus === "saving" && <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />}
          {savingStatus === "saved" && <div className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>}
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-slate-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu (Hidden during print) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 no-print" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h1 className="serif-heading text-xl font-bold text-[#d4af37] italic">RIFRAELI</h1>
              <p className="text-[8px] tracking-[0.2em] text-gray-500 uppercase font-semibold">PRESTIGE FINANCE</p>
            </div>

            <nav className="flex-1 space-y-4">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 py-1 text-left ${
                      isActive
                        ? "text-white border-l-2 border-[#d4af37] pl-3 -ml-4 font-semibold"
                        : "text-gray-500 hover:text-white pl-3"
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-gray-900 space-y-4">
              <div className="flex items-center gap-2">
                <div className="status-dot h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">Sessão Segura</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-[#111111] border border-[#222222] text-xs font-bold py-2 px-3 rounded text-gray-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Prestige Header Bar */}
        <header className="hidden md:flex h-16 border-b border-[#1a1a1a] items-center justify-between px-8 bg-[#070707] no-print flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Usuário:</span>
            <span className="text-xs text-white font-semibold font-mono">{session.username}</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-mono tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>CRIPTOGRAFIA ATIVA (E2EE)</span>
            </div>
            <button
              onClick={() => {
                setActiveTab("transactions");
                setIsExternalAddModalOpen(true);
              }}
              className="px-4 py-1.5 rounded text-xs bg-[#d4af37] text-black font-bold uppercase tracking-wider hover:bg-[#c49f27] transition cursor-pointer"
            >
              NOVO LANÇAMENTO
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col">
          {/* Dynamic header row (Hidden during print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a1a1a] pb-5 mb-6 no-print">
            <div>
              <span className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider font-mono">
                Auditoria Blindada & Gestão Prestige
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 serif-heading italic">
                <span>{navItems.find((n) => n.id === activeTab)?.name}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs bg-[#111111] text-gray-400 font-semibold py-2 px-4 rounded-xl border border-[#222222]">
              <Lock className="h-4 w-4 text-[#d4af37]" />
              <span>RSA-4096 Client Encrypted</span>
            </div>
          </div>

          {/* Dynamic mounting of Panels */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <OverviewPanel
                state={data}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenAddTransaction={() => setIsExternalAddModalOpen(true)}
              />
            )}

            {activeTab === "transactions" && (
              <TransactionsPanel
                transactions={data.transactions}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isAddModalOpen={isExternalAddModalOpen}
                onCloseAddModal={() => setIsExternalAddModalOpen(false)}
              />
            )}

            {activeTab === "investments" && (
              <InvestmentsPanel
                investments={data.investments}
                onAddInvestment={handleAddInvestment}
                onEditInvestment={handleEditInvestment}
                onDeleteInvestment={handleDeleteInvestment}
              />
            )}

            {activeTab === "goals" && (
              <GoalsPanel
                goals={data.goals}
                emergencyReserve={data.emergencyReserve}
                transactions={data.transactions}
                onAddGoal={handleAddGoal}
                onEditGoal={handleEditGoal}
                onDeleteGoal={handleDeleteGoal}
                onUpdateEmergencyReserve={handleUpdateEmergencyReserve}
              />
            )}

            {activeTab === "ai" && <AIPanel state={data} />}

            {activeTab === "report" && <ReportPanel state={data} />}
          </div>
        </main>
      </div>
    </div>
  );
}
