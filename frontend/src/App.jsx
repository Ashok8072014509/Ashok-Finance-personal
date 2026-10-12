import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import WelcomeBanner from './components/WelcomeBanner';
import LineTabs from './components/LineTabs';
import TransactionsTable from './components/TransactionsTable';
import DailyEntryModal from './components/DailyEntryModal';
import EditEntryModal from './components/EditEntryModal';
import BagEditModal from './components/BagEditModal';
import SupabaseModal from './components/SupabaseModal';
import { api } from './services/api';
import { generateClientPDF } from './services/pdfGenerator';
import { Plus } from 'lucide-react';

export default function App() {
  const [lines, setLines] = useState([]);
  const [activeLineId, setActiveLineId] = useState('all');
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

  // Load all initial data
  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      // 1. Fetch lines
      const lineList = await api.getLines();
      setLines(lineList);

      // 2. Fetch Bag Status
      const statusRes = await api.getBagStatus();
      setBagStatus(statusRes.data);
      setDataSource(statusRes.source);

      // 3. Fetch Entries
      const entriesRes = await api.getEntries();
      setEntries(entriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-polling every 25 seconds for real-time sync
  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 25000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handler for adding a new entry
  const handleSaveEntry = async (entryData) => {
    await api.createEntry(entryData);
    await loadData(false);
  };

  // Handler for updating an existing entry
  const handleUpdateEntry = async (entryId, entryData) => {
    await api.updateEntry(entryId, entryData);
    await loadData(false);
  };

  // Handler for deleting an entry
  const handleDeleteEntry = async (entryId) => {
    await api.deleteEntry(entryId);
    await loadData(false);
  };

  // Handler for updating Starting Bag
  const handleSaveStartingBag = async (newStartingBag, notes) => {
    const updatedStatus = await api.updateStartingBag(newStartingBag, notes);
    setBagStatus(updatedStatus);
    await loadData(false);
  };

  // Trigger Edit Modal
  const handleOpenEdit = (entry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  // Export PDF Report
  const handleExportPDF = () => {
    const lineMap = Object.fromEntries(lines.map((l) => [l.id, l.name]));
    const currentLineName = activeLineId === 'all' ? 'All Lines Combined' : (lineMap[activeLineId] || activeLineId);
    
    // Filter entries by current view
    const exportEntries = activeLineId === 'all' 
      ? entries 
      : entries.filter((e) => e.line_id === activeLineId);

    generateClientPDF({
      bagStatus,
      entries: exportEntries,
      activeLineName: currentLineName,
      dateFilterLabel: 'All Records'
    });
  };

  const activeLineName = activeLineId === 'all' 
    ? 'All Lines Combined' 
    : lines.find((l) => l.id === activeLineId)?.name || 'Line View';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-red-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        dataSource={dataSource}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onExportPDF={handleExportPDF}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        
        {/* Welcome Section & Primary Financial Cards */}
        <WelcomeBanner
          bagStatus={bagStatus}
          onOpenEditBagModal={() => setIsBagEditModalOpen(true)}
        />

        {/* 3 Business Line Tabs (Morning, Evening 1, Evening 2) */}
        <LineTabs
          lines={lines}
          activeLineId={activeLineId}
          onSelectLine={setActiveLineId}
          linesSummary={bagStatus?.lines_summary || []}
        />

        {/* Responsive Ledger Entries Table & Filters */}
        <TransactionsTable
          entries={entries}
          activeLineId={activeLineId}
          activeLineName={activeLineName}
          onEditEntry={handleOpenEdit}
          onDeleteEntry={handleDeleteEntry}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            ASHOK FINANCE &copy; {new Date().getFullYear()} • Daily Line Ledger System
          </p>
          <p className="text-slate-400">
            Morning Line • Evening Line 1 • Evening Line 2 • Bag Baseline: ₹10,00,000
          </p>
        </div>
      </footer>

      {/* Floating Action Button (FAB) on Mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xl shadow-red-500/40 flex items-center justify-center transition cursor-pointer"
          aria-label="Add Daily Entry"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modals */}
      <DailyEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEntry}
        lines={lines}
        defaultLineId={activeLineId}
        currentBag={bagStatus?.current_bag || 1000000}
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
        currentBag={bagStatus?.current_bag || 1000000}
      />

      <BagEditModal
        isOpen={isBagEditModalOpen}
        onClose={() => setIsBagEditModalOpen(false)}
        startingBag={bagStatus?.starting_bag || 1000000}
        onSave={handleSaveStartingBag}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefresh={() => loadData(true)}
      />

    </div>
  );
}
