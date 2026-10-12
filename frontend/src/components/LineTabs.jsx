import React from 'react';
import { Sun, Moon, Sparkles, Layers } from 'lucide-react';
import { formatINR } from '../services/pdfGenerator';

export default function LineTabs({ 
  lines = [], 
  activeLineId, 
  onSelectLine, 
  linesSummary = [] 
}) {
  const summaryMap = Object.fromEntries(linesSummary.map((s) => [s.line_id, s]));

  const getLineIcon = (id) => {
    switch (id) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'evening_1':
        return <Moon className="w-4 h-4 text-red-500" />;
      case 'evening_2':
        return <Sparkles className="w-4 h-4 text-rose-500" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  const tabs = [
    { id: 'all', name: 'All Lines Combined', isAll: true },
    ...lines
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
        {tabs.map((tab) => {
          const isActive = activeLineId === tab.id;
          const summary = summaryMap[tab.id];
          const net = summary ? summary.net_amount : null;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectLine(tab.id)}
              className={`flex-1 min-w-[180px] sm:min-w-0 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition flex items-center justify-between space-x-2 whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-red-50/60 text-slate-700 hover:text-red-700 border-slate-200/80 hover:border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className={`p-1 rounded-md ${isActive ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
                  {getLineIcon(tab.id)}
                </span>
                <span className="font-bold truncate">{tab.name}</span>
              </div>

              {net !== null && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : net >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {net >= 0 ? '+' : ''}{formatINR(net)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
