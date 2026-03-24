import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';
import Icon from '../../components/icon/Icon';

// ─── DT Copilot Config ────────────────────────────────────────────────────────
const BIZVIZ_URL   = '/bizviz-proxy/llmService';
const DT_ASSIST_ID = '3514581148';
const DT_CONNECTOR = '238893540';
const DT_TABLES    = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];

// DT_SPACE_KEY is the space where the BizWiz assistant + connector live.
// This is ALWAYS '5129' (the DT production space from REACT_APP_DT_CLIENT_ID),
// regardless of which user account is logged in.
// The logged-in user's spaceKey (e.g. '1111' for demo) must NOT be used here —
// it causes "Metadata is not available" because the catalog is in space 5129.
const DT_SPACE_KEY = (() => {
  const dtClientId = process.env.REACT_APP_DT_CLIENT_ID || '';
  // Format: "GSUSJGITCDXHEDBNLIUD@5129" — extract the part after @
  const atIdx = dtClientId.lastIndexOf('@');
  return atIdx !== -1 ? dtClientId.slice(atIdx + 1) : '5129';
})();
// Short description — same length/style as fleet copilot
// Exact description from working curl — must match BizWiz assistant 3514581148 config
const DT_DESCRIPTION = 'ROLE: Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) PLATFORM: Ravity Digital Twin Dashboard — Maruti Suzuki Victoris Project ARCHITECTURE: Privacy-first, SQL-native, on-premise execution MARKET: India | STANDARDS: BS6 / ARAI | OEM: Maruti Suzuki  You are a specialised automotive intelligence agent embedded in the Ravity Vehicle Digital Twin platform. Your job is to answer questions about vehicle health, driver behaviour, fuel efficiency, DTC faults, warranty risk, fleet performance, and operational costs — without any raw vehicle data ever leaving the secure local environment.  You operate in two phases for every user question:  PHASE 1 — SQL GENERATION   You receive a natural-language question from the user.   You generate one precise, parameterised SQL query against the local   vehicle telematics database. You output SQL only — no interpretation,   no commentary, no markdown. If the question cannot be answered from   the available schema, you output: CANNOT_GENERATE_SQL: [reason]  PHASE 2 — RESULT INTERPRETATION   You receive the SQL result rows returned by the local database executor.   You interpret those results using your automotive domain expertise:   Indian road conditions, BS6 emission norms, ARAI benchmarks, Maruti   Suzuki vehicle specifications, Indian fuel pricing, seasonal factors,   and warranty risk rules. Every number you state must come directly   fr';

interface HistoryItem {
  context: string;
  session_id: string;
  last_activity?: string;
}


// ─── DataViz Component ───────────────────────────────────────────────────────
type ChartType = 'table' | 'bar-v' | 'bar-h' | 'line';

// Refined teal-indigo palette
const C = {
  // Primary series color — rich teal
  a1: '#0f766e',  // teal-700
  a2: '#14b8a6',  // teal-500
  a3: '#5eead4',  // teal-300
  // Secondary — indigo accent
  b1: '#4338ca',  // indigo-700
  b2: '#6366f1',  // indigo-500
  // UI
  slate:  '#0f172a',
  muted:  '#475569',
  subtle: '#94a3b8',
  border: '#e2e8f0',
  bg:     '#f8fafc',
  bgCard: '#ffffff',
  bgHead: '#f0fdfa',  // teal tint
  pink:   '#e91e8c',
};

// Gradient stops for bars — deepest to lightest teal based on rank
const barRgb = (i: number, total: number) => {
  const t = total > 1 ? i / (total - 1) : 0;   // 0 = highest rank, 1 = lowest
  // From teal-700 to teal-300
  const r = Math.round(15  + t * (94  - 15));
  const g = Math.round(118 + t * (234 - 118));
  const b = Math.round(110 + t * (212 - 110));
  return `rgb(${r},${g},${b})`;
};

const DataViz: React.FC<{ data: any[]; xKey: string; yKey: string; title?: string }> =
  ({ data, xKey, yKey, title }) => {

  const [chartType,     setChartType]     = React.useState<ChartType>('table');
  const [tableExpanded, setTableExpanded] = React.useState(false);

  // Smooth pixel scroll state
  const [hScroll, setHScroll] = React.useState(0);  // 0–100 for bar-v (horizontal scroll)
  const [vScroll, setVScroll] = React.useState(0);  // 0–100 for bar-h (vertical scroll)
  const [lScroll, setLScroll] = React.useState(0);  // 0–100 for line  (horizontal scroll)
  const [hDrag,   setHDrag]   = React.useState(false);
  const [vDrag,   setVDrag]   = React.useState(false);
  const [lDrag,   setLDrag]   = React.useState(false);
  const hRef = React.useRef<HTMLDivElement>(null);
  const vRef = React.useRef<HTMLDivElement>(null);
  const lRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setHScroll(0); setVScroll(0); setLScroll(0); }, [chartType, data]);

  // Sort descending
  const sorted = React.useMemo(
    () => [...data].sort((a,b) => Number(b[yKey]??0) - Number(a[yKey]??0)),
    [data, yKey]
  );
  const vals   = sorted.map(r => Number(r[yKey] ?? 0));
  const vMax   = Math.max(...vals, 1);
  const vMin   = Math.min(...vals, 0);
  const range  = vMax - vMin || 1;

  const fmt    = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
  const lbl    = (s: any, maxLen = 12) => { const str = String(s??''); return str.length > maxLen ? '…'+str.slice(-(maxLen-1)) : str; };
  const fmtKey = (k: string) => k.split('_').map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');

  const scrub = (ref: React.RefObject<HTMLDivElement>, setFn: (v:number)=>void, axis: 'x'|'y') =>
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect  = ref.current.getBoundingClientRect();
      const ratio = axis === 'x'
        ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        : Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
      setFn(ratio * 100);
    };

  // ── "Bar" tab = VERTICAL bars ─────────────────────────────────────────────
  const renderBarV = () => {
    const BAR_W = 44, GAP = 12, H = 260, LBL_H = 58, PAD_L = 46, PAD_T = 20, SCRUB_H = 12;
    const svgW      = PAD_L + sorted.length * (BAR_W + GAP) + 20;
    const maxScroll = Math.max(0, svgW - 580);
    const offset    = Math.round((hScroll / 100) * maxScroll);
    const thumbW    = maxScroll > 0 ? Math.max(16, (580 / svgW) * 100) : 100;
    const thumbL    = maxScroll > 0 ? (hScroll / 100) * (100 - thumbW) : 0;

    return (
      <div>
        <div style={{ overflow:'hidden', borderRadius:8, background:C.bg,
          border:`1px solid ${C.border}`, height: PAD_T+H+LBL_H, position:'relative' }}>
          <svg
            width={svgW}
            height={PAD_T+H+LBL_H}
            style={{ display:'block', position:'absolute', left: -offset, top:0 }}>
            <defs>
              <linearGradient id="gBV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.a2}/>
                <stop offset="100%" stopColor={C.a1}/>
              </linearGradient>
            </defs>
            {/* Y-axis */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T+H}
              stroke={C.border} strokeWidth={1.5}/>
            {/* Y gridlines + labels — offset so they stay visible in viewport */}
            {[0,0.2,0.4,0.6,0.8,1].map((f,i) => {
              const y = PAD_T + H - f*H;
              return (
                <g key={i}>
                  <line x1={PAD_L} y1={y} x2={svgW} y2={y}
                    stroke={f===0?C.border:'#e0f2f1'} strokeWidth={f===0?1.5:0.8}
                    strokeDasharray={f===0?'':'3,3'}/>
                  <text x={PAD_L-5} y={y+3.5} textAnchor="end"
                    fill={C.subtle} fontSize={8} fontFamily="monospace">{fmt(f*vMax)}</text>
                </g>
              );
            })}
            {/* X-axis */}
            <line x1={PAD_L} y1={PAD_T+H} x2={svgW} y2={PAD_T+H}
              stroke={C.border} strokeWidth={1.5}/>
            {/* Bars */}
            {sorted.map((row, i) => {
              const val  = vals[i];
              const barH = Math.max((val/vMax)*H, 4);
              const x    = PAD_L + i*(BAR_W+GAP) + GAP;
              const y    = PAD_T + H - barH;
              const clr  = barRgb(i, sorted.length);
              return (
                <g key={i}>
                  <rect x={x+2} y={y+3} width={BAR_W} height={barH} rx={5} fill="rgba(0,0,0,0.05)"/>
                  <rect x={x} y={y} width={BAR_W} height={barH} rx={5} fill={clr}>
                    <title>{`#${i+1} ${row[xKey]}: ${val.toLocaleString()}`}</title>
                  </rect>
                  <rect x={x+4} y={y+3} width={BAR_W-8} height={5} rx={2.5} fill="rgba(255,255,255,0.28)"/>
                  {barH >= 26 ? (
                    <text x={x+BAR_W/2} y={y+15} textAnchor="middle"
                      fill="#fff" fontSize={8} fontWeight="700">{fmt(val)}</text>
                  ) : (
                    <text x={x+BAR_W/2} y={y-6} textAnchor="middle"
                      fill={C.muted} fontSize={8} fontWeight="600">{fmt(val)}</text>
                  )}
                  {/* VIN label — rotated, smaller font */}
                  <text x={x+BAR_W/2} y={PAD_T+H+16} textAnchor="end"
                    fill={C.muted} fontSize={8}
                    transform={`rotate(-40,${x+BAR_W/2},${PAD_T+H+16})`}>
                    {lbl(row[xKey], 13)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Horizontal scrubber under bar chart */}
        {maxScroll > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:C.subtle }}>
                {sorted.length} VINs · scroll to see all
              </span>
              <span style={{ fontSize:10, color:C.subtle, fontFamily:'monospace' }}>
                {Math.round((hScroll/100)*(sorted.length-1))+1} – {Math.min(Math.round((hScroll/100)*(sorted.length-1))+Math.floor(580/(BAR_W+GAP)), sorted.length)} shown
              </span>
            </div>
            <div ref={hRef}
              onClick={scrub(hRef, setHScroll, 'x')}
              onMouseMove={e => { if(hDrag) scrub(hRef, setHScroll, 'x')(e); }}
              onMouseDown={() => setHDrag(true)}
              onMouseUp={() => setHDrag(false)}
              onMouseLeave={() => setHDrag(false)}
              style={{ position:'relative', height:SCRUB_H, background:C.border,
                borderRadius:SCRUB_H/2, cursor:'ew-resize', userSelect:'none' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%',
                width:`${thumbL+thumbW}%`, background:`${C.a1}18`, borderRadius:SCRUB_H/2 }}/>
              <div style={{ position:'absolute', top:0, height:'100%',
                left:`${thumbL}%`, width:`${thumbW}%`, borderRadius:SCRUB_H/2,
                background:`linear-gradient(90deg,${C.a1},${C.a2})`,
                boxShadow:`0 2px 8px ${C.a1}55`,
                transition: hDrag ? 'none' : 'left 0.1s ease',
                cursor:'ew-resize', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width:1.5, height:SCRUB_H-4, background:'rgba(255,255,255,0.8)', borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── "Horiz" tab = HORIZONTAL bars (values on X axis, VINs on Y axis)
  //    Bars go left-to-right, VIN labels on the left
  //    Scrubber: vertical bar on the right side (scroll up/down through VINs)
  // ─────────────────────────────────────────────────────────────────────────
  const renderBarH = () => {
    const ROW_H = 38, GAP = 8, LABEL_W = 140, BAR_AREA = 380, VAL_W = 64;
    const SVG_W     = LABEL_W + BAR_AREA + VAL_W;
    const viewport  = 380;  // visible height in px
    const totalH    = sorted.length * (ROW_H + GAP);
    const maxScroll = Math.max(0, totalH - viewport);
    const offset    = Math.round((vScroll / 100) * maxScroll);
    const thumbH    = maxScroll > 0 ? Math.max(24, (viewport / totalH) * 100) : 100;
    const thumbT    = maxScroll > 0 ? (vScroll / 100) * (100 - thumbH) : 0;
    const SCRUB_W   = 14;

    return (
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        {/* Chart */}
        <div style={{ flex:1, overflow:'hidden', borderRadius:8, background:C.bg,
          border:`1px solid ${C.border}`, height:viewport, position:'relative' }}>
          <svg
            width={SVG_W}
            height={sorted.length * (ROW_H + GAP)}
            style={{ display:'block', position:'absolute', top:-offset, left:0 }}>
            <defs>
              <linearGradient id="gBH" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C.a1}/>
                <stop offset="100%" stopColor={C.a3}/>
              </linearGradient>
            </defs>
            {/* X gridlines (follow viewport vertically) */}
            {[0,0.25,0.5,0.75,1].map((f,i) => {
              const x = LABEL_W + f*BAR_AREA;
              return (
                <g key={i}>
                  <line x1={x} y1={offset} x2={x} y2={offset+viewport}
                    stroke={f===0?C.border:'#e0f2f1'} strokeWidth={f===0?2:1}
                    strokeDasharray={f===0?'':'4,4'}/>
                </g>
              );
            })}
            {/* Rows */}
            {sorted.map((row, i) => {
              const val   = vals[i];
              const barW  = Math.max((val/vMax)*BAR_AREA, 6);
              const y     = i*(ROW_H+GAP);
              const clr   = barRgb(i, sorted.length);
              return (
                <g key={i}>
                  {/* Rank */}
                  <text x={10} y={y+ROW_H/2+4} fill={C.subtle} fontSize={11}
                    fontWeight="800" fontFamily="monospace">{String(i+1).padStart(2,'0')}</text>
                  {/* VIN label */}
                  <text x={LABEL_W-10} y={y+ROW_H/2+4} textAnchor="end"
                    fill={C.slate} fontSize={10} fontWeight="500">{lbl(row[xKey], 16)}</text>
                  {/* Track */}
                  <rect x={LABEL_W} y={y+5} width={BAR_AREA} height={ROW_H-10}
                    fill="#e0f2f1" rx={5}/>
                  {/* Bar */}
                  <rect x={LABEL_W} y={y+5} width={barW} height={ROW_H-10}
                    fill={clr} rx={5}>
                    <title>{`#${i+1} ${row[xKey]}: ${val.toLocaleString()}`}</title>
                  </rect>
                  {/* Top highlight on bar */}
                  <rect x={LABEL_W+3} y={y+7} width={Math.max(barW-6,0)} height={5}
                    rx={3} fill="rgba(255,255,255,0.35)"/>
                  {/* Value */}
                  <text x={LABEL_W+barW+8} y={y+ROW_H/2+4}
                    fill={C.a1} fontSize={9} fontWeight="700" fontFamily="monospace">{fmt(val)}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Vertical scrubber on the right */}
        {maxScroll > 0 && (
          <div style={{ width:SCRUB_W, alignSelf:'stretch', display:'flex',
            flexDirection:'column', paddingTop:4, paddingBottom:4 }}>
            <div ref={vRef}
              onClick={scrub(vRef, setVScroll, 'y')}
              onMouseMove={e => { if(vDrag) scrub(vRef, setVScroll, 'y')(e); }}
              onMouseDown={() => setVDrag(true)}
              onMouseUp={() => setVDrag(false)}
              onMouseLeave={() => setVDrag(false)}
              style={{ flex:1, position:'relative', background:C.border,
                borderRadius:SCRUB_W/2, cursor:'ns-resize', userSelect:'none' }}>
              <div style={{ position:'absolute', left:0, top:0, right:0,
                height:`${thumbT+thumbH}%`, background:`${C.a1}18`, borderRadius:SCRUB_W/2 }}/>
              <div style={{ position:'absolute', left:0, right:0,
                top:`${thumbT}%`, height:`${thumbH}%`, minHeight:24,
                borderRadius:SCRUB_W/2,
                background:`linear-gradient(180deg,${C.a2},${C.a1})`,
                boxShadow:`0 2px 8px ${C.a1}55`,
                transition: vDrag ? 'none' : 'top 0.1s ease',
                cursor:'ns-resize', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:2 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width:SCRUB_W-4, height:1.5,
                    background:'rgba(255,255,255,0.8)', borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Line chart with horizontal scrubber ──────────────────────────────────
  const renderLine = () => {
    const PAD_L=54, PAD_T=24, PAD_B=56, PAD_R=24, H=260, SCRUB_H=12;
    const viewport  = 580;
    const DOT_STEP  = 28;                                     // px per data point — gives labels room
    const totalW    = PAD_L + sorted.length * DOT_STEP + PAD_R;
    const maxScroll = Math.max(0, totalW - viewport);
    const offset    = Math.round((lScroll / 100) * maxScroll);
    const thumbW    = maxScroll > 0 ? Math.max(16, (viewport / totalW) * 100) : 100;
    const thumbL    = maxScroll > 0 ? (lScroll / 100) * (100 - thumbW) : 0;
    const cW        = totalW - PAD_L - PAD_R;

    const pts = sorted.map((row, i) => ({
      x: PAD_L + (sorted.length > 1 ? (i/(sorted.length-1))*cW : cW/2),
      y: PAD_T + H - ((vals[i]-vMin)/range)*H,
      val: vals[i],
      label: String(row[xKey] ?? ''),
    }));
    const pathD = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaD = pts.length > 1
      ? `${pathD} L${pts[pts.length-1].x.toFixed(1)},${PAD_T+H} L${PAD_L},${PAD_T+H} Z`
      : '';

    return (
      <div>
        <div style={{ overflow:'hidden', borderRadius:8, background:C.bg,
          border:`1px solid ${C.border}`, height:PAD_T+H+PAD_B, position:'relative' }}>
          <svg
            width={totalW}
            height={PAD_T+H+PAD_B}
            style={{ display:'block', position:'absolute', left:-offset, top:0 }}>
            <defs>
              <linearGradient id="gLA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.a2} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={C.a2} stopOpacity="0.02"/>
              </linearGradient>
            </defs>
            {/* Y-axis */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T+H}
              stroke={C.border} strokeWidth={1.5}/>
            {/* Y grid + labels */}
            {[0,0.2,0.4,0.6,0.8,1].map((f,i) => {
              const y = PAD_T + H - f*H;
              return (
                <g key={i}>
                  <line x1={PAD_L} y1={y} x2={totalW} y2={y}
                    stroke={f===0?C.border:'#e0f2f1'} strokeWidth={f===0?1.5:0.8}
                    strokeDasharray={f===0?'':'3,3'}/>
                  <text x={PAD_L-5} y={y+3.5} textAnchor="end"
                    fill={C.subtle} fontSize={8} fontFamily="monospace">
                    {fmt(vMin + f*range)}
                  </text>
                </g>
              );
            })}
            {/* X-axis */}
            <line x1={PAD_L} y1={PAD_T+H} x2={totalW} y2={PAD_T+H}
              stroke={C.border} strokeWidth={1.5}/>
            {/* Area */}
            {pts.length > 1 && <path d={areaD} fill="url(#gLA)"/>}
            {/* Line */}
            {pts.length > 1 && (
              <path d={pathD} fill="none" stroke={C.a1} strokeWidth={2.5}
                strokeLinejoin="round" strokeLinecap="round"/>
            )}
            {/* Dots + labels */}
            {pts.map((p,i) => (
              <g key={i}>
                {/* Vertical tick */}
                <line x1={p.x} y1={PAD_T+H} x2={p.x} y2={PAD_T+H+6}
                  stroke={C.border} strokeWidth={1}/>
                {/* Dot */}
                <circle cx={p.x} cy={p.y} r={5} fill={C.bgCard} stroke={C.a1} strokeWidth={2.5}>
                  <title>{`#${i+1} ${p.label}: ${p.val.toLocaleString()}`}</title>
                </circle>
                {/* Value above dot — only show when DOT_STEP is wide enough */}
                <text x={p.x} y={p.y-10} textAnchor="middle"
                  fill={C.a1} fontSize={7.5} fontWeight="700">{fmt(p.val)}</text>
                {/* X label rotated */}
                <text x={p.x} y={PAD_T+H+16} textAnchor="end"
                  fill={C.muted} fontSize={7.5}
                  transform={`rotate(-40,${p.x},${PAD_T+H+16})`}>{lbl(p.label, 13)}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Horizontal scrubber for line chart */}
        {maxScroll > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:C.subtle }}>{sorted.length} data points</span>
              <span style={{ fontSize:10, color:C.subtle }}>drag to scroll →</span>
            </div>
            <div ref={lRef}
              onClick={scrub(lRef, setLScroll, 'x')}
              onMouseMove={e => { if(lDrag) scrub(lRef, setLScroll, 'x')(e); }}
              onMouseDown={() => setLDrag(true)}
              onMouseUp={() => setLDrag(false)}
              onMouseLeave={() => setLDrag(false)}
              style={{ position:'relative', height:SCRUB_H, background:C.border,
                borderRadius:SCRUB_H/2, cursor:'ew-resize', userSelect:'none' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%',
                width:`${thumbL+thumbW}%`, background:`${C.a1}18`, borderRadius:SCRUB_H/2 }}/>
              <div style={{ position:'absolute', top:0, height:'100%',
                left:`${thumbL}%`, width:`${thumbW}%`, borderRadius:SCRUB_H/2,
                background:`linear-gradient(90deg,${C.a1},${C.a2})`,
                boxShadow:`0 2px 8px ${C.a1}55`,
                transition: lDrag ? 'none' : 'left 0.1s ease',
                cursor:'ew-resize', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width:1.5, height:SCRUB_H-4, background:'rgba(255,255,255,0.8)', borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Table ─────────────────────────────────────────────────────────────────
  const renderTable = () => {
    const keys    = Object.keys(sorted[0] || {});
    const visible = tableExpanded ? sorted : sorted.slice(0, 10);
    return (
      <div>
        <div style={{ overflowX:'auto', borderRadius:8, border:`1px solid ${C.border}` }}>
          <table style={{ borderCollapse:'collapse', width:'100%', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bgHead }}>
                <th style={{ padding:'10px 12px', textAlign:'left', color:C.muted,
                  fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:0.6,
                  borderBottom:`2px solid ${C.border}`, width:36 }}>#</th>
                {keys.map(k => (
                  <th key={k} style={{ padding:'10px 16px', textAlign:'left', color:C.muted,
                    fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:0.6,
                    whiteSpace:'nowrap', borderBottom:`2px solid ${C.border}` }}>{fmtKey(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.border}`,
                  background: i%2===0 ? C.bgCard : C.bg }}>
                  <td style={{ padding:'9px 12px', color:C.subtle, fontSize:11,
                    fontFamily:'monospace', fontWeight:700 }}>
                    {(i+1).toString().padStart(2,'0')}
                  </td>
                  {keys.map(k => (
                    <td key={k} style={{ padding:'9px 16px', color:C.slate, fontSize:13 }}>
                      {typeof row[k] === 'number'
                        ? <span style={{ fontFamily:'monospace', fontWeight:700, color:C.a1 }}>
                            {row[k].toLocaleString()}
                          </span>
                        : row[k] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length > 10 && (
          <button onClick={() => setTableExpanded(e => !e)}
            style={{ marginTop:10, background:'none', border:`1px solid ${C.a1}44`,
              borderRadius:8, color:C.a1, fontSize:12, padding:'6px 16px',
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
            {tableExpanded ? '▲ Show less' : `▼ Show all ${sorted.length} rows`}
          </button>
        )}
      </div>
    );
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const total = vals.reduce((a:number,b:number)=>a+b,0);
  const avg   = total / (vals.length||1);
  const stats = [
    { label:'Total',   value:fmt(total),     sub:'' },
    { label:'Average', value:fmt(avg),        sub:'' },
    { label:'Max',     value:fmt(vals[0]||0), sub:lbl(sorted[0]?.[xKey]||'',14) },
    { label:'Min',     value:fmt(vals[vals.length-1]||0), sub:lbl(sorted[sorted.length-1]?.[xKey]||'',14) },
    { label:'Records', value:data.length.toLocaleString(), sub:'' },
  ];

  const TABS = [
    { type:'table' as ChartType, icon:'⊞', label:'Table'  },
    { type:'bar-v' as ChartType, icon:'▐▐', label:'Bar'   },
    { type:'bar-h' as ChartType, icon:'≡≡', label:'Horiz' },
    { type:'line'  as ChartType, icon:'∿',  label:'Line'  },
  ];

  return (
    <div style={{ marginTop:12, background:C.bgCard, borderRadius:14,
      border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(15,118,110,0.10)',
      overflow:'hidden', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`,
        background:`linear-gradient(135deg,${C.bgHead},${C.bgCard})`,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          {title && <div style={{ fontSize:13, fontWeight:700, color:C.a1 }}>{title}</div>}
          <div style={{ fontSize:11, color:C.subtle, marginTop:2 }}>
            {data.length.toLocaleString()} records · sorted highest → lowest · {fmtKey(xKey)} vs {fmtKey(yKey)}
          </div>
        </div>
        <div style={{ display:'flex', gap:2, background:C.bg, borderRadius:10,
          padding:3, border:`1px solid ${C.border}` }}>
          {TABS.map(tab => (
            <button key={tab.type}
              onClick={() => { setChartType(tab.type); setTableExpanded(false); }}
              style={{ padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s',
                background: chartType===tab.type ? C.a1 : 'transparent',
                color:       chartType===tab.type ? '#fff' : C.muted,
                boxShadow:   chartType===tab.type ? `0 2px 8px ${C.a1}55` : 'none',
                display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:10 }}>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        {stats.map((s,i) => (
          <div key={i} style={{ flex:1, padding:'8px 14px',
            borderRight: i<stats.length-1 ? `1px solid ${C.border}` : '' }}>
            <div style={{ fontSize:10, color:C.subtle, textTransform:'uppercase',
              letterSpacing:0.5, fontWeight:600 }}>{s.label}</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.a1,
              lineHeight:1.2, fontFamily:'monospace' }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ padding:'16px 18px 14px' }}>
        {chartType === 'table' && renderTable()}
        {chartType === 'bar-v' && renderBarV()}
        {chartType === 'bar-h' && renderBarH()}
        {chartType === 'line'  && renderLine()}
      </div>
    </div>
  );
};


const AiAnalysisDashboard = () => {
  const { vin, apiParams } = useDt();
  const { token, user }    = useSelector((state: any) => state.auth);

  const [inputText,        setInputText]        = useState('');
  const [responses,        setResponses]        = useState<any[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [questionHistory,  setQuestionHistory]  = useState<HistoryItem[]>([]);
  const [historyOpen,      setHistoryOpen]      = useState(true);
  const [hoveredIndex,     setHoveredIndex]     = useState<number | null>(null);
  const [hoveredIndex1,    setHoveredIndex1]    = useState<number | null>(null);
  const [hoveredIndex2,    setHoveredIndex2]    = useState<number | null>(null);
  const [sessionId,        setSessionId]        = useState<string | null>(null);
  const [,                 setTrigger]          = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses, loading]);

  // ── Session ID — same pattern as fleet copilot ───────────────────────────────
  useEffect(() => {
    const userId = user?.user?.id || user?.user?.userId;
    if (!userId) return;
    const sessionKey  = `dt_session_${userId}`;
    const loginKey    = `dt_login_user`;
    const lastLogin   = localStorage.getItem(loginKey);
    let   savedSid    = localStorage.getItem(sessionKey);
    if (!savedSid || lastLogin !== userId.toString()) {
      savedSid = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(sessionKey, savedSid);
      localStorage.setItem(loginKey, userId.toString());
    }
    setSessionId(savedSid);
  }, [user]);

  // ── Chat history — same pattern as fleet copilot ─────────────────────────────
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const userId = user?.user?.id || user?.user?.userId;
        if (!userId) return;
        const spaceKey = user?.user?.spaceKey;
        const res = await fetch(
          `/rest-proxy/vc_chat_history_older?user_id=${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              clientid:     `VTBPJEQBEEDBEQSHIXDJ@${spaceKey}`,
              appname:      'valcode_demo_api',
              clientsecret: 'ESUKBCLCYETVMHAZPQXW1760338574796',
            },
          }
        );
        if (!res.ok) return;
        const text = await res.text();
        const data = (text.startsWith('{') || text.startsWith('[')) ? JSON.parse(text) : [];
        setQuestionHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    fetchChatHistory();
  }, [user]);

  // ── Load history detail — same pattern as fleet copilot ──────────────────────
  const fetchHistoryDetail = async (userId: string, historySessionId: string) => {
    setLoading(true);
    try {
      const spaceKey = user?.user?.spaceKey;
      const res = await fetch(
        `/rest-proxy/vc_chat_history?user_id=${userId}&session_id=${historySessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            clientid:     `VTBPJEQBEEDBEQSHIXDJ@${spaceKey}`,
            appname:      'valcode_demo_api',
            clientsecret: 'ESUKBCLCYETVMHAZPQXW1760338574796',
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();

      // Parse history responses — same double-parse pattern as fleet copilot
      const parsedResponses = data.map((item: any) => {
        let firstParsed: any = {};
        try { firstParsed = JSON.parse(item.response); }
        catch { firstParsed = { response: item.response }; }

        let finalParsed: any = {};
        try { finalParsed = JSON.parse(firstParsed.response); }
        catch { finalParsed = firstParsed; }

        const { tableHTML, suggestionList } = buildResponseParts(finalParsed);
        const chartConfig = extractChart(finalParsed);
        const cleanedResponse = buildHtmlResponse(tableHTML, finalParsed, !!chartConfig);
        return { question: item.question, htmlResponse: cleanedResponse, suggestions: suggestionList, chart: chartConfig };
      });

      setResponses(parsedResponses);
      setSessionId(historySessionId);
    } catch (err) {
      console.error('Error fetching history detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Safe data parser — identical to fleet copilot ────────────────────────────
  const safeParseData = (data: any): any[] => {
    if (!data) return [];
    try {
      if (Array.isArray(data)) return data;
      if (typeof data === 'object') return [data];
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return [parsed];
      }
    } catch (err) {
      console.warn('safeParseData: Unable to parse data field', err);
    }
    return [];
  };

  // ── Build table HTML — identical to fleet copilot ────────────────────────────
  const buildTableHTML = (parsedData: any[]): string => {
    if (!parsedData.length) return '';
    const keys = Object.keys(parsedData[0]);
    const headers = keys.map(k => {
      const formatted = k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `<th style="padding:6px; border:1px solid #dde; text-align:left; color:#555577; background:#f5f5ff; font-size:11px; text-transform:uppercase; letter-spacing:0.4px;">${formatted}</th>`;
    }).join('');
    const rows = parsedData.map(row =>
      `<tr style="border-bottom:1px solid #eef;">${keys.map(k =>
        `<td style="padding:8px 13px; color:#333344; font-size:13px;">${row[k] ?? '—'}</td>`
      ).join('')}</tr>`
    ).join('');
    return `<div style="margin-top:14px; overflow-x:auto; border-radius:10px; border:1px solid #dde;">
      <table style="border-collapse:collapse; width:100%; font-size:13px;">
        <thead><tr style="background:#f5f5ff;">${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  };

  // ── Build response parts — same logic as fleet copilot ───────────────────────
  const buildResponseParts = (parsedResponse: any) => {
    const parsedData  = safeParseData(parsedResponse?.data);
    const tableHTML   = buildTableHTML(parsedData);
    let suggestionList: string[] = [];
    const rawSugg = parsedResponse?.visualization?.Suggestions || parsedResponse?.visualization?.suggestions;
    if (rawSugg) {
      suggestionList = Array.isArray(rawSugg)
        ? rawSugg
        : String(rawSugg).split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return { tableHTML, suggestionList };
  };

  const buildHtmlResponse = (tableHTML: string, parsedResponse: any, hasChart: boolean = false): string => {
    const viz = parsedResponse?.visualization || {};
    // When DataViz renders, skip the duplicate table — show text analysis only
    const tableSection = hasChart ? '' : tableHTML;
    return `<div style="font-family: inherit; line-height: 1.75; color: #334155;">
      ${tableSection}
      ${viz.Answer   || viz.answer   || ''}
      ${viz.Analysis || viz.analysis || ''}
      ${parsedResponse?.explanation ? `<p style="color:#94a3b8; font-style:italic; font-size:13px; margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9;">${parsedResponse.explanation}</p>` : ''}
    </div>`;
  };

  // Extract chart config from parsed response for rendering
  const extractChart = (parsedResponse: any): { data: any[]; xKey: string; yKey: string; title: string } | null => {
    const rows = safeParseData(parsedResponse?.data);
    const viz  = parsedResponse?.visualization || {};
    if (!rows.length) return null;
    const xKey = viz.x_axis || Object.keys(rows[0])[0];
    const yKey = viz.y_axis || Object.keys(rows[0])[1];
    if (!yKey || !rows.some((r: any) => typeof r[yKey] === 'number')) return null;
    return { data: rows, xKey, yKey, title: viz.chart_title || '' };
  };

  // ── handleSend — modelled exactly on fleet copilot ───────────────────────────
  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    setLoading(true);
    try {
      setQuestionHistory(prev => [
        { context: textToSend, session_id: sessionId || 'new' },
        ...prev,
      ]);

      const userId    = user?.user?.id || user?.user?.userId;
      const authToken = token;

      if (!userId || !authToken) {
        setResponses(prev => [...prev, {
          question: textToSend,
          error: 'Authentication required — please log in again.',
        }]);
        return;
      }

      // DT_SPACE_KEY (5129) is used for all BizWiz calls — NOT user.spaceKey.
      // The BizWiz assistant and connector live in space 5129 regardless of
      // which user account is authenticated (demo=1111, production=5129, etc.)
      const headers: Record<string, string> = {
        accept:           'application/json, text/plain, */*',
        'content-type':   'application/x-www-form-urlencoded',
        authtoken:        authToken,
        spacekey:         DT_SPACE_KEY,
        userid:           String(userId),
        origin:           'https://platform.ravity.io',
        referer:          'https://platform.ravity.io/newGenAi/',
      };

      const innerData = {
        text:             textToSend,
        userID:           String(userId),
        sessionID:        sessionId || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        assistId:         DT_ASSIST_ID,
        connector:        DT_CONNECTOR,
        description:      DT_DESCRIPTION,
        tables:           DT_TABLES,
        selected_files:   [],
        type:             'connector',
        documentStoreIds: DT_TABLES,
        spaceKey:         DT_SPACE_KEY,
      };

      const bodyData = new URLSearchParams({
        serviceType: 'process_text',
        data:        JSON.stringify(innerData),
        spacekey:    DT_SPACE_KEY,
      });

      const response = await fetch(BIZVIZ_URL, { method: 'POST', headers, body: bodyData });

      if (!response.ok) {
        const errText = await response.text();
        console.error('BizWiz error:', response.status, errText);
        setResponses(prev => [...prev, {
          question: textToSend,
          error: `API error ${response.status}: ${errText.slice(0, 300) || 'No details returned — check network & proxy config.'}`,
        }]);
        return;
      }

      const rawData = await response.json();

      // ── Detect known BizWiz backend errors and surface them clearly ──────────
      const rawResponseStr = typeof rawData?.response === 'string' ? rawData.response : '';
      let innerParsed: any = {};
      try { innerParsed = JSON.parse(rawResponseStr); } catch { /* not JSON */ }

      const dataField = innerParsed?.data || rawData?.data || '';
      const isCatalogError = typeof dataField === 'string' &&
        (dataField.includes('Metadata is not available') ||
         dataField.includes('Please check Catalog') ||
         dataField.includes('not able to retrieve') ||
         dataField.toLowerCase().includes('catalog'));

      const vizError = innerParsed?.visualization?.error || '';
      const isVizError = typeof vizError === 'string' &&
        vizError.toLowerCase().includes('failed to generate');

      if (isCatalogError || (isVizError && !dataField)) {
        setResponses(prev => [...prev, {
          question: textToSend,
          error: [
            '⚙️ Backend configuration required — table schema not yet indexed.',
            '',
            'The BizWiz assistant (ID: 3514581148) cannot find the metadata for:',
            '  • synthetic_data_kpi',
            '  • qac_kpi_baseline_data',
            '',
            'To fix: Go to platform.ravity.io → GenAI Admin → Connectors',
            '→ select connector 238893540 → "Sync Schema" / "Update Catalog"',
            '',
            `Raw: ${dataField || vizError}`,
          ].join('\n'),
        }]);
        return;
      }

      // Normalise: BizWiz sometimes wraps in {response:"…"}, sometimes returns object directly
      let parsedResponse: any;
      const responseField = rawData?.response ?? rawData;
      if (typeof responseField === 'string') {
        try { parsedResponse = JSON.parse(responseField); }
        catch { parsedResponse = { html: responseField }; }
      } else {
        parsedResponse = responseField;
      }

      let cleanedResponse = '';
      let suggestionList: string[] = [];

      try {
        if (parsedResponse && !parsedResponse.html) {
          // Remove fields that should not be surfaced to the user
          const display = { ...parsedResponse };
          delete display.query;
          delete display.dashboards;
          delete display.data_refreshed_at;

          const { tableHTML, suggestionList: suggs } = buildResponseParts(display);
          suggestionList = suggs;
          const hasChrt = !!extractChart(display);
          cleanedResponse = buildHtmlResponse(tableHTML, display, hasChrt);
        } else {
          cleanedResponse = parsedResponse?.html || String(responseField) || 'No response received.';
        }
      } catch (err) {
        console.warn('Response handling failed — fallback to raw string', err);
        cleanedResponse = String(rawData?.response || rawData || 'No response available');
      }

      const chartConfig2 = parsedResponse && !parsedResponse.html ? extractChart(parsedResponse) : null;
      setResponses(prev => [...prev, {
        question:     rawData.original_text || textToSend,
        htmlResponse: cleanedResponse,
        suggestions:  suggestionList,
        chart:        chartConfig2,
      }]);

      // Ingestion — fire and forget
      fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          IngestionId:     process.env.REACT_APP_INGESTIONID     || '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret: process.env.REACT_APP_INGESTIONSECRET || '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
        },
        body: JSON.stringify({
          question:   textToSend,
          response:   JSON.stringify(rawData),
          user_id:    userId,
          action:     'add',
          session_id: sessionId || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          spacekey:   DT_SPACE_KEY,
          user_name:  user?.user?.fullName  || 'Unknown_User',
          user_email: user?.user?.emailID   || 'unknown@ravity.io',
        }),
      }).catch(ingErr => console.error('Ingestion error:', ingErr));

    } catch (error: any) {
      console.error('handleSend error:', error);
      setResponses(prev => [...prev, {
        question: textToSend,
        error: `Request failed: ${error?.message || 'Unknown error'}`,
      }]);
    } finally {
      setLoading(false);
      setInputText('');
    }
  };

  // ── Delete history — same as fleet copilot ───────────────────────────────────
  const handleDeleteHistory = async (sessionIdToDelete: string) => {
    try {
      const userId = user?.user?.id || user?.user?.userId;
      if (!userId || !sessionIdToDelete) return;
      setLoading(true);
      await fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          IngestionId:     '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret: '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
        },
        body: JSON.stringify({
          question:   '',
          response:   '',
          user_id:    userId,
          action:     'delete',
          session_id: sessionIdToDelete,
          spacekey:   user?.user?.spaceKey,
          user_name:  user?.user?.fullName || 'Unknown_User',
          user_email: user?.user?.emailID  || 'unknown@ravity.io',
        }),
      });
      setQuestionHistory(prev => prev.filter(h => h.session_id !== sessionIdToDelete));
    } catch (error) {
      console.error('Error deleting history:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Initial suggestions — include VIN naturally so agent knows context ────────
  const vinDisplay = vin ? vin.slice(-8) : 'selected VIN';
  const initSuggestions = [
    'How many harsh acceleration events per VIN?',
    'Show fuel efficiency and total distance per VIN',
    'Which VINs have the highest overspeeding events?',
    'Show CO2 emissions per VIN ranked highest to lowest',
  ];

  return (
    <>
      <style>{`
        @keyframes dtSpin { to { transform: rotate(360deg); } }
        .dt-typing span { display:inline-block; width:7px; height:7px; border-radius:50%;
          background:#e91e8c; margin:0 2px; animation:dtBounce 1.2s infinite; }
        .dt-typing span:nth-child(2){ animation-delay:.2s }
        .dt-typing span:nth-child(3){ animation-delay:.4s }
        @keyframes dtBounce { 0%,100%{opacity:.2;transform:scale(.85)} 50%{opacity:1;transform:scale(1.1)} }
      `}</style>

      <div style={{
        display:'flex', flexDirection:'column',
        // 72px = app header, 68px = our page header bar we added, 1px = border
        height:'calc(100vh - 141px)',
        width:'100%', minWidth:0,
        fontFamily:'Arial, sans-serif', background:'#f5f7fa',
        overflow:'hidden',
      }}><div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: historyOpen ? 260 : 60, minWidth: historyOpen ? 260 : 60,
          background:'#f8f9fa', borderRight:'1px solid #e8e8e8',
          display:'flex', flexDirection:'column', transition:'width 0.25s', overflow:'hidden',
        }}>
          {/* New chat */}
          <div onClick={() => { setInputText(''); setResponses([]); setSelectedSuggestion(''); }}
            style={{ padding:'14px 16px', borderBottom:'1px solid #e0e0e0', fontWeight:600,
              cursor:'pointer', color:'#666688', display:'flex', alignItems:'center', gap:10,
              whiteSpace:'nowrap', fontSize:13 }}
            onMouseEnter={e => (e.currentTarget.style.background='#f0f4ff')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
            💬 {historyOpen && 'New chat'}
          </div>

          {/* History toggle */}
          <div onClick={() => setHistoryOpen(p => !p)}
            style={{ padding:'14px 16px', borderBottom:'1px solid #e0e0e0', fontWeight:600,
              cursor:'pointer', color:'#666688', display:'flex', alignItems:'center', gap:10,
              whiteSpace:'nowrap', fontSize:13 }}
            onMouseEnter={e => (e.currentTarget.style.background='#f0f4ff')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
            🕑 {historyOpen && 'History'}
          </div>

          {historyOpen && (
            <ul style={{ listStyle:'none', margin:0, padding:8, overflowY:'auto',
              flex:1, scrollbarWidth:'thin' }}>
              {questionHistory.length === 0 && (
                <li style={{ padding:'12px 10px', color:'#aaa', fontSize:12 }}>
                  No previous conversations
                </li>
              )}
              {questionHistory.map((item, idx) => (
                <li key={idx} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'9px 10px', borderRadius:8, marginBottom:2,
                  cursor:'pointer', color:'#777799', fontSize:12, transition:'all 0.15s',
                  ...(hoveredIndex1 === idx ? { background:'#f0f4ff', color:'#1a1a2e' } : {}),
                }}
                  onMouseEnter={() => setHoveredIndex1(idx)}
                  onMouseLeave={() => setHoveredIndex1(null)}>
                  <div title={item.context}
                    style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', cursor:'pointer' }}
                    onClick={() => {
                      const userId = user?.user?.id || user?.user?.userId;
                      if (userId && item.session_id) fetchHistoryDetail(String(userId), item.session_id);
                    }}>
                    💬 {item.context}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); if (window.confirm('Delete this chat history?')) handleDeleteHistory(item.session_id); }}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 5px',
                      borderRadius:4, color:'transparent', transition:'all 0.15s', marginLeft:6 }}
                    onMouseEnter={e => { e.currentTarget.style.color='#ff6060'; e.currentTarget.style.background='#3a1a1a'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='transparent'; e.currentTarget.style.background='none'; }}>
                    <Icon icon='Delete' size='sm' forceFamily='material' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Main chat area ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* ── Page title header ── */}
          <div style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'14px 24px', background:'#ffffff',
            borderBottom:'1px solid #e8e8e8', flexShrink:0,
          }}>
            <div style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg,#e91e8c,#c2185b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 3px 12px rgba(233,30,140,0.30)',
            }}>
              <svg viewBox='0 0 24 24' width='20' height='20' fill='#fff'>
                <path d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z'/>
              </svg>
            </div>
            <div>
              <h1 style={{ color:'#111', fontWeight:900, fontSize:20, margin:0, lineHeight:1.1 }}>
                Conversational Intelligence
              </h1>
              <p style={{ color:'#888', fontSize:12, margin:'2px 0 0', fontWeight:400 }}>
                SQL-native vehicle intelligence — privacy-first, on-premise
              </p>
            </div>
          </div>

          {/* Context bar + date filter */}
          <div style={{ display:'flex', alignItems:'center', background:'#ffffff',
            borderBottom:'1px solid #e8e8e8', flexShrink:0, flexWrap:'wrap' }}>
            {[
              { label:'VIN',  value: vin || 'not selected', pink: !!vin },
              { label:'From', value: apiParams.startdate,   pink: true },
              { label:'To',   value: apiParams.enddate,     pink: true },
            ].map(p => (
              <div key={p.label} style={{ display:'flex', alignItems:'center', gap:7,
                padding:'10px 18px', fontSize:12, borderRight:'1px solid #e8e8e8' }}>
                <span style={{ color:'#aaa', textTransform:'uppercase', letterSpacing:'0.6px',
                  fontSize:10, fontWeight:600 }}>{p.label}</span>
                <span style={{ color: p.pink ? '#e91e8c' : '#aaa', fontFamily:'monospace',
                  fontSize:12, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.value}
                </span>
              </div>
            ))}
            <div style={{ padding:'4px 12px' }}>
              <DateFilterBar title="" onApply={() => setTrigger(p => p + 1)} />
            </div>
          </div>

          {/* Welcome screen */}
          {responses.length === 0 && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'40px 32px', textAlign:'center', overflowY:'auto' }}>
              <div style={{ width:54, height:54, borderRadius:16, background:'linear-gradient(135deg,#e91e8c,#c2185b)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                margin:'0 auto 18px', boxShadow:'0 4px 20px rgba(233,30,140,0.25)' }}>🤖</div>
              <h2 style={{ color:'#1a1a2e', fontSize:22, fontWeight:700, margin:'0 0 10px' }}>
                Hello {user?.user?.fullName?.split(' ')[0] || 'there'} — what would you like to explore?
              </h2>
              <p style={{ color:'#666688', fontSize:14, margin:'0 0 16px', maxWidth:480, lineHeight:1.7 }}>
                Ask me anything about vehicle telematics — harsh driving events, fuel efficiency,
                speed distribution, CO₂ emissions, DTC fault codes, or fleet-wide comparisons.
                I generate precise SQL and interpret the results using automotive domain expertise.
              </p>
              {vin && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#f0f4ff',
                  border:'1px solid #e0e0e0', borderRadius:20, padding:'7px 16px', fontSize:12,
                  color:'#666688', marginBottom:24 }}>
                  <span>Active VIN:</span>
                  <strong style={{ color:'#e91e8c', fontFamily:'monospace' }}>{vin}</strong>
                  <span>·</span>
                  <span>{apiParams.startdate} → {apiParams.enddate}</span>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:600, width:'100%' }}>
                {initSuggestions.map((q, i) => (
                  <button key={i}
                    style={{
                      background: hoveredIndex === i ? '#f0f4ff' : '#ffffff',
                      border: `1px solid ${hoveredIndex === i ? '#e91e8c55' : '#e0e0e0'}`,
                      borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left',
                      color: hoveredIndex === i ? '#e0e0f0' : '#8080a0', fontSize:13, lineHeight:1.5,
                      transition:'all 0.2s', fontFamily:'inherit',
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => { setSelectedSuggestion(q); setInputText(q); handleSend(q); }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {responses.length > 0 && (
            <div style={{ flex:1, padding:'20px 28px', overflowY:'auto',
              display:'flex', flexDirection:'column', gap:24 }}>
              {responses.map((res, idx) => (
                <div key={idx}>
                  {/* User bubble */}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
                    <div style={{ background:'linear-gradient(135deg,#e91e8c,#c2185b)', color:'#fff',
                      padding:'12px 18px', borderRadius:'18px 18px 4px 18px', maxWidth:'68%',
                      fontSize:14, lineHeight:1.6, boxShadow:'0 4px 16px #e91e8c30' }}>
                      {res.question}
                    </div>
                  </div>

                  {/* AI bubble */}
                  {res.error ? (
                    <div style={{ background:'#fff8f0', border:'1px solid #ffd0a0',
                      borderRadius:'4px 18px 18px 18px', overflow:'hidden', maxWidth:'80%' }}>
                      <div style={{ background:'#ff8c00', padding:'8px 16px',
                        fontSize:12, fontWeight:700, color:'#fff', letterSpacing:0.5 }}>
                        ⚠ BACKEND ERROR — Action Required
                      </div>
                      <pre style={{ margin:0, padding:'14px 18px',
                        fontSize:13, color:'#7a3800', lineHeight:1.8,
                        fontFamily:'inherit', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                        {res.error}
                      </pre>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ width:32, height:32, borderRadius:10, flexShrink:0, marginTop:2,
                        background:'linear-gradient(135deg,#e91e8c,#c2185b)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14, boxShadow:'0 2px 8px #e91e8c40' }}>🤖</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div>
                          {res.chart && (
                            <DataViz
                              data={res.chart.data}
                              xKey={res.chart.xKey}
                              yKey={res.chart.yKey}
                              title={res.chart.title}
                            />
                          )}
                          <div style={{ background:'#fff', border:'1px solid #e8e8e8',
                            padding:'16px 20px', borderRadius:res.chart ? '0 0 12px 12px' : '4px 18px 18px 18px',
                            fontSize:14, lineHeight:1.8, maxWidth:'100%',
                            borderTop: res.chart ? 'none' : undefined }}
                            dangerouslySetInnerHTML={{ __html: res.htmlResponse }} />
                        </div>
                        {res.suggestions?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                            {res.suggestions.map((s: string, i: number) => (
                              <button key={i}
                                style={{
                                  background: hoveredIndex2 === i ? '#f0f4ff' : '#f0f0f8',
                                  border: `1px solid ${hoveredIndex2 === i ? '#e91e8c55' : '#e0e0e0'}`,
                                  color: hoveredIndex2 === i ? '#e0e0f0' : '#8080b0',
                                  padding:'7px 14px', borderRadius:20, fontSize:12,
                                  cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
                                  ...(selectedSuggestion === s ? { borderColor:'#e91e8c', color:'#e91e8c' } : {}),
                                }}
                                onMouseEnter={() => setHoveredIndex2(i)}
                                onMouseLeave={() => setHoveredIndex2(null)}
                                onClick={() => { setSelectedSuggestion(s); handleSend(s); }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:10, flexShrink:0,
                    background:'linear-gradient(135deg,#e91e8c,#c2185b)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                  <div style={{ background:'#ffffff', border:'1px solid #e0e0e0',
                    padding:'14px 18px', borderRadius:'4px 18px 18px 18px' }}>
                    <span className="dt-typing"><span/><span/><span/></span>
                  </div>
                </div>
              )}

              {/* Inline suggestions after last message */}
              {!loading && responses.length > 0 && !responses[responses.length - 1]?.suggestions?.length && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center',
                  padding:'12px 0', borderTop:'1px solid #e8e8e8' }}>
                  {initSuggestions.map((question, index) => (
                    <button key={index}
                      style={{
                        padding:'7px 14px', borderRadius:20,
                        border: `1px solid ${hoveredIndex === index ? '#e91e8c55' : '#e0e0e0'}`,
                        background: hoveredIndex === index ? '#f0f4ff' : '#ffffff',
                        cursor:'pointer', fontSize:12, transition:'all 0.2s ease',
                        color: hoveredIndex === index ? '#e0e0f0' : '#8080a0',
                        fontFamily:'inherit',
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => { setSelectedSuggestion(question); setInputText(question); handleSend(question); }}>
                      {question}
                    </button>
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input bar */}
          <div style={{ display:'flex', padding:'12px 20px', borderTop:'1px solid #e8e8e8',
            background:'#ffffff', gap:10, alignItems:'center' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', background:'#ffffff',
              border:'1.5px solid #d0d0d0', borderRadius:14, padding:'4px 4px 4px 16px',
              transition:'border-color 0.2s' }}
              onFocus={() => {}} >
              <input
                type="text"
                placeholder='Ask anything about vehicle telematics — harsh events, fuel efficiency, speed, CO2...'
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex:1, background:'none', border:'none', outline:'none',
                  color:'#1a1a2e', fontSize:14, padding:'8px 0', fontFamily:'inherit' }}
              />
            </div>
            <button onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              style={{ width:42, height:42, borderRadius:10, flexShrink:0,
                background: (loading || !inputText.trim()) ? '#e0e0e0' : 'linear-gradient(135deg,#e91e8c,#c2185b)',
                border:'none', cursor: (loading || !inputText.trim()) ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:16, transition:'all 0.2s',
                boxShadow: (loading || !inputText.trim()) ? 'none' : '0 2px 10px #e91e8c40' }}>
              {loading
                ? <div style={{ width:16, height:16, border:'2px solid #aaa',
                    borderTopColor:'transparent', borderRadius:'50%',
                    animation:'dtSpin 0.8s linear infinite' }} />
                : '➤'}
            </button>
          </div>
          <div style={{ textAlign:'center', fontSize:11, color:'#bbb', paddingBottom:8 }}>
            Ask fleet-wide questions for best results — e.g. 'harsh acceleration per VIN'
          </div>
        </div>
      </div></div>
    </>
  );
};

export default AiAnalysisDashboard;
