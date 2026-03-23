import React, { FC, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';

interface DateFilterBarProps {
  title: string;
  onApply: () => void;
}

const PRESETS = [
  { label: '7D',  days: 7,   tooltip: 'Last 7 days' },
  { label: '30D', days: 30,  tooltip: 'Last 30 days' },
  { label: '90D', days: 90,  tooltip: 'Last 90 days' },
  { label: '6M',  days: 180, tooltip: 'Last 6 months' },
  { label: '1Y',  days: 365, tooltip: 'Last 1 year' },
  { label: 'ALL', days: 730, tooltip: 'All available data' },
];

const DATA_END   = new Date('2025-06-30');
const DATA_START = new Date('2023-06-01');

const clamp = (d: Date): Date => {
  if (d > DATA_END)   return new Date(DATA_END);
  if (d < DATA_START) return new Date(DATA_START);
  return d;
};
const fmt = (d: Date): string => d.toISOString().slice(0, 10);

/* ── canvas-based page screenshot (no external deps) ─────────────────────── */
const capturePageAsCanvas = (): Promise<HTMLCanvasElement | null> => {
  return new Promise(resolve => {
    const el = document.getElementById('dt-page-content');
    if (!el) { resolve(null); return; }

    const rect   = el.getBoundingClientRect();
    const scale  = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width  = rect.width  * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }

    ctx.scale(scale, scale);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw all SVGs found on the page onto the canvas
    const svgs = Array.from(el.querySelectorAll('svg'));
    if (svgs.length === 0) { resolve(canvas); return; }

    let done = 0;
    svgs.forEach(svg => {
      const svgRect    = svg.getBoundingClientRect();
      const x          = svgRect.left - rect.left;
      const y          = svgRect.top  - rect.top;
      const w          = svgRect.width;
      const h          = svgRect.height;

      const clone      = svg.cloneNode(true) as SVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width',  String(w));
      clone.setAttribute('height', String(h));

      const serializer = new XMLSerializer();
      const svgStr     = serializer.serializeToString(clone);
      const blob       = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url        = URL.createObjectURL(blob);
      const img        = new Image();

      img.onload = () => {
        ctx.drawImage(img, x, y, w, h);
        URL.revokeObjectURL(url);
        done++;
        if (done === svgs.length) resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        done++;
        if (done === svgs.length) resolve(canvas);
      };
      img.src = url;
    });
  });
};

const downloadPage = async (title: string) => {
  const canvas = await capturePageAsCanvas();
  if (!canvas) {
    // Fallback: export all SVGs as a zip-like multi-file download
    const el   = document.getElementById('dt-page-content') || document.body;
    const svgs = Array.from(el.querySelectorAll('svg'));
    if (svgs.length === 0) { alert('No visual content to export on this page.'); return; }
    const serializer = new XMLSerializer();
    svgs.slice(0, 1).forEach((svg, i) => {
      const clone = svg.cloneNode(true) as SVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const blob = new Blob([serializer.serializeToString(clone)], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.download = `${title.replace(/\s+/g, '_')}_chart${i + 1}.svg`;
      a.href     = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    return;
  }
  // Convert canvas to PNG blob and trigger download
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.png`;
    a.href     = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
};

/* ── Component ────────────────────────────────────────────────────────────── */
const DateFilterBar: FC<DateFilterBarProps> = ({ title, onApply }) => {
  const { vin, startDate, setStartDate, endDate, setEndDate } = useDt();
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [downloading, setDownloading]   = useState(false);

  const applyPreset = (days: number, idx: number) => {
    const end   = clamp(new Date(DATA_END));
    const start = clamp(new Date(end.getTime() - days * 86_400_000));
    setStartDate(fmt(start));
    setEndDate(fmt(end));
    setActivePreset(idx);
    setTimeout(onApply, 50);
  };

  const handleApply = () => {
    if (startDate > endDate) { alert('Start date cannot be after end date'); return; }
    onApply();
  };

  const handleDownload = async () => {
    setDownloading(true);
    await downloadPage(title);
    setDownloading(false);
  };

  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {/* ── Title row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h2 style={{ color: '#e91e8c', fontWeight: 800, fontSize: 20, margin: 0, flex: 1 }}>{title}</h2>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg,#fce4ec,#fff)',
          border: '1px solid #f48fb1', borderRadius: 8, padding: '4px 12px',
        }}>
          <span style={{ fontSize: 10, color: '#880e4f', fontWeight: 700 }}>VIN</span>
          <span style={{ fontSize: 12, color: '#c2185b', fontFamily: 'monospace', fontWeight: 700 }}>{vin}</span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '6px 14px', border: '1px solid #ddd', borderRadius: 8,
            background: downloading ? '#e91e8c' : '#f9f9f9',
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600,
            color: downloading ? '#fff' : '#555',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!downloading) { e.currentTarget.style.background='#111'; e.currentTarget.style.color='#fff'; }}}
          onMouseLeave={e => { if (!downloading) { e.currentTarget.style.background='#f9f9f9'; e.currentTarget.style.color='#555'; }}}
        >
          {downloading ? '⏳ Saving…' : '🖼 Download Page'}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        background: '#fff', border: '1px solid #eee', borderRadius: 12,
        padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {(['Start','End'] as const).map(lbl => {
          const val    = lbl === 'Start' ? startDate : endDate;
          const setter = lbl === 'Start' ? setStartDate : setEndDate;
          return (
            <div key={lbl} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid #ddd', borderRadius: 8, padding: '5px 10px', background: '#fafafa',
            }}>
              <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{lbl}</span>
              <input type="date" value={val} min="2023-06-01" max="2025-06-30"
                onChange={e => { setter(e.target.value); setActivePreset(null); }}
                style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#222', outline: 'none', cursor: 'pointer' }} />
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 4 }}>
          {PRESETS.map((p, i) => (
            <button key={p.label} title={p.tooltip} onClick={() => applyPreset(p.days, i)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${activePreset === i ? '#e91e8c' : '#e0e0e0'}`,
              background: activePreset === i ? 'linear-gradient(135deg,#e91e8c,#c2185b)' : '#f5f5f5',
              color: activePreset === i ? '#fff' : '#555', transition: 'all 0.15s',
              boxShadow: activePreset === i ? '0 2px 8px rgba(233,30,140,0.3)' : 'none',
            }}>{p.label}</button>
          ))}
        </div>
        <button onClick={handleApply} style={{
          padding: '7px 24px', marginLeft: 'auto',
          background: 'linear-gradient(135deg,#111,#333)',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
          cursor: 'pointer', color: '#fff', letterSpacing: 0.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
          Apply ▶
        </button>
      </div>
      <div style={{ marginTop: 5, fontSize: 11, color: '#aaa', paddingLeft: 4, display: 'flex', gap: 10 }}>
        <span>📅 <strong style={{ color:'#888' }}>{startDate}</strong> → <strong style={{ color:'#888' }}>{endDate}</strong></span>
        <span>({days} days selected)</span>
        <span style={{ marginLeft: 'auto' }}>Available: Jun 2023 – Jun 2025</span>
      </div>
    </div>
  );
};

export default DateFilterBar;
