import React from 'react';
import { 
  Building2, 
  Download, 
  RotateCw, 
  Database, 
  SlidersHorizontal,
  FileText
} from 'lucide-react';

export default function Header({ 
  onRefresh, 
  isLoading, 
  dataSource, 
  onOpenSupabaseModal, 
  onExportPDF,
  activeLineId = 'all',
  activeLineName = 'All Lines Combined'
}) {
  const getSourceBadge = () => {
    switch (dataSource) {
      case 'supabase':
        return { label: 'Supabase Live', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'backend':
        return { label: 'Render / FastAPI', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      default:
        return { label: 'Local Storage', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    }
  };

  const badge = getSourceBadge();

  return (
    <header className="bg-white border-b border-red-100 sticky top-0 z-30 shadow-xs">
      {/* Top Brand Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-rose-500 w-full" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-200 shrink-0">
              <span className="font-black text-lg sm:text-xl tracking-wider">AF</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  ASHOK <span className="text-red-600">FINANCE</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  Ledger 2026
                </span>
                {activeLineId !== 'all' ? (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {activeLineName.replace('ASHOK FINANCE ', '')}
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    3 Lines
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5 font-medium">
                3 Dedicated Lines • Daily Income & Outgoing Capital Bag
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Connection Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Click to view database connection status"
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border transition hover:opacity-85 cursor-pointer ${badge.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              <span className="hidden sm:inline">{badge.label}</span>
              <span className="sm:hidden font-extrabold">{badge.label.split(' ')[0]}</span>
            </button>

            {/* Sync / Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Sync & refresh data"
              className="p-1.5 sm:px-3 sm:py-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition flex items-center space-x-1 text-xs font-medium cursor-pointer"
              aria-label="Sync data"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>

            {/* Supabase / Settings Modal Button */}
            <button
              onClick={onOpenSupabaseModal}
              title="Database & Connection Settings"
              className="p-1.5 sm:px-3 sm:py-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition flex items-center space-x-1 text-xs font-medium cursor-pointer"
              aria-label="Database Settings"
            >
              <Database className="w-4 h-4 text-red-600" />
              <span className="hidden md:inline">DB</span>
            </button>

            {/* Export PDF Report Button */}
            <button
              id="header-pdf-btn"
              onClick={onExportPDF}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl transition shadow-xs flex items-center space-x-1 text-xs font-bold cursor-pointer"
              title="Download Statement"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF Report</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
