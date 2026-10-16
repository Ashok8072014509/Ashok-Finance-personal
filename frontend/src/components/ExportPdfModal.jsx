import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Calendar, 
  Layers, 
  Sun, 
  Sunset, 
  Moon, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { generateClientPDF, formatINR } from '../services/pdfGenerator';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExportPdfModal({
  isOpen,
  onClose,
  entries = [],
  bagStatus,
  defaultLineId = 'all',
}) {
  if (!isOpen) return null;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0-11

  const [selectedLine, setSelectedLine] = useState(defaultLineId || 'all');
  const [periodType, setPeriodType] = useState('month'); // 'month', 'year', 'custom', 'all'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadedFilename, setDownloadedFilename] = useState('');

  // Available lines options
  const lineOptions = [
    { id: 'all', name: 'All Lines Combined', icon: Layers, badge: 'Unified' },
    { id: 'morning', name: 'Ashok Finance Morning', icon: Sun, badge: 'Morning Line' },
    { id: 'evening_1', name: 'Ashok Finance Evening 1', icon: Sunset, badge: 'Evening 1' },
    { id: 'evening_2', name: 'Ashok Finance Evening 2', icon: Moon, badge: 'Evening 2' },
  ];

  // Calculate matching date range based on periodType
  const computedRange = useMemo(() => {
    if (periodType === 'month') {
      const y = Number(selectedYear);
      const m = Number(selectedMonth) + 1;
      const monthPadded = String(m).padStart(2, '0');
      // Number of days in this month
      const daysInMonth = new Date(y, m, 0).getDate();
      const start = `${y}-${monthPadded}-01`;
      const end = `${y}-${monthPadded}-${String(daysInMonth).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
      return { start, end, label, typeDesc: 'Monthly Statement' };
    } else if (periodType === 'year') {
      const y = Number(selectedYear);
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      const label = `Annual ${selectedYear}`;
      return { start, end, label, typeDesc: 'Annual Statement' };
    } else if (periodType === 'custom') {
      const label = (startDate && endDate) 
        ? `${startDate} to ${endDate}` 
        : (startDate ? `From ${startDate}` : (endDate ? `Up to ${endDate}` : 'Custom Range'));
      return { start: startDate || null, end: endDate || null, label, typeDesc: 'Custom Date Range' };
    } else {
      // 'all'
      return { start: null, end: null, label: 'All Records History', typeDesc: 'Full Historical Statement' };
    }
  }, [periodType, selectedMonth, selectedYear, startDate, endDate]);

  // Live Statement Preview Calculation
  const previewData = useMemo(() => {
    const isCombined = selectedLine === 'all';
    const linesSummary = bagStatus?.lines_summary || [];
    const activeLineSummary = linesSummary.find((l) => l.line_id === selectedLine);

    const baselineStartingBag = isCombined
      ? Number(bagStatus?.starting_bag || 3000000)
      : Number(activeLineSummary?.starting_bag || bagStatus?.line_starting_bags?.[selectedLine] || 1000000);

    // Filter by branch
    const lineEntries = isCombined
      ? [...entries]
      : entries.filter((e) => e.line_id === selectedLine);

    // Sort chronologically
    lineEntries.sort((a, b) => {
      const d = (a.entry_date || '').localeCompare(b.entry_date || '');
      if (d !== 0) return d;
      return (a.created_at || a.id || '').localeCompare(b.created_at || b.id || '');
    });

    // Compute running bag
    let running = baselineStartingBag;
    let periodOpening = baselineStartingBag;
    const matchingEntries = [];
    let periodIncome = 0;
    let periodOutgoing = 0;

    for (const e of lineEntries) {
      const inc = Number(e.income) || 0;
      const out = Number(e.outgoing) || 0;
      const net = inc - out;
      running += net;

      let inRange = true;
      if (computedRange.start && e.entry_date < computedRange.start) inRange = false;
      if (computedRange.end && e.entry_date > computedRange.end) inRange = false;

      if (inRange) {
        matchingEntries.push({ ...e, inc, out, net, running_bag: running });
        periodIncome += inc;
        periodOutgoing += out;
      } else if (computedRange.start && e.entry_date < computedRange.start) {
        periodOpening = running;
      }
    }

    const periodNet = periodIncome - periodOutgoing;
    const finalRemaining = matchingEntries.length > 0 
      ? matchingEntries[matchingEntries.length - 1].running_bag 
      : periodOpening;

    return {
      entriesCount: matchingEntries.length,
      openingBag: periodOpening,
      income: periodIncome,
      outgoing: periodOutgoing,
      net: periodNet,
      remainingBag: finalRemaining,
      baselineBag: baselineStartingBag,
    };
  }, [entries, bagStatus, selectedLine, computedRange]);

  const activeLineObj = lineOptions.find((l) => l.id === selectedLine) || lineOptions[0];

  // Execute PDF generation and download
  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      const result = generateClientPDF({
        bagStatus,
        allEntries: entries,
        activeLineId: selectedLine,
        activeLineName: activeLineObj.name,
        dateFilterLabel: computedRange.label,
        periodStartDate: computedRange.start,
        periodEndDate: computedRange.end,
      });

      setDownloadedFilename(result.filename);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Failed to generate statement:', err);
      alert('Error generating PDF statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-5 sm:px-7 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
              <FileText className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                Export PDF Financial Statement
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Detailed ledger with Running Bag Amount & Remaining Balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* 1. Branch Line Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              1. Select Finance Branch / Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {lineOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedLine === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedLine(opt.id);
                      setDownloadSuccess(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/80 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-red-200/60 text-red-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                    <span className="font-bold text-xs truncate leading-tight">
                      {opt.name.replace('Ashok Finance ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Statement Period Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              2. Select Statement Period
            </label>
            
            {/* Period Type Pills */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
              {[
                { id: 'month', label: '📅 By Month' },
                { id: 'year', label: '📆 By Year' },
                { id: 'custom', label: '🗓️ Custom Dates' },
                { id: 'all', label: '📑 All Time' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPeriodType(p.id);
                    setDownloadSuccess(false);
                  }}
                  className={`py-2 px-1 text-center font-bold text-xs rounded-lg transition cursor-pointer ${
                    periodType === p.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sub-selectors depending on periodType */}
            {periodType === 'month' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Select Month:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(Number(e.target.value));
                      setDownloadSuccess(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Select Year:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                      setDownloadSuccess(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                      <option key={yr} value={yr}>Year {yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {periodType === 'year' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Full Calendar Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setDownloadSuccess(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                    <option key={yr} value={yr}>Full Year {yr} (1 Jan - 31 Dec)</option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    From Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDownloadSuccess(false);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    To End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDownloadSuccess(false);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none"
                  />
                </div>
              </div>
            )}

            {periodType === 'all' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs text-slate-600 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Generates complete ledger record since inception with all transactions and cumulative bag balance.
                </span>
              </div>
            )}
          </div>

          {/* 3. Live Statement Summary Preview */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                  Statement Preview Summary
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                {computedRange.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Entries</span>
                <span className="text-base sm:text-lg font-black text-white">{previewData.entriesCount} Records</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-emerald-400 block font-bold uppercase">Period Income</span>
                <span className="text-base sm:text-lg font-black text-emerald-300">+{formatINR(previewData.income)}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-red-400 block font-bold uppercase">Period Outgoing</span>
                <span className="text-base sm:text-lg font-black text-red-300">-{formatINR(previewData.outgoing)}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Period Net Flow</span>
                <span className={`text-base sm:text-lg font-black ${
                  previewData.net >= 0 ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {previewData.net >= 0 ? '+' : ''}{formatINR(previewData.net)}
                </span>
              </div>
            </div>

            {/* Remaining Bag Highlight */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Period Opening Bag: {formatINR(previewData.openingBag)}
                </span>
                <span className="text-xs text-white/90 font-medium">
                  Scope: <b>{activeLineObj.name}</b>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-red-300 block uppercase font-bold tracking-wider">
                  Final Remaining Bag
                </span>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formatINR(previewData.remainingBag)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Features Included in Generated PDF */}
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center space-x-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Complete Audit Features Included in Generated PDF:</span>
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-emerald-800/90 text-[11px] sm:text-xs">
              <li>Every day's transaction logged with <b>Running Bag Amount</b> after each entry</li>
              <li>Reconciliation block with <b>Total Remaining Bag Amount</b> and Period Net Cashflow</li>
              <li>Official Ashok Finance header, scope breakdown, and verification signatures</li>
            </ul>
          </div>

          {/* Success Notification Banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Statement downloaded: <b>{downloadedFilename}</b>
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-white/60 px-2 py-0.5 rounded-md">
                Saved to Downloads
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>

          <button
            id="modal-download-pdf-btn"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-200 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Statement'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
