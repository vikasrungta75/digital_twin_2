import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import {
  fetchVehicleInfo, fetchVehicleUsage, fetchOverallData,
  fetchDtcInfo, fetchDtcTile, fetchFuelEvents,
  fetchSummaryBaselineTile, fetchOverallKpiData,
} from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import PageHeader, { ICON_PATHS } from './PageHeader';

// ─── Re-use provider config & AI caller from Vehicle Analysis ─────────────────
type Provider = 'gemini' | 'claude' | 'openai';

const PROVIDERS = [
  {
    id: 'gemini' as Provider, name: 'Google Gemini', icon: '✦', color: '#4285F4',
    keyPlaceholder: 'AIza...', keyLink: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash', note: 'Best — free tier' },
      { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash', note: 'Fast — free tier' },
      { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro',   note: 'Powerful' },
    ],
  },
  {
    id: 'claude' as Provider, name: 'Anthropic Claude', icon: '◆', color: '#D97757',
    keyPlaceholder: 'sk-ant-...', keyLink: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', note: 'Best balance' },
      { id: 'claude-opus-4-5',   label: 'Claude Opus 4.5',   note: 'Most capable' },
      { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  note: 'Fast & cheap' },
    ],
  },
  {
    id: 'openai' as Provider, name: 'OpenAI', icon: '◎', color: '#10A37F',
    keyPlaceholder: 'sk-...', keyLink: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o',      label: 'GPT-4o',      note: 'Best balance' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', note: 'Fast & cheap' },
      { id: 'o3',          label: 'o3',           note: 'Most capable' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg = (arr: any[], key: string) => {
  const vals = arr.map(d => Number(d[key] || 0)).filter(v => isFinite(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};
const tot = (arr: any[], key: string) => arr.reduce((s, d) => s + Number(d[key] || 0), 0);

// ─── Build vehicle data block (same logic as AiAnalysisDashboard) ─────────────
const buildVehicleBlock = (
  label: string, vin: string,
  vehicleInfo: any, usage: any, overallData: any[],
  dtcInfo: any[], dtcTile: any, fuelEvents: any[],
  baseline: any,
): string => {
  const vi = vehicleInfo || {};
  const us = usage || {};
  const bl = baseline || {};
  const n  = overallData.length || 1;

  const totalDist      = tot(overallData, 'trip_distance');
  const totalIdle      = tot(overallData, 'idle_time');
  const totalHarshAcc  = tot(overallData, 'harsh_acc_count');
  const totalHarshBrk  = tot(overallData, 'harsh_brk_count');
  const totalHarshTurn = tot(overallData, 'harsh_turn_count');
  const totalOverspe   = tot(overallData, 'overspeeding_count');
  const totalOverspeDur= tot(overallData, 'overspeeding_dur_in_sec');
  const totalCo2       = tot(overallData, 'co2_emissions');
  const avgFuelEff     = avg(overallData, 'fuel_efficiency');
  const avgSpeed       = avg(overallData, 'average_speed');
  const maxSpeed       = Math.max(...overallData.map(d => Number(d.max_speed || 0)), 0);
  const totalBatHi     = tot(overallData, 'bat_above_15v');
  const totalBatLo     = tot(overallData, 'bat_below_9v');
  const totalFuelLow   = tot(overallData, 'fuel_less_than_20per');
  const odoResets      = tot(overallData, 'odometerresetcount');
  const totalKmsLoss   = tot(overallData, 'kms_loss_mlg');
  const avgAcPct       = avg(overallData, 'percentage_ac_on');
  const avgAlt         = avg(overallData, 'altitude_median');
  const totalAdult     = fuelEvents.reduce((s, d) => s + Number(d.fueladulteration || 0), 0);
  const totalFilling   = fuelEvents.reduce((s, d) => s + Number(d.filling_detected || 0), 0);
  const totalEmptying  = fuelEvents.reduce((s, d) => s + Number(d.emptying_detected || 0), 0);
  const currentFaults  = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current')).length;
  const histFaults     = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('history')).length;
  const uniqueDtcCodes = Array.from(new Set(dtcInfo.map((d: any) => d.diagnosticinfo_data_dtc || '').filter(Boolean)));
  const harshPer100    = totalDist > 0 ? ((totalHarshAcc + totalHarshBrk + totalHarshTurn) / totalDist * 100).toFixed(2) : 'N/A';

  return `
=== ${label} — VIN: ${vin} ===

VEHICLE IDENTITY
  Model: ${vi.vehicle_model || 'Unknown'}  Variant: ${vi.vehicle_variant || 'Unknown'}
  Fuel: ${vi.fuel_type || 'Unknown'}  Engine: ${vi.engine_type || 'Unknown'}  Trans: ${vi.transmission_type || 'Unknown'}
  CNG: ${vi.cng === 'Y' ? 'Yes' : 'No'}  Mfg: ${vi.manuf_date || 'N/A'}  Sale: ${vi.sale_date || 'N/A'}
  Last Service: ${vi.last_serv || 'N/A'}  Last Warranty: ${vi.last_war_claim || 'N/A'}

USAGE
  Trips: ${us.total_trips || n}  Distance: ${(us.total_distance || totalDist).toFixed(1)} km
  Engine Hrs: ${Number(us.total_eng_hr || 0).toFixed(1)}  Avg Speed: ${(us.avg_speed || avgSpeed).toFixed(1)} km/h  Max Speed: ${maxSpeed.toFixed(1)} km/h

DRIVING BEHAVIOUR
  Harsh Acc: ${totalHarshAcc}  Harsh Brk: ${totalHarshBrk}  Harsh Turn: ${totalHarshTurn}
  Total Harsh: ${totalHarshAcc + totalHarshBrk + totalHarshTurn}  Per 100km: ${harshPer100}
  Overspeeding: ${totalOverspe} events (${(totalOverspeDur/60).toFixed(1)} min)
  Idle Time: ${(totalIdle/60).toFixed(1)} min

FUEL & EFFICIENCY
  Avg Fuel Efficiency: ${avgFuelEff.toFixed(2)} km/l
  CO2 Total: ${totalCo2.toFixed(2)} kg  CO2/km: ${totalDist > 0 ? (totalCo2/totalDist).toFixed(4) : 'N/A'} kg/km
  Fuel <20% Events: ${totalFuelLow}  Mileage Loss: ${totalKmsLoss.toFixed(1)} km
  Fuel Fill: ${totalFilling}  Drain: ${totalEmptying}  Adulteration: ${totalAdult}${totalAdult > 0 ? ' ⚠️ CRITICAL' : ''}
  Odometer Resets: ${odoResets}${odoResets > 0 ? ' ⚠️ CRITICAL' : ''}

BATTERY
  Bat >15V (Overcharge): ${totalBatHi} events  Bat <9V (Under-volt): ${totalBatLo} events

CLIMATE
  AC Usage: ${avgAcPct.toFixed(1)}%  Altitude: ${avgAlt.toFixed(0)}m

SPEED BANDS
  ${['0_20','20_60','60_80','80_100','100_120','120_140','140_plus'].map(b => `${b.replace(/_/g,'-')}kmh: ${avg(overallData,`speed_distribution_${b}_kmh`).toFixed(1)}%`).join('  ')}

DTC FAULTS
  Total: ${dtcTile?.total_dtc_count || dtcInfo.length}  Unique codes: ${uniqueDtcCodes.length}
  Active: ${currentFaults}  History: ${histFaults}
  Last DTC: ${dtcTile?.last_dtc_code || 'None'} at ${dtcTile?.last_dtc_time || 'N/A'}
  Codes: ${dtcInfo.slice(0,10).map((d: any) => `${d.diagnosticinfo_data_dtc}(${d.diagnosticinfo_data_status})`).join(', ') || 'None'}

BASELINE vs FLEET
  Distance delta: ${bl.bsline_total_distance ? `${(((totalDist/n) - Number(bl.bsline_total_distance)) / Number(bl.bsline_total_distance) * 100).toFixed(1)}%` : 'N/A'}
  Speed delta: ${bl.bsline_average_speed ? `${(avgSpeed - Number(bl.bsline_average_speed)).toFixed(1)} km/h` : 'N/A'}
  Harsh Acc delta: ${bl.bsline_harsh_acc_count ? `${((totalHarshAcc/n) - Number(bl.bsline_harsh_acc_count)).toFixed(2)}/trip` : 'N/A'}
  CO2 delta: ${bl.bsline_co2_emissions ? `${((totalCo2/n) - Number(bl.bsline_co2_emissions)).toFixed(2)} kg/trip` : 'N/A'}`;
};

// ─── Build comparison prompt ──────────────────────────────────────────────────
const buildComparisonPrompt = (
  startDate: string, endDate: string,
  vin1: string, data1: string,
  vin2: string, data2: string,
): string => `You are an expert automotive engineer specialising in aftermarket vehicle telematics for the Indian market. You have deep knowledge of BS6 norms, ARAI standards, Indian road conditions, and warranty policies.

=== VEHICLE DIGITAL TWIN — DUAL VEHICLE COMPARISON ANALYSIS ===
Period: ${startDate} to ${endDate}

${data1}

${data2}

=== END DATA ===

Perform a comprehensive side-by-side comparison. Use these EXACT section headings:

1. EXECUTIVE COMPARISON SUMMARY
   Highlight the single most important difference between the two vehicles.

2. DRIVING BEHAVIOUR COMPARISON
   Compare harsh events, overspeeding, idle time. Rate each vehicle (Better/Worse/Similar). Identify the safer driver.

3. FUEL & EFFICIENCY COMPARISON
   Compare fuel efficiency (km/l), CO2 emissions, mileage loss. Calculate % difference. Identify the more efficient vehicle.

4. FAULT CODE COMPARISON
   Compare DTC count, active faults, unique codes. Which vehicle has more critical issues?

5. MAINTENANCE COMPARISON
   Compare service history, odometer resets, battery health. Which needs maintenance sooner?

6. WARRANTY RISK COMPARISON
   Which vehicle carries higher warranty risk and why? Flag any warranty-voiding behaviour.

7. SAFETY COMPARISON
   Compare overspeeding duration, harsh events per 100km, hazard activations. Which is safer?

8. RECOMMENDATIONS
   For each vehicle separately, give 3 specific actionable recommendations.
   Then give 1 recommendation applicable to both.

Rules:
- Always refer to vehicles as "Vehicle A (${vin1})" and "Vehicle B (${vin2})"
- Use a consistent format: state the metric, Vehicle A value, Vehicle B value, % difference, winner
- Flag critical concerns with 🔴, warnings with ⚠️, good performance with ✅
- Use Indian automotive context: BS6 norms, Indian fuel prices, ARAI benchmarks
- Be specific with numbers — never say "higher" without stating actual values`;

// ─── Call AI ──────────────────────────────────────────────────────────────────
const callAI = async (
  provider: Provider, apiKey: string, model: string, prompt: string,
  log: (m: string) => void,
): Promise<string> => {
  if (provider === 'gemini') {
    const modelOrder = [model, 'gemini-2.5-flash-preview-04-17', 'gemini-2.0-flash', 'gemini-1.5-flash']
      .filter((m, i, a) => a.indexOf(m) === i);
    for (let attempt = 0; attempt < modelOrder.length; attempt++) {
      const tryModel = modelOrder[attempt];
      if (attempt > 0) log(`⏳ Retrying with ${tryModel}...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${apiKey.trim()}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 6000 } }) }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) { log(`✅ Success with ${tryModel}`); return text; }
      }
      const err = await res.json().catch(() => ({}));
      const is429 = res.status === 429;
      if (is429 && attempt < modelOrder.length - 1) { await new Promise(r => setTimeout(r, 2000)); continue; }
      if (is429) throw new Error(`All Gemini models quota exhausted. Wait a minute or switch to OpenAI/Claude.`);
      if (res.status === 404) { continue; }
      throw new Error(`Gemini ${res.status}: ${err?.error?.message?.slice(0, 200) || 'Unknown error'}`);
    }
    throw new Error('No Gemini model responded');
  }
  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','x-api-key':apiKey.trim(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model, max_tokens: 6000, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`Claude ${res.status}: ${e?.error?.message?.slice(0,200)}`); }
    return (await res.json())?.content?.[0]?.text || '';
  }
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','Authorization':`Bearer ${apiKey.trim()}` },
      body: JSON.stringify({ model, max_tokens: 6000, temperature: 0.3, messages: [{ role:'user', content:prompt }] }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`OpenAI ${res.status}: ${e?.error?.message?.slice(0,200)}`); }
    return (await res.json())?.choices?.[0]?.message?.content || '';
  }
  throw new Error('Unknown provider');
};

// ─── Parse comparison sections ────────────────────────────────────────────────
interface CompSection { title: string; icon: string; content: string; severity: 'good'|'warning'|'critical'|'info'; }

const parseSections = (text: string): CompSection[] => {
  const defs = [
    { key: 'EXECUTIVE COMPARISON',   icon: '📋', title: 'Executive Comparison Summary' },
    { key: 'DRIVING BEHAVIOUR',      icon: '🏎️', title: 'Driving Behaviour Comparison' },
    { key: 'FUEL & EFFICIENCY',      icon: '⛽', title: 'Fuel & Efficiency Comparison' },
    { key: 'FAULT CODE',             icon: '🔴', title: 'Fault Code Comparison' },
    { key: 'MAINTENANCE',            icon: '🔧', title: 'Maintenance Comparison' },
    { key: 'WARRANTY',               icon: '🛡️', title: 'Warranty Risk Comparison' },
    { key: 'SAFETY',                 icon: '⚠️', title: 'Safety Comparison' },
    { key: 'RECOMMENDATION',         icon: '📈', title: 'Recommendations' },
  ];
  const sections: CompSection[] = [];
  defs.forEach((def, i) => {
    const si = text.search(new RegExp(def.key, 'i'));
    if (si === -1) return;
    const next = defs.slice(i + 1).find(d => text.search(new RegExp(d.key, 'i')) > si);
    const ei   = next ? text.search(new RegExp(next.key, 'i')) : text.length;
    const content = text.slice(si, ei).trim();
    const severity: CompSection['severity'] =
      content.includes('🔴') || /critical|immediate/i.test(content) ? 'critical'
      : content.includes('⚠️') || /warning|concern|risk/i.test(content) ? 'warning'
      : /✅|good|better|excellent/i.test(content) ? 'good'
      : 'info';
    sections.push({ title: def.title, icon: def.icon, content, severity });
  });
  if (sections.length === 0)
    sections.push({ title: 'Comparison Analysis', icon: '🔄', content: text, severity: 'info' });
  return sections;
};

const sevStyle = (s: CompSection['severity']) => ({
  good:     { border: '#a5d6a7', bg: '#f1f8e9', badge: '#2e7d32', badgeBg: '#e8f5e9' },
  warning:  { border: '#ffe082', bg: '#fffde7', badge: '#f57f17', badgeBg: '#fff9c4' },
  critical: { border: '#ef9a9a', bg: '#ffebee', badge: '#c62828', badgeBg: '#ffcdd2' },
  info:     { border: '#90caf9', bg: '#e3f2fd', badge: '#1565c0', badgeBg: '#bbdefb' },
}[s]);

// ─── VIN selector component ───────────────────────────────────────────────────
const VinSelector: React.FC<{
  label: string; accentColor: string; vin: string; vinList: string[];
  onChange: (v: string) => void;
}> = ({ label, accentColor, vin, vinList, onChange }) => (
  <div style={{ flex: 1, minWidth: 220 }}>
    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#555', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>
      {label}
    </label>
    <div style={{ position:'relative' }}>
      <div style={{
        position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
        width:10, height:10, borderRadius:'50%', background:accentColor, flexShrink:0,
      }}/>
      <select
        value={vin}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'10px 14px 10px 28px',
          border:`2px solid ${vin ? accentColor : '#ddd'}`,
          borderRadius:10, fontSize:13, outline:'none',
          background: vin ? `${accentColor}08` : '#fafafa',
          color:'#111', fontWeight:600, cursor:'pointer',
          appearance:'none',
        }}
      >
        <option value=''>— Select VIN —</option>
        {vinList.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#888' }}>▼</div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const VehicleComparisonDashboard: FC = () => {
  const { vinList, apiParams, setVin: setCtxVin } = useDt();

  // ── Two independent VINs ──────────────────────────────────────────────────
  const [vin1, setVin1] = useState<string>('');
  const [vin2, setVin2] = useState<string>('');

  // Seed VIN1 from context on first load
  useEffect(() => {
    if (!vin1 && apiParams.vin) setVin1(apiParams.vin);
  }, [apiParams.vin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Provider state (shared with Vehicle Analysis via localStorage) ────────
  const savedKeys     = (() => { try { return JSON.parse(localStorage.getItem('dt_ai_keys') || '{}'); } catch { return {}; } })();
  const savedProvider = (localStorage.getItem('dt_ai_provider') as Provider | null) || 'openai';
  const savedModels   = (() => { try { return JSON.parse(localStorage.getItem('dt_ai_models') || '{}'); } catch { return {}; } })();

  const [provider,  setProvider]  = useState<Provider>(savedProvider);
  const [keys,      setKeys]      = useState<Record<Provider,string>>({
    gemini: savedKeys.gemini || process.env.REACT_APP_GEMINI_KEY || '',
    claude: savedKeys.claude || process.env.REACT_APP_CLAUDE_KEY || '',
    openai: savedKeys.openai || process.env.REACT_APP_OPENAI_KEY || '',
  });
  const [models,    setModels]    = useState<Record<Provider,string>>({
    gemini: savedModels.gemini || 'gemini-2.5-flash-preview-04-17',
    claude: savedModels.claude || 'claude-sonnet-4-5',
    openai: savedModels.openai || 'gpt-4o-mini',
  });
  const [showKeys,  setShowKeys]  = useState<Record<Provider,boolean>>({ gemini:false, claude:false, openai:false });

  useEffect(() => { localStorage.setItem('dt_ai_provider', provider); }, [provider]);
  useEffect(() => {
    const toSave: Record<string,string> = {};
    (Object.entries(keys) as [Provider,string][]).forEach(([p,k]) => { if (k && k.length >= 20) toSave[p] = k; });
    localStorage.setItem('dt_ai_keys', JSON.stringify(toSave));
  }, [keys]);
  useEffect(() => { localStorage.setItem('dt_ai_models', JSON.stringify(models)); }, [models]);

  // ── Analysis state ────────────────────────────────────────────────────────
  const [loading,    setLoading]   = useState(false);
  const [sections,   setSections]  = useState<CompSection[]>([]);
  const [rawText,    setRawText]   = useState('');
  const [error,      setError]     = useState('');
  const [dataStatus, setStatus]    = useState<string[]>([]);
  const [progress,   setProgress]  = useState(0);
  const [trigger,    setTrigger]   = useState(0);
  const [expanded,   setExpanded]  = useState<Record<number,boolean>>({ 0: true });

  const cfg = PROVIDERS.find(p => p.id === provider)!;
  const log = (msg: string) => setStatus(prev => [...prev, msg]);

  const runComparison = useCallback(async () => {
    if (!vin1 || !vin2) { setError('Please select both Vehicle A and Vehicle B.'); return; }
    if (vin1 === vin2)  { setError('Please select two different VINs for a meaningful comparison.'); return; }
    const key = keys[provider].trim();
    if (!key)          { setError(`Please enter your ${cfg.name} API key.`); return; }
    if (key.length < 20) { setError(`That doesn't look like a valid ${cfg.name} API key.`); return; }

    setLoading(true); setError(''); setSections([]); setRawText(''); setStatus([]); setProgress(0);

    try {
      log('📡 Fetching data for Vehicle A...');
      const params1 = { vin: vin1, startdate: apiParams.startdate, enddate: apiParams.enddate };
      const [vi1R, us1R, od1R, dtc1R, dtcT1R, fe1R, bl1R] = await Promise.allSettled([
        fetchVehicleInfo(vin1),
        fetchVehicleUsage(params1),
        fetchOverallData(params1),
        fetchDtcInfo(params1),
        fetchDtcTile(params1),
        fetchFuelEvents(params1),
        fetchSummaryBaselineTile(params1),
      ]);
      setProgress(20);

      log('📡 Fetching data for Vehicle B...');
      const params2 = { vin: vin2, startdate: apiParams.startdate, enddate: apiParams.enddate };
      const [vi2R, us2R, od2R, dtc2R, dtcT2R, fe2R, bl2R] = await Promise.allSettled([
        fetchVehicleInfo(vin2),
        fetchVehicleUsage(params2),
        fetchOverallData(params2),
        fetchDtcInfo(params2),
        fetchDtcTile(params2),
        fetchFuelEvents(params2),
        fetchSummaryBaselineTile(params2),
      ]);
      setProgress(45);

      // Resolve all settled promises
      const r = (p: PromiseSettledResult<any>, isArr = false, idx = 0) =>
        p.status === 'fulfilled' ? (isArr ? (Array.isArray(p.value) ? p.value : []) : (Array.isArray(p.value) ? p.value[idx] : p.value)) : (isArr ? [] : null);

      const vi1 = r(vi1R, false, 0), us1 = r(us1R, false, 0), od1 = r(od1R, true), di1 = r(dtc1R, true), dt1 = r(dtcT1R, false, 0), fe1 = r(fe1R, true), bl1 = r(bl1R, false, 0);
      const vi2 = r(vi2R, false, 0), us2 = r(us2R, false, 0), od2 = r(od2R, true), di2 = r(dtc2R, true), dt2 = r(dtcT2R, false, 0), fe2 = r(fe2R, true), bl2 = r(bl2R, false, 0);

      log(`✅ Vehicle A: ${od1.length} trips · ${di1.length} DTCs`);
      log(`✅ Vehicle B: ${od2.length} trips · ${di2.length} DTCs`);
      setProgress(55);

      log('🧠 Building comparison prompt...');
      const block1 = buildVehicleBlock('VEHICLE A', vin1, vi1, us1, od1, di1, dt1, fe1, bl1);
      const block2 = buildVehicleBlock('VEHICLE B', vin2, vi2, us2, od2, di2, dt2, fe2, bl2);
      const prompt = buildComparisonPrompt(apiParams.startdate, apiParams.enddate, vin1, block1, vin2, block2);
      setProgress(60);

      log(`🤖 Sending to ${cfg.name} — ${models[provider]}...`);
      const responseText = await callAI(provider, key, models[provider], prompt, log);
      setProgress(95);

      if (!responseText) throw new Error('Empty response — try again');
      log(`✅ Comparison complete (${responseText.length.toLocaleString()} chars)`);
      setProgress(100);

      setSections(parseSections(responseText));
      setRawText(responseText);
    } catch (e: any) {
      setError(e.message || 'Comparison failed');
      log(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [vin1, vin2, apiParams, provider, keys, models, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadTxt = () => {
    const hdr = `VEHICLE COMPARISON ANALYSIS\n${'='.repeat(60)}\nVehicle A: ${vin1}  |  Vehicle B: ${vin2}\nPeriod: ${apiParams.startdate} to ${apiParams.enddate}\nProvider: ${cfg.name} · Model: ${models[provider]}\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([hdr + rawText], { type: 'text/plain' });
    const a    = document.createElement('a');
    a.download = `Comparison_${vin1}_vs_${vin2}_${apiParams.startdate}.txt`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' };
  const sec:  React.CSSProperties = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase', letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };

  const VIN1_COLOR = '#e91e8c';
  const VIN2_COLOR = '#2196F3';

  return (
    <div style={page} id='dt-page-content'>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Page header ── */}
      <PageHeader
        iconPath='M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z'
        title='Vehicle Comparison Analysis'
        subtitle='AI-powered side-by-side comparison of two vehicles over the same period'
      />

      <DateFilterBar title='Vehicle Comparison' onApply={() => setTrigger(prev => prev + 1)} />

      {/* ── Vehicle selector ── */}
      <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <div style={sec}>🚗 Select Vehicles to Compare</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <VinSelector
            label='Vehicle A'
            accentColor={VIN1_COLOR}
            vin={vin1}
            vinList={vinList}
            onChange={setVin1}
          />

          {/* VS divider */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:44, height:44, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#e91e8c,#2196F3)',
            color:'#fff', fontWeight:900, fontSize:13,
            boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
            alignSelf:'flex-end', marginBottom:2,
          }}>VS</div>

          <VinSelector
            label='Vehicle B'
            accentColor={VIN2_COLOR}
            vin={vin2}
            vinList={vinList}
            onChange={setVin2}
          />
        </div>

        {/* Vehicle identity preview once both selected */}
        {vin1 && vin2 && vin1 !== vin2 && (
          <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
            {[{ vin: vin1, color: VIN1_COLOR, label: 'A' }, { vin: vin2, color: VIN2_COLOR, label: 'B' }].map(v => (
              <div key={v.vin} style={{
                flex:1, minWidth:200, background:`${v.color}08`,
                border:`1.5px solid ${v.color}33`, borderRadius:10, padding:'10px 14px',
                display:'flex', alignItems:'center', gap:10,
              }}>
                <div style={{ width:28, height:28, borderRadius:8, background:v.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:13, flexShrink:0 }}>{v.label}</div>
                <div>
                  <div style={{ fontSize:12, color:'#555', fontWeight:600 }}>Vehicle {v.label}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#111', fontFamily:'monospace' }}>{v.vin}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {vin1 && vin2 && vin1 === vin2 && (
          <div style={{ marginTop:12, background:'#fff3cd', border:'1px solid #ffc107', borderRadius:8, padding:'8px 14px', fontSize:13, color:'#856404' }}>
            ⚠️ Please select two <strong>different</strong> VINs for a meaningful comparison.
          </div>
        )}
      </div>

      {/* ── AI Provider ── */}
      <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <div style={sec}>🤖 AI Provider</div>

        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)} style={{
              padding:'10px 20px', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
              border:`2px solid ${provider === p.id ? p.color : '#e0e0e0'}`,
              background: provider === p.id ? p.color : '#f9f9f9',
              color: provider === p.id ? '#fff' : '#444',
              boxShadow: provider === p.id ? `0 4px 16px ${p.color}44` : 'none',
              display:'flex', alignItems:'center', gap:8, transition:'all 0.15s',
            }}>
              <span style={{ fontSize:16 }}>{p.icon}</span>
              {p.name}
              {keys[p.id] && <span style={{ fontSize:10, background:'rgba(255,255,255,0.3)', padding:'1px 6px', borderRadius:10 }}>Key set</span>}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'end' }}>
          {/* API Key */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6 }}>
              {cfg.name} API Key
              <a href={cfg.keyLink} target='_blank' rel='noreferrer' style={{ marginLeft:8, fontSize:11, color:cfg.color, textDecoration:'none' }}>Get key →</a>
            </label>
            <div style={{ position:'relative' }}>
              <input
                type={showKeys[provider] ? 'text' : 'password'}
                placeholder={cfg.keyPlaceholder}
                value={keys[provider]}
                onChange={e => setKeys(k => ({ ...k, [provider]: e.target.value }))}
                style={{ width:'100%', padding:'10px 44px 10px 14px', border:`1.5px solid ${keys[provider] ? cfg.color : '#ddd'}`, borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace', background: keys[provider] ? `${cfg.color}08` : '#fafafa' }}
              />
              <button onClick={() => setShowKeys(s => ({ ...s, [provider]: !s[provider] }))}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', border:'none', background:'none', cursor:'pointer', fontSize:14, color:'#aaa' }}>
                {showKeys[provider] ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {/* Model */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6 }}>Model</label>
            <select value={models[provider]} onChange={e => setModels(m => ({ ...m, [provider]: e.target.value }))}
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${cfg.color}`, borderRadius:10, fontSize:13, outline:'none', background:'#fff', cursor:'pointer', color:'#111', fontWeight:600 }}>
              {cfg.models.map(m => <option key={m.id} value={m.id}>{m.label}{m.note ? ` — ${m.note}` : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Run button */}
        <div style={{ marginTop:18, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <button
            onClick={runComparison} disabled={loading || !vin1 || !vin2 || vin1 === vin2}
            style={{
              padding:'12px 32px',
              background: (loading || !vin1 || !vin2 || vin1 === vin2) ? '#f0f0f0' : `linear-gradient(135deg,${VIN1_COLOR},${VIN2_COLOR})`,
              border:'none', borderRadius:10,
              color: (loading || !vin1 || !vin2 || vin1 === vin2) ? '#aaa' : '#fff',
              fontWeight:700, fontSize:15, cursor:(loading || !vin1 || !vin2 || vin1 === vin2) ? 'not-allowed' : 'pointer',
              boxShadow:(loading || !vin1 || !vin2 || vin1 === vin2) ? 'none' : '0 4px 20px rgba(233,30,140,0.35)',
              display:'flex', alignItems:'center', gap:10, transition:'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading && vin1 && vin2 && vin1!==vin2) e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; }}
          >
            {loading
              ? <><div style={{ width:16, height:16, border:'2px solid #aaa', borderTopColor:'#888', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Comparing vehicles…</>
              : <>{cfg.icon} Run Comparison</>
            }
          </button>
          {models[provider] && !loading && (
            <span style={{ fontSize:12, color:'#888' }}>
              Using: <strong style={{ color:cfg.color }}>{cfg.models.find(m => m.id === models[provider])?.label || models[provider]}</strong>
            </span>
          )}
          {!vin1 || !vin2 ? (
            <span style={{ fontSize:12, color:'#f57f17', fontWeight:600 }}>
              ⚠ Select both vehicles to run comparison
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background:'#ffebee', border:'2px solid #ef9a9a', borderRadius:12, padding:'14px 20px', marginBottom:20, display:'flex', gap:12 }}>
          <span style={{ fontSize:24 }}>❌</span>
          <div>
            <div style={{ fontWeight:700, color:'#c62828', fontSize:14 }}>Comparison Failed</div>
            <div style={{ fontSize:13, color:'#555', marginTop:4, whiteSpace:'pre-wrap' }}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Progress ── */}
      {(loading || dataStatus.length > 0) && (
        <div style={{ background:'#fff', borderRadius:14, padding:'18px 22px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#333', marginBottom:10 }}>📡 Progress</div>
          <div style={{ height:6, background:'#f0f0f0', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
            <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${VIN1_COLOR},${VIN2_COLOR})`, borderRadius:3, transition:'width 0.4s ease' }}/>
          </div>
          <div style={{ background:'#0d1117', borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#58a6ff', maxHeight:160, overflowY:'auto', lineHeight:1.9 }}>
            {dataStatus.map((m, i) => (
              <div key={i} style={{ color: m.startsWith('✅') ? '#3fb950' : m.startsWith('❌') ? '#f85149' : m.startsWith('⚠️') ? '#f0c040' : '#58a6ff' }}>{m}</div>
            ))}
            {loading && <div style={{ color:'#f0c040' }}>▊</div>}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {sections.length > 0 && (
        <>
          {/* Header bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <div style={sec}>📊 Comparison Results — {apiParams.startdate} → {apiParams.enddate}</div>
            <button onClick={downloadTxt} style={{ padding:'9px 20px', background:`linear-gradient(135deg,${VIN1_COLOR},${VIN2_COLOR})`, border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              📥 Download Report (.txt)
            </button>
          </div>

          {/* Vehicle legend */}
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            {[{ vin: vin1, color: VIN1_COLOR, label: 'A' }, { vin: vin2, color: VIN2_COLOR, label: 'B' }].map(v => (
              <div key={v.vin} style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:`1.5px solid ${v.color}33`, borderRadius:8, padding:'6px 14px' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:v.color }}/>
                <span style={{ fontSize:12, fontWeight:700, color:'#555' }}>Vehicle {v.label}:</span>
                <span style={{ fontSize:13, fontWeight:800, color:v.color, fontFamily:'monospace' }}>{v.vin}</span>
              </div>
            ))}
          </div>

          {/* Accordion sections */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {sections.map((s, i) => {
              const st        = sevStyle(s.severity);
              const isOpen    = !!expanded[i];
              const cleanContent = s.content.replace(/^[0-9]+\.\s+[A-Z][A-Z\s&]+[\n:—\-]*/m, '').trim();
              const preview   = cleanContent.split(/\s+/).slice(0, 25).join(' ') + '…';

              return (
                <div key={i} style={{ background: isOpen ? st.bg : '#fff', border:`1.5px solid ${isOpen ? st.border : '#e8e8e8'}`, borderRadius:14, overflow:'hidden', boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)', transition:'all 0.2s' }}>
                  <div onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', cursor:'pointer', background: isOpen ? `${st.border}28` : 'transparent', borderBottom: isOpen ? `1px solid ${st.border}44` : 'none', userSelect:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{s.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: isOpen ? 0 : 3 }}>
                          <span style={{ fontWeight:800, fontSize:14, color:'#111' }}>{s.title}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:20, background:st.badgeBg, color:st.badge, textTransform:'uppercase', letterSpacing:0.6, flexShrink:0 }}>{s.severity}</span>
                        </div>
                        {!isOpen && <div style={{ fontSize:12, color:'#777', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview}</div>}
                      </div>
                    </div>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, marginLeft:12, background: isOpen ? st.border : '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color: isOpen ? '#fff' : '#888', transition:'all 0.2s' }}>
                      {isOpen ? '▲' : '▼'}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding:'18px 22px 20px' }}>
                      <div style={{ fontSize:14, color:'#222', lineHeight:2, whiteSpace:'pre-line' }}>{cleanContent}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand/Collapse all */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <button onClick={() => setExpanded(Object.fromEntries(sections.map((_,i) => [i,true])))}
              style={{ padding:'5px 14px', border:'1px solid #ddd', borderRadius:8, background:'#f9f9f9', cursor:'pointer', fontSize:12, color:'#555', fontWeight:600 }}>
              ⬇ Expand All
            </button>
            <button onClick={() => setExpanded({})}
              style={{ padding:'5px 14px', border:'1px solid #ddd', borderRadius:8, background:'#f9f9f9', cursor:'pointer', fontSize:12, color:'#555', fontWeight:600 }}>
              ⬆ Collapse All
            </button>
          </div>

          {/* Raw response */}
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f0f0f0', background:'#fafafa' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span>📄</span>
                <span style={{ fontWeight:700, fontSize:14, color:'#333' }}>Complete Raw Response</span>
                <span style={{ fontSize:11, color:'#888', background:'#f0f0f0', padding:'2px 8px', borderRadius:12 }}>{rawText.length.toLocaleString()} chars</span>
              </div>
              <button onClick={downloadTxt} style={{ padding:'6px 14px', border:`1.5px solid ${VIN1_COLOR}`, borderRadius:8, background:`${VIN1_COLOR}18`, cursor:'pointer', fontSize:12, color:VIN1_COLOR, fontWeight:600 }}>
                📥 Download .txt
              </button>
            </div>
            <div style={{ padding:'18px 22px', fontFamily:"'Courier New',monospace", fontSize:13, color:'#1a1a2e', lineHeight:1.9, whiteSpace:'pre-wrap', background:'#fdfdfd', maxHeight:600, overflowY:'auto' }}>
              {rawText}
            </div>
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {sections.length === 0 && !loading && !error && (
        <div style={{ background:'#fff', borderRadius:14, padding:'60px 40px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔄</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#111', marginBottom:8 }}>Vehicle Comparison Analysis</div>
          <div style={{ fontSize:14, color:'#888', maxWidth:500, margin:'0 auto', lineHeight:1.8 }}>
            Select <strong style={{ color:VIN1_COLOR }}>Vehicle A</strong> and <strong style={{ color:VIN2_COLOR }}>Vehicle B</strong>,
            set your date range, choose an AI provider and click <strong>Run Comparison</strong>.
          </div>
          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {['Driving Behaviour', 'Fuel Efficiency', 'DTC Faults', 'Maintenance', 'Warranty Risk', 'Safety Score'].map(x => (
              <span key={x} style={{ background:'#f5f5f5', color:'#666', fontSize:12, fontWeight:600, padding:'6px 14px', borderRadius:20 }}>
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleComparisonDashboard;
