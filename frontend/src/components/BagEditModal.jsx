import React, { useState, useEffect } from 'react';
import { X, Wallet, Check, AlertCircle } from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function BagEditModal({ 
  isOpen, 
  onClose, 
  startingBag = 1000000, 
  onSave 
}) {
  const [amount, setAmount] = useState('1000000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(String(startingBag));
      setNotes('Ashok Finance Bag Capital Adjustment');
      setError('');
    }
  }, [isOpen, startingBag]);

  if (!isOpen) return null;

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
      await onSave(num, notes);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update bag capital.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPresets = [
    { label: '5 Lakhs', value: 500000 },
    { label: '10 Lakhs (Default)', value: 1000000 },
    { label: '15 Lakhs', value: 1500000 },
    { label: '20 Lakhs', value: 2000000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border border-red-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Edit Bag Capital</h3>
              <p className="text-xs text-red-100/90">Configure starting fund baseline</p>
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Initial Starting Bag Capital (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-lg font-black text-red-700 rounded-xl border border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Formatted: <b className="text-slate-800">{formatINR(parseFloat(amount) || 0)}</b>
            </p>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Quick Shortcuts:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickPresets.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setAmount(String(p.value))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition text-left cursor-pointer ${
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
              Reason / Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
            />
          </div>

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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Update Starting Bag'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
