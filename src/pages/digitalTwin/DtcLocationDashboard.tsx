import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchDtcLocationData, fetchDtcInfo, fetchDtcTile } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
const sec: React.CSSProperties  = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };
const two: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
const th: React.CSSProperties   = { background: '#f5f5f5', padding: '9px 12px', textAlign: 'left' as const, fontWeight: 700, color: '#333', borderBottom: '2px solid #eee', fontSize: 11 };
const td: React.CSSProperties   = { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', color: '#444', fontSize: 11 };

const DTC_CATEGORIES: Record<string, { label: string; color: string }> = {
  P: { label: 'Powertrain',     color: '#ef5350' },
  B: { label: 'Body Elec.',     color: '#ffa726' },
  C: { label: 'Chassis/Safety', color: '#42a5f5' },
  U: { label: 'CAN Network',    color: '#ab47bc' },
};

const getCategory = (code: string) => DTC_CATEGORIES[code?.[0]?.toUpperCase()] || { label: 'Other', color: '#78909c' };

// Simple SVG-based dot map (no external map library required)
const DotMap: FC<{ faults: any[] }> = ({ faults }) => {
  if (!faults.length) return <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No GPS coordinates available for fault locations.</div>;

  // Compute bounding box
  const lats = faults.map(f => Number(f.latitude)).filter(v => v !== 0);
  const lngs = faults.map(f => Number(f.longitude)).filter(v => v !== 0);
  if (!lats.length) return <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Fault location coordinates not available.</div>;

  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.1, 0.01);
  const padLng = Math.max((maxLng - minLng) * 0.1, 0.01);

  const W = 680, H = 380;
  const toX = (lng: number) => ((lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * W;
  const toY = (lat: number) => H - ((lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * H;

  return (
    <div style={{ background: '#e8f4fd', borderRadius: 12, padding: 12, border: '1px solid #b3d4e8' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={W * i / 3} y1={0} x2={W * i / 3} y2={H} stroke="#c8dce8" strokeWidth={0.5} />
        ))}
        {[0, 1, 2].map(i => (
          <line key={i} x1={0} y1={H * i / 2} x2={W} y2={H * i / 2} stroke="#c8dce8" strokeWidth={0.5} />
        ))}

        {/* Fault dots */}
        {faults.map((f, i) => {
          const lat = Number(f.latitude), lng = Number(f.longitude);
          if (!lat || !lng) return null;
          const cat = getCategory(f.diagnosticinfo_data_dtc || '');
          const isCurrent = (f.diagnosticinfo_data_status || '').toLowerCase().includes('current');
          return (
            <g key={i}>
              {/* Pulse ring for current faults */}
              {isCurrent && (
                <circle cx={toX(lng)} cy={toY(lat)} r={14} fill="none" stroke={cat.color} strokeWidth={1.5} opacity={0.4} />
              )}
              <circle
                cx={toX(lng)} cy={toY(lat)} r={isCurrent ? 8 : 6}
                fill={cat.color} opacity={0.85}
                style={{ cursor: 'pointer' }}
              />
              <text x={toX(lng)} y={toY(lat) - 12} textAnchor="middle" fontSize={9} fill="#333" fontWeight={600}>
                {(f.diagnosticinfo_data_dtc || '').toUpperCase().slice(0, 6)}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(DTC_CATEGORIES).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color }} />
            <span>{k} — {v.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid #ef5350' }} />
          <span>Pulsing = Active Fault</span>
        </div>
      </div>
    </div>
  );
};

const DtcLocationDashboard: FC = () => {
  const { apiParams } = useDt();
  const [locationData, setLocationData] = useState<any[]>([]);
  const [dtcInfo, setDtcInfo]           = useState<any[]>([]);
  const [dtcTile, setDtcTile]           = useState<any>(null);
  const [dtcType, setDtcType]           = useState<string>('');
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [trigger, setTrigger]           = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.allSettled([
        fetchDtcLocationData({ ...apiParams, dtc_type: dtcType }),
        fetchDtcInfo(apiParams),
        fetchDtcTile(apiParams),
      ]);
      if (a.status === 'fulfilled') setLocationData(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setDtcInfo(Array.isArray(b.value) ? b.value : []);
      if (c.status === 'fulfilled') { const v = Array.isArray(c.value) ? c.value[0] : c.value; setDtcTile(v || null); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams, dtcType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const tile = dtcTile || {};

  // Merge location data with dtcInfo for richer display
  const mergedFaults = locationData.length > 0 ? locationData : dtcInfo.filter(d => d.latitude && d.longitude);

  // Cluster analysis: count faults by city/state
  const cityMap: Record<string, number> = {};
  dtcInfo.forEach(d => {
    const loc = d.city || d.state || 'Unknown';
    cityMap[loc] = (cityMap[loc] || 0) + 1;
  });
  const cityBreakdown = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count }));

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  dtcInfo.forEach(d => {
    const cat = getCategory(d.diagnosticinfo_data_dtc || '').label;
    catBreakdown[cat] = (catBreakdown[cat] || 0) + 1;
  });

  const currentFaults  = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current'));
  const histFaults     = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('history'));
  const uniqueCodes    = Array.from(new Set(dtcInfo.map(d => d.diagnosticinfo_data_dtc || '').filter(Boolean)));

  const filtered = dtcInfo.filter(d =>
    !search || (d.diagnosticinfo_data_dtc || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.ecu || '').toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    { label: 'Total Faults',       value: tile.total_dtc_count || dtcInfo.length, icon: '🔴', color: '#ef5350', unit: '',         lowerIsBetter: true },
    { label: 'Unique DTC Codes',   value: tile.unique_dtc_count || uniqueCodes.length, icon: '📋', color: '#ffa726', unit: '',   lowerIsBetter: true },
    { label: 'Active / Current',   value: currentFaults.length,                   icon: '⚡', color: '#f44336', unit: 'faults',  lowerIsBetter: true, description: 'Current faults require immediate attention' },
    { label: 'History (Resolved)', value: histFaults.length,                      icon: '📁', color: '#66bb6a', unit: 'faults',  lowerIsBetter: false },
    { label: 'Last DTC Code',      value: tile.last_dtc_code || '—',              icon: '🔍', color: '#ab47bc', unit: '',         lowerIsBetter: false },
    { label: 'Fault Locations',    value: mergedFaults.filter(f => f.latitude && f.longitude).length, icon: '📍', color: '#42a5f5', unit: '', lowerIsBetter: false, description: 'Faults with GPS coordinates' },
  ];

  return (
    <div style={page} id="dt-page-content">
      <h1 style={{ color: '#e91e8c', fontWeight: 900, fontSize: 26, marginBottom: 20, letterSpacing: 1 }}>
        🗺️ DTC Location Intelligence
      </h1>
      <DateFilterBar title="DTC Location Analysis" onApply={() => setTrigger(prev => prev + 1)} />

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#333' }}>Filter by DTC Type:</div>
        {['', 'P', 'B', 'C', 'U'].map(t => (
          <button key={t} onClick={() => setDtcType(t)}
            style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: dtcType === t ? '#e91e8c' : '#f0f0f0', color: dtcType === t ? '#fff' : '#444' }}>
            {t || 'All'} {t ? `— ${DTC_CATEGORIES[t]?.label}` : ''}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search DTC / city / ECU…"
          style={{ marginLeft: 'auto', padding: '6px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, width: 200 }} />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#aaa' }}>Loading fault location data…</div>}

      <div style={sec}>📍 KPI Summary</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      {/* Map */}
      <div style={sec}>🗺️ Fault Location Map — GPS Coordinates of DTC Events</div>
      <div style={{ marginBottom: 20 }}>
        <DotMap faults={mergedFaults} />
        <div style={{ fontSize: 11, color: '#888', marginTop: 8, textAlign: 'center' }}>
          Each dot represents a fault occurrence location. Powered by <code>vt_dtc_location_data</code> API.
          {currentFaults.length > 0 && <span style={{ color: '#ef5350', fontWeight: 700 }}> &nbsp;Pulsing dots = Active faults requiring immediate attention.</span>}
        </div>
      </div>

      <div style={two}>
        {/* City/Location breakdown */}
        <div>
          <div style={sec}>📍 Top Fault Locations</div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>City / Region</th><th style={th}>Fault Count</th></tr></thead>
              <tbody>
                {cityBreakdown.map((r, i) => (
                  <tr key={r.city} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}>{r.city}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#e91e8c' }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <div style={sec}>📊 Fault Category Breakdown</div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Category</th><th style={th}>Count</th><th style={th}>Share</th></tr></thead>
              <tbody>
                {Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count], i) => (
                  <tr key={cat} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}>{cat}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{count}</td>
                    <td style={td}>{dtcInfo.length > 0 ? ((count / dtcInfo.length) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Fault Log */}
      <div style={sec}>📋 Fault Event Log with Coordinates</div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              {['DTC Code', 'Category', 'Status', 'ECU', 'City / State', 'Latitude', 'Longitude', 'Occurrence Time'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((d, i) => {
              const cat = getCategory(d.diagnosticinfo_data_dtc || '');
              const isCurrent = (d.diagnosticinfo_data_status || '').toLowerCase().includes('current');
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...td, fontWeight: 800, color: cat.color }}>{(d.diagnosticinfo_data_dtc || '—').toUpperCase()}</td>
                  <td style={td}><span style={{ background: cat.color + '22', color: cat.color, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{cat.label}</span></td>
                  <td style={td}>
                    <span style={{ background: isCurrent ? '#ffebee' : '#e8f5e9', color: isCurrent ? '#c62828' : '#2e7d32', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                      {isCurrent ? '🔴 Current' : '✅ History'}
                    </span>
                  </td>
                  <td style={td}>{d.ecu || '—'}</td>
                  <td style={td}>{[d.city, d.state].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 10 }}>{d.latitude ? Number(d.latitude).toFixed(4) : '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 10 }}>{d.longitude ? Number(d.longitude).toFixed(4) : '—'}</td>
                  <td style={{ ...td, fontSize: 10 }}>{(d.occurrencetime || '—').slice(0, 16)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 50 && (
          <div style={{ padding: '10px 16px', color: '#888', fontSize: 12, textAlign: 'center' }}>
            Showing 50 of {filtered.length} faults. Use DTC type filter to narrow results.
          </div>
        )}
      </div>
    </div>
  );
};

export default DtcLocationDashboard;
