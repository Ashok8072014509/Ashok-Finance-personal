import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Edit3, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function TransactionsTable({ 
  entries = [], 
  onEditEntry, 
  onDeleteEntry, 
  onOpenAddModal, 
  activeLineId = 'all', 
  activeLineName = 'All Lines Combined' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, week, month, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Compute filtered entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter by active tab line
    if (activeLineId && activeLineId !== 'all') {
      result = result.filter((e) => e.line_id === activeLineId);
    }

    // Filter by date range
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dateFilter === 'today') {
      result = result.filter((e) => e.entry_date === todayStr);
    } else if (dateFilter === 'yesterday') {
      result = result.filter((e) => e.entry_date === yesterdayDate);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      result = result.filter((e) => e.entry_date >= weekAgo && e.entry_date <= todayStr);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      result = result.filter((e) => e.entry_date >= monthAgo && e.entry_date <= todayStr);
    } else if (dateFilter === 'custom') {
      if (customStart) result = result.filter((e) => e.entry_date >= customStart);
      if (customEnd) result = result.filter((e) => e.entry_date <= customEnd);
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((e) => {
        const line = (e.line_name || e.line_id || '').toLowerCase();
        const notes = (e.notes || '').toLowerCase();
        const inc = String(e.income || '');
        const out = String(e.outgoing || '');
        return line.includes(term) || notes.includes(term) || inc.includes(term) || out.includes(term);
      });
    }

    return result;
  }, [entries, activeLineId, dateFilter, customStart, customEnd, searchTerm]);

  // Totals for filtered view
  const totals = useMemo(() => {
    let inc = 0;
    let out = 0;
    filteredEntries.forEach((e) => {
      inc += Number(e.income) || 0;
      out += Number(e.outgoing) || 0;
    });
    return {
      income: inc,
      outgoing: out,
      net: inc - out,
      count: filteredEntries.length,
    };
  }, [filteredEntries]);

  const getLineBadge = (id) => {
    switch (id) {
      case 'morning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" />
            <span>MORNING</span>
          </span>
        );
      case 'evening_1':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
            <Moon className="w-3 h-3 text-red-600" />
            <span>EVENING 1</span>
          </span>
        );
      case 'evening_2':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <Sparkles className="w-3 h-3 text-rose-600" />
            <span>EVENING 2</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {id}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Daily Ledger Entries</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700">
                {totals.count} {totals.count === 1 ? 'record' : 'records'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Viewing: <b className="text-slate-700">{activeLineName}</b>
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-red-200 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Daily Entry</span>
          </button>
        </div>

        {/* Date Filter Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          
          {/* Quick Date Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search remarks, amounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-100 outline-none"
            />
          </div>
        </div>

        {/* Custom Date Inputs if 'custom' is active */}
        {dateFilter === 'custom' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">Date Range:</span>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Filtered Range Summary Bar */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500">Period Income: </span>
              <b className="text-emerald-700">+{formatINR(totals.income)}</b>
            </div>
            <div>
              <span className="text-slate-500">Period Outgoing: </span>
              <b className="text-red-700">-{formatINR(totals.outgoing)}</b>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Period Net Flow:</span>
            <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
              totals.net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {totals.net >= 0 ? '+' : ''}{formatINR(totals.net)}
            </span>
          </div>
        </div>

      </div>

      {/* Responsive Content */}

      {/* Desktop Table (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Branch Line</th>
              <th className="py-3 px-4 text-right">Income (+)</th>
              <th className="py-3 px-4 text-right">Outgoing (-)</th>
              <th className="py-3 px-4 text-right">Net Flow (In - Out)</th>
              <th className="py-3 px-4">Remarks / Notes</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-600">No ledger entries found</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing filters or click "Record Daily Entry" above.</p>
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => {
                const inc = Number(e.income) || 0;
                const out = Number(e.outgoing) || 0;
                const net = inc - out;

                return (
                  <tr key={e.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {e.entry_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {getLineBadge(e.line_id)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                      +{formatINR(inc)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-red-700 whitespace-nowrap">
                      -{formatINR(out)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 font-black ${
                        net >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {net >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
                        <span>{net >= 0 ? '+' : ''}{formatINR(net)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={e.notes}>
                      {e.notes || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => onEditEntry(e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (shown on smaller screens) */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">No ledger entries found</p>
            <p className="text-xs text-slate-400 mt-1">Tap "+ Record Entry" to create one.</p>
          </div>
        ) : (
          filteredEntries.map((e) => {
            const inc = Number(e.income) || 0;
            const out = Number(e.outgoing) || 0;
            const net = inc - out;

            return (
              <div key={e.id} className="p-4 hover:bg-red-50/20 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-800">{e.entry_date}</span>
                    {getLineBadge(e.line_id)}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditEntry(e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 bg-slate-100 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(e.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 bg-slate-100 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Income</span>
                    <span className="text-xs font-bold text-emerald-700">+{formatINR(inc)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Outgoing</span>
                    <span className="text-xs font-bold text-red-700">-{formatINR(out)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Net Flow</span>
                    <span className={`text-xs font-black ${net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {net >= 0 ? '+' : ''}{formatINR(net)}
                    </span>
                  </div>
                </div>

                {e.notes && (
                  <p className="text-xs text-slate-500 italic bg-white px-2 py-1 rounded border border-slate-100">
                    "{e.notes}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
