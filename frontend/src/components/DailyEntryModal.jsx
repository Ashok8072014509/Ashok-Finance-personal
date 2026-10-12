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
  AlertCircle
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function DailyEntryModal({ 
  isOpen, 
  onClose, 
  onSave, 
  lines = [], 
  defaultLineId = 'morning', 
  currentBag = 1000000 
}) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineId, setLineId] = useState(defaultLineId !== 'all' ? defaultLineId : 'morning');
  const [income, setIncome] = useState('');
  const [outgoing, setOutgoing] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntryDate(new Date().toISOString().slice(0, 10));
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
  const projectedBag = currentBag + netAmount;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-red-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Record Daily Entry</h3>
              <p className="text-xs text-red-100/90">Add income and outgoing for Ashok Finance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-semibold text-emerald-800 transition"
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
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={outgoing}
                  onChange={(e) => setOutgoing(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none font-semibold text-red-800 transition"
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
                <span>Net Cashflow (Income - Outgoing):</span>
              </span>
              <span className={`text-base font-black ${netAmount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {netAmount >= 0 ? '+' : ''}{formatINR(netAmount)}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Action: <b className={netAmount >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {netAmount >= 0 ? 'Adds to Bag balance' : 'Subtracts from Bag balance'}
                </b>
              </span>
              <span className="font-semibold text-slate-800">
                New Bag: <b className="text-red-700">{formatINR(projectedBag)}</b>
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
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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
