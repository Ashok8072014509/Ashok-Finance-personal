import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2, 
  IndianRupee, 
  FileText,
  AlertCircle,
  Wallet,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';
import { getLocalDateStr, getYesterdayDateStr } from '../services/api';

const formatRecordDate = (dateStr) => {
  if (!dateStr) return 'No prior entry';
  const todayStr = getLocalDateStr();
  const yesterdayStr = getYesterdayDateStr();
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  try {
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

export default function DailyEntryModal({ 
  isOpen, 
  onClose, 
  onSave, 
  lines = [], 
  linesSummary = [],
  defaultLineId = 'morning', 
  currentBag = 1000000 
}) {
  const [entryDate, setEntryDate] = useState(getLocalDateStr());
  const [lineId, setLineId] = useState(defaultLineId !== 'all' ? defaultLineId : 'morning');
  const [income, setIncome] = useState('');
  const [outgoing, setOutgoing] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntryDate(getLocalDateStr());
      setLineId(defaultLineId !== 'all' ? defaultLineId : 'morning');
      setIncome('');
      setOutgoing('');
      setNotes('');
      setError('');
    }
  }, [isOpen, defaultLineId]);

  if (!isOpen) return null;

  const numIncome = parseFloat(income) || 0;
  const numOutgoing = parseFloat(outgoing) || 0;
  const netAmount = numIncome - numOutgoing;

  const activeLineSummary = linesSummary.find((l) => l.line_id === lineId);
  const activeLineOpeningBag = Number(activeLineSummary?.opening_bag) || (Number(activeLineSummary?.starting_bag) || currentBag);
  const activeLineCurrentBag = Number(activeLineSummary?.current_bag) || currentBag;
  const projectedBag = activeLineOpeningBag + netAmount;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entryDate) {
      setError('Please select an entry date.');
      return;
    }
    if (!lineId) {
      setError('Please select a business line.');
      return;
    }
    if (numIncome === 0 && numOutgoing === 0) {
      setError('Please enter either Income or Outgoing amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        entry_date: entryDate,
        line_id: lineId,
        income: numIncome,
        outgoing: numOutgoing,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full border border-red-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-600 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Record Daily Entry</h3>
              <p className="text-xs text-red-100/90">Add income and outgoing for Ashok Finance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Day Opening Bag & Rollover Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Wallet className="w-4 h-4 text-red-600" />
                <span>Day Opening Bag Capital:</span>
              </span>
              <span className="text-sm font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {formatINR(activeLineOpeningBag)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Carried from: <b className="text-slate-800">{formatRecordDate(activeLineSummary?.last_entry_date)}</b></span>
              </span>
              {activeLineSummary?.last_entry_date && (
                <span>Prior Net: <b className={activeLineSummary.last_entry_net >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {activeLineSummary.last_entry_net >= 0 ? '+' : ''}{formatINR(activeLineSummary.last_entry_net)}
                </b></span>
              )}
            </div>
          </div>

          {/* Row 1: Date & Line Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Entry Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Branch Line
              </label>
              <select
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition bg-white"
                required
              >
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Income and Outgoing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
                <span>Income (+)</span>
                <span className="text-[10px] text-slate-400 font-normal">Collections / Inflow</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-semibold text-emerald-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center justify-between">
                <span>Outgoing (-)</span>
                <span className="text-[10px] text-slate-400 font-normal">Disbursements / Expenses</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={outgoing}
                  onChange={(e) => setOutgoing(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none font-semibold text-red-800 transition"
                />
              </div>
            </div>
          </div>

          {/* Live Bag Balance Calculation Preview Box */}
          <div className={`p-4 rounded-2xl border transition-all ${
            netAmount >= 0 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-red-50/70 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                {netAmount >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                <span>Today's Net Cashflow (Income - Outgoing):</span>
              </span>
              <span className={`text-base font-black ${netAmount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {netAmount >= 0 ? '+' : ''}{formatINR(netAmount)}
              </span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="text-slate-600">
                Opening {formatINR(activeLineOpeningBag)} {netAmount >= 0 ? '+' : '-'} {formatINR(Math.abs(netAmount))} ➔
              </span>
              <span className="font-semibold text-slate-900">
                Projected Closing Bag: <b className="text-red-700 font-black text-sm">{formatINR(projectedBag)}</b>
              </span>
            </div>
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Remarks / Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="e.g., Morning market collection, customer repayment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-md shadow-red-200 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Update Bag'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
