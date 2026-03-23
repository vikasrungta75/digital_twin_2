import React, { FC, useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';

const OPENAI_KEY   = process.env.REACT_APP_OPENAI_KEY || '';
const OPENAI_MODEL = 'gpt-4o-mini';

// ── Download helpers ──────────────────────────────────────────────────────────
const downloadTxt = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.download = `${filename.replace(/[^a-z0-9_\-]/gi,'_')}.txt`;
  a.href = url; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.download = `${filename.replace(/[^a-z0-9_\-]/gi,'_')}.csv`;
  a.href = url; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const copyToClipboard = (text: string) => {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
};

interface KpiCardProps {
  label: string; value: any; baseline?: any;
  unit?: string; icon?: string; color?: string;
  description?: string; trendData?: Array<{ label: string; value: number }>;
  lowerIsBetter?: boolean; rawData?: any; vehicleInfo?: any;
}

// ── Statistical helpers ───────────────────────────────────────────────────────
const calcStats = (vals: number[]) => {
  if (!vals.length) return null;
  const n      = vals.length;
  const sum    = vals.reduce((a, b) => a + b, 0);
  const mean   = sum / n;
  const sorted = [...vals].sort((a, b) => a - b);
  const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stddev   = Math.sqrt(variance);
  const cv       = mean !== 0 ? (stddev / mean) * 100 : 0;
  const median   = n % 2 === 0
    ? (sorted[n/2-1] + sorted[n/2]) / 2
    : sorted[Math.floor(n/2)];
  const p25  = sorted[Math.floor(n * 0.25)];
  const p75  = sorted[Math.floor(n * 0.75)];
  const iqr  = p75 - p25;
  // Linear trend slope
  const xMean = (n - 1) / 2;
  const slope = vals.reduce((s, v, i) => s + (i - xMean) * (v - mean), 0)
    / vals.reduce((s, _, i) => s + Math.pow(i - xMean, 2), 0);
  const trend = Math.abs(slope) < 0.001 ? 'Stable'
    : slope > 0 ? 'Increasing' : 'Decreasing';
  const trendStrength = Math.abs(slope / (mean || 1)) * 100;
  // Outliers (> 2 std devs from mean)
  const outliers = vals.filter(v => Math.abs(v - mean) > 2 * stddev);
  return {
    n, sum, mean, median, min: sorted[0], max: sorted[n-1],
    stddev, cv, p25, p75, iqr, slope, trend, trendStrength, outliers,
  };
};

const fmt = (v: number, dp = 2) =>
  v > 1_000_000 ? `${(v/1_000_000).toFixed(1)}M`
  : v > 1_000   ? `${(v/1_000).toFixed(1)}K`
  : v.toFixed(dp);

// ── Parse AI response into named sections ─────────────────────────────────────
const parseSections = (text: string) => {
  const headings = ['INTERPRETATION','ROOT CAUSE','IMPACT','BENCHMARKS','RECOMMENDATIONS','TREND INSIGHT'];
  const icons: Record<string,string> = {
    INTERPRETATION:'📋', 'ROOT CAUSE':'🔍', IMPACT:'🏥',
    BENCHMARKS:'📏', RECOMMENDATIONS:'✅', 'TREND INSIGHT':'📈',
  };
  const clean = text
    .replace(/\*\*([A-Z][A-Z &]+)\*\*/g, '$1')
    .replace(/^#{1,3}\s*/gm, '')
    .replace(/^[0-9]+\.\s+([A-Z])/gm, '$1');
  const sections: { title: string; content: string; icon: string }[] = [];
  headings.forEach((h, i) => {
    const si = clean.search(new RegExp(h, 'i'));
    if (si === -1) return;
    const next = headings.slice(i+1).find(hh => clean.search(new RegExp(hh,'i')) > si);
    const ei   = next ? clean.search(new RegExp(next,'i')) : clean.length;
    const content = clean.slice(si, ei).replace(new RegExp('^'+h+'[:\\s—\\-]*','i'),'').trim();
    if (content.length > 10) sections.push({ title: h, content, icon: icons[h] || '📊' });
  });
  return sections.length > 0 ? sections : [{ title: 'ANALYSIS', content: text, icon: '🤖' }];
};

// ── Field key lookup (module-level constant — never recreated) ───────────────
const FIELD_MAP: Record<string, string[]> = {
  'Fuel Efficiency': ['fuel_efficiency'], 'CO₂': ['co2_emissions'],
  'Speed':           ['average_speed','max_speed'],
  'Harsh Acc':       ['harsh_acc_count'],
  'Harsh Brk':       ['harsh_brk_count'],
  'Harsh Turn':      ['harsh_turn_count'],
  'Overspeeding':    ['overspeeding_count'],
  'Idle':            ['idle_time'],
  'Battery':         ['bat_above_15v'],
  'AC':              ['percentage_ac_on'],
  'Distance':        ['trip_distance'],
  'Duration':        ['trip_duration_minute'],
  'Altitude':        ['altitude_median'],
  'GSM':             ['gsm_strength_per'],
  'CO2':             ['co2_emissions'],
  'Mileage':         ['kms_loss_mlg'],
};

const KpiCard: FC<KpiCardProps> = ({
  label, value, baseline, unit='', icon='📊', color='#42a5f5',
  description, trendData, lowerIsBetter=false, rawData, vehicleInfo,
}) => {
  const [open,          setOpen]         = useState(false);
  const [activeTab,     setActiveTab]    = useState<'stats'|'ai'>('stats');
  const [aiResult,      setAiResult]     = useState('');
  const [aiLoading,     setAiLoading]    = useState(false);
  const [aiSections,    setAiSections]   = useState<{ title:string; content:string; icon:string }[]>([]);
  const [activeSection, setActiveSection]= useState(0);
  const [showRaw,       setShowRaw]      = useState(false);
  const [copied,        setCopied]       = useState(false);

  const num     = value    != null ? Number(value)    : null;
  const numBase = baseline != null ? Number(baseline) : null;
  const delta   = (num != null && numBase != null && numBase !== 0)
    ? ((num - numBase) / numBase * 100) : null;
  const isGood  = delta == null ? null : lowerIsBetter ? delta <= 0 : delta >= 0;
  const display = num == null ? '—' : fmt(num);
  const statusColor = isGood == null ? '#888' : isGood ? '#2e7d32' : '#c62828';
  const statusBg    = isGood == null ? '#f5f5f5' : isGood ? '#e8f5e9' : '#ffebee';

  // ── Extract trip-level values for this KPI ────────────────────────────────
  const rd       = useMemo(() => rawData || [], [rawData]); // eslint-disable-line react-hooks/exhaustive-deps
  const fieldKey = useMemo(() => Object.entries(FIELD_MAP).find(([k]) => label.toLowerCase().includes(k.toLowerCase()))?.[1]?.[0] || '', [label]); // eslint-disable-line react-hooks/exhaustive-deps
  const tripVals  = useMemo(() =>
    fieldKey && rd.length
      ? rd.map((d: any) => Number(d[fieldKey] || 0)).filter((v: number) => isFinite(v) && v > 0)
      : [],
    [fieldKey, rd]
  );
  const tripStats = useMemo(() => calcStats(tripVals), [tripVals]);

  const timeSeries = useMemo(() =>
    fieldKey && rd.length
      ? rd.slice(0, 60).map((d: any) => ({
          date:  (d.process_date || '').slice(5, 10),
          value: Number(d[fieldKey] || 0),
        })).filter((x: any) => x.value > 0)
      : [],
    [fieldKey, rd]
  );

  const chartData = trendData || (num != null && numBase != null
    ? [{ label:'Fleet Avg', value: numBase }, { label:'This Vehicle', value: num }]
    : []);

  // ── AI prompt — sends ALL stats + raw values ──────────────────────────────
  const buildPrompt = useCallback(() => {
    const vi = vehicleInfo || {};
    const s  = tripStats;
    const rawSample = tripVals.map(function(val: number, idx: number) {
      return "Trip " + String(idx+1) + ": " + val.toFixed(2) + " " + unit;
    }).slice(0, 50).join(" | ");

    return `You are an expert automotive quality analyst for Indian aftermarket vehicles. Analyse this KPI with the full statistical context provided.

CRITICAL: Do NOT restate the statistics. Start IMMEDIATELY with INTERPRETATION.
Use EXACTLY these section headers on their own line:
INTERPRETATION
ROOT CAUSE
IMPACT
BENCHMARKS
RECOMMENDATIONS
TREND INSIGHT

=== KPI DETAILS ===
KPI Name: ${label}
Current Aggregate Value: ${display} ${unit}
Fleet Baseline: ${numBase != null ? `${(numBase as number).toFixed(2)} ${unit}` : 'Not available'}
Delta vs Baseline: ${delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : 'N/A'}
Status: ${isGood == null ? 'Unknown' : isGood ? 'GOOD' : 'NEEDS ATTENTION'}
Lower is better: ${lowerIsBetter ? 'Yes' : 'No'}
Description: ${description || 'No description'}

=== VEHICLE CONTEXT ===
Model: ${vi.vehicle_model || 'Unknown'} ${vi.vehicle_variant || ''}
Fuel: ${vi.fuel_type || 'Unknown'}, Engine: ${vi.engine_type || 'Unknown'}
Age: Mfg ${vi.manuf_date || 'Unknown'}, Sale ${vi.sale_date || 'Unknown'}
Last Service: ${vi.last_serv || 'Unknown'}

=== STATISTICAL ANALYSIS (${s?.n || 0} trip-level records) ===
Mean:    ${s ? s.mean.toFixed(3) : 'N/A'} ${unit}
Median:  ${s ? s.median.toFixed(3) : 'N/A'} ${unit}
Min:     ${s ? s.min.toFixed(3) : 'N/A'} ${unit}
Max:     ${s ? s.max.toFixed(3) : 'N/A'} ${unit}
Sum:     ${s ? s.sum.toFixed(3) : 'N/A'} ${unit}
Std Dev: ${s ? s.stddev.toFixed(3) : 'N/A'}
CV:      ${s ? s.cv.toFixed(1) : 'N/A'}% (variability index)
P25:     ${s ? s.p25.toFixed(3) : 'N/A'} ${unit}
P75:     ${s ? s.p75.toFixed(3) : 'N/A'} ${unit}
IQR:     ${s ? s.iqr.toFixed(3) : 'N/A'}
Trend:   ${s?.trend || 'N/A'} (slope: ${s ? s.slope.toFixed(4) : 'N/A'})
Outliers: ${s?.outliers.length || 0} values beyond 2 std devs ${s?.outliers.length ? `(${s.outliers.slice(0,5).map(v=>v.toFixed(2)).join(', ')})` : ''}

=== RAW TRIP VALUES (first 50 of ${tripVals.length}) ===
${rawSample || 'No trip-level data available for this KPI'}`;
  }, [label, display, unit, numBase, delta, isGood, lowerIsBetter, description, vehicleInfo, tripStats, tripVals]); // eslint-disable-line react-hooks/exhaustive-deps
  const NL = String.fromCharCode(10);
  const getStatsReport = useCallback(() => {
    const s = tripStats;
    const parts: string[] = [
      "KPI STATISTICAL REPORT",
      "=".repeat(50),
      "KPI:           " + label,
      "Value:         " + display + " " + unit,
      "Fleet Baseline:" + (numBase != null ? " " + (numBase as number).toFixed(2) + " " + unit : " N/A"),
      "Delta:         " + (delta != null ? (delta >= 0 ? "+" : "") + delta.toFixed(1) + "%" : "N/A"),
      "Status:        " + (isGood == null ? "Unknown" : isGood ? "GOOD" : "NEEDS ATTENTION"),
      "",
      "STATISTICS (" + (s ? s.n : 0) + " trip records)",
      "-".repeat(40),
      "Mean:          " + (s ? s.mean.toFixed(3) : "N/A") + " " + unit,
      "Median:        " + (s ? s.median.toFixed(3) : "N/A") + " " + unit,
      "Min:           " + (s ? s.min.toFixed(3) : "N/A") + " " + unit,
      "Max:           " + (s ? s.max.toFixed(3) : "N/A") + " " + unit,
      "Sum/Total:     " + (s ? s.sum.toFixed(2) : "N/A") + " " + unit,
      "Std Deviation: " + (s ? s.stddev.toFixed(3) : "N/A"),
      "Coeff of Var:  " + (s ? s.cv.toFixed(1) : "N/A") + "%",
      "25th Pctile:   " + (s ? s.p25.toFixed(3) : "N/A") + " " + unit,
      "75th Pctile:   " + (s ? s.p75.toFixed(3) : "N/A") + " " + unit,
      "IQR:           " + (s ? s.iqr.toFixed(3) : "N/A"),
      "Trend:         " + (s ? s.trend : "N/A") + " (slope: " + (s ? s.slope.toFixed(4) : "N/A") + "/trip)",
      "Outliers:      " + (s ? s.outliers.length : 0) + " trips beyond 2 std devs",
      "",
      "RAW TRIP VALUES (" + tripVals.length + " records)",
      "-".repeat(40),
    ];
    tripVals.forEach(function(val: number, idx: number) {
      parts.push("Trip " + String(idx + 1).padStart(4, "0") + ": " + val.toFixed(3) + " " + unit);
    });
    if (aiResult) {
      parts.push("", "AI ANALYSIS", "=".repeat(50), aiResult);
    }
    return parts.join(NL);
  }, [label, display, unit, numBase, delta, isGood, tripStats, tripVals, aiResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatsCsv = useCallback(() => {
    const rows: string[][] = [['Trip#', 'Value', unit || 'unit', 'Date']];
    tripVals.forEach(function(val: number, idx: number) {
      const d = (rawData || [])[idx];
      rows.push([String(idx + 1), val.toFixed(3), unit, d?.process_date || '']);
    });
    return rows;
  }, [tripVals, unit, rawData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(() => {
    copyToClipboard(getStatsReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getStatsReport]);

  // ── Run AI ────────────────────────────────────────────────────────────────
  const runAi = useCallback(async () => {
    setAiLoading(true); setAiResult(''); setAiSections([]); setActiveSection(0);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: OPENAI_MODEL, max_tokens: 1500, temperature: 0.3,
          messages: [{ role:'user', content: buildPrompt() }],
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`OpenAI ${res.status}: ${e?.error?.message?.slice(0,100)||'error'}`);
      }
      const data   = await res.json();
      const text   = data?.choices?.[0]?.message?.content || '';
      setAiResult(text);
      setAiSections(parseSections(text));
    } catch (e: any) {
      setAiResult(`❌ ${e.message}`);
      setAiSections([{ title:'ERROR', content: e.message, icon:'❌' }]);
    } finally { setAiLoading(false); }
  }, [buildPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = tripStats;

  return (
    <>
      <style>{`
        @keyframes dtFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes kpiSpin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── Card tile ── */}
      <div onClick={() => setOpen(true)} title="Click to expand"
        style={{ background:'#fff',borderRadius:14,padding:'14px 16px',
          boxShadow:'0 1px 6px rgba(0,0,0,0.07)',cursor:'pointer',position:'relative',
          overflow:'hidden',border:'1.5px solid transparent',transition:'all 0.18s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-2px)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none';}}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:3,
          background:`linear-gradient(90deg,${color},${color}66)`,borderRadius:'14px 14px 0 0' }}/>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          {delta != null && (
            <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:statusBg,color:statusColor }}>
              {delta>=0?'▲':'▼'}{Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <div style={{ fontSize:22,fontWeight:800,color:'#111',lineHeight:1.1,marginBottom:2 }}>
          {display}{unit&&<span style={{ fontSize:11,color:'#888',fontWeight:400,marginLeft:3 }}>{unit}</span>}
        </div>
        <div style={{ fontSize:11,color:'#666',fontWeight:600,marginBottom:6,lineHeight:1.3 }}>{label}</div>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={36}>
            <BarChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
              <Bar dataKey="value" radius={[2,2,0,0]}>
                {chartData.map((_,i)=><Cell key={i} fill={i===chartData.length-1?color:`${color}44`}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div style={{ fontSize:9,color:'#ccc',marginTop:2,textAlign:'right' as const }}>click to expand ⤢</div>
      </div>

      {/* ── Expanded modal ── */}
      {open && (
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={() => setOpen(false)}>
          <div style={{ background:'#fff',borderRadius:20,width:640,maxWidth:'96vw',maxHeight:'92vh',
            boxShadow:'0 24px 80px rgba(0,0,0,0.25)',overflow:'hidden',
            display:'flex',flexDirection:'column' as const,animation:'dtFadeIn .18s ease' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${color},${color}99)`,padding:'16px 20px',flexShrink:0 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:26 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize:15,fontWeight:800,color:'#fff' }}>{label}</div>
                    {unit && <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)' }}>{unit}</div>}
                  </div>
                </div>
                <button onClick={()=>setOpen(false)} style={{ border:'none',background:'rgba(255,255,255,.2)',
                  borderRadius:10,width:34,height:34,cursor:'pointer',fontSize:16,color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
              </div>
            </div>

            {/* Tab bar + action toolbar */}
            <div style={{ flexShrink:0 }}>
              <div style={{ display:'flex',borderBottom:'1px solid #f0f0f0',background:'#fafafa' }}>
                {[
                  { id:'stats' as const, label:'📊 Statistics' },
                  { id:'ai'    as const, label:'🤖 AI Analysis' },
                ].map(t => (
                  <button key={t.id} onClick={()=>setActiveTab(t.id)}
                    style={{ flex:1,padding:'11px 8px',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,
                      background:'transparent',transition:'all .15s',
                      borderBottom: activeTab===t.id ? `3px solid ${color}` : '3px solid transparent',
                      color: activeTab===t.id ? color : '#888' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {/* Action toolbar */}
              <div style={{ display:'flex',gap:6,padding:'8px 14px',background:'#fff',
                borderBottom:'2px solid #f0f0f0',flexWrap:'wrap' as const }}>
                <button onClick={() => downloadTxt(`KPI_${label}`, getStatsReport())}
                  style={{ padding:'5px 12px',border:'1px solid #4caf50',borderRadius:7,background:'#f1f8e9',
                    cursor:'pointer',fontSize:11,color:'#2e7d32',fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
                  📄 Download .txt
                </button>
                <button onClick={() => downloadCsv(`KPI_${label}`, getStatsCsv())}
                  style={{ padding:'5px 12px',border:'1px solid #42a5f5',borderRadius:7,background:'#e3f2fd',
                    cursor:'pointer',fontSize:11,color:'#1565c0',fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
                  📊 Download .csv
                </button>
                <button onClick={handleCopy}
                  style={{ padding:'5px 12px',border:`1px solid ${copied?'#66bb6a':'#ddd'}`,borderRadius:7,
                    background:copied?'#e8f5e9':'#f9f9f9',cursor:'pointer',fontSize:11,
                    color:copied?'#2e7d32':'#777',fontWeight:600,display:'flex',alignItems:'center',gap:5,transition:'all .2s' }}>
                  {copied ? '✅ Copied!' : '📋 Copy Stats'}
                </button>
                {aiResult && (
                  <button onClick={() => downloadTxt(`AI_Analysis_${label}`, getStatsReport())}
                    style={{ padding:'5px 12px',border:'1px solid #10A37F',borderRadius:7,background:'#f0fdf4',
                      cursor:'pointer',fontSize:11,color:'#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
                    🤖 Download AI Report
                  </button>
                )}
                <div style={{ marginLeft:'auto',fontSize:10,color:'#bbb',alignSelf:'center' }}>
                  {tripVals.length > 0 ? `${tripVals.length} records` : 'No raw data'}
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY:'auto' as const,flex:1,padding:'18px 20px' }}>

              {/* ══ STATS TAB ══ */}
              {activeTab === 'stats' && (
                <div style={{ display:'flex',flexDirection:'column' as const,gap:14 }}>

                  {/* Value vs Baseline */}
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
                    {[
                      { label:'Current Value', val:`${display} ${unit}`, c:color },
                      { label:'Fleet Baseline', val:numBase!=null?`${(numBase as number).toFixed(2)} ${unit}`:'N/A', c:'#888' },
                      { label:'Delta', val:delta!=null?`${delta>=0?'+':''}${delta.toFixed(1)}%`:'N/A', c:statusColor },
                    ].map(x=>(
                      <div key={x.label} style={{ background:'#fafafa',borderRadius:12,padding:'12px',textAlign:'center' as const }}>
                        <div style={{ fontSize:20,fontWeight:900,color:x.c,lineHeight:1 }}>{x.val}</div>
                        <div style={{ fontSize:10,color:'#888',marginTop:4,fontWeight:600 }}>{x.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Full stats table */}
                  {s && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:800,color:'#333',marginBottom:8,borderLeft:`3px solid ${color}`,paddingLeft:8 }}>
                        📐 Full Statistical Summary — {s.n} trip records
                      </div>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                        {[
                          ['Mean',         `${s.mean.toFixed(3)} ${unit}`],
                          ['Median',       `${s.median.toFixed(3)} ${unit}`],
                          ['Min',          `${s.min.toFixed(3)} ${unit}`],
                          ['Max',          `${s.max.toFixed(3)} ${unit}`],
                          ['Sum / Total',  `${s.sum.toFixed(2)} ${unit}`],
                          ['Std Deviation',`${s.stddev.toFixed(3)}`],
                          ['Coeff of Var', `${s.cv.toFixed(1)}%`],
                          ['25th Pctile',  `${s.p25.toFixed(3)} ${unit}`],
                          ['75th Pctile',  `${s.p75.toFixed(3)} ${unit}`],
                          ['IQR',          `${s.iqr.toFixed(3)}`],
                          ['Trend',        s.trend],
                          ['Slope',        `${s.slope.toFixed(4)} per trip`],
                          ['Outliers',     `${s.outliers.length} trips (>2σ)`],
                          ['Records',      String(s.n)],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display:'flex',justifyContent:'space-between',
                            background:k==='Trend'||k==='Std Deviation'||k==='Coeff of Var'?'#fff8e1':'#fafafa',
                            borderRadius:8,padding:'7px 12px',border:'1px solid #f0f0f0' }}>
                            <span style={{ fontSize:11,color:'#777',fontWeight:600 }}>{k}</span>
                            <span style={{ fontSize:11,color:'#111',fontWeight:700,fontFamily:'monospace' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {s.outliers.length > 0 && (
                        <div style={{ marginTop:8,background:'#fff3e0',border:'1px solid #ffcc02',borderRadius:8,
                          padding:'8px 12px',fontSize:11,color:'#e65100' }}>
                          ⚠️ Outlier values: {s.outliers.slice(0,8).map(v=>v.toFixed(2)).join(', ')}{s.outliers.length>8?` +${s.outliers.length-8} more`:''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trend chart */}
                  {timeSeries.length > 1 && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:800,color:'#333',marginBottom:8,borderLeft:`3px solid ${color}`,paddingLeft:8 }}>
                        📈 Trend — {timeSeries.length} records
                        <span style={{ marginLeft:8,fontWeight:400,color:s?.trend==='Increasing'?'#ef5350':s?.trend==='Decreasing'?'#66bb6a':'#888' }}>
                          {s?.trend==='Increasing'?' ↑ Increasing':s?.trend==='Decreasing'?' ↓ Decreasing':' → Stable'}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={timeSeries} margin={{top:4,right:8,left:0,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                          <XAxis dataKey="date" tick={{fontSize:9}} tickLine={false}/>
                          <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}/>
                          <Tooltip formatter={(v:any)=>[`${v} ${unit}`,label]}/>
                          {numBase!=null && <ReferenceLine y={numBase} stroke="#aaa" strokeDasharray="4 4"
                            label={{value:'Baseline',position:'right' as const,fontSize:9,fill:'#aaa'}}/>}
                          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{r:3}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Baseline bar */}
                  {timeSeries.length <= 1 && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="label" tick={{fontSize:11}} tickLine={false}/>
                        <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                        <Tooltip formatter={(v:any)=>[`${v} ${unit}`,'Value']}/>
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {chartData.map((_,i)=><Cell key={i} fill={i===chartData.length-1?color:`${color}55`}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {/* Description */}
                  {description && (
                    <div style={{ background:'#fff8e1',border:'1px solid #ffe082',borderRadius:10,
                      padding:'10px 14px',fontSize:12,color:'#555',lineHeight:1.7 }}>
                      💡 {description}
                    </div>
                  )}

                  {/* CTA to AI */}
                  <div style={{ background:'linear-gradient(135deg,#10A37F12,#10A37F06)',border:'1.5px dashed #10A37F55',
                    borderRadius:12,padding:'14px 18px',textAlign:'center' as const }}>
                    <div style={{ fontSize:13,color:'#065f46',marginBottom:8,fontWeight:600 }}>
                      Want a deeper expert interpretation of these statistics?
                    </div>
                    <button onClick={()=>setActiveTab('ai')} style={{
                      padding:'9px 22px',background:'#10A37F',border:'none',borderRadius:10,color:'#fff',
                      fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'0 3px 12px rgba(16,163,127,0.3)' }}>
                      🤖 Run AI Analysis →
                    </button>
                  </div>
                </div>
              )}

              {/* ══ AI TAB ══ */}
              {activeTab === 'ai' && (
                <div style={{ display:'flex',flexDirection:'column' as const,gap:12 }}>

                  {/* What will be sent info */}
                  {!aiResult && !aiLoading && (
                    <div style={{ background:'#f0f4ff',borderRadius:12,padding:'14px 16px',fontSize:12,color:'#555',lineHeight:1.8 }}>
                      <div style={{ fontWeight:700,color:'#1a237e',marginBottom:8 }}>📦 Data being sent to GPT-4o mini:</div>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:4 }}>
                        {[
                          `✅ KPI value: ${display} ${unit}`,
                          `✅ Fleet baseline: ${numBase != null ? `${(numBase as number).toFixed(2)} ${unit}` : 'N/A'}`,
                          `✅ Delta vs fleet: ${delta != null ? `${delta.toFixed(1)}%` : 'N/A'}`,
                          `✅ Mean / Median / Std Dev`,
                          `✅ Min / Max / IQR / P25 / P75`,
                          `✅ Trend + slope coefficient`,
                          `✅ Outlier values (${s?.outliers?.length || 0} detected)`,
                          `✅ ${tripVals.length} raw trip-level values`,
                          `✅ Vehicle model / fuel / engine`,
                          `✅ Service history context`,
                        ].map((x,i)=><div key={i}>{x}</div>)}
                      </div>
                    </div>
                  )}

                  {/* Run button */}
                  {!aiResult && !aiLoading && (
                    <button onClick={runAi} style={{
                      width:'100%',padding:'13px',background:'linear-gradient(135deg,#10A37F,#059669)',
                      border:'none',borderRadius:12,color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',
                      boxShadow:'0 4px 16px rgba(16,163,127,0.35)',letterSpacing:0.3 }}>
                      ◎ Run AI Analysis on {label}
                    </button>
                  )}

                  {/* Loading */}
                  {aiLoading && (
                    <div style={{ textAlign:'center' as const,padding:'28px 20px',color:'#10A37F' }}>
                      <div style={{ width:36,height:36,border:'3px solid #10A37F44',borderTopColor:'#10A37F',
                        borderRadius:'50%',animation:'kpiSpin .8s linear infinite',margin:'0 auto 12px' }}/>
                      <div style={{ fontWeight:600,fontSize:13 }}>Analysing {label}…</div>
                      <div style={{ fontSize:11,color:'#888',marginTop:4 }}>Sending {tripVals.length} data points to GPT-4o mini</div>
                    </div>
                  )}

                  {/* Results — section pills */}
                  {aiSections.length > 0 && !aiLoading && (
                    <div>
                      {/* Pills */}
                      <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:12 }}>
                        {aiSections.map((sec,i)=>(
                          <button key={i} onClick={()=>setActiveSection(i)} style={{
                            padding:'6px 14px',border:'none',borderRadius:8,cursor:'pointer',
                            fontWeight:600,fontSize:12,transition:'all .15s',
                            background:activeSection===i?'#10A37F':'#f0f0f0',
                            color:activeSection===i?'#fff':'#555',
                          }}>
                            {sec.icon} {sec.title}
                          </button>
                        ))}
                        <button onClick={runAi} style={{
                          marginLeft:'auto',padding:'6px 12px',border:'1px solid #10A37F',borderRadius:8,
                          background:'transparent',cursor:'pointer',fontSize:11,color:'#10A37F',fontWeight:600 }}>
                          🔄 Re-run
                        </button>
                      </div>

                      {/* Active section */}
                      <div style={{ background:'#f8fffe',border:'1.5px solid #10A37F33',borderRadius:12,padding:'16px 18px' }}>
                        <div style={{ fontSize:11,fontWeight:800,color:'#10A37F',textTransform:'uppercase' as const,letterSpacing:0.8,marginBottom:10 }}>
                          {aiSections[activeSection]?.icon} {aiSections[activeSection]?.title}
                        </div>
                        <div style={{ fontSize:13,color:'#1a1a2e',lineHeight:2.0,whiteSpace:'pre-line' as const }}>
                          {aiSections[activeSection]?.content}
                        </div>
                      </div>

                      {/* Full raw toggle */}
                      <div style={{ marginTop:10 }}>
                        <button onClick={()=>setShowRaw(r=>!r)} style={{
                          padding:'5px 12px',border:'1px solid #ddd',borderRadius:8,background:'#f9f9f9',
                          cursor:'pointer',fontSize:11,color:'#777',fontWeight:600 }}>
                          {showRaw ? '▲ Hide' : '▼ Show'} full AI response
                        </button>
                        {showRaw && (
                          <div style={{ marginTop:8,background:'#0d1117',borderRadius:8,padding:'12px 14px',
                            fontFamily:'monospace',fontSize:11,color:'#c9d1d9',lineHeight:1.8,
                            whiteSpace:'pre-wrap' as const,maxHeight:300,overflowY:'auto' as const }}>
                            {aiResult}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KpiCard;
