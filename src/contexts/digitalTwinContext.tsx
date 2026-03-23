import React, { createContext, FC, ReactNode, useContext, useState, useCallback, useEffect } from 'react';
import { fetchVinFilter } from '../services/digitalTwinApi';

// ── Session storage helpers ───────────────────────────────────────────────────
const SS_VIN = 'dt_vin';
const SS_START = 'dt_startdate';
const SS_END = 'dt_enddate';

const getStored = (key: string, fallback: string): string => {
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const store = (key: string, val: string) => {
  try { sessionStorage.setItem(key, val); } catch { /* ignore */ }
};

// ── Default date range: last 30 days within the known data window ─────────────
const buildDefaultDates = () => {
  const now = new Date();
  // Clamp to data availability window: June 2023 – June 2025
  const dataEnd = new Date('2025-06-30');
  const dataStart = new Date('2023-06-01');
  const end = now < dataEnd ? now : dataEnd;
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  if (start < dataStart) start.setTime(dataStart.getTime());
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
};

const defaults = buildDefaultDates();

// ── Context interface ─────────────────────────────────────────────────────────
interface DtContextProps {
  vin: string;
  setVin: (v: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  vinList: string[];
  loadVins: () => void;
  apiParams: { vin: string; startdate: string; enddate: string; [key: string]: string };
}

const DtContext = createContext<DtContextProps>({} as DtContextProps);

// ── Provider ──────────────────────────────────────────────────────────────────
export const DtProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [vin, setVinState] = useState<string>(() => getStored(SS_VIN, '')); // VIN loaded from API on mount
  const [startDate, setStartDateState] = useState<string>(() => getStored(SS_START, defaults.start));
  const [endDate, setEndDateState] = useState<string>(() => getStored(SS_END, defaults.end));
  const [vinList, setVinList] = useState<string[]>([]);

  // Persist to session whenever values change
  const setVin = useCallback((v: string) => {
    store(SS_VIN, v);
    setVinState(v);
  }, []);

  const setStartDate = useCallback((d: string) => {
    store(SS_START, d);
    setStartDateState(d);
  }, []);

  const setEndDate = useCallback((d: string) => {
    store(SS_END, d);
    setEndDateState(d);
  }, []);

  // Load VIN list from API on mount
  const loadVins = useCallback(async () => {
    try {
      const data = await fetchVinFilter();
      if (Array.isArray(data) && data.length > 0) {
        const list = data.map((v: any) => v._id || v.vin || String(v)).filter(Boolean);
        setVinList(list);
        // If current VIN is not in the list, set to first available
        const current = getStored(SS_VIN, '');
        if (current && !list.includes(current)) {
          setVin(list[0]);
        } else if (!current && list.length > 0) {
          setVin(list[0]);
        }
      }
    } catch (e) {
      // keep defaults silently
    }
  }, [setVin]);

  useEffect(() => {
    loadVins();
  }, [loadVins]);

  return (
    <DtContext.Provider
      value={{
        vin,
        setVin,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        vinList,
        loadVins,
        apiParams: { vin, startdate: startDate, enddate: endDate },
      }}>
      {children}
    </DtContext.Provider>
  );
};

export const useDt = () => useContext(DtContext);
export default DtContext;
