import React, { FC, useRef, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush,
} from 'recharts';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'multibar';
export interface ChartSeries {
  key: string; color: string; name?: string; type?: 'bar' | 'line';
}

interface ChartCardProps {
  title: string; data: any[]; type: ChartType; xKey: string;
  series: ChartSeries[]; height?: number; expandable?: boolean;
  unit?: string; description?: string; benchmark?: number;
  benchmarkLabel?: string; analysisText?: string;
}

const OPENAI_KEY   = process.env.REACT_APP_OPENAI_KEY || '';
const OPENAI_MODEL = 'gpt-4o-mini';

const dlTxt = (filename: string, content: string) => {
  const blob = new Blob([content], { type:'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.download = `${filename.replace(/[^a-z0-9_\-]/gi,'_')}.txt`;
  a.href = url; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const copyText = (t: string) => { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(()=>{}); };

const PALETTE = [
  '#e91e8c','#42a5f5','#ffa726','#66bb6a','#ab47bc',
  '#ef5350','#26c6da','#8bc34a','#ff7043','#5c6bc0',
];

// ── Exports ──────────────────────────────────────────────────────────────────
const exportCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows    = data.map(r => Object.values(r).map(v => JSON.stringify(v ?? '')).join(','));
  const blob    = new Blob([[headers,...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.download = `${filename.replace(/[^a-z0-9]/gi,'_')}.csv`;
  a.href = url; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
};

const exportSVG = (el: HTMLElement | null, filename: string) => {
  if (!el) return;
  const svg   = el.querySelector('svg'); if (!svg) return;
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('style','background:#fff');
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type:'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.download = `${filename.replace(/[^a-z0-9]/gi,'_')}.svg`;
  a.href = url; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
};

// ── Quick stats from chart data ──────────────────────────────────────────────
const getStats = (data: any[], series: ChartSeries[], unit = '') => {
  const key  = series[0]?.key;
  const vals = data.map(d => Number(d[key] ?? 0)).filter(v => isFinite(v) && v > 0);
  if (!vals.length) return null;
  const n      = vals.length;
  const sum    = vals.reduce((a,b)=>a+b,0);
  const avg    = sum / n;
  const max    = Math.max(...vals);
  const min    = Math.min(...vals);
  const sorted = [...vals].sort((a,b)=>a-b);
  const median = n%2===0 ? (sorted[n/2-1]+sorted[n/2])/2 : sorted[Math.floor(n/2)];
  const p25    = sorted[Math.floor(n*0.25)];
  const p75    = sorted[Math.floor(n*0.75)];
  const stddev = Math.sqrt(vals.reduce((s,v2)=>s+Math.pow(v2-avg,2),0)/n);
  const cv     = avg !== 0 ? (stddev/avg)*100 : 0;
  const xMean  = (n-1)/2;
  const denom  = vals.reduce((s,_,i)=>s+Math.pow(i-xMean,2),0)||1;
  const slope  = vals.reduce((s,v2,i)=>s+(i-xMean)*(v2-avg),0)/denom;
  const trend  = Math.abs(slope)<0.001?'Stable':slope>0?'Increasing':'Decreasing';
  const outliers = vals.filter(v2=>Math.abs(v2-avg)>2*stddev);
  const allSeriesStats = series.map(sr => {
    const sv = data.map(d=>Number(d[sr.key]??0)).filter(v2=>isFinite(v2)&&v2>0);
    if (!sv.length) return null;
    const savg = sv.reduce((a,b)=>a+b,0)/sv.length;
    return { name:sr.name||sr.key, avg:savg, max:Math.max(...sv), min:Math.min(...sv), n:sv.length };
  }).filter(Boolean);
  return { avg, max, min, sum, median, p25, p75, stddev, cv, trend, slope, count:n, unit, outliers, allSeriesStats };
};

// ── Build AI prompt ──────────────────────────────────────────────────────────
const buildChartPrompt = (
  title: string, data: any[], series: ChartSeries[],
  unit = '', description = '', benchmark?: number, benchmarkLabel?: string
): string => {
  const stats = getStats(data, series, unit);
  if (!stats) return '';

  // Sample data points for context (up to 20)
  const sampleRows = data.slice(0, 20).map(d => {
    const row = series.map(s => `${s.name || s.key}:${Number(d[s.key]||0).toFixed(2)}`).join(', ');
    return `  ${d[Object.keys(d)[0]] || ''}: ${row}`;
  }).join('\n');

  // For multi-series, add each series stats
  const seriesStats = series.map(s => {
    const sv = data.map(d=>Number(d[s.key]||0)).filter(sv2=>isFinite(sv2)&&sv2>0);
    if (!sv.length) return null;
    return "  " + (s.name||s.key) + ": avg=" + (sv.reduce((sa: number,sb: number)=>sa+sb,0)/sv.length).toFixed(2) + " max=" + Math.max(...sv).toFixed(2) + " min=" + Math.min(...sv).toFixed(2) + " n=" + sv.length;
  }).filter(Boolean).join("\n");

  return `You are an expert automotive quality analyst for Indian aftermarket vehicles. Analyse this chart's data and provide expert insights.

CRITICAL RULES:
- Do NOT repeat or summarise the statistics — I already have them
- Do NOT output tables, horizontal lines, or stat blocks
- Start IMMEDIATELY with the first section header

Chart: ${title}
Type: ${series.length > 1 ? 'Multi-series' : 'Single series'}
Unit: ${unit || 'count'}
Description: ${description || 'Vehicle telematics chart'}
${benchmark != null ? `Benchmark: ${benchmark} ${unit} (${benchmarkLabel || 'reference'})` : ''}

Statistical Summary (${stats.count} records):
- Mean:     ${stats.avg.toFixed(3)} ${unit}
- Median:   ${stats.median.toFixed(3)} ${unit}
- Min:      ${stats.min.toFixed(3)} ${unit}
- Max:      ${stats.max.toFixed(3)} ${unit}
- Sum:      ${stats.sum.toFixed(2)} ${unit}
- Std Dev:  ${stats.stddev.toFixed(3)}
- CV:       ${stats.cv.toFixed(1)}% (variability)
- P25/P75:  ${stats.p25.toFixed(3)} / ${stats.p75.toFixed(3)} ${unit}
- Trend:    ${stats.trend} (slope: ${stats.slope.toFixed(4)})
- Outliers: ${stats.outliers.length} values beyond 2 std devs${stats.outliers.length > 0 ? ` (${stats.outliers.slice(0,5).map((v: number)=>v.toFixed(2)).join(', ')})` : ''}

${series.length > 1 ? `Per-series breakdown:\n${seriesStats}` : ''}

Sample data (${Math.min(data.length, 20)} of ${data.length} records):
${sampleRows}

Use EXACTLY these section headers on their own line:

CHART INTERPRETATION
(what this chart reveals about vehicle behaviour and condition)

PATTERN ANALYSIS
(peaks, dips, anomalies, clusters — what patterns in the data are notable)

VEHICLE HEALTH IMPACT
(how this chart data affects engine wear, safety, fuel cost, maintenance)

BENCHMARKS & NORMS
(comparison to BS6 standards, ARAI norms, typical Indian vehicle fleet ranges)

RECOMMENDATIONS
(3-5 numbered specific actions based on this chart)

TREND FORECAST
(where this metric is heading and what to watch for)`;
};

// ── Parse AI sections ─────────────────────────────────────────────────────────
const parseSections = (text: string) => {
  const headings = ['CHART INTERPRETATION','PATTERN ANALYSIS','VEHICLE HEALTH','BENCHMARKS','RECOMMENDATIONS','TREND FORECAST'];
  const clean = text
    .replace(/\*\*([A-Z][A-Z &]+)\*\*/g, '$1')
    .replace(/^#{1,3}\s*/gm, '')
    .replace(/^[0-9]+\.\s+([A-Z])/gm, '$1');
  const sections: { title: string; content: string; icon: string }[] = [];
  const icons: Record<string,string> = {
    'CHART INTERPRETATION': '📋',
    'PATTERN ANALYSIS':     '🔍',
    'VEHICLE HEALTH':       '🔧',
    'BENCHMARKS':           '📏',
    'RECOMMENDATIONS':      '✅',
    'TREND FORECAST':       '📈',
  };
  headings.forEach((h, i) => {
    const si = clean.search(new RegExp(h, 'i'));
    if (si === -1) return;
    const next = headings.slice(i+1).find(hh => clean.search(new RegExp(hh,'i')) > si);
    const ei   = next ? clean.search(new RegExp(next,'i')) : clean.length;
    const content = clean.slice(si, ei).replace(new RegExp('^'+h+'[:\\s—\\-]*','i'),'').trim();
    if (content.length > 10)
      sections.push({ title: h.replace('CHART ',''), content, icon: icons[h] || '📊' });
  });
  return sections.length > 0 ? sections : [{ title: 'ANALYSIS', content: text, icon: '🤖' }];
};

// ── Overlay modal ─────────────────────────────────────────────────────────────
const Overlay: FC<{ onClose:()=>void; title:string; children:React.ReactNode }> = ({ onClose, title, children }) => (
  <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.6)',
    display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:16,width:'96vw',maxWidth:1200,
      maxHeight:'92vh',overflow:'auto',boxShadow:'0 32px 96px rgba(0,0,0,0.28)',animation:'dtFadeIn .18s ease' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 24px',borderBottom:'1px solid #f0f0f0',position:'sticky',top:0,background:'#fff',zIndex:1 }}>
        <span style={{ fontWeight:800,fontSize:16,color:'#111' }}>{title}</span>
        <button onClick={onClose} style={{ border:'none',background:'#f5f5f5',borderRadius:8,
          width:34,height:34,cursor:'pointer',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',color:'#444' }}>✕</button>
      </div>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const ChartCard: FC<ChartCardProps> = ({
  title, data, type, xKey, series, height=260,
  expandable=true, unit, description, benchmark, benchmarkLabel, analysisText,
}) => {
  const [modal,      setModal]      = useState(false);
  const [tab,        setTab]        = useState<'chart'|'ai'>('chart');
  const [menu,       setMenu]       = useState(false);
  const [aiResult,   setAiResult]   = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiSections, setAiSections] = useState<{ title:string; content:string; icon:string }[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [copied,     setCopied]     = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = getStats(data, series, unit);

  // ── Report builder ───────────────────────────────────────────────────────
  const buildReport = useCallback(() => {
    const s = stats;
    const header = [
      `CHART ANALYSIS REPORT`,
      `${'='.repeat(55)}`,
      `Chart:         ${title}`,
      `Date Generated:${new Date().toLocaleString()}`,
      `Records:       ${data.length}`,
      `Series:        ${series.map(sr=>sr.name||sr.key).join(', ')}`,
      `Unit:          ${unit || 'count'}`,
      description ? `Description:   ${description}` : '',
      benchmark != null ? `Benchmark:     ${benchmark} ${unit||''}  (${benchmarkLabel||'reference'})` : '',
      ``,
      s ? `STATISTICS` : '',
      s ? `${'-'.repeat(40)}` : '',
      s ? `Mean:          ${s.avg.toFixed(3)} ${s.unit}` : '',
      s ? `Median:        ${s.median.toFixed(3)} ${s.unit}` : '',
      s ? `Min:           ${s.min.toFixed(3)} ${s.unit}` : '',
      s ? `Max:           ${s.max.toFixed(3)} ${s.unit}` : '',
      s ? `Sum:           ${s.sum.toFixed(2)} ${s.unit}` : '',
      s ? `Std Deviation: ${s.stddev.toFixed(3)}` : '',
      s ? `Coeff of Var:  ${s.cv.toFixed(1)}%` : '',
      s ? `P25 / P75:     ${s.p25.toFixed(3)} / ${s.p75.toFixed(3)} ${s.unit}` : '',
      s ? `Trend:         ${s.trend} (slope: ${s.slope.toFixed(4)}/record)` : '',
      s ? `Outliers:      ${s.outliers.length} values beyond 2 std devs` : '',
      s?.outliers.length ? `Outlier vals:  ${s.outliers.slice(0,10).map((v: number)=>v.toFixed(2)).join(', ')}` : '',
      ``,
      `RAW DATA (all ${data.length} records)`,
      `${'-'.repeat(40)}`,
      Object.keys(data[0]||{}).join('	'),
      ...data.map(d => Object.values(d).map(v => String(v ?? '')).join('	')),
    ].filter(l => l !== '');
    if (aiResult) {
      header.push('', `AI ANALYSIS`, '='.repeat(55), aiResult);
    }
    return header.join('\n');
  }, [title, data, series, unit, description, benchmark, benchmarkLabel, stats, aiResult]);

  // ── Run AI analysis ──────────────────────────────────────────────────────
  const runAi = useCallback(async () => {
    setAiLoading(true);
    setAiResult('');
    setAiSections([]);
    setTab('ai');
    try {
      const prompt = buildChartPrompt(title, data, series, unit, description, benchmark, benchmarkLabel);
      if (!prompt) { setAiResult('No data to analyse.'); setAiLoading(false); return; }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: OPENAI_MODEL, max_tokens: 1200, temperature: 0.3,
          messages: [{ role:'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(`OpenAI ${res.status}: ${err?.error?.message?.slice(0,100)||'error'}`);
      }
      const data2 = await res.json();
      const text  = data2?.choices?.[0]?.message?.content || '';
      setAiResult(text);
      setAiSections(parseSections(text));
      setActiveSection(0);
    } catch(e: any) {
      setAiResult(`❌ ${e.message}`);
      setAiSections([{ title:'ERROR', content: e.message, icon:'❌' }]);
    } finally { setAiLoading(false); }
  }, [title, data, series, unit, description, benchmark, benchmarkLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render chart ──────────────────────────────────────────────────────────
  const renderChart = useCallback((h: number, brush = false) => {
    if (!data?.length) return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:h,color:'#ccc',fontSize:13 }}>
        No data for the selected date range
      </div>
    );
    const gradId  = (k: string) => `grad_${k}_${title.replace(/\W/g,'')}`;
    const common  = { data, margin:{ top:6,right:16,left:0,bottom:brush?28:4 } };
    const xAxis   = <XAxis dataKey={xKey} tick={{fontSize:10}} tickLine={false} interval="preserveStartEnd"/>;
    const yAxis   = <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false} width={48}/>;
    const grid    = <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>;
    const tip     = <Tooltip contentStyle={{borderRadius:8,fontSize:12}} formatter={(v:any)=>unit?`${v} ${unit}`:v}/>;
    const leg     = series.length>1 ? <Legend wrapperStyle={{fontSize:11}}/> : null;
    const ref     = benchmark!=null ? <ReferenceLine y={benchmark} stroke="#e91e8c" strokeDasharray="5 5"
                      label={{value:benchmarkLabel||'Benchmark',fill:'#e91e8c',fontSize:10,position:'insideTopRight'}}/> : null;
    const brushEl = brush&&data.length>12 ? <Brush dataKey={xKey} height={20} stroke="#e91e8c" fill="#fce4ec" travellerWidth={5}/> : null;

    if (type==='bar'||type==='multibar') {
      const hasLine = series.some(s=>s.type==='line');
      if (hasLine) return (
        <ComposedChart {...common}>{grid}{xAxis}{yAxis}{tip}{leg}{ref}
          {series.map(s => s.type==='line'
            ? <Line  key={s.key} dataKey={s.key} name={s.name||s.key} stroke={s.color} dot={false} strokeWidth={2.5}/>
            : <Bar   key={s.key} dataKey={s.key} name={s.name||s.key} fill={s.color}   radius={[3,3,0,0]} maxBarSize={36}/>
          )}{brushEl}
        </ComposedChart>
      );
      return (
        <BarChart {...common}>{grid}{xAxis}{yAxis}{tip}{leg}{ref}
          {series.map(s=><Bar key={s.key} dataKey={s.key} name={s.name||s.key} fill={s.color} radius={[3,3,0,0]} maxBarSize={36}/>)}
          {brushEl}
        </BarChart>
      );
    }
    if (type==='line') return (
      <LineChart {...common}>{grid}{xAxis}{yAxis}{tip}{leg}{ref}
        {series.map(s=><Line key={s.key} dataKey={s.key} name={s.name||s.key} stroke={s.color} dot={data.length<50} strokeWidth={2.5}/>)}
        {brushEl}
      </LineChart>
    );
    if (type==='area') return (
      <AreaChart {...common}>
        <defs>{series.map(s=>(
          <linearGradient key={s.key} id={gradId(s.key)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={s.color} stopOpacity={0.55}/>
            <stop offset="95%" stopColor={s.color} stopOpacity={0.03}/>
          </linearGradient>
        ))}</defs>
        {grid}{xAxis}{yAxis}{tip}{leg}{ref}
        {series.map(s=><Area key={s.key} dataKey={s.key} name={s.name||s.key} stroke={s.color} fill={`url(#${gradId(s.key)})`} dot={false} strokeWidth={2.5}/>)}
        {brushEl}
      </AreaChart>
    );
    if (type==='pie') {
      const pd = data.map((d,i)=>({ name:d[xKey]||d.category||`Item${i+1}`, value:Number(d[series[0]?.key]||d.value||0) }));
      const or = h<260?90:130; const ir = h<260?38:56;
      return (
        <PieChart>
          <Pie data={pd} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={or} innerRadius={ir}
            label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
            {pd.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
          </Pie>
          <Tooltip/><Legend wrapperStyle={{fontSize:11}}/>
        </PieChart>
      );
    }
    return null;
  }, [data,type,xKey,series,unit,benchmark,benchmarkLabel,title]);

  // ── Stats bar ──────────────────────────────────────────────────────────────
  const StatsBar = () => {
    if (!stats) return null;
    const u = unit || '';
    return (
      <div style={{ display:'flex',gap:8,marginTop:14,flexWrap:'wrap' as const }}>
        {([
          ['Mean',   stats.avg.toFixed(2),    '#42a5f5'],
          ['Median', stats.median.toFixed(2), '#7c4dff'],
          ['Max',    stats.max.toFixed(2),    '#ef5350'],
          ['Min',    stats.min.toFixed(2),    '#66bb6a'],
          ['Std Dev',stats.stddev.toFixed(2), '#ff9800'],
          ['CV',     `${stats.cv.toFixed(1)}%`,'#26c6da'],
          ['Count',  String(stats.count),     '#ffa726'],
          ['Trend',  stats.trend,              stats.trend==='Increasing'?'#ef5350':stats.trend==='Decreasing'?'#66bb6a':'#888'],
        ] as [string,string,string][]).map(([l,v,c]) => (
          <div key={l} style={{ flex:'1 1 80px',background:'#fafafa',borderRadius:10,padding:'8px 12px',textAlign:'center' as const,border:`2px solid ${c}22` }}>
            <div style={{ fontSize:15,fontWeight:800,color:c }}>{v}{l!=='Count'&&l!=='Trend'&&u?` ${u}`:''}</div>
            <div style={{ fontSize:10,color:'#888',fontWeight:600,marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
    );
  };

  // ── AI panel ───────────────────────────────────────────────────────────────
  const AiPanel = ({ inModal = false }: { inModal?: boolean }) => (
    <div style={{ border:'2px solid #10A37F22',borderRadius:12,overflow:'hidden',marginTop:inModal?0:0 }}>
      {/* AI header */}
      <div style={{ background:'linear-gradient(135deg,#10A37F18,#10A37F05)',padding:'10px 16px',
        display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #10A37F22' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:16 }}>🤖</span>
          <span style={{ fontSize:13,fontWeight:700,color:'#065f46' }}>AI Chart Analysis</span>
          <span style={{ fontSize:10,color:'#888',background:'#f0f0f0',padding:'2px 7px',borderRadius:10 }}>
            GPT-4o mini
          </span>
        </div>
        <button onClick={runAi} disabled={aiLoading} style={{
          padding:'6px 14px',background:aiLoading?'#e0e0e0':'#1565c0',border:'none',borderRadius:8,
          color:aiLoading?'#888':'#fff',fontWeight:700,fontSize:12,cursor:aiLoading?'not-allowed':'pointer',
          display:'flex',alignItems:'center',gap:6,
        }}>
          {aiLoading
            ? <><div style={{ width:12,height:12,border:'2px solid #aaa',borderTopColor:'#555',borderRadius:'50%',animation:'chartSpin .8s linear infinite' }}/>Analysing…</>
            : aiResult ? '🔄 Re-analyse' : '◎ Analyse Chart'
          }
        </button>
      </div>

      {/* Loading */}
      {aiLoading && (
        <div style={{ padding:'24px',textAlign:'center' as const,color:'#888',fontSize:13 }}>
          <div style={{ fontSize:28,marginBottom:8 }}>📊</div>
          Analysing {title} with GPT-4o mini…
        </div>
      )}

      {/* Sections */}
      {aiSections.length > 0 && !aiLoading && (
        <div style={{ display:'flex',flexDirection:'column' as const }}>
          {/* Tab pills */}
          <div style={{ display:'flex',gap:6,padding:'10px 14px',background:'#fafafa',
            borderBottom:'1px solid #f0f0f0',flexWrap:'wrap' as const }}>
            {aiSections.map((s,i) => (
              <button key={i} onClick={()=>setActiveSection(i)} style={{
                padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',
                fontWeight:600,fontSize:11,transition:'all .15s',
                background: activeSection===i ? '#10A37F' : '#f0f0f0',
                color: activeSection===i ? '#fff' : '#555',
              }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>

          {/* Active section content */}
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'#10A37F',textTransform:'uppercase' as const,letterSpacing:0.6,marginBottom:8 }}>
              {aiSections[activeSection]?.icon} {aiSections[activeSection]?.title}
            </div>
            <div style={{ fontSize:13,color:'#222',lineHeight:2,whiteSpace:'pre-line' as const }}>
              {aiSections[activeSection]?.content}
            </div>
          </div>

          {/* Full response toggle */}
          <details style={{ borderTop:'1px solid #f0f0f0' }}>
            <summary style={{ padding:'8px 16px',fontSize:11,color:'#888',cursor:'pointer',userSelect:'none' as const,background:'#fafafa' }}>
              📄 Full raw response
            </summary>
            <div style={{ padding:'12px 16px',fontFamily:'monospace',fontSize:11,color:'#444',
              lineHeight:1.8,whiteSpace:'pre-wrap' as const,background:'#f8f9fa',maxHeight:300,overflowY:'auto' as const }}>
              {aiResult}
            </div>
          </details>
        </div>
      )}

      {/* Stats summary + run button — shown before AI runs */}
      {!aiResult && !aiLoading && (
        <div style={{ display:'flex',flexDirection:'column' as const,gap:12 }}>
          {/* Stats table */}
          {stats && (
            <div>
              <div style={{ fontSize:12,fontWeight:800,color:'#333',marginBottom:8 }}>📐 Statistical Summary</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                {([
                  ['Records',   String(stats.count)],
                  ['Mean',      `${stats.avg.toFixed(3)} ${stats.unit}`],
                  ['Median',    `${((stats as any).median||stats.avg).toFixed ? ((stats as any).median||stats.avg).toFixed(3) : '—'} ${stats.unit}`],
                  ['Min',       `${stats.min.toFixed(3)} ${stats.unit}`],
                  ['Max',       `${stats.max.toFixed(3)} ${stats.unit}`],
                  ['Std Dev',   `${stats.stddev.toFixed(3)}`],
                  ['CV',        `${stats.cv.toFixed(1)}%`],
                  ['Trend',     stats.trend],
                ] as [string,string][]).map(([k,v])=>(
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',
                    background:'#fafafa',borderRadius:8,padding:'6px 10px',border:'1px solid #f0f0f0' }}>
                    <span style={{ fontSize:11,color:'#777',fontWeight:600 }}>{k}</span>
                    <span style={{ fontSize:11,color:'#111',fontWeight:700,fontFamily:'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Data info */}
          <div style={{ background:'#f0f4ff',borderRadius:10,padding:'10px 14px',fontSize:11,color:'#555',lineHeight:1.8 }}>
            <strong style={{ color:'#1a237e' }}>📦 AI will receive:</strong> {data.length} data points across {series.length} series, all statistics above, benchmark reference{benchmark!=null?` (${benchmark} ${unit||''})`:''}, and chart description.
          </div>
          {/* Run button */}
          <button onClick={runAi} style={{
            width:'100%',padding:'11px',background:'linear-gradient(135deg,#10A37F,#059669)',
            border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',
            boxShadow:'0 3px 12px rgba(16,163,127,0.3)' }}>
            ◎ Run AI Analysis on "{title}"
          </button>
        </div>
      )}
    </div>
  );

  const TabBtn: FC<{ t:'chart'|'ai'; label:string }> = ({ t, label }) => (
    <button onClick={()=>setTab(t)} style={{
      padding:'5px 12px',border:'none',borderRadius:6,fontWeight:600,fontSize:12,cursor:'pointer',
      background: tab===t ? '#e91e8c' : '#f0f0f0',
      color: tab===t ? '#fff' : '#555', transition:'all .15s',
    }}>{label}</button>
  );

  return (
    <>
      <style>{`
        @keyframes dtFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes chartSpin{to{transform:rotate(360deg)}}
      `}</style>
      <div ref={cardRef} style={{ background:'#fff',borderRadius:14,padding:'16px 18px',
        boxShadow:'0 1px 6px rgba(0,0,0,0.07)',display:'flex',flexDirection:'column' as const }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
          <span style={{ fontWeight:700,fontSize:13,color:'#111',flex:1,lineHeight:1.3 }}>{title}</span>
          <div style={{ display:'flex',gap:4 }}>
            <TabBtn t="chart" label="📈"/>
            <TabBtn t="ai"    label="🤖"/>
          </div>
          {/* Action menu */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setMenu(m=>!m)} style={{ border:'none',background:'#f5f5f5',borderRadius:8,
              width:30,height:30,cursor:'pointer',fontSize:16,
              display:'flex',alignItems:'center',justifyContent:'center',color:'#666' }}>⋮</button>
            {menu && (
              <div style={{ position:'absolute',right:0,top:34,zIndex:200,background:'#fff',borderRadius:10,
                boxShadow:'0 8px 32px rgba(0,0,0,0.15)',minWidth:160,overflow:'hidden',border:'1px solid #eee' }}>
                {[
                  { icon:'⤢', label:'Expand View',    fn:()=>{ setModal(true);                      setMenu(false); } },
                  { icon:'🖼', label:'Download SVG',   fn:()=>{ exportSVG(cardRef.current,title);    setMenu(false); } },
                  { icon:'📊', label:'Export CSV',     fn:()=>{ exportCSV(data,title);               setMenu(false); } },
                  { icon:'📄', label:'Download Report',fn:()=>{ dlTxt(`Chart_${title}`,buildReport());setMenu(false); } },
                  { icon:'📋', label:'Copy Stats',     fn:()=>{ copyText(buildReport());setCopied(true);setTimeout(()=>setCopied(false),2000);setMenu(false); } },
                  { icon:'🤖', label:'AI Analysis',    fn:()=>{ setTab('ai');                         setMenu(false); } },
                ].map(({ icon, label, fn }) => (
                  <button key={label} onClick={fn} style={{
                    display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 14px',
                    border:'none',background:'transparent',cursor:'pointer',fontSize:12,color:'#333',textAlign:'left' as const,
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#fce4ec')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {description && <p style={{ fontSize:11,color:'#888',margin:'0 0 8px',lineHeight:1.5 }}>{description}</p>}

        {/* Body */}
        {tab === 'chart' ? (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart(height, true) as any}
          </ResponsiveContainer>
        ) : (
          <AiPanel/>
        )}
        {/* Mini stats footer — inside card */}
        {stats && tab === 'chart' && (
          <div style={{ display:'flex',gap:4,marginTop:6,paddingTop:6,
            borderTop:'1px solid #f5f5f5',flexWrap:'wrap' as const,alignItems:'center' }}>
            <span style={{ fontSize:10,color:'#bbb' }}>
              n={stats.count} · avg={stats.avg.toFixed(1)}{unit?` ${unit}`:''} · {stats.trend==='Increasing'?'↑':stats.trend==='Decreasing'?'↓':'→'} {stats.trend}
            </span>
          </div>
        )}
      </div>

      {/* Expanded modal */}
      {modal && (
        <Overlay onClose={()=>setModal(false)} title={title}>
          <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' as const,alignItems:'center' }}>
            <button onClick={()=>setTab('chart')} style={{ padding:'6px 14px',border:'none',borderRadius:7,fontWeight:700,fontSize:12,cursor:'pointer',background:tab==='chart'?'#e91e8c':'#f0f0f0',color:tab==='chart'?'#fff':'#555' }}>📈 Chart</button>
            <button onClick={()=>{ setTab('ai'); if(!aiResult&&!aiLoading) runAi(); }} style={{ padding:'6px 14px',border:'none',borderRadius:7,fontWeight:700,fontSize:12,cursor:'pointer',background:tab==='ai'?'#10A37F':'#f0f0f0',color:tab==='ai'?'#fff':'#555' }}>🤖 AI Analysis</button>
            <div style={{ width:1,height:24,background:'#e0e0e0',margin:'0 4px' }}/>
            <button onClick={()=>dlTxt(`Chart_${title}`,buildReport())} style={{ padding:'6px 12px',border:'1px solid #4caf50',borderRadius:7,background:'#f1f8e9',cursor:'pointer',fontSize:11,color:'#2e7d32',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>📄 .txt</button>
            <button onClick={()=>exportCSV(data,title)} style={{ padding:'6px 12px',border:'1px solid #42a5f5',borderRadius:7,background:'#e3f2fd',cursor:'pointer',fontSize:11,color:'#1565c0',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>📊 .csv</button>
            <button onClick={()=>exportSVG(cardRef.current,title)} style={{ padding:'6px 12px',border:'1px solid #ddd',borderRadius:7,background:'#f9f9f9',cursor:'pointer',fontSize:11,color:'#555',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>🖼 .svg</button>
            <button onClick={()=>{copyText(buildReport());setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              style={{ padding:'6px 12px',border:`1px solid ${copied?'#66bb6a':'#ddd'}`,borderRadius:7,
                background:copied?'#e8f5e9':'#f9f9f9',cursor:'pointer',fontSize:11,
                color:copied?'#2e7d32':'#777',fontWeight:600,transition:'all .2s',display:'flex',alignItems:'center',gap:4 }}>
              {copied?'✅ Copied':'📋 Copy'}
            </button>
            {aiResult && (
              <button onClick={()=>dlTxt(`AI_Analysis_${title}`,buildReport())} style={{ padding:'6px 12px',border:'1px solid #10A37F',borderRadius:7,background:'#f0fdf4',cursor:'pointer',fontSize:11,color:'#065f46',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>🤖 AI Report</button>
            )}
          </div>
          {tab === 'chart' ? (
            <>
              <ResponsiveContainer width="100%" height={500}>
                {renderChart(500, true) as any}
              </ResponsiveContainer>
              <StatsBar/>
            </>
          ) : (
            <AiPanel inModal/>
          )}
        </Overlay>
      )}
    </>
  );
};

export default ChartCard;
