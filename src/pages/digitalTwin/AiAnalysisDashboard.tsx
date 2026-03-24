import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';
import Icon from '../../components/icon/Icon';

// ─── DT Copilot Config ────────────────────────────────────────────────────────
// Modelled exactly on the working FleetCopilot pattern.
// Only these values differ from fleet: assistId, connector, tables, description.
// Everything else (headers, fetch pattern, response parsing) is identical to fleet.
const BIZVIZ_URL     = '/bizviz-proxy/llmService';
const DT_ASSIST_ID   = '3514581148';
const DT_CONNECTOR   = '238893540';
const DT_TABLES      = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];
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

const C = {
  accent:  '#2563eb',
  accent2: '#3b82f6',
  accent3: '#60a5fa',
  slate:   '#0f172a',
  muted:   '#64748b',
  subtle:  '#94a3b8',
  border:  '#e2e8f0',
  bg:      '#f8fafc',
  bgCard:  '#ffffff',
  bgHead:  '#f1f5f9',
  pink:    '#e91e8c',
};

const DataViz: React.FC<{ data: any[]; xKey: string; yKey: string; title?: string }> =
  ({ data, xKey, yKey, title }) => {

  const [chartType,     setChartType]     = React.useState<ChartType>('table');
  const [tableExpanded, setTableExpanded] = React.useState(false);

  // ── Pixel-level scroll state ──────────────────────────────────────────────
  // pixelOffset: how many pixels we've scrolled (smooth, not page-based)
  const [pixelOffset,  setPixelOffset]  = React.useState(0);
  const [vPixelOffset, setVPixelOffset] = React.useState(0); // vertical bar scrubber
  const [hDragging,    setHDragging]    = React.useState(false);
  const [vDragging,    setVDragging]    = React.useState(false);
  const hScrubRef = React.useRef<HTMLDivElement>(null);
  const vScrubRef = React.useRef<HTMLDivElement>(null);

  // Sort data descending by value — always show highest first
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => Number(b[yKey] ?? 0) - Number(a[yKey] ?? 0));
  }, [data, yKey]);

  const allVals = sortedData.map(r => Number(r[yKey] ?? 0));
  const allMax  = Math.max(...allVals, 1);
  const allMin  = Math.min(...allVals, 0);

  const fmt    = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
  const lbl    = (s: any) => { const str = String(s ?? ''); return str.length > 10 ? '…'+str.slice(-8) : str; };
  const fmtKey = (k: string) => k.split('_').map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');

  // ── Vertical bar dimensions ───────────────────────────────────────────────
  const BAR_W = 38, BAR_GAP = 10, BAR_H = 220, LBL_H = 52, PAD_L = 48, PAD_T = 20;
  const barTotalW   = sortedData.length * (BAR_W + BAR_GAP);   // total SVG width
  const barViewport = 460;                                       // visible pixel width
  const barMaxScroll = Math.max(0, barTotalW - barViewport);    // max pixel scroll
  const barOffset   = Math.round((vPixelOffset / 100) * barMaxScroll); // pixels scrolled

  // ── Horizontal bar dimensions ─────────────────────────────────────────────
  const ROW_H = 30, ROW_GAP = 7, LABEL_W = 130, BAR_AREA = 340, PAD_R_H = 60;
  const rowTotal    = sortedData.length * (ROW_H + ROW_GAP);   // total height of all rows
  const hViewport   = 320;                                       // visible pixel height
  const hMaxScroll  = Math.max(0, rowTotal - hViewport);
  const hOffset     = Math.round((pixelOffset / 100) * hMaxScroll);

  // ── Vertical bar scrubber (right side, vertical) ──────────────────────────
  const vThumbH  = barMaxScroll > 0 ? Math.max(24, (barViewport / barTotalW) * 100) : 100;
  const vThumbPct = barMaxScroll > 0 ? (vPixelOffset / 100) * (100 - vThumbH) : 0;

  const handleVScrub = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!vScrubRef.current) return;
    const rect = vScrubRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setVPixelOffset(ratio * 100);
  }, []);

  // ── Horizontal bar scrubber (bottom, horizontal) ──────────────────────────
  const hThumbW   = hMaxScroll > 0 ? Math.max(24, (hViewport / rowTotal) * 100) : 100;
  const hThumbPct = hMaxScroll > 0 ? (pixelOffset / 100) * (100 - hThumbW) : 0;

  const handleHScrub = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hScrubRef.current) return;
    const rect = hScrubRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setPixelOffset(ratio * 100);
  }, []);

  // Reset scroll on data/type change
  React.useEffect(() => { setPixelOffset(0); setVPixelOffset(0); }, [chartType, data]);

  // ── Vertical bar chart ────────────────────────────────────────────────────
  const renderBarV = () => {
    const W = Math.max(barTotalW, barViewport);
    const SCRUB_W = 14;
    return (
      <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
        {/* Chart with clipped viewport */}
        <div style={{ flex:1, position:'relative', overflow:'hidden', height:PAD_T+BAR_H+LBL_H }}>
          <svg
            viewBox={`${barOffset} 0 ${barViewport} ${PAD_T+BAR_H+LBL_H}`}
            style={{ display:'block', width:'100%', height:PAD_T+BAR_H+LBL_H,
              minWidth: barViewport }}
            preserveAspectRatio="none">
            <defs>
              <linearGradient id="bvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent3}/>
                <stop offset="60%" stopColor={C.accent}/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
            {/* Y-axis */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T+BAR_H} stroke={C.border} strokeWidth={1.5}/>
            {/* Grid lines + Y labels — fixed at left edge of viewport */}
            {[0,0.2,0.4,0.6,0.8,1].map((f,i) => {
              const y = PAD_T + BAR_H - f*BAR_H;
              return (
                <g key={i}>
                  <line x1={barOffset+PAD_L} y1={y} x2={barOffset+barViewport} y2={y}
                    stroke={f===0?C.border:'#f1f5f9'} strokeWidth={f===0?1.5:1}
                    strokeDasharray={f===0?'':'3,3'}/>
                  <text x={barOffset+PAD_L-6} y={y+4} textAnchor="end"
                    fill={C.subtle} fontSize={9} fontFamily="monospace">
                    {fmt(f*allMax)}
                  </text>
                </g>
              );
            })}
            {/* Bars — all rendered, viewport clips them */}
            {sortedData.map((row, i) => {
              const val  = allVals[i];
              const pct  = val / allMax;
              const barH = Math.max(pct * BAR_H, 3);
              const x    = PAD_L + i*(BAR_W+BAR_GAP) + BAR_GAP/2;
              const y    = PAD_T + BAR_H - barH;
              // Intensity: top ranks get deeper color
              const intensity = 1 - (i / sortedData.length) * 0.55;
              const r = Math.round(37 + (1-intensity)*60);
              const g = Math.round(99 + (1-intensity)*40);
              const b = Math.round(235 - (1-intensity)*80);
              const barColor = `rgb(${r},${g},${b})`;
              return (
                <g key={i}>
                  <rect x={x+2} y={y+3} width={BAR_W} height={barH} rx={4} fill="#0000000a"/>
                  <rect x={x} y={y} width={BAR_W} height={barH} rx={4} fill={barColor}>
                    <title>{`#${i+1} ${row[xKey]}: ${val.toLocaleString()}`}</title>
                  </rect>
                  {barH > 22 && (
                    <text x={x+BAR_W/2} y={y+14} textAnchor="middle"
                      fill="#fff" fontSize={8} fontWeight="700" opacity={0.92}>{fmt(val)}</text>
                  )}
                  {barH <= 22 && (
                    <text x={x+BAR_W/2} y={y-5} textAnchor="middle"
                      fill={C.muted} fontSize={8} fontWeight="600">{fmt(val)}</text>
                  )}
                  <text x={x+BAR_W/2} y={PAD_T+BAR_H+18} textAnchor="end"
                    fill={C.muted} fontSize={8.5}
                    transform={`rotate(-40,${x+BAR_W/2},${PAD_T+BAR_H+18})`}>{lbl(row[xKey])}</text>
                </g>
              );
            })}
            {/* X-axis */}
            <line x1={barOffset+PAD_L} y1={PAD_T+BAR_H} x2={barOffset+barViewport} y2={PAD_T+BAR_H}
              stroke={C.border} strokeWidth={1.5}/>
          </svg>
        </div>

        {/* Vertical scrubber — only shown when content overflows */}
        {barMaxScroll > 0 && (
          <div style={{ width:SCRUB_W, display:'flex', flexDirection:'column',
            alignItems:'center', paddingTop:PAD_T, paddingBottom:LBL_H }}>
            <div
              ref={vScrubRef}
              onClick={handleVScrub}
              onMouseMove={e => { if (vDragging) handleVScrub(e); }}
              onMouseDown={() => setVDragging(true)}
              onMouseUp={() => setVDragging(false)}
              onMouseLeave={() => setVDragging(false)}
              style={{ flex:1, width:SCRUB_W, position:'relative', background:C.border,
                borderRadius:SCRUB_W/2, cursor:'pointer', userSelect:'none' }}>
              {/* Track fill */}
              <div style={{ position:'absolute', top:0, left:0, right:0, borderRadius:SCRUB_W/2,
                height:`${vThumbPct+vThumbH}%`, background:`${C.accent}18` }}/>
              {/* Thumb */}
              <div style={{
                position:'absolute', left:'50%', transform:'translateX(-50%)',
                top:`${vThumbPct}%`, width:SCRUB_W, height:`${vThumbH}%`,
                minHeight:24, borderRadius:SCRUB_W/2,
                background:`linear-gradient(180deg,${C.accent3},${C.accent})`,
                boxShadow:`0 2px 8px ${C.accent}55`,
                transition: vDragging ? 'none' : 'top 0.12s ease',
                cursor:'grab', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:2 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:4, height:1.5, background:'rgba(255,255,255,0.75)',
                    borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Horizontal bar chart ──────────────────────────────────────────────────
  const renderBarH = () => {
    const SCRUB_H = 10;
    const totalSVGH = sortedData.length * (ROW_H + ROW_GAP) + 24;
    return (
      <div>
        {/* Clipped viewport */}
        <div style={{ overflow:'hidden', height:hViewport, position:'relative' }}>
          <svg
            viewBox={`0 ${hOffset} ${LABEL_W+BAR_AREA+PAD_R_H} ${hViewport}`}
            style={{ display:'block', width:'100%', height:hViewport }}
            preserveAspectRatio="none">
            <defs>
              <linearGradient id="bhGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C.accent}/>
                <stop offset="100%" stopColor={C.accent3}/>
              </linearGradient>
            </defs>
            {/* Vertical grid lines — anchored to viewport top */}
            {[0,0.25,0.5,0.75,1].map((f,i) => {
              const x = LABEL_W + f*BAR_AREA;
              return (
                <g key={i}>
                  <line x1={x} y1={hOffset} x2={x} y2={hOffset+hViewport}
                    stroke={f===0?C.border:'#f1f5f9'} strokeWidth={f===0?1.5:1}
                    strokeDasharray={f===0?'':'3,3'}/>
                  <text x={x} y={hOffset+hViewport-4} textAnchor="middle"
                    fill={C.subtle} fontSize={9} fontFamily="monospace">
                    {fmt(f*allMax)}
                  </text>
                </g>
              );
            })}
            {/* All rows rendered — viewport clips via viewBox */}
            {sortedData.map((row, i) => {
              const val  = allVals[i];
              const barW = Math.max((val/allMax)*BAR_AREA, 4);
              const y    = i*(ROW_H+ROW_GAP);
              const intensity = 1 - (i/sortedData.length)*0.5;
              const r2 = Math.round(37  + (1-intensity)*50);
              const g2 = Math.round(99  + (1-intensity)*30);
              const b2 = Math.round(235 - (1-intensity)*70);
              const barColor = `rgb(${r2},${g2},${b2})`;
              return (
                <g key={i}>
                  <text x={8} y={y+ROW_H/2+4} fill={C.subtle} fontSize={10} fontWeight="700"
                    fontFamily="monospace">
                    {String(i+1).padStart(2,'0')}
                  </text>
                  <text x={LABEL_W-10} y={y+ROW_H/2+4} textAnchor="end"
                    fill={C.slate} fontSize={11} fontWeight="500">{lbl(row[xKey])}</text>
                  <rect x={LABEL_W} y={y+4} width={BAR_AREA} height={ROW_H-8} fill="#f1f5f9" rx={4}/>
                  <rect x={LABEL_W} y={y+4} width={barW} height={ROW_H-8} fill={barColor} rx={4}>
                    <title>{`#${i+1} ${row[xKey]}: ${val.toLocaleString()}`}</title>
                  </rect>
                  <text x={LABEL_W+barW+8} y={y+ROW_H/2+4}
                    fill={C.accent} fontSize={10} fontWeight="700"
                    fontFamily="monospace">{fmt(val)}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Horizontal scrubber — smooth, continuous */}
        {hMaxScroll > 0 && (
          <div style={{ marginTop:8, padding:'0 2px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:C.subtle }}>
                {Math.round((pixelOffset/100)*sortedData.length)+1}–
                {Math.min(Math.round((pixelOffset/100)*sortedData.length)+Math.round(hViewport/(ROW_H+ROW_GAP)), sortedData.length)} of {sortedData.length}
              </span>
              <span style={{ fontSize:10, color:C.subtle }}>drag to scroll</span>
            </div>
            <div
              ref={hScrubRef}
              onClick={handleHScrub}
              onMouseMove={e => { if (hDragging) handleHScrub(e); }}
              onMouseDown={() => setHDragging(true)}
              onMouseUp={() => setHDragging(false)}
              onMouseLeave={() => setHDragging(false)}
              style={{ position:'relative', height:SCRUB_H+4, background:C.border,
                borderRadius:(SCRUB_H+4)/2, cursor:'pointer', userSelect:'none' }}>
              {/* Fill */}
              <div style={{ position:'absolute', left:0, top:0, height:'100%',
                width:`${hThumbPct+hThumbW}%`, background:`${C.accent}18`, borderRadius:(SCRUB_H+4)/2 }}/>
              {/* Thumb */}
              <div style={{
                position:'absolute', top:0, height:'100%',
                left:`${hThumbPct}%`, width:`${hThumbW}%`,
                borderRadius:(SCRUB_H+4)/2,
                background:`linear-gradient(90deg,${C.accent},${C.accent3})`,
                boxShadow:`0 2px 8px ${C.accent}44`,
                transition: hDragging ? 'none' : 'left 0.12s ease',
                cursor:'ew-resize', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:1.5, height:5, background:'rgba(255,255,255,0.75)',
                    borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Line chart ────────────────────────────────────────────────────────────
  const renderLine = () => {
    const W=560, H=220, PAD_L=50, PAD_T=16, PAD_B=52, PAD_R=20;
    const cW = W - PAD_L - PAD_R;
    const range = allMax - allMin || 1;
    const pts = sortedData.map((row, i) => ({
      x: PAD_L + (sortedData.length > 1 ? (i/(sortedData.length-1))*cW : cW/2),
      y: PAD_T + H - ((allVals[i]-allMin)/range)*H,
      val: allVals[i],
      label: String(row[xKey] ?? ''),
    }));
    const pathD = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaD = pts.length > 1
      ? `${pathD} L${pts[pts.length-1].x.toFixed(1)},${PAD_T+H} L${PAD_L},${PAD_T+H} Z`
      : '';
    return (
      <svg viewBox={`0 0 ${W} ${PAD_T+H+PAD_B}`}
        style={{ display:'block', width:'100%', height:PAD_T+H+PAD_B }}>
        <defs>
          <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent2} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={C.accent2} stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T+H} stroke={C.border} strokeWidth={1.5}/>
        {[0,0.2,0.4,0.6,0.8,1].map((f,i) => {
          const y = PAD_T + H - f*H;
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W-PAD_R} y2={y}
                stroke={f===0?C.border:'#f1f5f9'} strokeWidth={f===0?1.5:1}
                strokeDasharray={f===0?'':'3,3'}/>
              <text x={PAD_L-6} y={y+4} textAnchor="end" fill={C.subtle} fontSize={9} fontFamily="monospace">
                {fmt(allMin + f*range)}
              </text>
            </g>
          );
        })}
        <line x1={PAD_L} y1={PAD_T+H} x2={W-PAD_R} y2={PAD_T+H} stroke={C.border} strokeWidth={1.5}/>
        {pts.length > 1 && <path d={areaD} fill="url(#lineArea)"/>}
        {pts.length > 1 && (
          <path d={pathD} fill="none" stroke={C.accent} strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round"/>
        )}
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill={C.bgCard} stroke={C.accent} strokeWidth={2.5}>
              <title>{`#${i+1} ${p.label}: ${p.val.toLocaleString()}`}</title>
            </circle>
            {sortedData.length <= 12 && (
              <text x={p.x} y={p.y-11} textAnchor="middle"
                fill={C.accent} fontSize={9} fontWeight="700">{fmt(p.val)}</text>
            )}
            <text x={p.x} y={PAD_T+H+17} textAnchor="end" fill={C.muted} fontSize={9}
              transform={`rotate(-40,${p.x},${PAD_T+H+17})`}>{lbl(p.label)}</text>
          </g>
        ))}
      </svg>
    );
  };

  // ── Table ─────────────────────────────────────────────────────────────────
  const renderTable = () => {
    const keys    = Object.keys(sortedData[0] || {});
    const visible = tableExpanded ? sortedData : sortedData.slice(0, 10);
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
                        ? <span style={{ fontFamily:'monospace', fontWeight:700, color:C.accent }}>
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
        {sortedData.length > 10 && (
          <button onClick={() => setTableExpanded(e => !e)}
            style={{ marginTop:10, background:'none', border:`1px solid ${C.accent}44`,
              borderRadius:8, color:C.accent, fontSize:12, padding:'6px 16px',
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
            {tableExpanded ? '▲ Show less' : `▼ Show all ${sortedData.length} rows`}
          </button>
        )}
      </div>
    );
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const total  = allVals.reduce((a:number,b:number) => a+b, 0);
  const avg    = total / (allVals.length||1);
  const stats  = [
    { label:'Total',   value:fmt(total), sub:'' },
    { label:'Average', value:fmt(avg),   sub:'' },
    { label:'Max',     value:fmt(allVals[0]||0), sub:lbl(sortedData[0]?.[xKey]||'') },
    { label:'Min',     value:fmt(allVals[allVals.length-1]||0), sub:lbl(sortedData[sortedData.length-1]?.[xKey]||'') },
    { label:'Records', value:data.length.toLocaleString(), sub:'' },
  ];

  const TABS = [
    { type:'table' as ChartType, icon:'⊞', label:'Table' },
    { type:'bar-v' as ChartType, icon:'▐▐', label:'Bar' },
    { type:'bar-h' as ChartType, icon:'≡≡', label:'Horiz' },
    { type:'line'  as ChartType, icon:'∿',  label:'Line' },
  ];

  return (
    <div style={{ marginTop:12, background:C.bgCard, borderRadius:14,
      border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(37,99,235,0.08)',
      overflow:'hidden', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`,
        background:`linear-gradient(135deg,${C.bgHead},${C.bgCard})`,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          {title && <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{title}</div>}
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
                background: chartType===tab.type ? C.accent : 'transparent',
                color:       chartType===tab.type ? '#fff' : C.muted,
                boxShadow:   chartType===tab.type ? `0 2px 8px ${C.accent}44` : 'none',
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
            <div style={{ fontSize:16, fontWeight:800, color:C.accent,
              lineHeight:1.2, fontFamily:'monospace' }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ padding:'16px 18px 12px' }}>
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

      const userId   = user?.user?.id || user?.user?.userId;
      const spaceKey = user?.user?.spaceKey;
      const authToken = token;

      // Headers must match the working curl from platform.ravity.io/newGenAi/
      // origin and referer are set to platform.ravity.io — BizWiz may validate these
      const headers: Record<string, string> = {
        accept:           'application/json, text/plain, */*',
        'content-type':   'application/x-www-form-urlencoded',
        authtoken:        authToken,
        spacekey:         spaceKey,
        userid:           String(userId),
        origin:           'https://platform.ravity.io',
        referer:          'https://platform.ravity.io/newGenAi/',
      };

      const bodyData = new URLSearchParams({
        serviceType: 'process_text',
        data: JSON.stringify({
          text:             textToSend,   // RAW — no modification, same as fleet copilot
          userID:           String(userId),
          sessionID:        sessionId || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          assistId:         DT_ASSIST_ID,
          connector:        DT_CONNECTOR,
          description:      DT_DESCRIPTION,
          tables:           DT_TABLES,
          selected_files:   [],
          type:             'connector',
          documentStoreIds: DT_TABLES,
          spaceKey:         spaceKey,
        }),
        spacekey: spaceKey,
      });

      const response = await fetch(BIZVIZ_URL, { method: 'POST', headers, body: bodyData });

      if (!response.ok) {
        const errText = await response.text();
        console.error('BizWiz error:', errText);
        setResponses(prev => [...prev, {
          question: textToSend,
          error: `Server returned ${response.status}: ${errText.slice(0, 200)}`,
        }]);
        return;
      }

      const data = await response.json();

      // Parse response — same pattern as fleet copilot
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(data.response);
      } catch {
        parsedResponse = { html: data.response };
      }

      let cleanedResponse = '';
      let suggestionList: string[] = [];

      try {
        if (parsedResponse && !parsedResponse.html) {
          delete parsedResponse.query;
          delete parsedResponse.dashboards;
          delete parsedResponse.data_refreshed_at;

          const { tableHTML, suggestionList: suggs } = buildResponseParts(parsedResponse);
          suggestionList = suggs;
          const hasChrt = !!extractChart(parsedResponse);
          cleanedResponse = buildHtmlResponse(tableHTML, parsedResponse, hasChrt);
        } else {
          cleanedResponse = parsedResponse?.html || 'No response available';
        }
      } catch (err) {
        console.warn('Response handling failed — fallback to raw string', err);
        cleanedResponse = data.response || 'No response available';
      }

      const chartConfig2 = parsedResponse && !parsedResponse.html ? extractChart(parsedResponse) : null;
      setResponses(prev => [...prev, {
        question:     data.original_text || textToSend,
        htmlResponse: cleanedResponse,
        suggestions:  suggestionList,
        chart:        chartConfig2,
      }]);

      // Ingestion — fire and forget, same as fleet copilot
      try {
        await fetch('/ingestion-proxy/ingestion/dataIngestion', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            IngestionId:     '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
            IngestionSecret: '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
          },
          body: JSON.stringify({
            question:   textToSend,
            response:   JSON.stringify(data),
            user_id:    userId,
            action:     'add',
            session_id: sessionId || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            spacekey:   spaceKey,
            user_name:  user?.user?.fullName || 'Unknown_User',
            user_email: user?.user?.emailID  || 'unknown@ravity.io',
          }),
        });
      } catch (ingErr) {
        console.error('Ingestion error:', ingErr);
      }

    } catch (error) {
      console.error('Error:', error);
      setResponses(prev => [...prev, { question: inputText, error: 'Something went wrong!' }]);
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

      <div style={{ display:'flex', height:'calc(100vh - 72px)', fontFamily:'Arial, sans-serif', background:'#f5f7fa' }}>

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
                Hey {user?.user?.fullName?.split(' ')[0] || 'there'}, How may I assist you today?
              </h2>
              <p style={{ color:'#666688', fontSize:14, margin:'0 0 16px', maxWidth:440, lineHeight:1.7 }}>
                Ask me anything about the vehicle telematics data — harsh driving events, 
                fuel efficiency, speed distribution, CO₂ emissions or fleet-wide comparisons.
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
                    <div style={{ background:'#fff5f5', border:'1px solid #ffcccc',
                      color:'#cc2222', padding:'14px 18px', borderRadius:'4px 18px 18px 18px',
                      fontSize:14 }}>
                      {res.error}
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
      </div>
    </>
  );
};

export default AiAnalysisDashboard;
