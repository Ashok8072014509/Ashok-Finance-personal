import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function WelcomeBanner({ bagStatus, onOpenEditBagModal }) {
  const startingBag = Number(bagStatus?.starting_bag) || 1000000;
  const currentBag = Number(bagStatus?.current_bag) || 1000000;
  const netBagGrowth = currentBag - startingBag;
  const growthPercent = startingBag > 0 ? ((netBagGrowth / startingBag) * 100).toFixed(2) : 0;

  const todayIncome = Number(bagStatus?.today_income) || 0;
  const todayOutgoing = Number(bagStatus?.today_outgoing) || 0;
  const todayNet = Number(bagStatus?.today_net) || (todayIncome - todayOutgoing);

  const totalIncome = Number(bagStatus?.total_income) || 0;
  const totalOutgoing = Number(bagStatus?.total_outgoing) || 0;
  const totalNet = Number(bagStatus?.total_net) || (totalIncome - totalOutgoing);

  const todayDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Welcome Banner Bar */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-700 rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-red-950/40 text-red-100 text-xs font-medium border border-red-500/30 mb-2">
              <Calendar className="w-3.5 h-3.5 text-red-200" />
              <span>{todayDateFormatted}</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Welcome to Ashok Finance
            </h2>
            <p className="text-red-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Track morning & evening business lines, daily collections, outgoing disbursements, and real-time Bag capital balance.
            </p>
          </div>

          {/* Quick Bag Status Pill on Banner */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 sm:p-4 min-w-[240px] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-red-200 tracking-wider">Current Bag Capital</p>
              <p className="text-xl sm:text-2xl font-black text-white">{formatINR(currentBag)}</p>
            </div>
            <div className={`p-2 rounded-lg ${netBagGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-400/20 text-red-200'}`}>
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Master Bag Balance */}
        <div className="bg-white rounded-2xl border border-red-200 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <span>Total Bag Balance</span>
              </span>
              <button
                onClick={onOpenEditBagModal}
                title="Adjust starting bag amount"
                className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Capital</span>
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-700 tracking-tight">
              {formatINR(currentBag)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Starting Bag:</span>
            <span className="font-semibold text-slate-700">{formatINR(startingBag)}</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Net Bag Delta:</span>
            <span className={`font-bold inline-flex items-center ${netBagGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netBagGrowth >= 0 ? '+' : ''}{formatINR(netBagGrowth)} ({growthPercent}%)
            </span>
          </div>
        </div>

        {/* Card 2: Today's Income */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today's Income
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              +{formatINR(todayIncome)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Life-to-date Income:</span>
            <span className="font-semibold text-slate-700">{formatINR(totalIncome)}</span>
          </div>
        </div>

        {/* Card 3: Today's Outgoing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today's Outgoing
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
              -{formatINR(todayOutgoing)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Life-to-date Outgoing:</span>
            <span className="font-semibold text-slate-700">{formatINR(totalOutgoing)}</span>
          </div>
        </div>

        {/* Card 4: Today's Net Cashflow (Income - Outgoing) */}
        <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${
          todayNet >= 0 
            ? 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200' 
            : 'bg-gradient-to-br from-red-50/70 to-white border-red-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Today's Net Cashflow
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                todayNet >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {todayNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              todayNet >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {todayNet >= 0 ? '+' : ''}{formatINR(todayNet)}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Bag Impact:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
              todayNet >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {todayNet >= 0 ? 'Adds to Bag' : 'Deducts from Bag'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
