"use client";

import { useState, useEffect } from "react";
import { Key, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [apiKeys, setApiKeys] = useState({
    deepseek: "",
    deepseekBaseUrl: "https://api.deepseek.com",
    minimax: "",
    minimaxBaseUrl: "https://api.minimaxi.com/anthropic/v1",
    openrouter: "",
    openrouterBaseUrl: "https://openrouter.ai/api/v1",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys }),
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasAnyKey = apiKeys.deepseek || apiKeys.minimax || apiKeys.openrouter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl p-8 border border-border/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4e83fd] to-[#3370ff] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">欢迎使用 Eclaw</h1>
          <p className="text-muted-foreground">
            请配置至少一个 AI 模型的 API 密钥以开始使用
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${step === 0 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-medium">选择 AI 模型提供商</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                至少配置一个 API 密钥。推荐使用 DeepSeek（性价比高）或 MiniMax（中文优秀）。
              </p>
            </div>

            {/* DeepSeek */}
            <div className="p-4 border border-border/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">D</span>
                  </div>
                  <div>
                    <h4 className="font-medium">DeepSeek</h4>
                    <p className="text-xs text-muted-foreground">推荐 · 性价比高</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!apiKeys.deepseek}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setApiKeys({ ...apiKeys, deepseek: "" });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {apiKeys.deepseek !== undefined && (
                <input
                  type="password"
                  value={apiKeys.deepseek}
                  onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm"
                />
              )}
            </div>

            {/* MiniMax */}
            <div className="p-4 border border-border/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">M</span>
                  </div>
                  <div>
                    <h4 className="font-medium">MiniMax</h4>
                    <p className="text-xs text-muted-foreground">中文优秀</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!apiKeys.minimax}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setApiKeys({ ...apiKeys, minimax: "" });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {apiKeys.minimax !== undefined && (
                <input
                  type="password"
                  value={apiKeys.minimax}
                  onChange={(e) => setApiKeys({ ...apiKeys, minimax: e.target.value })}
                  placeholder="输入 MiniMax API Key"
                  className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm"
                />
              )}
            </div>

            {/* OpenRouter */}
            <div className="p-4 border border-border/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">O</span>
                  </div>
                  <div>
                    <h4 className="font-medium">OpenRouter</h4>
                    <p className="text-xs text-muted-foreground">支持 Claude, GPT, Grok 等</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!apiKeys.openrouter}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setApiKeys({ ...apiKeys, openrouter: "" });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {apiKeys.openrouter !== undefined && (
                <input
                  type="password"
                  value={apiKeys.openrouter}
                  onChange={(e) => setApiKeys({ ...apiKeys, openrouter: e.target.value })}
                  placeholder="sk-or-xxxxxxxx"
                  className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm"
                />
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!hasAnyKey || saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#4e83fd] to-[#3370ff] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  开始使用
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              API 密钥存储在本地，不会上传到任何服务器
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
