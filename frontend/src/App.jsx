import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import FinanceModeBar from './components/FinanceModeBar';
import WelcomeBanner from './components/WelcomeBanner';
import ComparisonGrid from './components/ComparisonGrid';
import TransactionsTable from './components/TransactionsTable';
import DailyEntryModal from './components/DailyEntryModal';
import EditEntryModal from './components/EditEntryModal';
import BagEditModal from './components/BagEditModal';
import SupabaseModal from './components/SupabaseModal';
import ExportPdfModal from './components/ExportPdfModal';
import { api } from './services/api';
import { generateClientPDF } from './services/pdfGenerator';
import { Plus, Layers, Sun, Sunset, Moon } from 'lucide-react';

export default function App() {
  const [lines, setLines] = useState([]);
  const [activeLineId, setActiveLineId] = useState('all'); // 'all', 'morning', 'evening_1', 'evening_2'
  const [bagStatus, setBagStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [dataSource, setDataSource] = useState('local');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isBagEditModalOpen, setIsBagEditModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  // High-speed data load (1 roundtrip bootstrap)
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await api.getBootstrap();
      if (res.lines?.length) setLines(res.lines);
      if (res.bagStatus) setBagStatus(res.bagStatus);
      if (res.entries) setEntries(res.entries);
      if (res.source) setDataSource(res.source);
    } catch (err) {
      console.error('Error in high-speed bootstrap:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-polling every 25 seconds for cloud sync
  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 25000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Zero-latency optimistic handler for adding an entry
  const handleSaveEntry = async (entryData) => {
    const res = await api.createEntry(entryData);
    if (res?.bagStatus) setBagStatus(res.bagStatus);
    if (res?.entries) setEntries(res.entries);
  };

  // Zero-latency optimistic handler for updating an entry
  const handleUpdateEntry = async (entryId, entryData) => {
    const res = await api.updateEntry(entryId, entryData);
    if (res?.bagStatus) setBagStatus(res.bagStatus);
    if (res?.entries) setEntries(res.entries);
  };

  // Zero-latency optimistic handler for deleting an entry
  const handleDeleteEntry = async (entryId) => {
    const res = await api.deleteEntry(entryId);
    if (res?.bagStatus) setBagStatus(res.bagStatus);
    if (res?.entries) setEntries(res.entries);
  };

  // Zero-latency handler for updating Starting Bag
  const handleSaveStartingBag = async (newStartingBag, notes, targetLine = 'all') => {
    const updatedStatus = await api.updateStartingBag(newStartingBag, notes, targetLine);
    if (updatedStatus) setBagStatus(updatedStatus);
  };

  // Trigger Edit Modal
  const handleOpenEdit = (entry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  // Open PDF Statement Export Modal
  const handleExportPDF = () => {
    setIsExportPdfModalOpen(true);
  };

  const activeLineName = activeLineId === 'all' 
    ? 'All Lines Combined' 
    : lines.find((l) => l.id === activeLineId)?.name || 'Line View';

  // Get active line current bag
  const activeLineSummary = bagStatus?.lines_summary?.find((l) => l.line_id === activeLineId);
  const activeLineBag = activeLineId === 'all' 
    ? (bagStatus?.current_bag || 3000000) 
    : (activeLineSummary?.current_bag || 1000000);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-red-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        dataSource={dataSource}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onExportPDF={handleExportPDF}
        activeLineId={activeLineId}
        activeLineName={activeLineName}
      />


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 pb-24 sm:pb-8">
        
        {/* Workspace Mode Bar: Toggle between All Finances and dedicated lines */}
        <FinanceModeBar
          activeMode={activeLineId}
          onSelectMode={setActiveLineId}
          linesSummary={bagStatus?.lines_summary || []}
          bagStatus={bagStatus}
        />

        {/* Welcome Section & Primary Financial Cards (Adapts to Active Mode) */}
        <WelcomeBanner
          bagStatus={bagStatus}
          activeMode={activeLineId}
          onOpenEditBagModal={() => setIsBagEditModalOpen(true)}
        />

        {/* Side-by-Side 3-Way Comparison Matrix (Visible in Combined Overview Mode) */}
        {activeLineId === 'all' && (
          <ComparisonGrid
            linesSummary={bagStatus?.lines_summary || []}
            onSelectMode={setActiveLineId}
            bagStatus={bagStatus}
          />
        )}

        {/* Responsive Ledger Entries Table & Filters */}
        <TransactionsTable
          entries={entries}
          activeLineId={activeLineId}
          activeLineName={activeLineName}
          onEditEntry={handleOpenEdit}
          onDeleteEntry={handleDeleteEntry}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenExportPdfModal={() => setIsExportPdfModalOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            ASHOK FINANCE &copy; {new Date().getFullYear()} • 3 Dedicated Finance Lines System
          </p>
          <p className="text-slate-400">
            Morning (₹10L Base) • Evening 1 (₹10L Base) • Evening 2 (₹10L Base) • Total Baseline: ₹30,00,000
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav" 
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        <button
          id="mobile-nav-all"
          onClick={() => setActiveLineId('all')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
            activeLineId === 'all' ? 'text-red-600 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">All</span>
        </button>

        <button
          id="mobile-nav-morning"
          onClick={() => setActiveLineId('morning')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
            activeLineId === 'morning' ? 'text-amber-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sun className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Morning</span>
        </button>

        {/* Center Elevated Action Button */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            id="mobile-nav-add-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-700 to-rose-600 text-white shadow-xl shadow-red-600/40 ring-4 ring-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            aria-label="Record Daily Entry"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-center text-[9px] font-black uppercase text-red-600 mt-0.5 tracking-tight">
            Record
          </span>
        </div>

        <button
          id="mobile-nav-evening-1"
          onClick={() => setActiveLineId('evening_1')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
            activeLineId === 'evening_1' ? 'text-rose-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sunset className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Eve 1</span>
        </button>

        <button
          id="mobile-nav-evening-2"
          onClick={() => setActiveLineId('evening_2')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
            activeLineId === 'evening_2' ? 'text-purple-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Moon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Eve 2</span>
        </button>
      </nav>

      {/* Modals */}
      <DailyEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEntry}
        lines={lines}
        linesSummary={bagStatus?.lines_summary || []}
        defaultLineId={activeLineId}
        currentBag={activeLineBag}
      />

      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        lines={lines}
        linesSummary={bagStatus?.lines_summary || []}
        currentBag={activeLineBag}
      />

      <BagEditModal
        isOpen={isBagEditModalOpen}
        onClose={() => setIsBagEditModalOpen(false)}
        startingBag={bagStatus?.starting_bag || 3000000}
        lineStartingBags={bagStatus?.line_starting_bags || {}}
        defaultLineId={activeLineId}
        onSave={handleSaveStartingBag}
      />

      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        entries={entries}
        bagStatus={bagStatus}
        defaultLineId={activeLineId}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefresh={() => loadData(true)}
      />

    </div>
  );
}

