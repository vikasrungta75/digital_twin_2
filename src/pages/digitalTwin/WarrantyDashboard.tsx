import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchDtcInfo, fetchDtcOccurrence, fetchOverallData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import PageHeader, { ICON_PATHS } from './PageHeader';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const pageStyle: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' as const };
const sectionTitle: React.CSSProperties = {
  color: '#e91e8c', fontWeight: 800, fontSize: 16, marginBottom: 16,
  textTransform: 'uppercase', letterSpacing: 0.5,
  borderLeft: '4px solid #e91e8c', paddingLeft: 12,
};
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 };
const tdStyle: React.CSSProperties = { padding: '9px 14px', borderBottom: '1px solid #f0f0f0', color: '#444', fontSize: 12 };
const thStyle: React.CSSProperties = { background: '#f5f5f5', padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #eee', fontSize: 12 };

// DTC to warranty category mapping
const WARRANTY_CATEGORY: Record<string, string> = {
  P: 'Powertrain',
  B: 'Body Electronics',
  C: 'Chassis / Safety',
  U: 'Communication Network',
};
const getCategory = (code: string) => WARRANTY_CATEGORY[code?.[0]?.toUpperCase()] || 'Other';

// Warranty validity estimator (heuristic based on usage)
const isLikelyVoidingEvent = (d: any): boolean => {
  const dist = Number(d.trip_distance || 0);
  const speed = Number(d.max_speed || 0);
  const harsh = Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0);
  return speed > 160 || harsh > 20 || dist > 500;
};

const WarrantyDashboard: FC = () => {
  const { apiParams } = useDt();
  const [dtcInfo, setDtcInfo] = useState<any[]>([]);
  const [dtcOcc, setDtcOcc] = useState<any[]>([]);
  const [overallData, setOverallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, occRes, oRes] = await Promise.allSettled([
        fetchDtcInfo(apiParams),
        fetchDtcOccurrence(apiParams),
        fetchOverallData(apiParams),
      ]);
      if (dRes.status === 'fulfilled') setDtcInfo(Array.isArray(dRes.value) ? dRes.value : []);
      if (occRes.status === 'fulfilled') setDtcOcc(Array.isArray(occRes.value) ? occRes.value : []);
      if (oRes.status === 'fulfilled') setOverallData(Array.isArray(oRes.value) ? oRes.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Category breakdown
  const byCategory = dtcInfo.reduce((acc: Record<string, number>, d) => {
    const cat = getCategory(d.diagnosticinfo_data_dtc || '');
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([category, count]) => ({ category, count }));

  // Potential warranty voiding events
  const voidingEvents = overallData.filter(isLikelyVoidingEvent);
  const totalHarshBrk = overallData.reduce((s, d) => s + Number(d.harsh_brk_count || 0), 0);
  const maxSpeedEver = Math.max(...overallData.map(d => Number(d.max_speed || 0)), 0);
  const adulteration = overallData.reduce((s, d) => s + Number(d.fueladulteration || 0), 0);
  const totalDistance = overallData.reduce((s, d) => s + Number(d.trip_distance || 0), 0);
  const avgFuelEff = overallData.length > 0
    ? (overallData.reduce((s, d) => s + Number(d.fuel_efficiency || 0), 0) / overallData.length).toFixed(2) : null;

  const currentFaults = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current'));
  const historyFaults = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('history'));

  // Recurring DTCs (appeared >1 time)
  const recurringDtcs = dtcOcc
    .filter(d => Number(d.count || d.value || 0) > 1)
    .map(d => ({ dtc: d.diagnosticinfo_data_dtc || d._id || d.dtc || '', count: Number(d.count || d.value || 0) }))
    .sort((a, b) => b.count - a.count);

  // Monthly fault distribution
  const monthlyFaults = dtcInfo.reduce((acc: Record<string, number>, d) => {
    const month = (d.occurrencetime || d.timestamp || '').slice(0, 7);
    if (month) acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const monthlyData = Object.entries(monthlyFaults)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Risk score
  const warrantyRisk = Math.min(100, Math.round(
    (voidingEvents.length * 10) + (adulteration * 20) + (currentFaults.length * 5) + (recurringDtcs.length * 3)
  ));

  const filteredDtc = dtcInfo.filter(d => {
    const code = (d.diagnosticinfo_data_dtc || '').toLowerCase();
    const st = (d.state || '').toLowerCase();
    return !searchTerm || code.includes(searchTerm.toLowerCase()) || st.includes(searchTerm.toLowerCase());
  });

  const kpis = [
    { label: 'Warranty Risk Score', value: warrantyRisk, icon: '🎯', color: warrantyRisk < 30 ? '#66bb6a' : warrantyRisk < 60 ? '#ffa726' : '#ef5350', unit: '/100', lowerIsBetter: true, description: 'Composite warranty risk: voiding events, adulterations, recurring DTCs' },
    { label: 'Total DTC Events', value: dtcInfo.length, icon: '🔴', color: '#f44336', unit: '', lowerIsBetter: true },
    { label: 'Current Active Faults', value: currentFaults.length, icon: '🔥', color: '#c62828', unit: '', lowerIsBetter: true },
    { label: 'Recurring DTCs', value: recurringDtcs.length, icon: '🔄', color: '#ff7043', unit: '', lowerIsBetter: true, description: 'DTCs that appeared more than once — systemic issue indicator' },
    { label: 'Potential Void Events', value: voidingEvents.length, icon: '⛔', color: '#b71c1c', unit: '', lowerIsBetter: true, description: 'Trips with extreme driving that may void manufacturer warranty' },
    { label: 'Fuel Adulteration', value: adulteration, icon: '☣️', color: '#6a1b9a', unit: 'events', lowerIsBetter: true, description: 'Suspected contaminated fuel events — automatic warranty impact' },
    { label: 'Max Speed Recorded', value: maxSpeedEver.toFixed(0), icon: '🏎️', color: maxSpeedEver > 160 ? '#ef5350' : '#42a5f5', unit: 'km/h', lowerIsBetter: true },
    { label: 'Total Distance', value: totalDistance.toFixed(0), icon: '📍', color: '#42a5f5', unit: 'km', lowerIsBetter: false },
    { label: 'Avg Fuel Efficiency', value: avgFuelEff, icon: '⛽', color: '#ffa726', unit: 'km/l', lowerIsBetter: false },
  ];

  return (
    <div style={pageStyle} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.warranty}
        title="Warranty Analysis"
        subtitle="Warranty risk assessment, claim history and coverage status"
      />
      <DateFilterBar title="Warranty Quality Analysis" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading warranty data…</div>}

      {/* Risk banner */}
      {warrantyRisk >= 40 && (
        <div style={{
          background: warrantyRisk >= 70 ? '#ffebee' : '#fff3e0',
          border: `1px solid ${warrantyRisk >= 70 ? '#ef9a9a' : '#ffcc02'}`,
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 28 }}>{warrantyRisk >= 70 ? '🔴' : '🟠'}</span>
          <div>
            <div style={{ fontWeight: 700, color: warrantyRisk >= 70 ? '#c62828' : '#e65100' }}>
              {warrantyRisk >= 70 ? 'HIGH WARRANTY RISK' : 'ELEVATED WARRANTY RISK'}
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {voidingEvents.length > 0 && `${voidingEvents.length} potential voiding event(s) detected. `}
              {adulteration > 0 && `${adulteration} fuel adulteration event(s). `}
              {currentFaults.length > 0 && `${currentFaults.length} active fault(s) require attention.`}
            </div>
          </div>
        </div>
      )}

      <div style={sectionTitle}>📋 Warranty KPIs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      <div style={sectionTitle}>📊 Warranty Analytics</div>
      <div style={twoCol}>
        <ChartCard
          title="DTC by Warranty Category"
          data={categoryData}
          type="pie"
          xKey="category"
          series={[{ key: 'count', color: '#42a5f5' }]}
          description="Distribution of DTCs by warranty domain (P=Powertrain, B=Body, C=Chassis, U=Network)"
        />
        <ChartCard
          title="Monthly DTC Occurrence Trend"
          data={monthlyData}
          type="area"
          xKey="month"
          series={[{ key: 'count', color: '#e91e8c', name: 'DTC Events' }]}
          description="Rising trend indicates accelerating degradation — check alignment with service history"
        />
      </div>

      {recurringDtcs.length > 0 && (
        <ChartCard
          title="Recurring DTCs (appeared >1 time)"
          data={recurringDtcs.slice(0, 15)}
          type="bar"
          xKey="dtc"
          series={[{ key: 'count', color: '#ff7043', name: 'Occurrences' }]}
          height={280}
          description="Recurring faults indicate systemic issues — high priority for warranty claim analysis"
        />
      )}
      <div style={{ height: 16 }} />

      {/* Warranty claim table */}
      <div style={sectionTitle}>📄 DTC Warranty Claim Summary</div>
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Filter by DTC code or state…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}
          />
          <span style={{ fontSize: 12, color: '#888' }}>{filteredDtc.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['DTC Code', 'Category', 'Status', 'Warranty Impact', 'City', 'State', 'Timestamp'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDtc.slice(0, 30).map((d, i) => {
                const code = d.diagnosticinfo_data_dtc || d.dtc || '—';
                const status = d.diagnosticinfo_data_status || d.status || 'Unknown';
                const isCurrent = status.toLowerCase().includes('current');
                const isRecurring = recurringDtcs.some(r => r.dtc === code);
                return (
                  <tr key={i} style={{ background: isCurrent ? '#fff8f8' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#e91e8c', fontFamily: 'monospace' }}>{code}</td>
                    <td style={tdStyle}>{getCategory(code)}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isCurrent ? '#ffebee' : '#f5f5f5', color: isCurrent ? '#c62828' : '#666' }}>
                        {status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: isCurrent ? '#ffebee' : isRecurring ? '#fff3e0' : '#e8f5e9',
                        color: isCurrent ? '#c62828' : isRecurring ? '#e65100' : '#2e7d32',
                      }}>
                        {isCurrent ? '⚠️ High' : isRecurring ? '🔄 Recurring' : '✅ Low'}
                      </span>
                    </td>
                    <td style={tdStyle}>{d.city || '—'}</td>
                    <td style={tdStyle}>{d.state || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace' }}>{d.occurrencetime || d.timestamp || '—'}</td>
                  </tr>
                );
              })}
              {filteredDtc.length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#bbb', padding: 32 }}>No warranty data for the selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Potential voiding events */}
      {voidingEvents.length > 0 && (
        <>
          <div style={sectionTitle}>⛔ Potential Warranty-Voiding Events</div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              ⚠️ These trips show patterns that <strong>may</strong> void warranty: excessive speed (&gt;160 km/h), &gt;20 harsh events, or single trip &gt;500 km.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Trip Date', 'Distance (km)', 'Max Speed', 'Harsh Events', 'Risk Reason'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {voidingEvents.slice(0, 20).map((d, i) => {
                    const harsh = Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0);
                    const speed = Number(d.max_speed || 0);
                    const dist = Number(d.trip_distance || 0);
                    const reasons = [];
                    if (speed > 160) reasons.push(`Speed ${speed} km/h`);
                    if (harsh > 20) reasons.push(`${harsh} harsh events`);
                    if (dist > 500) reasons.push(`${dist.toFixed(0)} km trip`);
                    return (
                      <tr key={i} style={{ background: '#fff8f8' }}>
                        <td style={tdStyle}>{(d.process_date || '').slice(0, 10)}</td>
                        <td style={tdStyle}>{dist.toFixed(1)}</td>
                        <td style={{ ...tdStyle, color: speed > 160 ? '#c62828' : '#333', fontWeight: speed > 160 ? 700 : 400 }}>{speed.toFixed(0)}</td>
                        <td style={{ ...tdStyle, color: harsh > 20 ? '#c62828' : '#333', fontWeight: harsh > 20 ? 700 : 400 }}>{harsh}</td>
                        <td style={{ ...tdStyle, color: '#c62828', fontWeight: 600 }}>{reasons.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WarrantyDashboard;
