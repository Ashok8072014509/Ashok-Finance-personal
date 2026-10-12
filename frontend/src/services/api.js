import { createClient } from '@supabase/supabase-js';

// Default configuration
const DEFAULT_LINES = [
  {
    id: 'morning',
    name: 'ASHOK FINANCE MORNING',
    description: 'Morning Collection & Disbursement Line',
    badge_color: '#DC2626',
  },
  {
    id: 'evening_1',
    name: 'ASHOK FINANCE EVENING 1',
    description: 'Evening Line 1 Collection & Disbursement',
    badge_color: '#B91C1C',
  },
  {
    id: 'evening_2',
    name: 'ASHOK FINANCE EVENING 2',
    description: 'Evening Line 2 Collection & Disbursement',
    badge_color: '#991B1B',
  },
];

const DEFAULT_STARTING_BAG = 1000000; // 10 Lakhs

// Helper to get or set Supabase credentials from localStorage or env
export const getSupabaseConfig = () => {
  const url = localStorage.getItem('af_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('af_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

export const saveSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('af_supabase_url', url.trim());
  else localStorage.removeItem('af_supabase_url');

  if (key) localStorage.setItem('af_supabase_key', key.trim());
  else localStorage.removeItem('af_supabase_key');

  initSupabaseClient();
};

let supabase = null;

const initSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (url && key && url.startsWith('http')) {
    try {
      supabase = createClient(url, key);
      return supabase;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      supabase = null;
    }
  } else {
    supabase = null;
  }
  return supabase;
};

initSupabaseClient();

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

// Backend API URL (Render or local backend)
export const getBackendUrl = () => {
  return localStorage.getItem('af_backend_url') || import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const saveBackendUrl = (url) => {
  if (url) localStorage.setItem('af_backend_url', url.trim());
  else localStorage.removeItem('af_backend_url');
};

// ----------------- LOCAL STORAGE INITIALIZATION -----------------
const LOCAL_STORAGE_KEY_ENTRIES = 'af_daily_entries';
const LOCAL_STORAGE_KEY_SETTINGS = 'af_bag_settings';

const getLocalSettings = () => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  const initial = {
    starting_bag: DEFAULT_STARTING_BAG,
    currency: 'INR',
    notes: 'Ashok Finance Initial Bag Capital (10 Lakhs)',
  };
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(initial));
  return initial;
};

const saveLocalSettings = (settings) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

const getLocalEntries = () => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ENTRIES);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Pre-seed sample realistic records for demonstration
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const initialEntries = [
    {
      id: 'demo-1',
      entry_date: today,
      line_id: 'morning',
      line_name: 'ASHOK FINANCE MORNING',
      income: 65000,
      outgoing: 25000,
      net_amount: 40000,
      notes: 'Morning interest collection & fresh disbursement',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      entry_date: today,
      line_id: 'evening_1',
      line_name: 'ASHOK FINANCE EVENING 1',
      income: 42000,
      outgoing: 18000,
      net_amount: 24000,
      notes: 'Market line collection',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      entry_date: yesterday,
      line_id: 'evening_2',
      line_name: 'ASHOK FINANCE EVENING 2',
      income: 38000,
      outgoing: 50000,
      net_amount: -12000,
      notes: 'Emergency merchant loan disbursement',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
  localStorage.setItem(LOCAL_STORAGE_KEY_ENTRIES, JSON.stringify(initialEntries));
  return initialEntries;
};

const saveLocalEntries = (entries) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_ENTRIES, JSON.stringify(entries));
};

// ----------------- CALCULATION HELPER -----------------
export const calculateBagStatus = (startingBag, entries) => {
  let totalIncome = 0;
  let totalOutgoing = 0;
  let todayIncome = 0;
  let todayOutgoing = 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  const linesSummary = {
    morning: { line_id: 'morning', line_name: 'ASHOK FINANCE MORNING', total_income: 0, total_outgoing: 0, net_amount: 0, entries_count: 0 },
    evening_1: { line_id: 'evening_1', line_name: 'ASHOK FINANCE EVENING 1', total_income: 0, total_outgoing: 0, net_amount: 0, entries_count: 0 },
    evening_2: { line_id: 'evening_2', line_name: 'ASHOK FINANCE EVENING 2', total_income: 0, total_outgoing: 0, net_amount: 0, entries_count: 0 },
  };

  entries.forEach((e) => {
    const inc = Number(e.income) || 0;
    const out = Number(e.outgoing) || 0;
    totalIncome += inc;
    totalOutgoing += out;

    if (e.entry_date === todayStr) {
      todayIncome += inc;
      todayOutgoing += out;
    }

    const lid = e.line_id;
    if (linesSummary[lid]) {
      linesSummary[lid].total_income += inc;
      linesSummary[lid].total_outgoing += out;
      linesSummary[lid].net_amount += (inc - out);
      linesSummary[lid].entries_count += 1;
    }
  });

  const totalNet = totalIncome - totalOutgoing;
  // Starting bag + net (adds if positive, subtracts if negative)
  const currentBag = startingBag + totalNet;
  const todayNet = todayIncome - todayOutgoing;

  return {
    starting_bag: startingBag,
    current_bag: currentBag,
    total_income: totalIncome,
    total_outgoing: totalOutgoing,
    total_net: totalNet,
    today_income: todayIncome,
    today_outgoing: todayOutgoing,
    today_net: todayNet,
    lines_summary: Object.values(linesSummary),
    total_entries: entries.length,
    as_of: new Date().toISOString(),
  };
};

// ----------------- UNIFIED DATA SERVICE -----------------
export const api = {
  getLines: async () => {
    return DEFAULT_LINES;
  },

  getBagStatus: async () => {
    // 1. Try Supabase if configured
    if (supabase) {
      try {
        const { data: sData } = await supabase.from('bag_settings').select('*').eq('id', 1).maybeSingle();
        const startingBag = Number(sData?.starting_bag) || DEFAULT_STARTING_BAG;

        const { data: eData } = await supabase.from('daily_entries').select('*');
        if (eData) {
          const status = calculateBagStatus(startingBag, eData);
          return { data: status, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase fetch failed, trying backend/local:', err);
      }
    }

    // 2. Try FastAPI Backend if available
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/bag`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          return { data, source: 'backend' };
        }
      } catch {
        // backend offline
      }
    }

    // 3. Fallback to LocalStorage
    const settings = getLocalSettings();
    const entries = getLocalEntries();
    const status = calculateBagStatus(Number(settings.starting_bag) || DEFAULT_STARTING_BAG, entries);
    return { data: status, source: 'local' };
  },

  updateStartingBag: async (newStartingBag, notes = '') => {
    const bagNum = Number(newStartingBag);

    // Update LocalStorage first
    const settings = getLocalSettings();
    settings.starting_bag = bagNum;
    if (notes) settings.notes = notes;
    saveLocalSettings(settings);

    // Sync to Supabase
    if (supabase) {
      try {
        await supabase.from('bag_settings').upsert({
          id: 1,
          starting_bag: bagNum,
          notes: notes || settings.notes,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase update failed:', e);
      }
    }

    // Sync to Backend
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/bag/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ starting_bag: bagNum, notes }),
        });
      } catch {
        // backend offline
      }
    }

    const entries = getLocalEntries();
    return calculateBagStatus(bagNum, entries);
  },

  getEntries: async (filters = {}) => {
    const { startDate, endDate, lineId } = filters;

    // 1. Supabase
    if (supabase) {
      try {
        let q = supabase.from('daily_entries').select('*');
        if (startDate) q = q.gte('entry_date', startDate);
        if (endDate) q = q.lte('entry_date', endDate);
        if (lineId && lineId !== 'all') q = q.eq('line_id', lineId);
        const { data, error } = await q.order('entry_date', { ascending: false });
        if (!error && data) {
          const lineMap = Object.fromEntries(DEFAULT_LINES.map((l) => [l.id, l.name]));
          const formatted = data.map((e) => ({
            ...e,
            line_name: lineMap[e.line_id] || e.line_id,
            net_amount: Number(e.income) - Number(e.outgoing),
          }));
          // cache to local
          saveLocalEntries(formatted);
          return { data: formatted, source: 'supabase' };
        }
      } catch (e) {
        console.warn('Supabase getEntries error:', e);
      }
    }

    // 2. Backend
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (lineId && lineId !== 'all') params.append('line_id', lineId);

        const res = await fetch(`${backendUrl}/api/entries?${params.toString()}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          saveLocalEntries(data);
          return { data, source: 'backend' };
        }
      } catch {
        // backend offline
      }
    }

    // 3. LocalStorage
    let local = getLocalEntries();
    if (startDate) {
      local = local.filter((e) => e.entry_date >= startDate);
    }
    if (endDate) {
      local = local.filter((e) => e.entry_date <= endDate);
    }
    if (lineId && lineId !== 'all') {
      local = local.filter((e) => e.line_id === lineId);
    }
    local.sort((a, b) => (b.entry_date > a.entry_date ? 1 : -1));
    return { data: local, source: 'local' };
  },

  createEntry: async (entryData) => {
    const lineMap = Object.fromEntries(DEFAULT_LINES.map((l) => [l.id, l.name]));
    const income = Number(entryData.income) || 0;
    const outgoing = Number(entryData.outgoing) || 0;
    const net = income - outgoing;
    const nowIso = new Date().toISOString();

    const newRecord = {
      id: 'af_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      entry_date: entryData.entry_date,
      line_id: entryData.line_id,
      line_name: lineMap[entryData.line_id] || entryData.line_id,
      income,
      outgoing,
      net_amount: net,
      notes: entryData.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 1. Save locally
    const current = getLocalEntries();
    const updated = [newRecord, ...current];
    saveLocalEntries(updated);

    // 2. Sync to Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.from('daily_entries').insert([{
          id: newRecord.id,
          entry_date: newRecord.entry_date,
          line_id: newRecord.line_id,
          income: newRecord.income,
          outgoing: newRecord.outgoing,
          net_amount: newRecord.net_amount,
          notes: newRecord.notes,
        }]).select();
        if (!error && data?.[0]) {
          newRecord.id = data[0].id;
        }
      } catch (e) {
        console.warn('Supabase createEntry sync failed:', e);
      }
    }

    // 3. Sync to Backend
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_date: newRecord.entry_date,
            line_id: newRecord.line_id,
            income: newRecord.income,
            outgoing: newRecord.outgoing,
            notes: newRecord.notes,
          }),
        });
      } catch {
        // backend offline
      }
    }

    return newRecord;
  },

  updateEntry: async (id, entryData) => {
    const lineMap = Object.fromEntries(DEFAULT_LINES.map((l) => [l.id, l.name]));
    const income = Number(entryData.income) || 0;
    const outgoing = Number(entryData.outgoing) || 0;
    const net = income - outgoing;
    const nowIso = new Date().toISOString();

    // 1. Update locally
    const current = getLocalEntries();
    const updated = current.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          entry_date: entryData.entry_date ?? e.entry_date,
          line_id: entryData.line_id ?? e.line_id,
          line_name: lineMap[entryData.line_id ?? e.line_id],
          income,
          outgoing,
          net_amount: net,
          notes: entryData.notes ?? e.notes,
          updated_at: nowIso,
        };
      }
      return e;
    });
    saveLocalEntries(updated);

    // 2. Supabase
    if (supabase) {
      try {
        await supabase.from('daily_entries').update({
          entry_date: entryData.entry_date,
          line_id: entryData.line_id,
          income,
          outgoing,
          net_amount: net,
          notes: entryData.notes,
          updated_at: nowIso,
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateEntry failed:', e);
      }
    }

    // 3. Backend
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/entries/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_date: entryData.entry_date,
            line_id: entryData.line_id,
            income,
            outgoing,
            notes: entryData.notes,
          }),
        });
      } catch {
        // backend offline
      }
    }

    return updated.find((e) => e.id === id);
  },

  deleteEntry: async (id) => {
    // 1. Local
    const current = getLocalEntries();
    const updated = current.filter((e) => e.id !== id);
    saveLocalEntries(updated);

    // 2. Supabase
    if (supabase) {
      try {
        await supabase.from('daily_entries').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteEntry failed:', e);
      }
    }

    // 3. Backend
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/entries/${id}`, { method: 'DELETE' });
      } catch {
        // backend offline
      }
    }

    return true;
  },

  // Direct backend PDF report stream
  getBackendPDFUrl: (filters = {}) => {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.lineId && filters.lineId !== 'all') params.append('line_id', filters.lineId);
    return `${backendUrl}/api/reports/pdf?${params.toString()}`;
  },
};
