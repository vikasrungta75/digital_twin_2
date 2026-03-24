import React, { FC, useCallback, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import {
  fetchVehicleInfo, fetchVehicleUsage, fetchOverallData,
  fetchDtcInfo, fetchDtcTile, fetchFuelEvents,
  fetchSummaryBaselineTile, fetchOverallKpiData,
  fetchSpeedDistribution, fetchTurnPercent,
} from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';

// ─── Provider config ─────────────────────────────────────────────────────────
type Provider = 'gemini' | 'claude' | 'openai';

interface ProviderConfig {
  id: Provider;
  name: string;
  icon: string;
  color: string;
  models: { id: string; label: string; note?: string }[];
  keyPlaceholder: string;
  keyLink: string;
  keyLinkLabel: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    color: '#4285F4',
    keyPlaceholder: 'AIza...',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyLinkLabel: 'aistudio.google.com',
    models: [
      { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview', note: 'Best — free tier' },
      { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash',         note: 'Fast — free tier' },
      { id: 'gemini-2.0-flash-lite',          label: 'Gemini 2.0 Flash Lite',    note: 'Cheapest — free tier' },
      { id: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash',         note: 'Stable' },
      { id: 'gemini-1.5-flash-8b',            label: 'Gemini 1.5 Flash 8B',      note: 'Smallest' },
      { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro',           note: 'Powerful' },
    ],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: '◆',
    color: '#D97757',
    keyPlaceholder: 'sk-ant-...',
    keyLink: 'https://console.anthropic.com/settings/keys',
    keyLinkLabel: 'console.anthropic.com',
    models: [
      { id: 'claude-opus-4-5',    label: 'Claude Opus 4.5',    note: 'Most capable' },
      { id: 'claude-sonnet-4-5',  label: 'Claude Sonnet 4.5',  note: 'Best balance' },
      { id: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5',   note: 'Fast & cheap' },
      { id: 'claude-opus-4-0',    label: 'Claude Opus 4',      note: 'Previous gen' },
      { id: 'claude-sonnet-4-0',  label: 'Claude Sonnet 4',    note: 'Previous gen' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '◎',
    color: '#10A37F',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.openai.com/api-keys',
    keyLinkLabel: 'platform.openai.com',
    models: [
      { id: 'o3',          label: 'o3',              note: 'Most capable' },
      { id: 'o4-mini',     label: 'o4-mini',         note: 'Best balance' },
      { id: 'gpt-4.1',     label: 'GPT-4.1',         note: 'Latest GPT-4' },
      { id: 'gpt-4o',      label: 'GPT-4o',          note: 'Multimodal' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini',     note: 'Fast & cheap' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo',     note: 'Previous gen' },
    ],
  },
];

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
  const avgGsm         = avg(overallData, 'gsm_strength_per');
  const totalHazard    = tot(overallData, 'hazard_light_activation_count');
  const totalAccBefore = tot(overallData, 'acc_before_turn_count');
  const totalBrkAfter  = tot(overallData, 'brk_after_turn_count');
  const totalAdult     = fuelEvents.reduce((s, d) => s + Number(d.fueladulteration || 0), 0);
  const totalFilling   = fuelEvents.reduce((s, d) => s + Number(d.filling_detected || 0), 0);
  const totalEmptying  = fuelEvents.reduce((s, d) => s + Number(d.emptying_detected || 0), 0);
  const currentFaults  = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current')).length;
  const histFaults     = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('history')).length;
  const uniqueDtcCodes = Array.from(new Set(dtcInfo.map((d: any) => d.diagnosticinfo_data_dtc || '').filter(Boolean)));
  const harshPer100    = totalDist > 0 ? ((totalHarshAcc + totalHarshBrk + totalHarshTurn) / totalDist * 100).toFixed(2) : 'N/A';

  return `You are an expert automotive engineer and quality analyst specialising in aftermarket vehicle telematics for the Indian automotive market. You have deep knowledge of BS6 emission norms, ARAI standards, Indian road conditions, and vehicle warranty policies.

=== VEHICLE DIGITAL TWIN — AI ANALYSIS REQUEST ===
Period: ${startDate} to ${endDate}   VIN: ${vin}

--- VEHICLE IDENTITY ---
Model: ${vi.vehicle_model || 'Unknown'}  Variant: ${vi.vehicle_variant || 'Unknown'}
Fuel: ${vi.fuel_type || 'Unknown'}  Engine: ${vi.engine_type || 'Unknown'}  Trans: ${vi.transmission_type || 'Unknown'}
CNG: ${vi.cng === 'Y' ? 'Yes' : 'No'}  Mfg: ${vi.manuf_date || 'N/A'}  Sale: ${vi.sale_date || 'N/A'}
Last Service: ${vi.last_serv || 'N/A'}  Last Warranty: ${vi.last_war_claim || 'N/A'}

--- USAGE ---
Trips: ${us.total_trips || n}  Distance: ${(us.total_distance || totalDist).toFixed(1)} km
Engine Hrs: ${Number(us.total_eng_hr || 0).toFixed(1)}  Avg Speed: ${(us.avg_speed || avgSpeed).toFixed(1)} km/h  Max Speed: ${maxSpeed.toFixed(1)} km/h
Start: ${us.start_location || 'N/A'}  End: ${us.end_location || 'N/A'}

--- DRIVING BEHAVIOUR ---
Harsh Acc: ${totalHarshAcc} events (${(tot(overallData,'harsh_acc_dur_in_sec')/60).toFixed(1)} min)
Harsh Brk: ${totalHarshBrk} events (${(tot(overallData,'harsh_brk_dur_in_sec')/60).toFixed(1)} min)
Harsh Turn: ${totalHarshTurn} events (${(tot(overallData,'harsh_turn_dur_in_sec')/60).toFixed(1)} min)
Total Harsh: ${totalHarshAcc + totalHarshBrk + totalHarshTurn}  Per 100km: ${harshPer100}
Overspeeding: ${totalOverspe} events (${(totalOverspeDur/60).toFixed(1)} min)
Acc Before Turn: ${totalAccBefore}  Brk After Turn: ${totalBrkAfter}
Idle Time: ${(totalIdle/60).toFixed(1)} min  Hazard Activations: ${totalHazard}
Left/Right Turns: ${tot(overallData,'left_turns')}/${tot(overallData,'right_turns')}

--- FUEL & EFFICIENCY ---
Avg Fuel Efficiency: ${avgFuelEff.toFixed(2)} km/l
CO2 Total: ${totalCo2.toFixed(2)} kg  CO2/km: ${totalDist > 0 ? (totalCo2/totalDist).toFixed(4) : 'N/A'} kg/km (BS6 norm ~0.12)
Fuel <20% Events: ${totalFuelLow}  Mileage Loss: ${totalKmsLoss.toFixed(1)} km
Fuel Fill: ${totalFilling}  Drain: ${totalEmptying}  Adulteration: ${totalAdult}${totalAdult > 0 ? ' ⚠️ CRITICAL' : ''}
Odometer Resets: ${odoResets}${odoResets > 0 ? ' ⚠️ CRITICAL' : ''}

--- BATTERY ---
Bat >15V (Overcharge): ${totalBatHi} events  Bat <9V (Under-volt): ${totalBatLo} events

--- CLIMATE ---
AC Usage: ${avgAcPct.toFixed(1)}% of trip time  Altitude: ${avgAlt.toFixed(0)}m  GSM: ${avgGsm.toFixed(1)}%

--- SPEED BANDS ---
${['0_20','20_60','60_80','80_100','100_120','120_140','140_plus'].map(b => `${b.replace(/_/g,'-')}kmh: ${avg(overallData,`speed_distribution_${b}_kmh`).toFixed(1)}%`).join('  ')}

--- DTC FAULTS ---
Total: ${dtcTile?.total_dtc_count || dtcInfo.length}  Unique codes: ${uniqueDtcCodes.length}
Active now: ${currentFaults}  History: ${histFaults}
Last DTC: ${dtcTile?.last_dtc_code || 'None'} at ${dtcTile?.last_dtc_time || 'N/A'}
Codes: ${dtcInfo.slice(0,15).map((d: any) => `${d.diagnosticinfo_data_dtc}(${d.diagnosticinfo_data_status}/${d.ecu || '?'})`).join(', ')}

--- BASELINE vs FLEET ---
Distance delta: ${bl.bsline_total_distance ? `${(((totalDist/n) - Number(bl.bsline_total_distance)) / Number(bl.bsline_total_distance) * 100).toFixed(1)}%` : 'N/A'}
Speed delta: ${bl.bsline_average_speed ? `${(avgSpeed - Number(bl.bsline_average_speed)).toFixed(1)} km/h` : 'N/A'}
Harsh Acc delta: ${bl.bsline_harsh_acc_count ? `${((totalHarshAcc/n) - Number(bl.bsline_harsh_acc_count)).toFixed(2)}/trip` : 'N/A'}
CO2 delta: ${bl.bsline_co2_emissions ? `${((totalCo2/n) - Number(bl.bsline_co2_emissions)).toFixed(2)} kg/trip` : 'N/A'}
=== END DATA ===

Provide a comprehensive aftermarket quality analysis with these EXACT section headings:

1. EXECUTIVE SUMMARY
2. DRIVING BEHAVIOUR ANALYSIS
3. FUEL & EFFICIENCY ANALYSIS
4. FAULT CODE ANALYSIS
5. MAINTENANCE RECOMMENDATIONS
6. WARRANTY RISK ASSESSMENT
7. SAFETY ALERTS
8. IMPROVEMENT RECOMMENDATIONS

Use automotive industry terminology. Be specific with numbers. Flag concerns with ⚠️ or 🔴.`;
};

// ─── Call AI provider ─────────────────────────────────────────────────────────
const callAI = async (
  provider: Provider, apiKey: string, model: string, prompt: string,
  log: (m: string) => void
): Promise<string> => {

  if (provider === 'gemini') {
    // Try models in order from cheapest to best, auto-fallback on quota errors
    const modelOrder = [
      model,                               // user-selected first
      'gemini-2.5-flash-preview-04-17',   // best free tier
      'gemini-2.0-flash',                  // reliable free tier
      'gemini-2.0-flash-lite',             // cheapest free tier
      'gemini-1.5-flash',                  // stable fallback
      'gemini-1.5-flash-8b',              // smallest fallback
    ].filter((m, i, a) => a.indexOf(m) === i); // dedupe

    for (let attempt = 0; attempt < modelOrder.length; attempt++) {
      const tryModel = modelOrder[attempt];
      if (attempt > 0) log(`⏳ Retrying with ${tryModel}...`);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) { log(`✅ Success with ${tryModel}`); return text; }
      }

      const err = await res.json().catch(() => ({}));
      const errMsg   = err?.error?.message || '';
      const retryAfter = errMsg.match(/retry in ([0-9.]+)s/i)?.[1];
      const is429    = res.status === 429;
      const is404    = res.status === 404;

      if (is429) {
        // Extract which quota was hit for a clear message
        const violations = err?.error?.details?.find((d: any) => d.violations)?.violations || [];
        const quotaNames = violations.map((v: any) => {
          if (v.quotaId?.includes('Day'))    return 'daily request limit';
          if (v.quotaId?.includes('Minute')) return 'per-minute rate limit';
          if (v.quotaId?.includes('Token'))  return 'token quota';
          return v.quotaId || 'unknown quota';
        }).filter(Boolean);

        const quotaMsg = quotaNames.length > 0
          ? `Quota hit: ${Array.from(new Set(quotaNames)).join(', ')}`
          : 'Rate limit exceeded';

        log(`⚠️ ${tryModel}: ${quotaMsg}${retryAfter ? ` — retry in ${retryAfter}s` : ''}`);

        if (retryAfter && attempt === 0 && Number(retryAfter) < 30) {
          log(`⏳ Waiting ${Math.ceil(Number(retryAfter))}s then retrying same model...`);
          await new Promise(r => setTimeout(r, (Number(retryAfter) + 1) * 1000));
          attempt--; // retry same model once
          continue;
        }

        if (attempt < modelOrder.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
          continue; // try next model
        }

        // All models exhausted - give clear actionable guidance
        throw new Error(
          `All Gemini models quota exhausted.

` +
          `Quick fixes:
` +
          `① Wait a minute and try again (per-minute quota resets)
` +
          `② Wait until tomorrow (daily quota resets at midnight UTC)
` +
          `③ Get a fresh free key: aistudio.google.com/app/apikey
` +
          `④ Enable billing on your Google Cloud project (~₹0.01/analysis)

` +
          `Last error: ${errMsg.slice(0, 200)}`
        );
      }

      if (is404) {
        log(`⚠️ ${tryModel}: model not found, trying next...`);
        continue;
      }

      // Non-quota, non-404 error - don't retry
      throw new Error(`Gemini ${res.status}: ${errMsg.slice(0, 200) || 'Unknown error'}`);
    }

    throw new Error('No Gemini model responded successfully');
  }

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Claude ${res.status}: ${err?.error?.message?.slice(0, 200) || 'Unknown error'}`);
    }
    const data = await res.json();
    return data?.content?.[0]?.text || '';
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI ${res.status}: ${err?.error?.message?.slice(0, 200) || 'Unknown error'}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  throw new Error('Unknown provider');
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
    sections.push({ title: 'Vehicle Analysis', icon: '🤖', content: text, severity: 'info' });
  return sections;
};

const sevStyle = (s: AnalysisSection['severity']) => ({
  good:     { border: '#a5d6a7', bg: '#f1f8e9', badge: '#2e7d32', badgeBg: '#e8f5e9' },
  warning:  { border: '#ffe082', bg: '#fffde7', badge: '#f57f17', badgeBg: '#fff9c4' },
  critical: { border: '#ef9a9a', bg: '#ffebee', badge: '#c62828', badgeBg: '#ffcdd2' },
  info:     { border: '#90caf9', bg: '#e3f2fd', badge: '#1565c0', badgeBg: '#bbdefb' },
}[s]);

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAnalysisDashboard: FC = () => {
  const { vin, apiParams } = useDt();

  // Provider state
  const [provider,   setProvider]   = useState<Provider>('openai');
  const [keys,       setKeys]       = useState<Record<Provider, string>>({
    gemini:  process.env.REACT_APP_GEMINI_KEY || '',
    claude:  '',
    openai:  process.env.REACT_APP_OPENAI_KEY || '',
  });
  const [models,     setModels]     = useState<Record<Provider, string>>({
    gemini: 'gemini-2.5-flash-preview-04-17',
    claude: 'claude-sonnet-4-5',
    openai: 'gpt-4o-mini',
  });
  const [showKeys, setShowKeys]     = useState<Record<Provider, boolean>>({ gemini: false, claude: false, openai: false });

  // Analysis state
  const [loading,    setLoading]    = useState(false);
  const [sections,   setSections]   = useState<AnalysisSection[]>([]);
  const [rawResponse,setRaw]        = useState('');
  const [error,      setError]      = useState('');
  const [dataStatus, setDataStatus] = useState<string[]>([]);
  const [progress,   setProgress]   = useState(0);
  const [trigger,    setTrigger]    = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });

  const cfg  = PROVIDERS.find(p => p.id === provider)!;
  const log  = (msg: string) => setDataStatus(prev => [...prev, msg]);

  const updateKey   = (p: Provider, v: string) => setKeys(k   => ({ ...k, [p]: v }));
  const updateModel = (p: Provider, v: string) => setModels(m => ({ ...m, [p]: v }));

  const runAnalysis = useCallback(async () => {
    const key = keys[provider].trim();
    if (!key) { setError(`Please enter your ${cfg.name} API key.`); return; }

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

      log(`🧠 Building analysis prompt...`);
      const prompt = buildPrompt(vin, apiParams.startdate, apiParams.enddate, vi, us, od, di, dt, fe, bl, kpi);
      setProgress(50);

      log(`🤖 Sending to ${cfg.name} — ${models[provider]}...`);
      const responseText = await callAI(provider, key, models[provider], prompt, log);
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
  }, [vin, apiParams, provider, keys, models, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const testConnection = async () => {
    const key = keys[provider].trim();
    if (!key) { setError(`Enter your ${cfg.name} API key first.`); return; }
    setDataStatus(['🔌 Testing connection...']);
    setError('');
    try {
      let ok = false;
      if (provider === 'gemini') {
        const testModel = models.gemini || 'gemini-2.0-flash-lite';
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${key}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with just the word OK.' }] }], generationConfig: { maxOutputTokens: 10 } }) }
        );
        ok = res.ok;
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`${res.status}: ${e?.error?.message?.slice(0,120) || 'error'}`); }
      } else if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
          body: JSON.stringify({ model: models.claude, max_tokens: 10, messages: [{ role:'user', content:'Reply OK.' }] })
        });
        ok = res.ok;
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`${res.status}: ${e?.error?.message?.slice(0,120) || 'error'}`); }
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type':'application/json','Authorization':`Bearer ${key}` },
          body: JSON.stringify({ model: models.openai, max_tokens: 10, messages: [{ role:'user', content:'Reply OK.' }] })
        });
        ok = res.ok;
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`${res.status}: ${e?.error?.message?.slice(0,120) || 'error'}`); }
      }
      if (ok) setDataStatus([`✅ ${cfg.name} connection successful — ${models[provider]} is ready`]);
    } catch(e: any) {
      setDataStatus([`❌ Connection failed: ${e.message}`]);
      setError(e.message);
    }
  };

  const downloadTxt = () => {
    const hdr = `VEHICLE DIGITAL TWIN — AI ANALYSIS REPORT\n${'='.repeat(60)}\nVIN: ${vin}\nPeriod: ${apiParams.startdate} to ${apiParams.enddate}\nProvider: ${cfg.name} · Model: ${models[provider]}\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([hdr + rawResponse], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.download = `AI_Analysis_${vin}_${apiParams.startdate}.txt`;
    a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' as const };
  const sec:  React.CSSProperties = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };

  return (
    <div style={page} id="dt-page-content">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#e91e8c,#c2185b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(233,30,140,0.30)',
        }}>
          <svg viewBox='0 0 24 24' width='24' height='24' fill='#fff'>
            <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z'/>
          </svg>
        </div>
        <div>
          <h1 style={{ color: '#111', fontWeight: 900, fontSize: 24, margin: 0, lineHeight: 1.1 }}>Vehicle Analysis</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '3px 0 0', fontWeight: 400 }}>
            AI-powered comprehensive vehicle telematics analysis
          </p>
        </div>
      </div>

      <DateFilterBar title="Vehicle Analysis" onApply={() => setTrigger(prev => prev + 1)} />

      {/* ── AI Provider selector ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={sec}>🤖 AI Provider</div>

        {/* Provider tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)} style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.15s',
              border: `2px solid ${provider === p.id ? p.color : '#e0e0e0'}`,
              background: provider === p.id ? p.color : '#f9f9f9',
              color: provider === p.id ? '#fff' : '#444',
              boxShadow: provider === p.id ? `0 4px 16px ${p.color}44` : 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              {p.name}
              {p.id === 'gemini' && keys.gemini && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 10 }}>Key set</span>}
              {p.id === 'claude' && keys.claude && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 10 }}>Key set</span>}
              {p.id === 'openai' && keys.openai && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 10 }}>Key set</span>}
            </button>
          ))}
        </div>

        {/* Selected provider config */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
          {/* API Key */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>
              {cfg.name} API Key
              <a href={cfg.keyLink} target="_blank" rel="noreferrer"
                style={{ marginLeft: 8, fontSize: 11, color: cfg.color, textDecoration: 'none', fontWeight: 400 }}>
                Get key →
              </a>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKeys[provider] ? 'text' : 'password'}
                placeholder={cfg.keyPlaceholder}
                value={keys[provider]}
                onChange={e => updateKey(provider, e.target.value)}
                style={{
                  width: '100%', padding: '10px 44px 10px 14px',
                  border: `1.5px solid ${keys[provider] ? cfg.color : '#ddd'}`,
                  borderRadius: 10, fontSize: 13, outline: 'none',
                  boxSizing: 'border-box' as const, fontFamily: 'monospace',
                  background: keys[provider] ? `${cfg.color}08` : '#fafafa',
                }}
              />
              <button
                onClick={() => setShowKeys(s => ({ ...s, [provider]: !s[provider] }))}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#aaa' }}
              >{showKeys[provider] ? '🙈' : '👁'}</button>
            </div>
          </div>

          {/* Model select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>
              Model
            </label>
            <select
              value={models[provider]}
              onChange={e => updateModel(provider, e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                border: `1.5px solid ${cfg.color}`,
                borderRadius: 10, fontSize: 13, outline: 'none',
                background: '#fff', cursor: 'pointer',
                color: '#111', fontWeight: 600,
              }}
            >
              {cfg.models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.note ? ` — ${m.note}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Run button */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={runAnalysis} disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#f0f0f0' : `linear-gradient(135deg,${cfg.color},${cfg.color}cc)`,
              border: 'none', borderRadius: 10, color: loading ? '#aaa' : '#fff',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : `0 4px 16px ${cfg.color}44`,
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid #aaa', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> Analysing…</>
            ) : (
              <>{cfg.icon} Run Analysis with {cfg.name}</>
            )}
          </button>
          <button
            onClick={testConnection}
            disabled={loading}
            style={{
              padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: `1.5px solid ${cfg.color}`, background: 'transparent',
              color: cfg.color, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${cfg.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            🔌 Test Key
          </button>
          {models[provider] && (
            <span style={{ fontSize: 12, color: '#888' }}>
              Using: <strong style={{ color: cfg.color }}>{cfg.models.find(m => m.id === models[provider])?.label || models[provider]}</strong>
            </span>
          )}
        </div>

        {/* Data info */}
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 12, color: '#888', cursor: 'pointer', userSelect: 'none' as const }}>
            📊 What data is sent to AI?
          </summary>
          <div style={{ marginTop: 8, background: '#f8f9fa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#555', lineHeight: 2 }}>
            {['Vehicle identity (model, variant, fuel, engine)', 'Usage (trips, distance, engine hours, locations)', 'Driving behaviour (harsh events, overspeeding, turns)', 'Fuel & efficiency (FE, CO₂, battery, adulteration)', 'Speed distribution (7 speed bands)', 'DTC/Fault codes (codes, ECU, status)', 'Climate (AC usage %, mileage loss)', 'Altitude, GSM signal, odometer resets', 'Fleet baseline comparisons (12+ KPI deltas)'].map((x, i) => <div key={i}>✅ {x}</div>)}
            <div style={{ color: '#e91e8c', fontWeight: 600, marginTop: 6 }}>⚠️ No raw GPS coordinates or personal data included.</div>
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
          </div>
        </div>
      )}

      {/* Progress */}
      {(loading || dataStatus.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>📡 Progress</div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${cfg.color},${cfg.color}cc)`, borderRadius: 3, transition: 'width 0.4s ease' }}/>
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
            <div style={sec}>📊 Results — {apiParams.startdate} → {apiParams.enddate} · {cfg.name} · {cfg.models.find(m => m.id === models[provider])?.label}</div>
            <button onClick={downloadTxt} style={{ padding: '9px 20px', background: `linear-gradient(135deg,${cfg.color},${cfg.color}cc)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 12px ${cfg.color}44`, display: 'flex', alignItems: 'center', gap: 7 }}>
              📥 Download Report (.txt)
            </button>
          </div>

          {/* ── Accordion section tabs ── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
            {sections.map((s, i) => {
              const st       = sevStyle(s.severity);
              const isExpanded = !!expandedSections[i];
              const cleanContent = s.content.replace(/^[0-9]+\.\s+[A-Z][A-Z\s&]+[\n:—\-]*/m, '').trim();
              // Word count for preview
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
                  {/* Accordion header — always visible, click to expand */}
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

                  {/* Expanded content */}
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
              <button onClick={downloadTxt} style={{ padding: '6px 14px', border: `1.5px solid ${cfg.color}`, borderRadius: 8, background: `${cfg.color}18`, cursor: 'pointer', fontSize: 12, color: cfg.color, fontWeight: 600 }}>
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
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>Vehicle Analysis</div>
          <div style={{ fontSize: 14, color: '#888', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Select your AI provider, enter your API key, choose a model, then click <strong style={{ color: '#e91e8c' }}>Run Analysis</strong> to get expert insights on this vehicle's telematics data.
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {PROVIDERS.map(p => (
              <span key={p.id} style={{ background: `${p.color}18`, color: p.color, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: `1px solid ${p.color}44` }}>
                {p.icon} {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisDashboard;
