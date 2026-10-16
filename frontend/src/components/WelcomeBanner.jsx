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
  Sun,
  Sunset,
  Moon,
  Layers,
  Building2
} from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function WelcomeBanner({ 
  bagStatus, 
  activeMode = 'all', 
  onOpenEditBagModal 
}) {
  const isCombined = (activeMode === 'all');
  const lineSummary = bagStatus?.lines_summary?.find((l) => l.line_id === activeMode);

  // Financial figures
  const startingBag = isCombined 
    ? (Number(bagStatus?.starting_bag) || 3000000) 
    : (Number(lineSummary?.starting_bag) || 1000000);

  const currentBag = isCombined 
    ? (Number(bagStatus?.current_bag) || 3000000) 
    : (Number(lineSummary?.current_bag) || 1000000);

  const netBagGrowth = currentBag - startingBag;
  const growthPercent = startingBag > 0 ? ((netBagGrowth / startingBag) * 100).toFixed(2) : '0.00';

  const todayIncome = isCombined 
    ? (Number(bagStatus?.today_income) || 0) 
    : (Number(lineSummary?.today_income) || 0);

  const todayOutgoing = isCombined 
    ? (Number(bagStatus?.today_outgoing) || 0) 
    : (Number(lineSummary?.today_outgoing) || 0);

  const todayNet = isCombined 
    ? (Number(bagStatus?.today_net) || (todayIncome - todayOutgoing)) 
    : (Number(lineSummary?.today_net) || (todayIncome - todayOutgoing));

  const monthIncome = isCombined 
    ? (Number(bagStatus?.month_income) || 0) 
    : (Number(lineSummary?.month_income) || 0);

  const monthOutgoing = isCombined 
    ? (Number(bagStatus?.month_outgoing) || 0) 
    : (Number(lineSummary?.month_outgoing) || 0);

  const monthNet = isCombined 
    ? (Number(bagStatus?.month_net) || (monthIncome - monthOutgoing)) 
    : (Number(lineSummary?.month_net) || (monthIncome - monthOutgoing));

  const totalIncome = isCombined 
    ? (Number(bagStatus?.total_income) || 0) 
    : (Number(lineSummary?.total_income) || 0);

  const totalOutgoing = isCombined 
    ? (Number(bagStatus?.total_outgoing) || 0) 
    : (Number(lineSummary?.total_outgoing) || 0);

  const totalNet = isCombined 
    ? (Number(bagStatus?.total_net) || (totalIncome - totalOutgoing)) 
    : (Number(lineSummary?.net_amount) || (totalIncome - totalOutgoing));

  const todayDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const currentMonthName = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Mode theming
  const modeThemes = {
    all: {
      title: 'Ashok Finance Consolidated Overview',
      subtitle: 'Tracking Morning, Evening 1 & Evening 2 lines with ₹30,00,000 total baseline capital.',
      badgeText: 'CONSOLIDATED 3-LINE VIEW',
      bannerBg: 'from-slate-900 via-red-950 to-red-900',
      icon: Layers,
      lineLabel: 'Combined Bag Balance',
    },
    morning: {
      title: 'Ashok Finance Morning Line',
      subtitle: 'Daily Morning Collection, interest payments & loan disbursements with ₹10,00,000 dedicated baseline.',
      badgeText: 'DEDICATED MORNING WORKSPACE',
      bannerBg: 'from-amber-600 via-amber-700 to-red-700',
      icon: Sun,
      lineLabel: 'Morning Bag Balance',
    },
    evening_1: {
      title: 'Ashok Finance Evening Line 1',
      subtitle: 'Evening Market Collection & merchant line disbursements with ₹10,00,000 dedicated baseline.',
      badgeText: 'DEDICATED EVENING 1 WORKSPACE',
      bannerBg: 'from-red-700 via-red-800 to-rose-800',
      icon: Sunset,
      lineLabel: 'Evening 1 Bag Balance',
    },
    evening_2: {
      title: 'Ashok Finance Evening Line 2',
      subtitle: 'Night Route collection, emergency loans & repayments with ₹10,00,000 dedicated baseline.',
      badgeText: 'DEDICATED EVENING 2 WORKSPACE',
      bannerBg: 'from-rose-900 via-purple-900 to-slate-950',
      icon: Moon,
      lineLabel: 'Evening 2 Bag Balance',
    },
  };

  const theme = modeThemes[activeMode] || modeThemes.all;
  const BannerIcon = theme.icon;

  return (
    <div className="space-y-4">
      {/* Welcome Hero Banner */}
      <div className={`bg-gradient-to-r ${theme.bannerBg} rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden transition-all duration-300`}>
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/30 text-white text-xs font-semibold border border-white/20">
                <BannerIcon className="w-3.5 h-3.5 text-red-200" />
                <span>{theme.badgeText}</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/20 text-white/90 text-xs font-medium border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-white/70" />
                <span>{todayDateFormatted}</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              {theme.title}
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              {theme.subtitle}
            </p>
          </div>

          {/* Quick Bag Status Pill on Banner */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 sm:p-4 w-full md:w-auto md:min-w-[240px] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] sm:text-xs uppercase font-extrabold text-white/70 tracking-wider">
                {isCombined ? 'Total Bag Capital' : 'Line Bag Capital'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">{formatINR(currentBag)}</p>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${netBagGrowth >= 0 ? 'bg-emerald-500/25 text-emerald-200' : 'bg-red-400/25 text-red-200'}`}>
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Dedicated Monthly Overview Strip on Banner */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
              {currentMonthName} (MTD Performance):
            </span>
          </div>
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-3 font-semibold text-xs text-center sm:text-left">
            <div className="bg-white/10 px-2 py-1.5 rounded-lg text-white">
              <span className="block text-[9px] uppercase text-slate-300 font-bold sm:inline sm:mr-1">In:</span>
              <b className="text-emerald-300 font-extrabold text-[11px] sm:text-xs">+{formatINR(monthIncome)}</b>
            </div>
            <div className="bg-white/10 px-2 py-1.5 rounded-lg text-white">
              <span className="block text-[9px] uppercase text-slate-300 font-bold sm:inline sm:mr-1">Out:</span>
              <b className="text-red-300 font-extrabold text-[11px] sm:text-xs">-{formatINR(monthOutgoing)}</b>
            </div>
            <div className={`px-2 py-1.5 rounded-lg font-black border text-[11px] sm:text-xs ${
              monthNet >= 0 ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30' : 'bg-red-500/25 text-red-200 border-red-400/30'
            }`}>
              <span className="block text-[9px] uppercase text-slate-300 font-bold sm:inline sm:mr-1">Net:</span>
              <span>{monthNet >= 0 ? '+' : ''}{formatINR(monthNet)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Bag Balance */}
        <div className="bg-white rounded-2xl border border-red-200 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <span>{theme.lineLabel}</span>
              </span>
              <button
                onClick={onOpenEditBagModal}
                title="Adjust starting bag capital baseline"
                className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Bag</span>
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-700 tracking-tight">
              {formatINR(currentBag)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Starting Bag Baseline:</span>
            <span className="font-semibold text-slate-700">{formatINR(startingBag)}</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Bag Growth:</span>
            <span className={`font-bold inline-flex items-center ${netBagGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netBagGrowth >= 0 ? '+' : ''}{formatINR(netBagGrowth)} ({growthPercent}%)
            </span>
          </div>
        </div>

        {/* Card 2: Income (Monthly Primary with Today & Total) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {isCombined ? "Monthly Income" : "Line Monthly Income"}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">{currentMonthName}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              +{formatINR(monthIncome)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Today's Income:</span>
              <span className="font-bold text-emerald-700">+{formatINR(todayIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>All-Time Total:</span>
              <span className="font-medium text-slate-600">{formatINR(totalIncome)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Outgoing (Monthly Primary with Today & Total) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {isCombined ? "Monthly Outgoing" : "Line Monthly Outgoing"}
                </span>
                <span className="text-[10px] text-red-600 font-semibold">{currentMonthName}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
              -{formatINR(monthOutgoing)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Today's Outgoing:</span>
              <span className="font-bold text-red-700">-{formatINR(todayOutgoing)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>All-Time Total:</span>
              <span className="font-medium text-slate-600">{formatINR(totalOutgoing)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Net Cashflow */}
        <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${
          monthNet >= 0 
            ? 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200' 
            : 'bg-gradient-to-br from-red-50/70 to-white border-red-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  {isCombined ? "Monthly Net Flow" : "Line Monthly Net"}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">{currentMonthName}</span>
              </div>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                monthNet >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {monthNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              monthNet >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {monthNet >= 0 ? '+' : ''}{formatINR(monthNet)}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Today's Net:</span>
              <span className={`font-bold ${todayNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {todayNet >= 0 ? '+' : ''}{formatINR(todayNet)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>All-Time Net:</span>
              <span className="font-semibold text-slate-600">
                {totalNet >= 0 ? '+' : ''}{formatINR(totalNet)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

