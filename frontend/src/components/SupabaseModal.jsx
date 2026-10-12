import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Key, 
  Link, 
  CheckCircle, 
  Copy, 
  Check, 
  ExternalLink,
  Server,
  Cloud,
  Code
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  getBackendUrl, 
  saveBackendUrl 
} from '../services/api';

const SQL_SCHEMA_SNIPPET = `-- Run this in Supabase -> SQL Editor
CREATE TABLE IF NOT EXISTS public.lines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    badge_color TEXT DEFAULT '#DC2626',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bag_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    starting_bag NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    notes TEXT DEFAULT 'Initial Bag amount of 10 Lakhs',
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    line_id TEXT NOT NULL REFERENCES public.lines(id) ON DELETE CASCADE,
    income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outgoing NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.lines (id, name, badge_color) VALUES 
    ('morning', 'ASHOK FINANCE MORNING', '#DC2626'),
    ('evening_1', 'ASHOK FINANCE EVENING 1', '#B91C1C'),
    ('evening_2', 'ASHOK FINANCE EVENING 2', '#991B1B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bag_settings (id, starting_bag) VALUES (1, 1000000.00)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Lines" ON public.lines FOR ALL USING (true);
CREATE POLICY "Public Read Bag" ON public.bag_settings FOR ALL USING (true);
CREATE POLICY "Public Read Entries" ON public.daily_entries FOR ALL USING (true);`;

export default function SupabaseModal({ isOpen, onClose, onRefresh }) {
  const currentSupabase = getSupabaseConfig();
  const currentBackend = getBackendUrl();

  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(currentSupabase.key);
  const [backendUrl, setBackendUrl] = useState(currentBackend);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    saveBackendUrl(backendUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onRefresh();
      onClose();
    }, 900);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-red-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Database & Deployment Settings</h3>
              <p className="text-xs text-red-100/90">Connect Supabase, Render, or Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Settings saved! Reloading connection...</span>
            </div>
          )}

          {/* Supabase Section */}
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center space-x-1.5">
                <Cloud className="w-4 h-4 text-red-600" />
                <span>Supabase PostgreSQL (Cloud Database)</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-red-700 hover:text-red-900 font-semibold inline-flex items-center space-x-1"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white transition font-mono"
              />
            </div>

            <div className="pt-1 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="text-red-700 hover:text-red-900 font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showSql ? 'Hide SQL Script' : 'View SQL Schema to Copy'}</span>
              </button>
              {showSql && (
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2 py-1 rounded-md bg-white border border-red-200 text-red-700 font-bold hover:bg-red-50 transition inline-flex items-center space-x-1 cursor-pointer text-[11px]"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              )}
            </div>

            {showSql && (
              <div className="relative">
                <pre className="max-h-40 overflow-y-auto bg-slate-900 text-slate-100 p-3 rounded-xl text-[10px] font-mono leading-relaxed">
                  {SQL_SCHEMA_SNIPPET}
                </pre>
              </div>
            )}
          </div>

          {/* Render Backend URL */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-slate-600" />
                <span>Render FastAPI Backend Service</span>
              </span>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Backend API URL (Render or Local)
              </label>
              <input
                type="text"
                placeholder="https://ashok-finance-api.onrender.com or http://localhost:8000"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              When deployed to Render, paste your Render web service URL here. If empty or offline, the app operates using direct Supabase and local storage.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Connect</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
