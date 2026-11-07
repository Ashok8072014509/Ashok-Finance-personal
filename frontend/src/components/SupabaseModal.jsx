import React, { useState, useEffect } from 'react';
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
  Code,
  Activity,
  AlertTriangle,
  RotateCw,
  HardDrive,
  Download,
  Upload,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getBackendUrl,
  saveBackendUrl,
  getLocalEntries,
  api
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
    ('evening_2', 'ASHOK FINANCE EVENING 2', '#991B1B'),
    ('friday', 'ASHOK FINANCE FRIDAY', '#059669'),
    ('saturday', 'ASHOK FINANCE SATURDAY', '#4F46E5')
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

  // Diagnostic states
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [storedEntries, setStoredEntries] = useState([]);
  const [showInspector, setShowInspector] = useState(false);
  const [showBulkRestore, setShowBulkRestore] = useState(false);
  const [bulkInputJson, setBulkInputJson] = useState('');
  const [importMessage, setImportMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStoredEntries(getLocalEntries());
      handleTestConnectivity();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnectivity = async () => {
    setIsTesting(true);
    try {
      const res = await api.checkHealth();
      setHealthStatus(res);
      setStoredEntries(getLocalEntries());
    } catch {
      setHealthStatus({ backendOnline: false, supabaseOnline: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncAllEntries();
      setSyncResult(`Successfully synced ${res.total} records across browser & database!`);
      setStoredEntries(getLocalEntries());
      if (onRefresh) onRefresh();
    } catch (err) {
      setSyncResult(`Sync warning: ${err.message || 'Check connection'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    api.exportBackupJson();
  };

  const handleBulkImport = async () => {
    setImportMessage(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(bulkInputJson);
        if (parsed.entries && Array.isArray(parsed.entries)) {
          parsed = parsed.entries;
        }
      } catch (e) {
        setImportMessage({ error: 'Please enter valid JSON array of records (e.g. [{"entry_date": "2026-11-02", "line_id": "morning", "income": 50000, "outgoing": 20000}])' });
        return;
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setImportMessage({ error: 'JSON array cannot be empty' });
        return;
      }
      const res = await api.bulkImportEntries(parsed);
      setImportMessage({ success: `Successfully imported & synced ${parsed.length} entries to database!` });
      setStoredEntries(getLocalEntries());
      setBulkInputJson('');
      if (onRefresh) onRefresh();
      setTimeout(() => setShowBulkRestore(false), 2000);
    } catch (err) {
      setImportMessage({ error: err.message || 'Import failed' });
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full border border-red-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in duration-200">

        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Database & Connectivity Status</h3>
              <p className="text-xs text-red-100/90">Render FastAPI, Supabase Cloud & Local Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Settings saved! Reloading connection...</span>
            </div>
          )}

          {/* Live Status & Diagnostic Panel */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-red-400" />
                <span>Live Database Connectivity</span>
              </span>
              <button
                type="button"
                onClick={handleTestConnectivity}
                disabled={isTesting}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg transition inline-flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Backend Status */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 font-medium">Render Backend:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${healthStatus?.backendOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                    {healthStatus?.backendOnline ? '● Online' : '● Offline / Sleeping'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate font-mono">
                  {backendUrl || 'None configured'}
                </p>
                {healthStatus?.dbStatusMessage && (
                  <p className="text-[10px] text-amber-300/80 mt-1 truncate">
                    {healthStatus.dbStatusMessage}
                  </p>
                )}
              </div>

              {/* Supabase Status */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 font-medium">Supabase Cloud:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${healthStatus?.supabaseOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                    {healthStatus?.supabaseOnline ? '● Active' : '● Paused / Standby'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate font-mono">
                  {supabaseUrl || 'None configured'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {healthStatus?.supabaseOnline ? 'PostgreSQL ready' : 'Free project may be paused'}
                </p>
              </div>
            </div>

            {/* Offline & Rollover Safety Guarantee */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Browser Safe Persistence Active</p>
                    <p className="text-[10px] text-slate-400">
                      {storedEntries.length} financial ledger records safely preserved locally
                    </p>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowInspector(!showInspector)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showInspector ? 'Hide Records' : `View (${storedEntries.length})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                    title="Export JSON backup to disk"
                  >
                    <Download className="w-3 h-3" />
                    <span>Backup JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkRestore(!showBulkRestore)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Restore / Bulk</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
                  </button>
                </div>
              </div>

              {/* Expandable Stored Records Inspector */}
              {showInspector && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold px-1">
                    <span>Local Records in Browser Memory ({storedEntries.length}):</span>
                  </div>
                  {storedEntries.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-2 bg-black/20 rounded-lg">No records stored locally yet.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 divide-y divide-white/5 text-[11px]">
                      {storedEntries.map((e, idx) => (
                        <div key={e.id || idx} className="p-2 flex items-center justify-between hover:bg-white/5">
                          <div>
                            <span className="font-bold text-white mr-2">{e.entry_date}</span>
                            <span className="text-slate-400 text-[10px] uppercase font-mono mr-2">{e.line_id}</span>
                            {e.notes && <span className="text-slate-500 text-[10px] italic">"{e.notes}"</span>}
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-semibold mr-2">+₹{Number(e.income || 0).toLocaleString('en-IN')}</span>
                            <span className="text-rose-400 font-semibold mr-2">-₹{Number(e.outgoing || 0).toLocaleString('en-IN')}</span>
                            <span className={`font-bold ${Number(e.net_amount || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {Number(e.net_amount || 0) >= 0 ? '+' : ''}₹{Number(e.net_amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Bulk Add / Restore Panel */}
              {showBulkRestore && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-2 animate-in fade-in duration-150">
                  <div className="text-[11px] text-amber-200 font-bold flex items-center justify-between">
                    <span>Paste Missing Records or Backup JSON to Restore:</span>
                    <button
                      type="button"
                      onClick={() => setShowBulkRestore(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkInputJson}
                    onChange={(e) => setBulkInputJson(e.target.value)}
                    placeholder='[&#10;  { "entry_date": "2026-11-02", "line_id": "morning", "income": 50000, "outgoing": 20000, "notes": "Nov 2 collection" },&#10;  { "entry_date": "2026-11-03", "line_id": "evening_1", "income": 40000, "outgoing": 15000 }&#10;]'
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-white/10 bg-black/40 text-emerald-300 font-mono focus:border-red-400 outline-none"
                  />
                  {importMessage && (
                    <p className={`text-xs p-2 rounded-lg font-medium ${importMessage.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      {importMessage.success || importMessage.error}
                    </p>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkRestore(false)}
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Import & Sync to Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {syncResult && (
              <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg font-medium">
                {syncResult}
              </p>
            )}

            {/* Supabase Unpause Notice */}
            {!healthStatus?.supabaseOnline && (
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Supabase Project Notice</span>
                </div>
                <p className="text-[11px] text-amber-100/90 leading-relaxed">
                  Supabase free-tier projects pause after 7 days of inactivity. If your project is paused, click the dashboard link below to restore it. In the meantime, your entries are completely protected in your browser and automatically synchronized with Render.
                </p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-amber-300 font-bold underline hover:text-white"
                >
                  <span>Open Supabase Dashboard to Restore</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
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
                <span className="text-[11px] text-slate-400">Active</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Backend API URL (Render or Local)
                </label>
                <input
                  type="text"
                  placeholder="https://ashok-finance-personal.onrender.com"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-white transition"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Connected to Ashok Finance FastAPI service on Render. It handles PDF generation, starting bags, and multi-tier persistence.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-2 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-md shadow-red-200 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
