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

const DEFAULT_LINE_STARTING_BAGS = {
  morning: 1000000,
  evening_1: 1000000,
  evening_2: 1000000,
};

const DEFAULT_STARTING_BAG = 3000000; // 3 lines combined default (10L each)

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
      const parsed = JSON.parse(raw);
      if (!parsed.line_starting_bags) {
        parsed.line_starting_bags = { ...DEFAULT_LINE_STARTING_BAGS };
        parsed.starting_bag = 3000000;
        localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  const initial = {
    starting_bag: DEFAULT_STARTING_BAG,
    line_starting_bags: { ...DEFAULT_LINE_STARTING_BAGS },
    currency: 'INR',
    notes: 'Ashok Finance Initial Bag Capital (10 Lakhs per line)',
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
      notes: 'Morning collection & fresh loan disbursement',
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
      notes: 'Market line daily collection',
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
export const calculateBagStatus = (startingBagsInput, entries = []) => {
  let lineStartingBags = { ...DEFAULT_LINE_STARTING_BAGS };
  if (typeof startingBagsInput === 'object' && startingBagsInput !== null) {
    if (startingBagsInput.line_starting_bags) {
      lineStartingBags = { ...lineStartingBags, ...startingBagsInput.line_starting_bags };
    } else {
      lineStartingBags = { ...lineStartingBags, ...startingBagsInput };
    }
  } else if (typeof startingBagsInput === 'number') {
    if (startingBagsInput === 1000000) {
      lineStartingBags = { morning: 1000000, evening_1: 1000000, evening_2: 1000000 };
    } else {
      const perLine = Math.round(startingBagsInput / 3);
      lineStartingBags = { morning: perLine, evening_1: perLine, evening_2: perLine };
    }
  }

  const linesSummary = {
    morning: { 
      line_id: 'morning', 
      line_name: 'ASHOK FINANCE MORNING', 
      starting_bag: Number(lineStartingBags.morning) || 1000000,
      total_income: 0, 
      total_outgoing: 0, 
      net_amount: 0, 
      today_income: 0,
      today_outgoing: 0,
      today_net: 0,
      month_income: 0,
      month_outgoing: 0,
      month_net: 0,
      entries_count: 0 
    },
    evening_1: { 
      line_id: 'evening_1', 
      line_name: 'ASHOK FINANCE EVENING 1', 
      starting_bag: Number(lineStartingBags.evening_1) || 1000000,
      total_income: 0, 
      total_outgoing: 0, 
      net_amount: 0, 
      today_income: 0,
      today_outgoing: 0,
      today_net: 0,
      month_income: 0,
      month_outgoing: 0,
      month_net: 0,
      entries_count: 0 
    },
    evening_2: { 
      line_id: 'evening_2', 
      line_name: 'ASHOK FINANCE EVENING 2', 
      starting_bag: Number(lineStartingBags.evening_2) || 1000000,
      total_income: 0, 
      total_outgoing: 0, 
      net_amount: 0, 
      today_income: 0,
      today_outgoing: 0,
      today_net: 0,
      month_income: 0,
      month_outgoing: 0,
      month_net: 0,
      entries_count: 0 
    },
  };

  let totalIncome = 0;
  let totalOutgoing = 0;
  let todayIncome = 0;
  let todayOutgoing = 0;
  let monthIncome = 0;
  let monthOutgoing = 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = new Date().toISOString().slice(0, 7);

  entries.forEach((e) => {
    const inc = Number(e.income) || 0;
    const out = Number(e.outgoing) || 0;
    totalIncome += inc;
    totalOutgoing += out;

    const isToday = (e.entry_date === todayStr);
    const isMonth = (e.entry_date && e.entry_date.startsWith(monthPrefix));

    if (isToday) {
      todayIncome += inc;
      todayOutgoing += out;
    }

    if (isMonth) {
      monthIncome += inc;
      monthOutgoing += out;
    }

    const lid = e.line_id;
    if (linesSummary[lid]) {
      linesSummary[lid].total_income += inc;
      linesSummary[lid].total_outgoing += out;
      linesSummary[lid].net_amount += (inc - out);
      linesSummary[lid].entries_count += 1;
      if (isToday) {
        linesSummary[lid].today_income += inc;
        linesSummary[lid].today_outgoing += out;
        linesSummary[lid].today_net += (inc - out);
      }
      if (isMonth) {
        linesSummary[lid].month_income += inc;
        linesSummary[lid].month_outgoing += out;
        linesSummary[lid].month_net += (inc - out);
      }
    }
  });

  // Calculate line-specific current bags and growth
  Object.keys(linesSummary).forEach((lid) => {
    const item = linesSummary[lid];
    item.current_bag = item.starting_bag + item.net_amount;
    item.growth_amount = item.current_bag - item.starting_bag;
    item.growth_percent = item.starting_bag > 0 ? Number(((item.growth_amount / item.starting_bag) * 100).toFixed(2)) : 0;
  });

  const totalStartingBag = Object.values(lineStartingBags).reduce((a, b) => a + Number(b), 0);
  const totalNet = totalIncome - totalOutgoing;
  const totalCurrentBag = totalStartingBag + totalNet;
  const todayNet = todayIncome - todayOutgoing;
  const monthNet = monthIncome - monthOutgoing;
  const growthAmount = totalCurrentBag - totalStartingBag;
  const growthPercent = totalStartingBag > 0 ? Number(((growthAmount / totalStartingBag) * 100).toFixed(2)) : 0;

  return {
    starting_bag: totalStartingBag,
    current_bag: totalCurrentBag,
    total_income: totalIncome,
    total_outgoing: totalOutgoing,
    total_net: totalNet,
    today_income: todayIncome,
    today_outgoing: todayOutgoing,
    today_net: todayNet,
    month_income: monthIncome,
    month_outgoing: monthOutgoing,
    month_net: monthNet,
    growth_amount: growthAmount,
    growth_percent: growthPercent,
    lines_summary: Object.values(linesSummary),
    line_starting_bags: lineStartingBags,
    total_entries: entries.length,
    as_of: new Date().toISOString(),
  };
};


export const api = {
  getLines: async () => {
    return DEFAULT_LINES;
  },

  // High-speed single roundtrip initialization
  getBootstrap: async () => {
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/bootstrap`, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data.entries) saveLocalEntries(data.entries);
          return {
            lines: data.lines || DEFAULT_LINES,
            bagStatus: data.bag_status,
            entries: data.entries || [],
            source: data.database_source === 'supabase' ? 'supabase' : 'backend',
          };
        }
      } catch {
        // Backend offline, fallback below
      }
    }

    // Fallback parallel fetch
    const [statusRes, entriesRes] = await Promise.all([
      api.getBagStatus(),
      api.getEntries()
    ]);
    return {
      lines: DEFAULT_LINES,
      bagStatus: statusRes.data,
      entries: entriesRes.data,
      source: statusRes.source,
    };
  },

  getBagStatus: async () => {
    // 1. Try Supabase if configured
    if (supabase) {
      try {
        let lineBags = { ...DEFAULT_LINE_STARTING_BAGS };
        const { data: lbsData } = await supabase.from('line_bag_settings').select('*');
        if (lbsData && lbsData.length > 0) {
          lbsData.forEach((row) => {
            lineBags[row.line_id] = Number(row.starting_bag);
          });
        } else {
          const { data: sData } = await supabase.from('bag_settings').select('*').eq('id', 1).maybeSingle();
          if (sData?.starting_bag) {
            const perLine = Math.round(Number(sData.starting_bag) / 3);
            lineBags = { morning: perLine, evening_1: perLine, evening_2: perLine };
          }
        }

        const { data: eData } = await supabase.from('daily_entries').select('*');
        if (eData) {
          const status = calculateBagStatus(lineBags, eData);
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
          const source = data.database_source === 'supabase' ? 'supabase' : 'backend';
          return { data, source };
        }
      } catch {
        // backend offline
      }
    }

    // 3. Fallback to LocalStorage
    const settings = getLocalSettings();
    const entries = getLocalEntries();
    const status = calculateBagStatus(settings.line_starting_bags || settings.starting_bag, entries);
    return { data: status, source: 'local' };
  },

  updateStartingBag: async (newStartingBag, notes = '', lineId = null, lineStartingBags = null) => {
    const settings = getLocalSettings();
    let currentBags = { ...settings.line_starting_bags };

    if (lineStartingBags) {
      currentBags = { ...currentBags, ...lineStartingBags };
    } else if (lineId && lineId !== 'all') {
      currentBags[lineId] = Number(newStartingBag);
    } else if (newStartingBag !== null && newStartingBag !== undefined) {
      currentBags = {
        morning: Number(newStartingBag),
        evening_1: Number(newStartingBag),
        evening_2: Number(newStartingBag),
      };
    }

    settings.line_starting_bags = currentBags;
    settings.starting_bag = Object.values(currentBags).reduce((a, b) => a + Number(b), 0);
    if (notes) settings.notes = notes;
    saveLocalSettings(settings);

    // Sync to Supabase
    if (supabase) {
      try {
        for (const [lid, amt] of Object.entries(currentBags)) {
          await supabase.from('line_bag_settings').upsert({
            line_id: lid,
            starting_bag: amt,
            notes,
            updated_at: new Date().toISOString(),
          });
        }
        await supabase.from('bag_settings').upsert({
          id: 1,
          starting_bag: settings.starting_bag,
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
          body: JSON.stringify({ 
            starting_bag: settings.starting_bag, 
            line_id: lineId,
            line_starting_bags: currentBags,
            notes 
          }),
        });
      } catch {
        // backend offline
      }
    }

    const entries = getLocalEntries();
    return calculateBagStatus(currentBags, entries);
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

    // 1. Immediately update locally & compute bag status in memory (0ms UI latency)
    const current = getLocalEntries();
    const updated = [newRecord, ...current];
    saveLocalEntries(updated);

    const settings = getLocalSettings();
    const immediateBagStatus = calculateBagStatus(settings.line_starting_bags || settings.starting_bag, updated);

    // 2. Seamless remote cloud sync (Backend priority, then Supabase)
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      fetch(`${backendUrl}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: newRecord.entry_date,
          line_id: newRecord.line_id,
          income: newRecord.income,
          outgoing: newRecord.outgoing,
          notes: newRecord.notes,
        }),
      }).catch((err) => console.warn('Backend sync failed:', err));
    } else if (supabase) {
      supabase.from('daily_entries').insert([{
        id: newRecord.id,
        entry_date: newRecord.entry_date,
        line_id: newRecord.line_id,
        income: newRecord.income,
        outgoing: newRecord.outgoing,
        net_amount: newRecord.net_amount,
        notes: newRecord.notes,
      }]).then(({ data, error }) => {
        if (!error && data?.[0]) {
          newRecord.id = data[0].id;
        }
      }).catch((err) => console.warn('Supabase sync failed:', err));
    }

    return { entry: newRecord, bagStatus: immediateBagStatus, entries: updated };
  },

  updateEntry: async (id, entryData) => {
    const lineMap = Object.fromEntries(DEFAULT_LINES.map((l) => [l.id, l.name]));
    const income = Number(entryData.income) || 0;
    const outgoing = Number(entryData.outgoing) || 0;
    const net = income - outgoing;
    const nowIso = new Date().toISOString();

    // 1. Update locally & compute new bag balance immediately
    const current = getLocalEntries();
    let updatedRecord = null;
    const updated = current.map((e) => {
      if (e.id === id) {
        updatedRecord = {
          ...e,
          entry_date: entryData.entry_date ?? e.entry_date,
          line_id: entryData.line_id ?? e.line_id,
          line_name: lineMap[entryData.line_id ?? e.line_id] || e.line_id,
          income,
          outgoing,
          net_amount: net,
          notes: entryData.notes ?? e.notes,
          updated_at: nowIso,
        };
        return updatedRecord;
      }
      return e;
    });
    saveLocalEntries(updated);

    const settings = getLocalSettings();
    const immediateBagStatus = calculateBagStatus(settings.line_starting_bags || settings.starting_bag, updated);

    // 2. Remote sync
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      fetch(`${backendUrl}/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: entryData.entry_date,
          line_id: entryData.line_id,
          income,
          outgoing,
          notes: entryData.notes,
        }),
      }).catch((err) => console.warn('Backend update failed:', err));
    } else if (supabase) {
      supabase.from('daily_entries').update({
        entry_date: entryData.entry_date,
        line_id: entryData.line_id,
        income,
        outgoing,
        net_amount: net,
        notes: entryData.notes,
        updated_at: nowIso,
      }).eq('id', id).catch((err) => console.warn('Supabase update failed:', err));
    }

    return { entry: updatedRecord, bagStatus: immediateBagStatus, entries: updated };
  },

  deleteEntry: async (id) => {
    // 1. Immediately delete locally & recalculate bag status
    const current = getLocalEntries();
    const updated = current.filter((e) => e.id !== id);
    saveLocalEntries(updated);

    const settings = getLocalSettings();
    const immediateBagStatus = calculateBagStatus(settings.line_starting_bags || settings.starting_bag, updated);

    // 2. Remote sync
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      fetch(`${backendUrl}/api/entries/${id}`, { method: 'DELETE' }).catch((err) => console.warn('Backend delete failed:', err));
    } else if (supabase) {
      supabase.from('daily_entries').delete().eq('id', id).catch((err) => console.warn('Supabase delete failed:', err));
    }

    return { bagStatus: immediateBagStatus, entries: updated };
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
