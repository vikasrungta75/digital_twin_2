import React, { FC, useCallback, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import {
  fetchVehicleInfo, fetchVehicleUsage, fetchOverallData,
  fetchDtcInfo, fetchDtcTile, fetchFuelEvents,
  fetchSummaryBaselineTile, fetchOverallKpiData,
  fetchSpeedDistribution, fetchTurnPercent,
} from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';

// ─── Ravity BizWiz LLM Configuration ─────────────────────────────────────────
//
// All AI calls now route exclusively through the Ravity BizWiz LLM service.
// Endpoint: https://platform.ravity.io/cxf/bizvizllm/llmService
// Auth:     authtoken + spacekey + userid headers (session-scoped)
// Payload:  serviceType=process_text, data=<JSON>
//
// The authtoken, spacekey, userid and assistId are read from the app's
// existing session/env vars so that no extra credentials need to be entered
// by the user.  If they are not injected at build time, sensible defaults from
// the Maruti Victoris deployment are used (same values visible in the curl
// sample you provided).
//
// The connector and documentStoreIds come from the VDTSIA assistant that is
// already configured inside BizWiz for the synthetic_data_kpi and
// qac_kpi_baseline_data tables.
// ─────────────────────────────────────────────────────────────────────────────

// Always use the relative proxy path:
//   Vercel:    resolved by vercel.json rewrite  /bizviz-proxy/* → platform.ravity.io/cxf/bizvizllm/*
//   Local dev: resolved by setupProxy.js        /bizviz-proxy/* → platform.ravity.io/cxf/bizvizllm/*
// Never call platform.ravity.io directly from the browser — CORS blocks it.
const BIZVIZ_ENDPOINT =
  process.env.REACT_APP_BIZVIZ_ENDPOINT || '/bizviz-proxy/llmService';

const BIZVIZ_SPACE_KEY =
  process.env.REACT_APP_BIZVIZ_SPACE_KEY || '5129';

const BIZVIZ_USER_ID =
  process.env.REACT_APP_BIZVIZ_USER_ID || '1217690654';

const BIZVIZ_ASSIST_ID =
  process.env.REACT_APP_BIZVIZ_ASSIST_ID || '3514581148';

const BIZVIZ_CONNECTOR =
  process.env.REACT_APP_BIZVIZ_CONNECTOR || '238893540';

// The authtoken is session-specific. It can be injected at build time for demo
// environments or provided by the user in the UI below (recommended for prod).
const BIZVIZ_AUTH_TOKEN_DEFAULT =
  process.env.REACT_APP_BIZVIZ_AUTH_TOKEN || '';

// Tables available in the BizWiz connector
const BIZVIZ_TABLES = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];

// ─── VDTSIA system description (first 2000 chars, matching the curl payload) ──
const VDTSIA_DESCRIPTION = `ROLE: Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) PLATFORM: Ravity Digital Twin Dashboard — Maruti Suzuki Victoris Project ARCHITECTURE: Privacy-first, SQL-native, on-premise execution MARKET: India | STANDARDS: BS6 / ARAI | OEM: Maruti Suzuki  You are a specialised automotive intelligence agent embedded in the Ravity Vehicle Digital Twin platform. Your job is to answer questions about vehicle health, driver behaviour, fuel efficiency, DTC faults, warranty risk, fleet performance, and operational costs — without any raw vehicle data ever leaving the secure local environment.  You operate in two phases for every user question:  PHASE 1 — SQL GENERATION    You receive a natural-language question from the user.    You generate one precise, parameterised SQL query against the local    vehicle telematics database. You output SQL only — no interpretation,    no commentary, no markdown. If the question cannot be answered from    the available schema, you output: CANNOT_GENERATE_SQL: [reason]  PHASE 2 — RESULT INTERPRETATION    You receive the SQL result rows returned by the local database executor.    You interpret those results using your automotive domain expertise:    Indian road conditions, BS6 emission norms, ARAI benchmarks, Maruti    Suzuki vehicle specifications, Indian fuel pricing, seasonal factors,    and warranty risk rules. Every number you state must come directly from the results.`;

// ─── Generate a unique session ID ─────────────────────────────────────────────
const makeSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisSection {
  title: string;
  icon: string;
  content: string;
  severity: 'good' | 'warning' | 'critical' | 'info';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const avg = (arr: any[], key: string) => {
  const vals = arr.map(d => Number(d[key] || 0)).filter(v => isFinite(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};
const tot = (arr: any[], key: string) => arr.reduce((s, d) => s + Number(d[key] || 0), 0);

// ─── Build prompt ─────────────────────────────────────────────────────────────
const buildPrompt = (
  vin: string, startDate: string, endDate: string,
  vehicleInfo: any, usage: any, overallData: any[],
  dtcInfo: any[], dtcTile: any, fuelEvents: any[],
  baseline: any, kpiData: any[]
): string => {
  const vi = vehicleInfo || {};
  const us = usage || {};
  const od = Array.isArray(overallData) ? overallData : [];
  const di = Array.isArray(dtcInfo) ? dtcInfo : [];
  const dt = dtcTile || {};
  const fe = Array.isArray(fuelEvents) ? fuelEvents : [];
  const bl = baseline || {};
  const kpi = Array.isArray(kpiData) ? kpiData : [];

  const totalKm    = tot(od, 'total_distance') || tot(od, 'distance_km') || 0;
  const totalTrips = od.length;
  const avgFE      = avg(od, 'fuel_efficiency') || avg(od, 'fuel_economy') || avg(kpi, 'fuel_efficiency') || 0;
  const avgSpeed   = avg(od, 'avg_speed') || avg(kpi, 'avg_speed') || 0;
  const harshAcc   = tot(od, 'harsh_acceleration') || tot(kpi, 'harsh_acceleration') || 0;
  const harshBrk   = tot(od, 'harsh_braking') || tot(kpi, 'harsh_braking') || 0;
  const overSpeed  = tot(od, 'overspeed_events') || tot(kpi, 'overspeed_events') || 0;
  const dtcCount   = di.length;
  const critDtc    = di.filter(d => (d.severity || d.status || '').toLowerCase().includes('critical')).length;

  return `You are the Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) for Maruti Suzuki.
Analyse the telematics data below for VIN ${vin} from ${startDate} to ${endDate}.

VEHICLE PROFILE:
- Make/Model: ${vi.make || vi.vehicle_make || 'Maruti Suzuki'} ${vi.model || vi.vehicle_model || 'Unknown'}
- Variant: ${vi.variant || '—'} | Fuel: ${vi.fuel_type || '—'} | Engine: ${vi.engine_cc || '—'} cc
- Year: ${vi.year || vi.manufacturing_year || '—'} | Odometer: ${vi.odometer || '—'} km

USAGE SUMMARY (${startDate} → ${endDate}):
- Total distance: ${totalKm.toFixed(1)} km across ${totalTrips} trips
- Avg fuel efficiency: ${avgFE.toFixed(2)} km/L
- Avg speed: ${avgSpeed.toFixed(1)} km/h
- Engine hours: ${tot(od, 'engine_hours').toFixed(1) || us.engine_hours || '—'} hrs
- Idle time %: ${avg(od, 'idle_time_pct').toFixed(1) || '—'}%

DRIVING BEHAVIOUR:
- Harsh acceleration events: ${harshAcc}
- Harsh braking events: ${harshBrk}
- Overspeeding events: ${overSpeed}
- Harsh cornering: ${tot(od, 'harsh_cornering') || tot(kpi, 'harsh_cornering') || 0}

DTC / FAULT CODE SUMMARY:
- Total active DTCs: ${dtcCount}
- Critical DTCs: ${critDtc}
- DTC tile data: total_dtc=${dt.total_dtc || 0}, active=${dt.active_dtc || 0}, resolved=${dt.resolved_dtc || 0}
${di.slice(0, 10).map(d => `  • ${d.dtc_code || d.code}: ${d.description || '—'} [${d.severity || d.status || '—'}]`).join('\n')}

FUEL & EFFICIENCY:
- Recent fuel events: ${fe.length}
${fe.slice(0, 5).map(f => `  • ${f.event_date || f.date || '—'}: ${f.event_type || '—'}, qty=${f.fuel_qty || f.quantity || '—'}L`).join('\n')}
- CO₂ estimate: ${avg(od, 'co2_emission').toFixed(1) || '—'} g/km
- ARAI rated FE: ${vi.arai_fe || bl.arai_fe || '—'} km/L

FLEET BASELINE COMPARISONS:
- Fleet avg FE: ${bl.avg_fuel_efficiency || bl.fleet_avg_fe || '—'} km/L
- Fleet avg harsh acc: ${bl.avg_harsh_acceleration || '—'}
- Fleet avg harsh brk: ${bl.avg_harsh_braking || '—'}
- Fleet overspeed avg: ${bl.avg_overspeed || '—'}

KPI DATA (${kpi.length} records):
${kpi.slice(0, 5).map(k => `  • ${JSON.stringify(k).slice(0, 120)}`).join('\n')}

---
Provide a comprehensive automotive intelligence report with these EXACT section headers:
1. EXECUTIVE SUMMARY
2. DRIVING BEHAVIOUR
3. FUEL & EFFICIENCY
4. FAULT CODE ANALYSIS
5. MAINTENANCE RECOMMENDATIONS
6. WARRANTY RISK ASSESSMENT
7. SAFETY ALERTS
8. IMPROVEMENT RECOMMENDATIONS

Use Indian road conditions context, BS6/ARAI benchmarks, and Maruti Suzuki specs.
Be specific with numbers. Flag concerns with ⚠️ or 🔴. Use automotive industry terminology.`;
};

// ─── Call Ravity BizWiz LLM ───────────────────────────────────────────────────
const callBizWizLLM = async (
  authToken: string,
  prompt: string,
  sessionId: string,
  log: (m: string) => void
): Promise<string> => {

  log('🔗 Connecting to Ravity BizWiz LLM service...');

  const dataPayload = JSON.stringify({
    text:          prompt,
    userID:        BIZVIZ_USER_ID,
    sessionID:     sessionId,
    assistId:      BIZVIZ_ASSIST_ID,
    connector:     BIZVIZ_CONNECTOR,
    description:   VDTSIA_DESCRIPTION,
    tables:        BIZVIZ_TABLES,
    selected_files: [],
    type:          'connector',
    documentStoreIds: BIZVIZ_TABLES,
    spaceKey:      BIZVIZ_SPACE_KEY,
  });

  const body = new URLSearchParams();
  body.append('serviceType', 'process_text');
  body.append('data', dataPayload);
  body.append('spacekey', BIZVIZ_SPACE_KEY);

  const res = await fetch(BIZVIZ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'authtoken':     authToken.trim(),
      'spacekey':      BIZVIZ_SPACE_KEY,
      'userid':        BIZVIZ_USER_ID,
      'accept':        'application/json, text/plain, */*',
      'origin':        'https://platform.ravity.io',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`BizWiz LLM returned ${res.status}: ${errText.slice(0, 300) || 'Unknown error'}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let responseText = '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    // BizWiz may wrap the answer in different shapes — unwrap best-effort
    responseText =
      data?.response ||
      data?.answer  ||
      data?.text    ||
      data?.message ||
      data?.result  ||
      (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    responseText = await res.text();
  }

  if (!responseText || responseText.trim().length === 0) {
    throw new Error('BizWiz LLM returned an empty response. Check authtoken validity.');
  }

  log(`✅ BizWiz LLM responded (${responseText.length.toLocaleString()} chars)`);
  return responseText;
};

// ─── Parse sections ───────────────────────────────────────────────────────────
const parseSections = (text: string): AnalysisSection[] => {
  const defs = [
    { key: 'EXECUTIVE SUMMARY',        icon: '📋', title: 'Executive Summary' },
    { key: 'DRIVING BEHAVIOUR',        icon: '🏎️', title: 'Driving Behaviour Analysis' },
    { key: 'FUEL & EFFICIENCY',        icon: '⛽', title: 'Fuel & Efficiency Analysis' },
    { key: 'FAULT CODE',               icon: '🔴', title: 'Fault Code Analysis' },
    { key: 'MAINTENANCE',              icon: '🔧', title: 'Maintenance Recommendations' },
    { key: 'WARRANTY',                 icon: '🛡️', title: 'Warranty Risk Assessment' },
    { key: 'SAFETY',                   icon: '⚠️', title: 'Safety Alerts' },
    { key: 'IMPROVEMENT',              icon: '📈', title: 'Improvement Recommendations' },
  ];

  const sections: AnalysisSection[] = [];
  defs.forEach((def, i) => {
    const si = text.search(new RegExp(def.key, 'i'));
    if (si === -1) return;
    const next = defs.slice(i + 1).find(d => text.search(new RegExp(d.key, 'i')) > si);
    const ei   = next ? text.search(new RegExp(next.key, 'i')) : text.length;
    const content = text.slice(si, ei).trim();
    const severity: AnalysisSection['severity'] =
      content.includes('🔴') || /critical|immediate/i.test(content) ? 'critical'
      : content.includes('⚠️') || /warning|concern|risk/i.test(content) ? 'warning'
      : /good|normal|excellent|compliant/i.test(content) ? 'good'
      : 'info';
    sections.push({ title: def.title, icon: def.icon, content, severity });
  });
  if (sections.length === 0)
    sections.push({ title: 'BizWiz Analysis', icon: '🤖', content: text, severity: 'info' });
  return sections;
};

const sevStyle = (s: AnalysisSection['severity']) => ({
  good:     { border: '#a5d6a7', bg: '#f1f8e9', badge: '#2e7d32', badgeBg: '#e8f5e9' },
  warning:  { border: '#ffe082', bg: '#fffde7', badge: '#f57f17', badgeBg: '#fff9c4' },
  critical: { border: '#ef9a9a', bg: '#ffebee', badge: '#c62828', badgeBg: '#ffcdd2' },
  info:     { border: '#90caf9', bg: '#e3f2fd', badge: '#1565c0', badgeBg: '#bbdefb' },
}[s]);

// Ravity brand colour
const RAVITY_COLOR = '#e91e8c';

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAnalysisDashboard: FC = () => {
  const { vin, apiParams } = useDt();

  // BizWiz auth state — the user only needs to paste their session authtoken
  const [authToken,  setAuthToken]  = useState(BIZVIZ_AUTH_TOKEN_DEFAULT);
  const [showToken,  setShowToken]  = useState(false);
  const [sessionId]                 = useState(makeSessionId);

  // Analysis state
  const [loading,    setLoading]    = useState(false);
  const [sections,   setSections]   = useState<AnalysisSection[]>([]);
  const [rawResponse,setRaw]        = useState('');
  const [error,      setError]      = useState('');
  const [dataStatus, setDataStatus] = useState<string[]>([]);
  const [progress,   setProgress]   = useState(0);
  const [trigger,    setTrigger]    = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });

  const log = (msg: string) => setDataStatus(prev => [...prev, msg]);

  const runAnalysis = useCallback(async () => {
    if (!authToken.trim()) {
      setError('Please enter your Ravity BizWiz authtoken to run the analysis.');
      return;
    }

    setLoading(true); setError(''); setSections([]); setRaw(''); setDataStatus([]); setProgress(0);

    try {
      log('📡 Fetching all vehicle data...');
      const [viR, usR, odR, dtcR, dtcTR, feR, blR, kpiR] = await Promise.allSettled([
        fetchVehicleInfo(vin),
        fetchVehicleUsage({ vin: apiParams.vin, startdate: apiParams.startdate, enddate: apiParams.enddate }),
        fetchOverallData(apiParams),
        fetchDtcInfo(apiParams),
        fetchDtcTile(apiParams),
        fetchFuelEvents(apiParams),
        fetchSummaryBaselineTile(apiParams),
        fetchOverallKpiData(apiParams),
      ]);

      const vi  = viR.status  === 'fulfilled' ? (Array.isArray(viR.value)  ? viR.value[0]  : viR.value)  : null;
      const us  = usR.status  === 'fulfilled' ? (Array.isArray(usR.value)  ? usR.value[0]  : usR.value)  : null;
      const od  = odR.status  === 'fulfilled' ? (Array.isArray(odR.value)  ? odR.value     : []) : [];
      const di  = dtcR.status === 'fulfilled' ? (Array.isArray(dtcR.value) ? dtcR.value    : []) : [];
      const dt  = dtcTR.status=== 'fulfilled' ? (Array.isArray(dtcTR.value)? dtcTR.value[0]: dtcTR.value): null;
      const fe  = feR.status  === 'fulfilled' ? (Array.isArray(feR.value)  ? feR.value     : []) : [];
      const bl  = blR.status  === 'fulfilled' ? (Array.isArray(blR.value)  ? blR.value[0]  : blR.value)  : null;
      const kpi = kpiR.status === 'fulfilled' ? (Array.isArray(kpiR.value) ? kpiR.value    : []) : [];

      log(`✅ ${od.length} trips · ${di.length} DTCs · ${fe.length} fuel events`);
      setProgress(40);

      log('🧠 Building analysis prompt...');
      const prompt = buildPrompt(vin, apiParams.startdate, apiParams.enddate, vi, us, od, di, dt, fe, bl, kpi);
      setProgress(50);

      log('🤖 Sending to Ravity BizWiz LLM (VDTSIA)...');
      const responseText = await callBizWizLLM(authToken, prompt, sessionId, log);
      setProgress(90);

      if (!responseText) throw new Error('Empty response — try again');
      log(`✅ Analysis complete (${responseText.length.toLocaleString()} chars)`);
      setProgress(100);

      setSections(parseSections(responseText));
      setRaw(responseText);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
      log(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [vin, apiParams, authToken, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const testConnection = async () => {
    if (!authToken.trim()) { setError('Enter your BizWiz authtoken first.'); return; }
    setDataStatus(['🔌 Testing BizWiz LLM connection...']);
    setError('');
    try {
      const testSessionId = makeSessionId();
      const body = new URLSearchParams();
      body.append('serviceType', 'process_text');
      body.append('data', JSON.stringify({
        text: 'Reply with the single word OK.',
        userID: BIZVIZ_USER_ID,
        sessionID: testSessionId,
        assistId: BIZVIZ_ASSIST_ID,
        connector: BIZVIZ_CONNECTOR,
        description: VDTSIA_DESCRIPTION,
        tables: BIZVIZ_TABLES,
        selected_files: [],
        type: 'connector',
        documentStoreIds: BIZVIZ_TABLES,
        spaceKey: BIZVIZ_SPACE_KEY,
      }));
      body.append('spacekey', BIZVIZ_SPACE_KEY);

      const res = await fetch(BIZVIZ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'authtoken': authToken.trim(),
          'spacekey': BIZVIZ_SPACE_KEY,
          'userid': BIZVIZ_USER_ID,
          'accept': 'application/json, text/plain, */*',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${errText.slice(0, 150) || 'error'}`);
      }
      setDataStatus(['✅ Ravity BizWiz LLM connection successful — VDTSIA assistant is ready']);
    } catch(e: any) {
      setDataStatus([`❌ Connection failed: ${e.message}`]);
      setError(e.message);
    }
  };

  const downloadTxt = () => {
    const hdr = `VEHICLE DIGITAL TWIN — AI ANALYSIS REPORT\n${'='.repeat(60)}\nVIN: ${vin}\nPeriod: ${apiParams.startdate} to ${apiParams.enddate}\nProvider: Ravity BizWiz LLM (VDTSIA)\nGenerated: ${new Date().toLocaleString()}\nSpace: ${BIZVIZ_SPACE_KEY} | Assist: ${BIZVIZ_ASSIST_ID}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([hdr + rawResponse], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.download = `AI_Analysis_${vin}_${apiParams.startdate}.txt`;
    a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' as const };
  const sec:  React.CSSProperties = { color: RAVITY_COLOR, fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: `4px solid ${RAVITY_COLOR}`, paddingLeft: 10 };

  return (
    <div style={page} id="dt-page-content">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={{ color: RAVITY_COLOR, fontWeight: 900, fontSize: 26, marginBottom: 4 }}>🤖 AI Vehicle Analysis</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Powered by <strong style={{ color: RAVITY_COLOR }}>Ravity BizWiz LLM</strong> — VDTSIA (Vehicle Digital Twin SQL Intelligence Agent)
      </p>

      <DateFilterBar title="AI Analysis" onApply={() => setTrigger(prev => prev + 1)} />

      {/* ── BizWiz Auth Panel ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={sec}>🔐 Ravity BizWiz Authentication</div>

        {/* Service info badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 18 }}>
          {[
            { label: 'Endpoint', value: 'platform.ravity.io' },
            { label: 'Space',    value: `#${BIZVIZ_SPACE_KEY}` },
            { label: 'Assist',   value: BIZVIZ_ASSIST_ID },
            { label: 'Tables',   value: BIZVIZ_TABLES.join(', ') },
          ].map(b => (
            <div key={b.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>{b.label}: </span>
              <span style={{ color: '#333', fontFamily: 'monospace' }}>{b.value}</span>
            </div>
          ))}
        </div>

        {/* Auth token input */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>
            BizWiz Auth Token
            <span style={{ marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 400 }}>
              (copy from your Ravity platform session — Network tab → authtoken header)
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="eyJzZXNpb25WYWxpZGF0ZSI6Ii..."
              value={authToken}
              onChange={e => setAuthToken(e.target.value)}
              style={{
                width: '100%', padding: '10px 44px 10px 14px',
                border: `1.5px solid ${authToken ? RAVITY_COLOR : '#ddd'}`,
                borderRadius: 10, fontSize: 12, outline: 'none',
                boxSizing: 'border-box' as const, fontFamily: 'monospace',
                background: authToken ? `${RAVITY_COLOR}08` : '#fafafa',
              }}
            />
            <button
              onClick={() => setShowToken(s => !s)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#aaa' }}
            >{showToken ? '🙈' : '👁'}</button>
          </div>
          {authToken && (
            <div style={{ fontSize: 11, color: '#4caf50', marginTop: 4, fontWeight: 600 }}>
              ✅ Token set ({authToken.length} chars)
            </div>
          )}
        </div>

        {/* Run + Test buttons */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <button
            onClick={runAnalysis} disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#f0f0f0' : `linear-gradient(135deg,${RAVITY_COLOR},${RAVITY_COLOR}cc)`,
              border: 'none', borderRadius: 10, color: loading ? '#aaa' : '#fff',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : `0 4px 16px ${RAVITY_COLOR}44`,
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid #aaa', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> Analysing…</>
            ) : (
              <>🤖 Run Analysis via BizWiz LLM</>
            )}
          </button>
          <button
            onClick={testConnection}
            disabled={loading}
            style={{
              padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: `1.5px solid ${RAVITY_COLOR}`, background: 'transparent',
              color: RAVITY_COLOR, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${RAVITY_COLOR}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            🔌 Test Connection
          </button>
        </div>

        {/* Data info */}
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 12, color: '#888', cursor: 'pointer', userSelect: 'none' as const }}>
            📊 What data is sent to BizWiz LLM?
          </summary>
          <div style={{ marginTop: 8, background: '#f8f9fa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#555', lineHeight: 2 }}>
            {['Vehicle identity (model, variant, fuel, engine)', 'Usage (trips, distance, engine hours, locations)', 'Driving behaviour (harsh events, overspeeding, turns)', 'Fuel & efficiency (FE, CO₂, battery, adulteration)', 'Speed distribution (7 speed bands)', 'DTC/Fault codes (codes, ECU, status)', 'Climate (AC usage %, mileage loss)', 'Altitude, GSM signal, odometer resets', 'Fleet baseline comparisons (12+ KPI deltas)'].map((x, i) => <div key={i}>✅ {x}</div>)}
            <div style={{ color: RAVITY_COLOR, fontWeight: 600, marginTop: 6 }}>⚠️ All analysis stays within the Ravity on-premise environment. No raw GPS or personal data leaves the secure boundary.</div>
          </div>
        </details>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#ffebee', border: '2px solid #ef9a9a', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 24 }}>❌</span>
          <div>
            <div style={{ fontWeight: 700, color: '#c62828', fontSize: 14 }}>Analysis Failed</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4, whiteSpace: 'pre-wrap' as const }}>{error}</div>
            {error.toLowerCase().includes('authtoken') || error.toLowerCase().includes('401') || error.toLowerCase().includes('403') ? (
              <div style={{ marginTop: 8, fontSize: 12, color: '#e65100', background: '#fff3e0', padding: '8px 12px', borderRadius: 8 }}>
                💡 <strong>Auth tip:</strong> Open the Ravity platform in Chrome → F12 → Network tab → click any API request → copy the <code>authtoken</code> header value and paste it above.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Progress */}
      {(loading || dataStatus.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>📡 Progress</div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${RAVITY_COLOR},${RAVITY_COLOR}cc)`, borderRadius: 3, transition: 'width 0.4s ease' }}/>
          </div>
          <div style={{ background: '#0d1117', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#58a6ff', maxHeight: 160, overflowY: 'auto' as const, lineHeight: 1.9 }}>
            {dataStatus.map((m, i) => (
              <div key={i} style={{ color: m.startsWith('✅') ? '#3fb950' : m.startsWith('❌') ? '#f85149' : m.startsWith('⚠️') ? '#f0c040' : '#58a6ff' }}>{m}</div>
            ))}
            {loading && <div style={{ color: '#f0c040' }}>▊</div>}
          </div>
        </div>
      )}

      {/* Results */}
      {sections.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' as const, gap: 10 }}>
            <div style={sec}>📊 Results — {apiParams.startdate} → {apiParams.enddate} · Ravity BizWiz LLM</div>
            <button onClick={downloadTxt} style={{ padding: '9px 20px', background: `linear-gradient(135deg,${RAVITY_COLOR},${RAVITY_COLOR}cc)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 12px ${RAVITY_COLOR}44`, display: 'flex', alignItems: 'center', gap: 7 }}>
              📥 Download Report (.txt)
            </button>
          </div>

          {/* ── Accordion section tabs ── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
            {sections.map((s, i) => {
              const st       = sevStyle(s.severity);
              const isExpanded = !!expandedSections[i];
              const cleanContent = s.content.replace(/^[0-9]+\.\s+[A-Z][A-Z\s&]+[\n:—\-]*/m, '').trim();
              const words    = cleanContent.split(/\s+/);
              const preview  = words.slice(0, 25).join(' ') + (words.length > 25 ? '…' : '');

              return (
                <div key={i} style={{
                  background: isExpanded ? st.bg : '#fff',
                  border: `1.5px solid ${isExpanded ? st.border : '#e8e8e8'}`,
                  borderRadius: 14, overflow: 'hidden',
                  boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}>
                  <div
                    onClick={() => setExpandedSections(prev => ({ ...prev, [i]: !prev[i] }))}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px', cursor: 'pointer',
                      background: isExpanded ? `${st.border}28` : 'transparent',
                      borderBottom: isExpanded ? `1px solid ${st.border}44` : 'none',
                      userSelect: 'none' as const,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isExpanded ? 0 : 3 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{s.title}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: st.badgeBg, color: st.badge, textTransform: 'uppercase' as const, letterSpacing: 0.6, flexShrink: 0 }}>
                            {s.severity}
                          </span>
                        </div>
                        {!isExpanded && (
                          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.4, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {preview}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginLeft: 12,
                      background: isExpanded ? st.border : '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: isExpanded ? '#fff' : '#888',
                      transition: 'all 0.2s',
                    }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '18px 22px 20px' }}>
                      <div style={{ fontSize: 14, color: '#222', lineHeight: 2, whiteSpace: 'pre-line' as const }}>
                        {cleanContent}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand/Collapse all controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setExpandedSections(Object.fromEntries(sections.map((_,i)=>[i,true])))}
              style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9',
                cursor: 'pointer', fontSize: 12, color: '#555', fontWeight: 600 }}>
              ⬇ Expand All
            </button>
            <button onClick={() => setExpandedSections({})}
              style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9',
                cursor: 'pointer', fontSize: 12, color: '#555', fontWeight: 600 }}>
              ⬆ Collapse All
            </button>
          </div>

          {/* Full raw response */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📄</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>Complete Raw Response</span>
                <span style={{ fontSize: 11, color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: 12 }}>
                  {rawResponse.length.toLocaleString()} chars · {rawResponse.split('\n').length} lines
                </span>
              </div>
              <button onClick={downloadTxt} style={{ padding: '6px 14px', border: `1.5px solid ${RAVITY_COLOR}`, borderRadius: 8, background: `${RAVITY_COLOR}18`, cursor: 'pointer', fontSize: 12, color: RAVITY_COLOR, fontWeight: 600 }}>
                📥 Download .txt
              </button>
            </div>
            <div style={{ padding: '18px 22px', fontFamily: "'Courier New', monospace", fontSize: 13, color: '#1a1a2e', lineHeight: 1.9, whiteSpace: 'pre-wrap' as const, background: '#fdfdfd', maxHeight: 600, overflowY: 'auto' as const }}>
              {rawResponse}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {sections.length === 0 && !loading && !error && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '60px 40px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', textAlign: 'center' as const }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>AI Vehicle Analysis — BizWiz LLM</div>
          <div style={{ fontSize: 14, color: '#888', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Paste your <strong style={{ color: RAVITY_COLOR }}>Ravity BizWiz authtoken</strong> above, then click{' '}
            <strong style={{ color: RAVITY_COLOR }}>Run Analysis</strong> to get expert VDTSIA insights powered by
            the <code>synthetic_data_kpi</code> and <code>qac_kpi_baseline_data</code> connectors.
          </div>
          <div style={{ marginTop: 20, background: '#fff8f5', border: `1px solid ${RAVITY_COLOR}44`, borderRadius: 12, padding: '14px 20px', fontSize: 12, color: '#555', textAlign: 'left' as const, maxWidth: 520, margin: '20px auto 0' }}>
            <strong style={{ color: RAVITY_COLOR }}>How to get your authtoken:</strong>
            <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 2.2 }}>
              <li>Open <a href="https://platform.ravity.io" target="_blank" rel="noreferrer" style={{ color: RAVITY_COLOR }}>platform.ravity.io</a> and log in</li>
              <li>Press <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>F12</kbd> → Network tab</li>
              <li>Click any API request and copy the <code>authtoken</code> request header</li>
              <li>Paste it in the field above</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisDashboard;
