import React, { useState, useEffect } from 'react';
import { X, Wallet, Check, AlertCircle, Sun, Sunset, Moon, Layers } from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function BagEditModal({ 
  isOpen, 
  onClose, 
  startingBag = 1000000, 
  lineStartingBags = {},
  defaultLineId = 'all',
  onSave 
}) {
  const [targetLine, setTargetLine] = useState(defaultLineId);
  const [amount, setAmount] = useState('1000000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const line = (defaultLineId && defaultLineId !== 'all') ? defaultLineId : 'morning';
      setTargetLine(line);
      const initialAmt = lineStartingBags[line] || 1000000;
      setAmount(String(initialAmt));
      setNotes(`Ashok Finance Bag Capital Update`);
      setError('');
    }
  }, [isOpen, defaultLineId, lineStartingBags]);

  if (!isOpen) return null;

  const handleLineChange = (newLineId) => {
    setTargetLine(newLineId);
    if (newLineId === 'all') {
      const perLine = lineStartingBags['morning'] || 1000000;
      setAmount(String(perLine));
    } else {
      setAmount(String(lineStartingBags[newLineId] || 1000000));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid starting bag capital amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave(num, notes, targetLine);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update bag capital.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPresets = [
    { label: '5 Lakhs (₹5L)', value: 500000 },
    { label: '10 Lakhs (Default)', value: 1000000 },
    { label: '15 Lakhs (₹15L)', value: 1500000 },
    { label: '20 Lakhs (₹20L)', value: 2000000 },
    { label: '25 Lakhs (₹25L)', value: 2500000 },
  ];

  const lineOptions = [
    { id: 'morning', name: 'Ashok Finance Morning', icon: Sun, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'evening_1', name: 'Ashok Finance Evening 1', icon: Sunset, color: 'text-red-700 bg-rose-50 border-rose-200' },
    { id: 'evening_2', name: 'Ashok Finance Evening 2', icon: Moon, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { id: 'all', name: 'All 3 Finances Uniformly', icon: Layers, color: 'text-slate-800 bg-slate-100 border-slate-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full border border-red-100 shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Edit Bag Capital Baseline</h3>
              <p className="text-xs text-red-100/90">Configure starting fund baseline per finance line</p>
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

          {/* Select Target Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Finance Line to Update:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {lineOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = targetLine === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleLineChange(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/80 text-red-900 ring-2 ring-red-400/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="text-xs truncate">{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Starting Bag Baseline Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-base sm:text-lg font-black text-red-700 rounded-xl border border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 mt-1 gap-1">
              <span>Formatted: <b className="text-slate-800">{formatINR(parseFloat(amount) || 0)}</b></span>
              {targetLine === 'all' && (
                <span className="text-red-700 font-semibold">Total for 3 lines: {formatINR((parseFloat(amount) || 0) * 3)}</span>
              )}
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Quick Baseline Presets:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickPresets.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setAmount(String(p.value))}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-left cursor-pointer active:scale-95 ${
                    Number(amount) === p.value
                      ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Reason / Capital Adjustment Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Starting fresh cycle with ₹10 Lakhs baseline"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
            />
          </div>

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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Update Baseline'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

