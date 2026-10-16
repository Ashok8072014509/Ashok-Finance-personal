import React from 'react';
import { 
  Sun, 
  Sunset, 
  Moon, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function ComparisonGrid({ 
  linesSummary = [], 
  onSelectMode, 
  bagStatus 
}) {
  const lineConfigs = {
    morning: {
      name: 'Ashok Finance Morning',
      route: 'Morning Route (8:00 AM - 1:00 PM)',
      icon: Sun,
      headerBg: 'from-amber-600 via-amber-700 to-red-700',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeText: 'MORNING LINE',
      cardBorder: 'border-amber-200/90 hover:border-amber-400',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      bagAccent: 'text-amber-800',
    },
    evening_1: {
      name: 'Ashok Finance Evening 1',
      route: 'Evening Market Route 1 (2:00 PM - 7:00 PM)',
      icon: Sunset,
      headerBg: 'from-red-700 via-red-800 to-rose-800',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeText: 'EVENING 1 LINE',
      cardBorder: 'border-red-200/90 hover:border-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700 text-white',
      bagAccent: 'text-red-800',
    },
    evening_2: {
      name: 'Ashok Finance Evening 2',
      route: 'Night & Merchant Route 2 (6:00 PM - 11:00 PM)',
      icon: Moon,
      headerBg: 'from-rose-900 via-purple-900 to-slate-900',
      badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
      badgeText: 'EVENING 2 LINE',
      cardBorder: 'border-purple-200/90 hover:border-purple-400',
      buttonBg: 'bg-purple-800 hover:bg-purple-900 text-white',
      bagAccent: 'text-purple-900',
    },
  };

  const linesList = ['morning', 'evening_1', 'evening_2'].map((id) => {
    const summary = linesSummary.find((s) => s.line_id === id) || {
      line_id: id,
      line_name: id,
      starting_bag: 1000000,
      current_bag: 1000000,
      total_income: 0,
      total_outgoing: 0,
      net_amount: 0,
      today_income: 0,
      today_outgoing: 0,
      today_net: 0,
      growth_amount: 0,
      growth_percent: 0,
      entries_count: 0,
    };
    return {
      ...summary,
      config: lineConfigs[id] || lineConfigs.morning,
    };
  });

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <BarChart3 className="w-4 h-4" />
            <span>3-Way Finance Lines Side-by-Side Comparison</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Independent Line Capital, Cashflow & Bag Calculations
          </h3>
        </div>
        <p className="text-xs text-slate-500 max-w-sm">
          Each finance operates on its own dedicated starting bag (₹10,00,000 baseline). Net collections directly grow each line's bag.
        </p>
      </div>

      {/* 3-Column Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {linesList.map((line) => {
          const cfg = line.config;
          const Icon = cfg.icon;
          const isNetPositive = line.net_amount >= 0;
          const growth = line.current_bag - line.starting_bag;
          const growthPct = line.starting_bag > 0 ? ((growth / line.starting_bag) * 100).toFixed(2) : 0;
          const isGrowthPositive = growth >= 0;

          const totalFlow = (line.total_income + line.total_outgoing) || 1;
          const incomeRatio = Math.min(100, Math.round((line.total_income / totalFlow) * 100));

          return (
            <div 
              key={line.line_id}
              className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between ${cfg.cardBorder}`}
            >
              <div>
                {/* Header Banner */}
                <div className={`bg-gradient-to-r ${cfg.headerBg} p-4 sm:p-5 text-white relative`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider mb-2 ${cfg.badgeBg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cfg.badgeText}</span>
                      </span>
                      <h4 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                        {cfg.name}
                      </h4>
                      <p className="text-[11px] text-white/80 mt-0.5 font-medium">
                        {cfg.route}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Primary Bag Highlight */}
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/70 block tracking-wider">
                        Current Bag Capital
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {formatINR(line.current_bag)}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      isGrowthPositive ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30' : 'bg-red-500/25 text-red-200 border border-red-400/30'
                    }`}>
                      {isGrowthPositive ? '+' : ''}{growthPct}%
                    </div>
                  </div>
                </div>

                {/* Card Body Metrics */}
                <div className="p-4 sm:p-5 space-y-4">
                  
                  {/* Baseline & Growth Row */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Starting Bag Baseline:</span>
                      <span className="font-bold text-slate-800">{formatINR(line.starting_bag)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Net Bag Growth:</span>
                      <span className={`font-bold inline-flex items-center space-x-0.5 ${
                        isGrowthPositive ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {isGrowthPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{isGrowthPositive ? '+' : ''}{formatINR(growth)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Income vs Outgoing Comparison */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Income: {formatINR(line.total_income)}</span>
                      </span>
                      <span className="text-slate-600 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        <span>Out: {formatINR(line.total_outgoing)}</span>
                      </span>
                    </div>
                    {/* Visual Ratio Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${incomeRatio}%` }} 
                        title={`Income: ${incomeRatio}%`}
                      />
                      <div 
                        className="bg-red-500 h-full transition-all duration-300" 
                        style={{ width: `${100 - incomeRatio}%` }} 
                        title={`Outgoing: ${100 - incomeRatio}%`}
                      />
                    </div>
                  </div>

                  {/* Net Flow Pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Net Cashflow</span>
                      <span className={`text-base font-black ${isNetPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isNetPositive ? '+' : ''}{formatINR(line.net_amount)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {line.entries_count} Entries
                    </span>
                  </div>

                  {/* Monthly Activity Box */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">This Month (MTD):</span>
                      <span className={`font-black text-xs ${
                        line.month_net >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {line.month_net >= 0 ? '+' : ''}{formatINR(line.month_net || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>In: <b className="text-emerald-700">+{formatINR(line.month_income || 0)}</b></span>
                      <span>Out: <b className="text-red-700">-{formatINR(line.month_outgoing || 0)}</b></span>
                    </div>
                  </div>

                  {/* Today's Activity Pill */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Today's Net Impact:</span>
                      <span className={`font-bold ${line.today_net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {line.today_net >= 0 ? '+' : ''}{formatINR(line.today_net)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>In: +{formatINR(line.today_income)}</span>
                      <span>Out: -{formatINR(line.today_outgoing)}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => onSelectMode(line.line_id)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs ${cfg.buttonBg}`}
                >
                  <span>Open {line.line_id === 'morning' ? 'Morning' : line.line_id === 'evening_1' ? 'Evening 1' : 'Evening 2'} Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Combined Grand Total Summary Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-red-200 text-xs font-bold mb-1 border border-white/10">
            <Sparkles className="w-3 h-3 text-red-300" />
            <span>Combined Total Across All 3 Finances</span>
          </span>
          <h4 className="text-lg sm:text-xl font-black">
            Ashok Finance Consolidated Capital Bag: {formatINR(bagStatus?.current_bag || 3000000)}
          </h4>
          <p className="text-xs text-red-200/80 mt-0.5">
            Initial Total Bag: {formatINR(bagStatus?.starting_bag || 3000000)} • Total Net Growth: {formatINR(bagStatus?.total_net || 0)}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="bg-white/10 rounded-xl px-2.5 py-2 text-center">
            <span className="text-[9px] sm:text-[10px] text-emerald-300 uppercase font-bold block">Month In</span>
            <span className="text-xs sm:text-sm font-extrabold text-white">+{formatINR(bagStatus?.month_income || 0)}</span>
          </div>
          <div className="bg-white/10 rounded-xl px-2.5 py-2 text-center">
            <span className="text-[9px] sm:text-[10px] text-red-300 uppercase font-bold block">Month Out</span>
            <span className="text-xs sm:text-sm font-extrabold text-white">-{formatINR(bagStatus?.month_outgoing || 0)}</span>
          </div>
          <div className="bg-white/10 rounded-xl px-2.5 py-2 text-center">
            <span className="text-[9px] sm:text-[10px] text-red-200 uppercase font-bold block">Month Net</span>
            <span className={`text-xs sm:text-sm font-black ${
              (bagStatus?.month_net || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {(bagStatus?.month_net || 0) >= 0 ? '+' : ''}{formatINR(bagStatus?.month_net || 0)}
            </span>
          </div>
          <div className="bg-white/15 rounded-xl px-2.5 py-2 text-center border border-white/10">
            <span className="text-[9px] sm:text-[10px] text-white/70 uppercase font-bold block">Grand Net</span>
            <span className={`text-xs sm:text-sm font-black ${
              (bagStatus?.total_net || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {(bagStatus?.total_net || 0) >= 0 ? '+' : ''}{formatINR(bagStatus?.total_net || 0)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
