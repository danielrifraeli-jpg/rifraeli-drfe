import React, { useState } from "react";
import { sha256, decryptData, encryptData } from "../lib/crypto";
import { getSeedData } from "../lib/seed";
import { FinancialState, UserSession } from "../types";
import { Lock, Eye, EyeOff, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (session: UserSession, decryptedData: FinancialState) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("rifraeli");
  const [password, setPassword] = useState("milhao123");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Calculate the SHA-256 of the password to verify on the server
      const passwordHash = await sha256(password);

      if (isRegisterMode) {
        // Registration flow
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            passwordHash,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao registrar usuário.");
        }

        setSuccess("Conta criada com sucesso! Faça login agora.");
        setIsRegisterMode(false);
        setLoading(false);
      } else {
        // Login flow
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            passwordHash,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Usuário ou senha incorretos.");
        }

        const session: UserSession = {
          username: data.username,
          passwordHash: passwordHash,
          rawPassword: password, // Store password temporarily in memory only for encryption upon save
        };

        let decryptedState: FinancialState;

        if (!data.encryptedData) {
          // Empty DB. Perform initial seeding for the user.
          console.log("Banco de dados vazio no servidor. Gerando dados de seed criptografados...");
          decryptedState = getSeedData();
          
          // Encrypt seed data using user's raw password
          const encryptedSeed = await encryptData(decryptedState, password);

          // Save seed data to the server
          await fetch("/api/data/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: session.username,
              passwordHash: session.passwordHash,
              encryptedData: encryptedSeed,
            }),
          });
        } else {
          // Decrypt existing financial data
          const decrypted = await decryptData(data.encryptedData, password);
          if (!decrypted) {
            throw new Error("Falha ao descriptografar os dados financeiros. Chave inválida.");
          }
          decryptedState = decrypted;
        }

        onLoginSuccess(session, decryptedState);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 py-12 relative overflow-hidden font-sans">
      {/* Delicate premium accent glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full filter blur-3xl" />

      <div className="w-full max-w-md bg-[#111111] border border-[#222222] rounded shadow-2xl p-8 z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="serif-heading text-4xl font-bold text-[#d4af37] tracking-tighter italic">RIFRAELI</h1>
            <p className="text-[10px] tracking-[0.25em] text-gray-500 uppercase font-bold mt-1">PRESTIGE FINANCE</p>
          </div>
          <p className="text-gray-400 mt-2 text-xs uppercase tracking-wider font-mono">
            Auditoria & Gestão Patrimonial Blindada
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs font-mono p-4 rounded mb-6 flex items-start gap-3">
            <span className="font-semibold text-lg leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 text-xs font-mono p-4 rounded mb-6 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
              Nome de Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: rifraeli"
              className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] text-white rounded py-3 px-4 outline-none transition-all placeholder:text-gray-700 font-medium font-mono text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                Senha de Acesso
              </label>
              {username === "rifraeli" && (
                <span className="text-gray-600 text-[10px] font-mono">milhao123</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#d4af37] text-white rounded py-3 pl-4 pr-12 outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] hover:bg-[#c49f27] disabled:bg-[#d4af37]/50 text-black font-extrabold uppercase tracking-wider text-xs py-3.5 px-4 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#d4af37]/10"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isRegisterMode ? (
              "Criar Conta Criptografada"
            ) : (
              "Acessar Carteira Blindada"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#222222] flex flex-col items-center gap-4 text-center">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError("");
              setSuccess("");
            }}
            className="text-[#d4af37] hover:text-[#c49f27] text-xs font-bold uppercase tracking-wider font-mono transition"
          >
            {isRegisterMode ? "Possui conta? Acessar" : "Cadastrar Nova Conta Criptografada"}
          </button>

          <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono uppercase tracking-widest">
            <Lock className="h-3 w-3 text-[#d4af37]" />
            <span>RSA-4096 + AES-GCM-256 CLIENT SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
