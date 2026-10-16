import React from 'react';
import { 
  Layers, 
  Sun, 
  Sunset, 
  Moon, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function FinanceModeBar({ 
  activeMode = 'all', 
  onSelectMode, 
  linesSummary = [],
  bagStatus 
}) {
  const lineDataMap = Object.fromEntries(linesSummary.map((l) => [l.line_id, l]));

  const modes = [
    {
      id: 'all',
      name: 'All Finances (Consolidated)',
      shortName: 'Combined',
      badge: 'Master View',
      icon: Layers,
      description: '3 Lines Unified Overview & Comparison',
      currentBag: bagStatus?.current_bag || 3000000,
      netAmount: bagStatus?.total_net || 0,
      monthIncome: bagStatus?.month_income || 0,
      monthOutgoing: bagStatus?.month_outgoing || 0,
      monthNet: bagStatus?.month_net || 0,
      accentColor: 'from-slate-900 to-red-950',
      activeBorder: 'border-red-600 bg-red-50/90 text-red-900 ring-2 ring-red-500/20',
      tagBg: 'bg-red-100 text-red-800',
      iconBg: 'bg-red-600 text-white',
    },
    {
      id: 'morning',
      name: 'Ashok Finance Morning',
      shortName: 'Morning Line',
      badge: 'Morning Route',
      icon: Sun,
      description: 'Morning Collection & Loan Line',
      currentBag: lineDataMap['morning']?.current_bag || 1000000,
      netAmount: lineDataMap['morning']?.net_amount || 0,
      monthIncome: lineDataMap['morning']?.month_income || 0,
      monthOutgoing: lineDataMap['morning']?.month_outgoing || 0,
      monthNet: lineDataMap['morning']?.month_net || 0,
      accentColor: 'from-amber-600 to-red-600',
      activeBorder: 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20',
      tagBg: 'bg-amber-100 text-amber-800',
      iconBg: 'bg-amber-500 text-white',
    },
    {
      id: 'evening_1',
      name: 'Ashok Finance Evening 1',
      shortName: 'Evening 1',
      badge: 'Evening Route 1',
      icon: Sunset,
      description: 'Market & Merchant Collection Line 1',
      currentBag: lineDataMap['evening_1']?.current_bag || 1000000,
      netAmount: lineDataMap['evening_1']?.net_amount || 0,
      monthIncome: lineDataMap['evening_1']?.month_income || 0,
      monthOutgoing: lineDataMap['evening_1']?.month_outgoing || 0,
      monthNet: lineDataMap['evening_1']?.month_net || 0,
      accentColor: 'from-red-600 to-rose-700',
      activeBorder: 'border-red-600 bg-rose-50/90 text-red-950 ring-2 ring-red-500/20',
      tagBg: 'bg-rose-100 text-rose-800',
      iconBg: 'bg-red-600 text-white',
    },
    {
      id: 'evening_2',
      name: 'Ashok Finance Evening 2',
      shortName: 'Evening 2',
      badge: 'Evening Route 2',
      icon: Moon,
      description: 'Disbursement & Night Line 2',
      currentBag: lineDataMap['evening_2']?.current_bag || 1000000,
      netAmount: lineDataMap['evening_2']?.net_amount || 0,
      monthIncome: lineDataMap['evening_2']?.month_income || 0,
      monthOutgoing: lineDataMap['evening_2']?.month_outgoing || 0,
      monthNet: lineDataMap['evening_2']?.month_net || 0,
      accentColor: 'from-red-800 to-purple-950',
      activeBorder: 'border-purple-600 bg-purple-50/90 text-purple-950 ring-2 ring-purple-500/20',
      tagBg: 'bg-purple-100 text-purple-800',
      iconBg: 'bg-purple-700 text-white',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 sm:p-2.5">
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100 mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Finance Workspace Mode
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
          Independent Bag Capital & Calculations per Line
        </span>
      </div>

      {/* Grid of 4 Modes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          const isPositive = mode.netAmount >= 0;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`relative text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98 ${
                isActive
                  ? mode.activeBorder + ' shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
              }`}
            >
              {/* Top row: Icon + Badge */}
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? mode.iconBg : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full ${
                  isActive ? mode.tagBg : 'bg-slate-100 text-slate-500'
                }`}>
                  {mode.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="font-extrabold text-[11px] sm:text-sm tracking-tight leading-snug truncate">
                  {mode.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 hidden sm:block">
                  {mode.description}
                </p>
              </div>

              {/* Bottom Bag & Month Net Pill */}
              <div className="mt-2 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase block leading-none">
                    Current Bag
                  </span>
                  <span className="font-black text-[11px] sm:text-sm tracking-tight text-slate-900 mt-0.5 block">
                    {formatINR(mode.currentBag)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase block leading-none">
                    Month Net
                  </span>
                  <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold mt-0.5 ${
                    mode.monthNet >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {mode.monthNet >= 0 ? '+' : ''}{formatINR(mode.monthNet || 0)}
                  </span>
                </div>
              </div>

              {/* Month In & Out Subline */}
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 pt-1 border-t border-dashed border-slate-100 mt-1">
                <span>In: <strong className="text-emerald-700 font-bold">+{formatINR(mode.monthIncome || 0)}</strong></span>
                <span>Out: <strong className="text-red-700 font-bold">-{formatINR(mode.monthOutgoing || 0)}</strong></span>
              </div>


              {/* Active Indicator dot */}
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
