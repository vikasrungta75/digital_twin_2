import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData, fetchOverallKpiData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
const sec: React.CSSProperties  = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };
const two: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
const th: React.CSSProperties   = { background: '#f5f5f5', padding: '9px 12px', textAlign: 'left' as const, fontWeight: 700, color: '#333', borderBottom: '2px solid #eee', fontSize: 11 };
const td: React.CSSProperties   = { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', color: '#444', fontSize: 11 };

const SecurityDashboard: FC = () => {
  const { apiParams } = useDt();
  const [od, setOd]         = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.allSettled([fetchOverallData(apiParams), fetchOverallKpiData(apiParams)]);
      if (a.status === 'fulfilled') setOd(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setKpiData(Array.isArray(b.value) ? b.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const n   = od.length || 1;
  const tot = (k: string) => od.reduce((s, d) => s + Number(d[k] || 0), 0);
  const bl  = kpiData[0] || {};

  // Security computations
  const totalLockEvents     = tot('num_door_lock_events');
  const totalUnlockEvents   = tot('num_door_unlock_events');
  const tripsAllDoorsLocked = od.filter(d => d.all_doors_lock_status === true || d.all_doors_lock_status === 1).length;
  const tripsAllDoorsUnlocked = od.filter(d => d.all_doors_lock_status === false || d.all_doors_lock_status === 0).length;
  const tripsDriverUnlocked = od.filter(d => d.driver_door_lock_status === false || d.driver_door_lock_status === 0).length;
  const tripsPassengerOpen  = od.filter(d => d.passenger_door_switch_status === true || d.passenger_door_switch_status === 1).length;
  const tripsRearOpen       = od.filter(d => d.rear_doors_switch_status === true || d.rear_doors_switch_status === 1).length;
  const tripsDriverOpen     = od.filter(d => d.driver_door_switch_status === true || d.driver_door_switch_status === 1).length;

  const lockComplianceRate  = od.length > 0 ? ((tripsAllDoorsLocked / od.length) * 100) : 100;
  const driverLockRate      = od.length > 0 ? (((od.length - tripsDriverUnlocked) / od.length) * 100) : 100;

  // Security Score (0-100): weighted compliance across all door signals
  const securityScore = Math.max(0, Math.min(100, Math.round(
    lockComplianceRate * 0.5 +
    driverLockRate * 0.3 +
    (od.length > 0 ? ((od.length - tripsPassengerOpen) / od.length * 100) : 100) * 0.2
  )));

  const scoreColor = securityScore >= 80 ? '#2e7d32' : securityScore >= 60 ? '#f9a825' : '#c62828';
  const scoreBg    = securityScore >= 80 ? '#e8f5e9' : securityScore >= 60 ? '#fffde7' : '#ffebee';

  // Per-trip security data
  const rows = od.map(d => ({
    date:           (d.process_date || '').slice(5, 10),
    locks:          Number(d.num_door_lock_events || 0),
    unlocks:        Number(d.num_door_unlock_events || 0),
    allLocked:      d.all_doors_lock_status === true || d.all_doors_lock_status === 1 ? 1 : 0,
    driverUnlocked: d.driver_door_lock_status === false || d.driver_door_lock_status === 0 ? 1 : 0,
    rearOpen:       d.rear_doors_switch_status === true || d.rear_doors_switch_status === 1 ? 1 : 0,
    passengerOpen:  d.passenger_door_switch_status === true || d.passenger_door_switch_status === 1 ? 1 : 0,
  }));

  // Lock vs Unlock trend
  const lockUnlockRows = rows.map(r => ({ date: r.date, locks: r.locks, unlocks: r.unlocks }));

  // Door status breakdown pie
  const doorStatusData = [
    { status: 'All Locked', count: tripsAllDoorsLocked },
    { status: 'Driver Unlocked', count: tripsDriverUnlocked },
    { status: 'Passenger Open', count: tripsPassengerOpen },
    { status: 'Rear Door Open', count: tripsRearOpen },
  ].filter(x => x.count > 0);

  // Insecure parking trips (all doors unlocked at trip end)
  const insecureTrips = od.filter(d =>
    (d.all_doors_lock_status === false || d.all_doors_lock_status === 0) &&
    (d.driver_door_lock_status === false || d.driver_door_lock_status === 0)
  );

  const kpis = [
    { label: 'Security Score',          value: securityScore,                          icon: '🔒', color: scoreColor, unit: '/100', lowerIsBetter: false, description: 'Composite score: door lock compliance across all trips' },
    { label: 'Lock Compliance Rate',    value: lockComplianceRate.toFixed(1),          icon: '✅', color: '#42a5f5', unit: '%',    lowerIsBetter: false, description: 'Trips where all doors were locked — target: 100%' },
    { label: 'Unsecured Parking Events',value: tripsAllDoorsUnlocked,                  icon: '🚨', color: '#ef5350', unit: 'trips',lowerIsBetter: true,  description: 'Trips ended with all doors unlocked — theft risk' },
    { label: 'Driver Door Unlocked',    value: tripsDriverUnlocked,                    icon: '🚪', color: '#ffa726', unit: 'trips',lowerIsBetter: true },
    { label: 'Passenger Door Open',     value: tripsPassengerOpen,                     icon: '🚪', color: '#ab47bc', unit: 'trips',lowerIsBetter: false, description: 'Trips with passenger door switch open — indicates usage' },
    { label: 'Rear Door Open Events',   value: tripsRearOpen,                          icon: '📦', color: '#5c6bc0', unit: 'trips',lowerIsBetter: false, description: 'Boot/cargo door open events per trip' },
    { label: 'Driver Door Open Events', value: tripsDriverOpen,                        icon: '🔓', color: '#26c6da', unit: 'trips',lowerIsBetter: false },
    { label: 'Total Lock Events',       value: totalLockEvents, baseline: Number(bl.bsline_num_door_lock_events || 0) || null,   icon: '🔐', color: '#66bb6a', unit: '', lowerIsBetter: false },
    { label: 'Total Unlock Events',     value: totalUnlockEvents, baseline: Number(bl.bsline_num_door_unlock_events || 0) || null,icon: '🔓', color: '#ff7043', unit: '', lowerIsBetter: false },
    { label: 'Driver Lock Rate',        value: driverLockRate.toFixed(1),              icon: '👤', color: '#4caf50', unit: '%',   lowerIsBetter: false, description: 'Trips where driver door was locked — driver discipline metric' },
    { label: 'Insecure Parking Trips',  value: insecureTrips.length,                   icon: '⚠️', color: '#f44336', unit: 'trips',lowerIsBetter: true, description: 'All-door-unlocked at trip end — escalate if > 0' },
    { label: 'Total Trips Analysed',    value: od.length,                              icon: '🚗', color: '#78909c', unit: '', lowerIsBetter: false },
  ];

  return (
    <div style={page} id="dt-page-content">
      <h1 style={{ color: '#e91e8c', fontWeight: 900, fontSize: 26, marginBottom: 20, letterSpacing: 1 }}>
        🔒 Vehicle Security & Access Intelligence
      </h1>
      <DateFilterBar title="Security Analysis" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#aaa' }}>Loading security data…</div>}

      {/* Security Score Hero */}
      <div style={{ background: scoreBg, border: `2px solid ${scoreColor}`, borderRadius: 16, padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor }}>{securityScore}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>SECURITY SCORE</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111', marginBottom: 6 }}>
            {securityScore >= 80 ? '✅ Good — Vehicle well secured' : securityScore >= 60 ? '⚠️ Monitor — Some unsecured events detected' : '🚨 Alert — Frequent unsecured parking detected'}
          </div>
          <div style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>
            Lock compliance: <strong>{lockComplianceRate.toFixed(1)}%</strong> &nbsp;|&nbsp;
            Insecure trips: <strong>{insecureTrips.length}</strong> &nbsp;|&nbsp;
            Total trips: <strong>{od.length}</strong>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {insecureTrips.length > 0 && (
        <div style={{ background: '#ffebee', border: '2px solid #ef9a9a', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 800, color: '#c62828', fontSize: 14 }}>{insecureTrips.length} INSECURE PARKING EVENT(S) DETECTED</div>
            <div style={{ fontSize: 13, color: '#555' }}>Vehicle was left with all doors unlocked at trip end — check dates below and review with driver.</div>
          </div>
        </div>
      )}

      <div style={sec}>🔐 Security KPIs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      <div style={sec}>📈 Lock / Unlock Activity Trend</div>
      <div style={two}>
        <ChartCard title="Door Lock vs Unlock Events per Trip" data={lockUnlockRows} type="multibar" xKey="date"
          series={[{ key: 'locks', color: '#66bb6a', name: 'Lock Events' }, { key: 'unlocks', color: '#ef5350', name: 'Unlock Events' }]}
          height={240} description="High unlock-to-lock ratio may indicate incomplete locking behaviour" />
        <ChartCard title="Door Status — Category Breakdown" data={doorStatusData} type="bar" xKey="status"
          series={[{ key: 'count', color: '#42a5f5', name: 'Trips' }]}
          height={240} description="Count of trips per door security status category" />
      </div>

      <div style={sec}>🚪 Per-Trip Door Security Flags</div>
      <div style={two}>
        <ChartCard title="Unsecured End-of-Trip Events (All Doors)" data={rows} type="bar" xKey="date"
          series={[{ key: 'allLocked', color: '#66bb6a', name: 'All Locked (1=yes)' }]}
          benchmark={1} benchmarkLabel="Target: always locked" height={240} />
        <ChartCard title="Rear Door (Boot) Open Events per Trip" data={rows} type="bar" xKey="date"
          series={[{ key: 'rearOpen', color: '#5c6bc0', name: 'Rear Door Open' }]}
          height={240} description="Boot open events — useful for detecting delivery or cargo usage patterns" />
      </div>

      {/* Insecure Trips Table */}
      {insecureTrips.length > 0 && (
        <>
          <div style={sec}>🚨 Insecure Parking Trip Log</div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Trip ID', 'Distance (km)', 'All Doors Locked', 'Driver Lock', 'Action'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insecureTrips.slice(0, 20).map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}>{d.process_date || '—'}</td>
                    <td style={td}>{(d.trip_id || '—').slice(-8)}</td>
                    <td style={td}>{Number(d.trip_distance || 0).toFixed(1)}</td>
                    <td style={{ ...td, color: '#c62828', fontWeight: 700 }}>❌ No</td>
                    <td style={{ ...td, color: '#c62828', fontWeight: 700 }}>
                      {d.driver_door_lock_status === false || d.driver_door_lock_status === 0 ? '❌ Unlocked' : '✅ Locked'}
                    </td>
                    <td style={td}><span style={{ background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>REVIEW</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SecurityDashboard;
