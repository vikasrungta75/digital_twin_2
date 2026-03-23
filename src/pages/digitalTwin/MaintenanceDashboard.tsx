import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData, fetchDtcInfo, fetchDtcOccurrence } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const pageStyle: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' as const };
const sectionTitle: React.CSSProperties = {
  color: '#e91e8c', fontWeight: 800, fontSize: 16, marginBottom: 16,
  textTransform: 'uppercase', letterSpacing: 0.5,
  borderLeft: '4px solid #e91e8c', paddingLeft: 12,
};
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 };

interface ComponentHealth {
  name: string;
  health: number;
  status: 'Good' | 'Monitor' | 'Alert' | 'Critical';
  nextService: string;
  icon: string;
  details: string;
}

const getStatus = (h: number): ComponentHealth['status'] =>
  h >= 80 ? 'Good' : h >= 60 ? 'Monitor' : h >= 40 ? 'Alert' : 'Critical';

const statusColor: Record<string, string> = {
  Good: '#2e7d32', Monitor: '#f9a825', Alert: '#e65100', Critical: '#c62828',
};
const statusBg: Record<string, string> = {
  Good: '#e8f5e9', Monitor: '#fffde7', Alert: '#fff3e0', Critical: '#ffebee',
};

const HealthBar: FC<{ value: number; label: string }> = ({ value, label }) => {
  const color = value >= 80 ? '#66bb6a' : value >= 60 ? '#ffa726' : value >= 40 ? '#ff7043' : '#ef5350';
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: '#555' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`, height: '100%',
          background: `linear-gradient(90deg,${color}aa,${color})`,
          borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
};

const MaintenanceDashboard: FC = () => {
  const { apiParams } = useDt();
  const [overallData, setOverallData] = useState<any[]>([]);
  const [dtcInfo, setDtcInfo] = useState<any[]>([]);
  const [dtcOcc, setDtcOcc] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, dRes, occRes] = await Promise.allSettled([
        fetchOverallData(apiParams),
        fetchDtcInfo(apiParams),
        fetchDtcOccurrence(apiParams),
      ]);
      if (oRes.status === 'fulfilled') setOverallData(Array.isArray(oRes.value) ? oRes.value : []);
      if (dRes.status === 'fulfilled') setDtcInfo(Array.isArray(dRes.value) ? dRes.value : []);
      if (occRes.status === 'fulfilled') setDtcOcc(Array.isArray(occRes.value) ? occRes.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Compute component health scores from telemetry
  const totalDistance = overallData.reduce((s, d) => s + Number(d.trip_distance || 0), 0);
  const totalHarshBrk = overallData.reduce((s, d) => s + Number(d.harsh_brk_count || 0), 0);
  const totalHarshAcc = overallData.reduce((s, d) => s + Number(d.harsh_acc_count || 0), 0);
  const totalHarshTurn = overallData.reduce((s, d) => s + Number(d.harsh_turn_count || 0), 0);
  const totalEngHrs = overallData.reduce((s, d) => s + Number(d.engine_on_time || 0) / 3600, 0);
  const totalOverspeeding = overallData.reduce((s, d) => s + Number(d.overspeeding_count || 0), 0);
  const totalBatBelow9 = overallData.reduce((s, d) => s + Number(d.bat_below_9v || 0), 0);
  const totalBatAbove15 = overallData.reduce((s, d) => s + Number(d.bat_above_15v || 0), 0);
  const totalIdleHrs = overallData.reduce((s, d) => s + Number(d.idle_time || 0) / 3600, 0);
  const totalFuelLow = overallData.reduce((s, d) => s + Number(d.fuel_less_than_20per || 0), 0);
  const dtcCount = dtcInfo.length;
  const currentDtc = dtcInfo.filter(d => (d.diagnosticinfo_data_status || '').toLowerCase().includes('current')).length;

  // Health scoring model (100 = perfect, decremented by risk factors)
  const brakeHealth = Math.max(10, 100 - Math.min(80, totalHarshBrk * 1.2 + totalDistance / 1000 * 2));
  const tyreSuspensionHealth = Math.max(10, 100 - Math.min(80, (totalHarshTurn + totalHarshAcc) * 0.8 + totalOverspeeding * 0.5));
  const engineHealth = Math.max(10, 100 - Math.min(80, totalIdleHrs * 2 + currentDtc * 5 + dtcCount * 0.5));
  const batteryHealth = Math.max(10, 100 - Math.min(80, totalBatBelow9 * 8 + totalBatAbove15 * 4));
  const fuelSystemHealth = Math.max(10, 100 - Math.min(80, totalFuelLow * 3 + dtcInfo.filter(d => (d.diagnosticinfo_data_dtc || '').startsWith('P01')).length * 5));
  const transmissionHealth = Math.max(10, 100 - Math.min(80, dtcInfo.filter(d => (d.diagnosticinfo_data_dtc || '').startsWith('P07')).length * 10 + totalHarshAcc * 0.5));
  const exhaustEmissionHealth = Math.max(10, 100 - Math.min(80, dtcInfo.filter(d => (d.diagnosticinfo_data_dtc || '').startsWith('P04')).length * 8));
  const overallHealth = Math.round((brakeHealth + tyreSuspensionHealth + engineHealth + batteryHealth + fuelSystemHealth + transmissionHealth + exhaustEmissionHealth) / 7);

  const components: ComponentHealth[] = [
    {
      name: 'Engine & Ignition', health: Math.round(engineHealth), icon: '⚙️',
      status: getStatus(engineHealth),
      nextService: engineHealth < 60 ? 'Immediate' : engineHealth < 80 ? 'Within 30 days' : 'Scheduled',
      details: `${currentDtc} active faults, ${totalIdleHrs.toFixed(1)} hrs idle. ${engineHealth < 60 ? 'Schedule engine inspection.' : 'Monitor ECU DTCs.'}`,
    },
    {
      name: 'Brake System', health: Math.round(brakeHealth), icon: '🛑',
      status: getStatus(brakeHealth),
      nextService: brakeHealth < 60 ? 'Immediate' : brakeHealth < 80 ? 'Within 15 days' : 'Scheduled',
      details: `${totalHarshBrk} harsh braking events. ${brakeHealth < 60 ? 'Brake pad inspection required.' : 'Normal wear pattern.'}`,
    },
    {
      name: 'Tyres & Suspension', health: Math.round(tyreSuspensionHealth), icon: '🔵',
      status: getStatus(tyreSuspensionHealth),
      nextService: tyreSuspensionHealth < 70 ? 'Within 30 days' : 'Scheduled',
      details: `${totalHarshTurn} harsh turns, ${totalHarshAcc} harsh acc events. ${tyreSuspensionHealth < 70 ? 'Alignment check recommended.' : 'Within tolerance.'}`,
    },
    {
      name: 'Battery & Electrical', health: Math.round(batteryHealth), icon: '🔋',
      status: getStatus(batteryHealth),
      nextService: batteryHealth < 50 ? 'Immediate' : batteryHealth < 70 ? 'Within 7 days' : 'Scheduled',
      details: `${totalBatBelow9} under-voltage events, ${totalBatAbove15} overcharge events. ${batteryHealth < 50 ? 'Battery replacement likely needed.' : 'Monitor voltage trend.'}`,
    },
    {
      name: 'Fuel System', health: Math.round(fuelSystemHealth), icon: '⛽',
      status: getStatus(fuelSystemHealth),
      nextService: fuelSystemHealth < 60 ? 'Within 15 days' : 'Scheduled',
      details: `${totalFuelLow} low-fuel events. ${fuelSystemHealth < 60 ? 'Injector/fuel pump inspection advised.' : 'Normal operation.'}`,
    },
    {
      name: 'Transmission', health: Math.round(transmissionHealth), icon: '⚙️',
      status: getStatus(transmissionHealth),
      nextService: transmissionHealth < 60 ? 'Immediate' : 'Scheduled',
      details: `${dtcInfo.filter(d => (d.diagnosticinfo_data_dtc || '').startsWith('P07')).length} transmission DTCs. ${transmissionHealth < 60 ? 'Gearbox service required.' : 'OK.'}`,
    },
    {
      name: 'Exhaust & Emission', health: Math.round(exhaustEmissionHealth), icon: '💨',
      status: getStatus(exhaustEmissionHealth),
      nextService: exhaustEmissionHealth < 70 ? 'Within 30 days' : 'Scheduled',
      details: `${dtcInfo.filter(d => (d.diagnosticinfo_data_dtc || '').startsWith('P04')).length} emission DTCs. ${exhaustEmissionHealth < 70 ? 'Catalytic converter / EGR check advised.' : 'Within BS6 norms.'}`,
    },
  ];

  // Service urgency data for chart
  const urgencyData = [
    { category: 'Immediate (<7 days)', count: components.filter(c => c.nextService === 'Immediate').length },
    { category: 'Within 30 days', count: components.filter(c => c.nextService.includes('30') || c.nextService.includes('15')).length },
    { category: 'Scheduled', count: components.filter(c => c.nextService === 'Scheduled').length },
  ];

  // Health trend over time (simulated from overall data)
  const healthTrend = overallData.slice(-30).map((d, i, arr) => {
    const slice = arr.slice(0, i + 1);
    const harshTotal = slice.reduce((s, x) => s + Number(x.harsh_brk_count || 0) + Number(x.harsh_acc_count || 0) + Number(x.harsh_turn_count || 0), 0);
    const dtcTotal = slice.length * 0.1; // proxy
    const score = Math.max(20, 100 - harshTotal * 0.3 - dtcTotal);
    return { date: (d.process_date || '').slice(5, 10), score: parseFloat(Math.min(100, score).toFixed(1)) };
  });

  const componentHealthData = components.map(c => ({ component: c.name.split(' ')[0], health: c.health }));

  const maintenanceKpis = [
    { label: 'Overall Health Score', value: overallHealth, icon: '🏥', color: overallHealth > 70 ? '#66bb6a' : overallHealth > 50 ? '#ffa726' : '#ef5350', unit: '/100', lowerIsBetter: false, description: 'Composite health index across all vehicle systems' },
    { label: 'Total Distance', value: totalDistance.toFixed(0), icon: '📍', color: '#42a5f5', unit: 'km', lowerIsBetter: false },
    { label: 'Engine Hours', value: totalEngHrs.toFixed(1), icon: '⏱️', color: '#ffa726', unit: 'hrs', lowerIsBetter: false },
    { label: 'Active Faults', value: currentDtc, icon: '🔴', color: '#f44336', unit: '', lowerIsBetter: true, description: 'DTCs with Current status requiring immediate attention' },
    { label: 'Components at Risk', value: components.filter(c => c.status === 'Alert' || c.status === 'Critical').length, icon: '⚠️', color: '#ff9800', unit: '', lowerIsBetter: true },
    { label: 'Harsh Events Total', value: totalHarshBrk + totalHarshAcc + totalHarshTurn, icon: '💥', color: '#e91e8c', unit: '', lowerIsBetter: true },
  ];

  return (
    <div style={pageStyle} id="dt-page-content">
      <DateFilterBar title="Maintenance & Predictive Health" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Analysing vehicle health…</div>}

      {/* Summary KPIs */}
      <div style={sectionTitle}>🏥 Health Summary</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 24 }}>
        {maintenanceKpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      {/* Component Health Cards */}
      <div style={sectionTitle}>🔧 Component Health Status</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {components.map((c) => (
          <div key={c.name} style={{
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            borderLeft: `4px solid ${statusColor[c.status]}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: statusBg[c.status], color: statusColor[c.status],
              }}>
                {c.status === 'Critical' ? '🔴' : c.status === 'Alert' ? '🟠' : c.status === 'Monitor' ? '🟡' : '🟢'} {c.status}
              </span>
            </div>

            <HealthBar value={c.health} label={`Health: ${c.health}%`} />

            <div style={{ marginTop: 10, fontSize: 12, color: '#555', lineHeight: 1.5 }}>{c.details}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#888' }}>Next Service:</span>
              <span style={{ fontWeight: 700, color: statusColor[c.status] }}>{c.nextService}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={sectionTitle}>📊 Health Analytics</div>
      <div style={twoCol}>
        <ChartCard
          title="Component Health Scores"
          data={componentHealthData}
          type="bar"
          xKey="component"
          series={[{ key: 'health', color: '#42a5f5', name: 'Health %' }]}
          benchmark={70}
          benchmarkLabel="Min threshold 70%"
          unit="%"
          description="Health scores per vehicle system — below 70% requires action"
        />
        <ChartCard
          title="Service Urgency Distribution"
          data={urgencyData}
          type="pie"
          xKey="category"
          series={[{ key: 'count', color: '#e91e8c' }]}
          description="How urgent are the maintenance needs across all components"
        />
      </div>

      {healthTrend.length > 0 && (
        <ChartCard
          title="Vehicle Health Score Trend"
          data={healthTrend}
          type="area"
          xKey="date"
          series={[{ key: 'score', color: '#66bb6a', name: 'Health Score' }]}
          unit="/100"
          benchmark={70}
          benchmarkLabel="Minimum acceptable"
          height={280}
          description="Declining health score trend indicates accelerating degradation — trigger preventive maintenance"
        />
      )}
      <div style={{ height: 16 }} />

      {/* Maintenance Schedule Table */}
      <div style={sectionTitle}>📅 Recommended Maintenance Schedule</div>
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['System', 'Health', 'Status', 'Priority', 'Recommended Action', 'Timeline'].map(h => (
                <th key={h} style={{ background: '#f5f5f5', padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#333', borderBottom: '2px solid #eee', fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...components].sort((a, b) => a.health - b.health).map((c, i) => (
              <tr key={c.name} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                  {c.icon} {c.name}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                  <HealthBar value={c.health} label="" />
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusBg[c.status], color: statusColor[c.status] }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, color: statusColor[c.status] }}>
                  {c.status === 'Critical' ? '🔴 Critical' : c.status === 'Alert' ? '🟠 High' : c.status === 'Monitor' ? '🟡 Medium' : '🟢 Low'}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555' }}>
                  {c.details}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: statusColor[c.status] }}>
                  {c.nextService}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
