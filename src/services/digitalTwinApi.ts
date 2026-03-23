/**
 * Digital Twin API Service  (ENHANCED — v2)
 * Base URL: https://platform.ravity.io/services/api/
 *
 * FIXES vs v1:
 *  - vt_vehicle_usage: corrected 'stardate' → 'startdate'
 *  - vt_overview_vehicle_info: corrected 'edndate' → 'enddate'
 *  - Both VIN-filter endpoints are now merged in fetchVinFilter()
 *  - New endpoints wired: V2V comparison, DTC location, date filter
 */

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const DT_BASE_URL = isProduction
  ? '/rest-proxy'
  : (process.env.REACT_APP_DT_BASE_URL || 'https://platform.ravity.io/services/api').replace(/\/$/, '');

const DT_CLIENT_ID     = process.env.REACT_APP_DT_CLIENT_ID     || 'GSUSJGITCDXHEDBNLIUD@5129';
const DT_APP_NAME      = process.env.REACT_APP_DT_APP_NAME      || 'demo';
const DT_CLIENT_SECRET = process.env.REACT_APP_DT_CLIENT_SECRET || 'GSVDOAFXOXAAFTONROLX1774026824090';

export const DT_API_HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-www-form-urlencoded',
  clientid:     DT_CLIENT_ID,
  appname:      DT_APP_NAME,
  clientsecret: DT_CLIENT_SECRET,
};

export interface DtQueryParams {
  vin: string;
  startdate: string;
  enddate: string;
  [key: string]: string;
}

const toDateTime = (val: string): string => {
  if (!val) return val;
  return val.includes('T') ? val : `${val}T00:00:00`;
};

const buildUrl = (path: string, params: Record<string, string>) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      const formatted = (k === 'startdate' || k === 'enddate')
        ? toDateTime(v)
        : v;
      return `${encodeURIComponent(k)}=${encodeURIComponent(formatted)}`;
    })
    .join('&');
  return `${DT_BASE_URL}${path}${query ? '?' + query : ''}`;
};

const dtFetch = async (path: string, params: Record<string, string> = {}) => {
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers: DT_API_HEADERS });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
};

// ── VIN / Date Filter ─────────────────────────────────────────────────────────
/** Merges both VIN-filter endpoints and de-duplicates results */
export const fetchVinFilter = async (): Promise<any[]> => {
  const [a, b] = await Promise.allSettled([
    dtFetch('/vehicle_twin_vin_filter'),
    dtFetch('/df_vin_filter'),
  ]);
  const merge: any[] = [];
  const seen = new Set<string>();
  const push = (arr: any[]) => arr.forEach(v => {
    const id = v._id || v.vin || String(v);
    if (!seen.has(id)) { seen.add(id); merge.push(v); }
  });
  if (a.status === 'fulfilled' && Array.isArray(a.value)) push(a.value);
  if (b.status === 'fulfilled' && Array.isArray(b.value)) push(b.value);
  return merge;
};

export const fetchDateFilter = () => dtFetch('/vt_date_filter');

// ── Overview ──────────────────────────────────────────────────────────────────
export const fetchVehicleInfo = (vin: string) =>
  dtFetch('/vt_overview_vehicle_info', { vin, startdate: '', enddate: '' }); // FIX: was 'edndate'

export const fetchVehicleUsage = (p: DtQueryParams) =>
  dtFetch('/vt_vehicle_usage', { vin: p.vin, startdate: p.startdate, enddate: p.enddate }); // FIX: was 'stardate'

export const fetchOverallData = (p: DtQueryParams) =>
  dtFetch('/vt_overall_data', p);

// ── Climate Analysis ──────────────────────────────────────────────────────────
export const fetchAcDistribution = (p: DtQueryParams) =>
  dtFetch('/vt_ac_distribution', p);

export const fetchAcTempDistribution = (p: DtQueryParams) =>
  dtFetch('/df_ac_temperature_disturbution', p);

// ── Driving Analysis ──────────────────────────────────────────────────────────
export const fetchSummaryData = (p: DtQueryParams) =>
  dtFetch('/df_summary_data', p);

export const fetchTurnPercent = (p: DtQueryParams) =>
  dtFetch('/vt_turn_percent', p);

export const fetchLeftTurnPercent = (p: DtQueryParams) =>
  dtFetch('/df_driving_left_turn_percentage', p);

export const fetchRightTurnPercent = (p: DtQueryParams) =>
  dtFetch('/df_right_turn_percentage', p);

export const fetchSummaryBaselineTile = (p: DtQueryParams) =>
  dtFetch('/df_summary_baseline_tile', p);

// ── Fuel Analysis ─────────────────────────────────────────────────────────────
export const fetchFuelEvents = (p: DtQueryParams) =>
  dtFetch('/vt_fuel_events', p);

export const fetchFuelEvent = (p: DtQueryParams) =>
  dtFetch('/df_fuel_event', p);

export const fetchOverallKpiData = (p: DtQueryParams) =>
  dtFetch('/df_overall_kpi_data', p);

// ── Speed Analysis ────────────────────────────────────────────────────────────
export const fetchSpeedDistribution = (p: DtQueryParams) =>
  dtFetch('/df_speed_distribution', p);

// ── DTC Analysis ──────────────────────────────────────────────────────────────
export const fetchDtcInfo = (p: DtQueryParams) =>
  dtFetch('/vt_dtc_info', p);

export const fetchDtcTile = (p: DtQueryParams) =>
  dtFetch('/vt_dtc_tile', p);

export const fetchDtcTrend = (p: DtQueryParams) =>
  dtFetch('/vt_dtc_trend', p);

export const fetchDtcStatusCount = (p: DtQueryParams) =>
  dtFetch('/vt_dtc_status_count', p);

export const fetchDtcOccurrence = (p: DtQueryParams) =>
  dtFetch('/vt_count_dtc_occ', p);

/** NEW — returns lat/lng of where each DTC fault occurred */
export const fetchDtcLocationData = (p: DtQueryParams & { dtc_type?: string }) =>
  dtFetch('/vt_dtc_location_data', { ...p, dtc_type: p.dtc_type || '' });

// ── V2V Comparison APIs (NEW — previously unused) ─────────────────────────────
export interface V2VParams extends DtQueryParams { vin1: string; }

export const fetchV2VAcTempDistribution = (p: V2VParams) =>
  dtFetch('/df_v2v_ac_temperature_distribution', p as any);

export const fetchV2VRightTurnPercent = (p: V2VParams) =>
  dtFetch('/df_v2v_right_turn_percent', p as any);

export const fetchV2VFuelEvent = (p: V2VParams) =>
  dtFetch('/df_v2v_fuel_event', p as any);
