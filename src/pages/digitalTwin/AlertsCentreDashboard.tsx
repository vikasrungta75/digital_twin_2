import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import {
  fetchOverallData, fetchDtcInfo, fetchFuelEvents, fetchOverallKpiData,
} from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';

const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
const sec: React.CSSProperties  = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };

type Severity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  date?: string;
  value?: string | number;
  warrantyImpact: boolean;
}

const SEV_COLOR: Record<Severity, string> = { critical: '#c62828', warning: '#e65100', info: '#1565c0' };
const SEV_BG: Record<Severity, string>    = { critical: '#ffebee', warning: '#fff3e0', info: '#e3f2fd' };
const SEV_ICON: Record<Severity, string>  = { critical: '🔴', warning: '🟡', info: '🔵' };
const SEV_LABEL: Record<Severity, string> = { critical: 'CRITICAL', warning: 'WARNING', info: 'INFO' };

const AlertsCentreDashboard: FC = () => {
  const { apiParams } = useDt();
  const [od, setOd]           = useState<any[]>([]);
  const [dtcInfo, setDtcInfo] = useState<any[]>([]);
  const [fuelEvents, setFe]   = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSev, setFilterSev] = useState<Severity | 'all'>('all');
  const [filterCat, setFilterCat] = useState('all');
  const [trigger, setTrigger]     = useState(0);

  // User-configurable thresholds
  const [thresholds, setThresholds] = useState({
    maxSpeedKmh:     160,
    harshPer100:     5,
    overspeeding:    3,
    lowFuelEvents:   2,
    idleHrsPerDay:   1,
    batBelowEvents:  2,
    dtcCurrentLimit: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c, d] = await Promise.allSettled([
        fetchOverallData(apiParams),
        fetchDtcInfo(apiParams),
        fetchFuelEvents(apiParams),
        fetchOverallKpiData(apiParams),
      ]);
      if (a.status === 'fulfilled') setOd(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setDtcInfo(Array.isArray(b.value) ? b.value : []);
      if (c.status === 'fulfilled') setFe(Array.isArray(c.value) ? c.value : []);
      if (d.status === 'fulfilled') setKpiData(Array.isArray(d.value) ? d.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Alert Generation Engine ──────────────────────────────────────────────────
  const buildAlerts = (): Alert[] => {
    const alerts: Alert[] = [];
    let idx = 0;
    const add = (a: Omit<Alert, 'id'>) => alerts.push({ id: String(idx++), ...a });

    // FUEL EVENTS
    const totalAdult  = fuelEvents.reduce((s, d) => s + Number(d.fueladulteration || 0), 0);
    const totalDrain  = fuelEvents.reduce((s, d) => s + Number(d.emptying_detected || 0), 0);
    const totalFill   = fuelEvents.reduce((s, d) => s + Number(d.filling_detected || 0), 0);

    if (totalAdult > 0)
      add({ severity: 'critical', category: 'Fuel', warrantyImpact: true,
        title: `Fuel Adulteration Detected — ${totalAdult} event(s)`,
        detail: 'Fuel quality compromised. Document for warranty claim. Check fuel source and supplier.',
        value: totalAdult });

    // OVERALL DATA ALERTS
    const odoResets   = od.reduce((s, d) => s + Number(d.odometerresetcount || 0), 0);
    const maxSpeed    = Math.max(...od.map(d => Number(d.max_speed || 0)), 0);
    const totalBatLo  = od.reduce((s, d) => s + Number(d.bat_below_9v || 0), 0);
    const totalBatHi  = od.reduce((s, d) => s + Number(d.bat_above_15v || 0), 0);
    const totalDist   = od.reduce((s, d) => s + Number(d.trip_distance || 0), 0);
    const totalHarsh  = od.reduce((s, d) => s + Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0), 0);
    const harshPer100 = totalDist > 0 ? (totalHarsh / (totalDist / 100)) : 0;
    const totalOver   = od.reduce((s, d) => s + Number(d.overspeeding_count || 0), 0);
    const totalIdleHr = od.reduce((s, d) => s + Number(d.idle_time || 0), 0) / 3600;
    const totalLowFuel= od.reduce((s, d) => s + Number(d.fuel_less_than_20per || 0), 0);
    const insecure    = od.filter(d => d.all_doors_lock_status === false || d.all_doors_lock_status === 0).length;
    const unclassified= od.reduce((s, d) => s + Number(d.unclassified || 0), 0);
    const avgFuelEff  = od.length > 0 ? od.reduce((s, d) => s + Number(d.fuel_efficiency || 0), 0) / od.length : 0;
    const avgGsm      = od.length > 0 ? od.reduce((s, d) => s + Number(d.gsm_strength_per || 0), 0) / od.length : 0;

    if (odoResets > 0)
      add({ severity: 'critical', category: 'Warranty', warrantyImpact: true,
        title: `Odometer Reset Detected — ${odoResets} reset(s)`,
        detail: 'Potential tampering. Warranty may be voided. Escalate for investigation immediately.',
        value: odoResets });

    if (maxSpeed > thresholds.maxSpeedKmh)
      add({ severity: 'critical', category: 'Safety', warrantyImpact: true,
        title: `Max Speed Exceeded ${thresholds.maxSpeedKmh} km/h`,
        detail: `Peak speed recorded: ${maxSpeed.toFixed(1)} km/h. This is a warranty-voiding event per most OEM policies.`,
        value: `${maxSpeed.toFixed(1)} km/h` });

    if (totalDrain > 0)
      add({ severity: 'critical', category: 'Fuel', warrantyImpact: false,
        title: `Abnormal Fuel Drain — ${totalDrain} event(s)`,
        detail: 'Possible fuel theft / siphoning detected. Review trip-level fuel data.',
        value: totalDrain });

    if (totalBatLo > thresholds.batBelowEvents)
      add({ severity: 'warning', category: 'Battery', warrantyImpact: false,
        title: `Battery Below 9V — ${totalBatLo} events`,
        detail: 'Under-voltage events detected. Risk of electrical damage. Check battery and charging system.',
        value: totalBatLo });

    if (totalBatHi > 0)
      add({ severity: 'warning', category: 'Battery', warrantyImpact: false,
        title: `Battery Above 15V — ${totalBatHi} events`,
        detail: 'Over-voltage / overcharge detected. Check alternator voltage regulator.',
        value: totalBatHi });

    if (harshPer100 > thresholds.harshPer100)
      add({ severity: 'warning', category: 'Driving', warrantyImpact: false,
        title: `High Harsh Event Rate — ${harshPer100.toFixed(1)} events/100km`,
        detail: 'Aggressive driving pattern detected. Driver coaching recommended. Impacts brake and tyre life.',
        value: `${harshPer100.toFixed(1)}/100km` });

    if (totalOver > thresholds.overspeeding)
      add({ severity: 'warning', category: 'Speed', warrantyImpact: true,
        title: `Repeated Overspeeding — ${totalOver} events`,
        detail: 'Multiple speed limit exceedances. Key warranty and insurance risk factor.',
        value: totalOver });

    if (totalLowFuel > thresholds.lowFuelEvents)
      add({ severity: 'warning', category: 'Fuel', warrantyImpact: false,
        title: `Frequent Low Fuel Events — ${totalLowFuel} occurrences`,
        detail: 'Running below 20% fuel regularly accelerates fuel pump wear and risks fuel starvation.',
        value: totalLowFuel });

    if (totalIdleHr > thresholds.idleHrsPerDay * od.length)
      add({ severity: 'warning', category: 'Fuel', warrantyImpact: false,
        title: `Excessive Idle Time — ${totalIdleHr.toFixed(1)} hours total`,
        detail: `Average ${(totalIdleHr / Math.max(od.length, 1)).toFixed(1)} hrs/trip idle. Target: < ${thresholds.idleHrsPerDay}h/trip. Review route and driver habits.`,
        value: `${totalIdleHr.toFixed(1)} hrs` });

    if (insecure > 0)
      add({ severity: 'warning', category: 'Security', warrantyImpact: false,
        title: `Unsecured Parking — ${insecure} trip(s)`,
        detail: 'Vehicle left with unlocked doors at trip end. Theft risk — remind driver to lock vehicle.',
        value: insecure });

    if (avgGsm < 40 && od.length > 0)
      add({ severity: 'warning', category: 'Connectivity', warrantyImpact: false,
        title: `Low GSM Signal — ${avgGsm.toFixed(0)}% average`,
        detail: 'Poor telematics connectivity may result in incomplete data capture for this vehicle.',
        value: `${avgGsm.toFixed(0)}%` });

    if (unclassified > 0)
      add({ severity: 'info', category: 'Data Quality', warrantyImpact: false,
        title: `Unclassified Engine Events — ${unclassified}`,
        detail: 'ECU reporting events the platform cannot classify. May indicate firmware mismatch or sensor issue.',
        value: unclassified });

    if (totalFill > 0)
      add({ severity: 'info', category: 'Fuel', warrantyImpact: false,
        title: `Fuel Fill Events Detected — ${totalFill}`,
        detail: 'Normal refuelling events detected. Useful for cross-referencing fuel receipts.',
        value: totalFill });

    if (avgFuelEff > 0 && avgFuelEff < 10)
      add({ severity: 'warning', category: 'Fuel', warrantyImpact: false,
        title: `Low Fuel Efficiency — ${avgFuelEff.toFixed(2)} km/l average`,
        detail: 'Below typical threshold of 10 km/l. Check driving behaviour, tyre pressure, and engine health.',
        value: `${avgFuelEff.toFixed(2)} km/l` });

    // DTC ALERTS
    const currentDtc = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current'));
    if (currentDtc.length >= thresholds.dtcCurrentLimit)
      add({ severity: 'critical', category: 'DTC', warrantyImpact: true,
        title: `${currentDtc.length} Active Fault Code(s) — Immediate Attention Required`,
        detail: `Active DTCs: ${currentDtc.slice(0, 5).map(d => d.diagnosticinfo_data_dtc).join(', ')}${currentDtc.length > 5 ? ` (+${currentDtc.length - 5} more)` : ''}. Vehicle requires service.`,
        value: currentDtc.length });

    const criticalDtcs = dtcInfo.filter(d => { const c = (d.diagnosticinfo_data_dtc || '').toUpperCase(); return c.startsWith('P03') || c.startsWith('U0'); });
    if (criticalDtcs.length > 0)
      add({ severity: 'critical', category: 'DTC', warrantyImpact: true,
        title: `Critical DTC Category Detected`,
        detail: `Codes: ${criticalDtcs.slice(0, 3).map(d => d.diagnosticinfo_data_dtc).join(', ')} — Misfire or CAN communication fault. Escalate immediately.`,
        value: criticalDtcs.length });

    return alerts.sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  };

  const allAlerts  = buildAlerts();
  const categories = Array.from(new Set(allAlerts.map(a => a.category)));
  const filtered   = allAlerts.filter(a =>
    (filterSev === 'all' || a.severity === filterSev) &&
    (filterCat === 'all' || a.category === filterCat)
  );

  const critCount    = allAlerts.filter(a => a.severity === 'critical').length;
  const warnCount    = allAlerts.filter(a => a.severity === 'warning').length;
  const infoCount    = allAlerts.filter(a => a.severity === 'info').length;
  const warrantyCount= allAlerts.filter(a => a.warrantyImpact).length;

  const exportAlerts = () => {
    const csv = [
      ['Severity', 'Category', 'Title', 'Detail', 'Value', 'Warranty Impact'],
      ...allAlerts.map(a => [a.severity, a.category, a.title, a.detail, String(a.value || ''), a.warrantyImpact ? 'Yes' : 'No']),
    ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.download = `alerts_${apiParams.vin}_${apiParams.startdate}_${apiParams.enddate}.csv`;
    a.href = url; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={page} id="dt-page-content">
      <h1 style={{ color: '#e91e8c', fontWeight: 900, fontSize: 26, marginBottom: 20, letterSpacing: 1 }}>
        🔔 Alerts & Notifications Centre
      </h1>
      <DateFilterBar title="Alerts Centre" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#aaa' }}>Analysing vehicle data…</div>}

      {/* Summary Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Critical', count: critCount,    bg: '#ffebee', color: '#c62828', icon: '🔴' },
          { label: 'Warning',  count: warnCount,    bg: '#fff3e0', color: '#e65100', icon: '🟡' },
          { label: 'Info',     count: infoCount,    bg: '#e3f2fd', color: '#1565c0', icon: '🔵' },
          { label: 'Warranty Risk', count: warrantyCount, bg: '#fce4ec', color: '#880e4f', icon: '🛡️' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 18px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setFilterSev(s.label === 'Warranty Risk' ? 'all' : s.label.toLowerCase() as Severity)}>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.icon} {s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#333' }}>Filter:</div>
        {(['all', 'critical', 'warning', 'info'] as const).map(s => (
          <button key={s} onClick={() => setFilterSev(s)}
            style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: filterSev === s ? '#e91e8c' : '#f0f0f0', color: filterSev === s ? '#fff' : '#444' }}>
            {s === 'all' ? 'All Severities' : `${SEV_ICON[s]} ${SEV_LABEL[s]}`}
          </button>
        ))}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '5px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12 }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={exportAlerts} style={{ marginLeft: 'auto', padding: '6px 16px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          📥 Export CSV
        </button>
      </div>

      {/* Alert Feed */}
      <div style={sec}>
        {filtered.length} ALERT{filtered.length !== 1 ? 'S' : ''} {filterSev !== 'all' ? `— ${filterSev.toUpperCase()}` : ''} {filterCat !== 'all' ? `— ${filterCat}` : ''}
      </div>
      {filtered.length === 0 && (
        <div style={{ background: '#e8f5e9', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#2e7d32', fontWeight: 700 }}>
          ✅ No alerts match your current filter criteria.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(a => (
          <div key={a.id} style={{ background: SEV_BG[a.severity], border: `1.5px solid ${SEV_COLOR[a.severity]}33`, borderLeft: `4px solid ${SEV_COLOR[a.severity]}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{SEV_ICON[a.severity]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ background: SEV_COLOR[a.severity], color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{SEV_LABEL[a.severity]}</span>
                <span style={{ background: '#f0f0f0', color: '#444', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{a.category}</span>
                {a.warrantyImpact && <span style={{ background: '#fce4ec', color: '#880e4f', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>🛡️ WARRANTY RISK</span>}
                {a.value !== undefined && <span style={{ marginLeft: 'auto', fontWeight: 800, color: SEV_COLOR[a.severity], fontSize: 13 }}>{a.value}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{a.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold Configuration */}
      <div style={{ marginTop: 28 }}>
        <div style={sec}>⚙️ Configure Alert Thresholds</div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {[
              { key: 'maxSpeedKmh',     label: 'Max Speed Alert (km/h)',       step: 10 },
              { key: 'harshPer100',     label: 'Harsh Events/100km Alert',     step: 1  },
              { key: 'overspeeding',    label: 'Overspeeding Count Alert',     step: 1  },
              { key: 'lowFuelEvents',   label: 'Low Fuel Events Alert',        step: 1  },
              { key: 'idleHrsPerDay',   label: 'Idle Hours/Trip Alert (hrs)',  step: 0.5},
              { key: 'batBelowEvents',  label: 'Battery <9V Events Alert',     step: 1  },
              { key: 'dtcCurrentLimit', label: 'Active DTC Count Alert',       step: 1  },
            ].map(({ key, label, step }) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: '#444' }}>{label}</span>
                <input type="number" value={(thresholds as any)[key]} step={step} min={0}
                  onChange={e => setThresholds(p => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontWeight: 700 }} />
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 12 }}>
            Changes take effect immediately and regenerate all alerts above.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsCentreDashboard;
