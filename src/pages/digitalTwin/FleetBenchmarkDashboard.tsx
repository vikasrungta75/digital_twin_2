import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import {
  fetchOverallData, fetchOverallKpiData, fetchSummaryBaselineTile,
  fetchV2VAcTempDistribution, fetchV2VRightTurnPercent, fetchV2VFuelEvent,
  fetchVinFilter,
} from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import PageHeader, { ICON_PATHS } from './PageHeader';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
const sec: React.CSSProperties  = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };
const two: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
const th: React.CSSProperties   = { background: '#f5f5f5', padding: '9px 12px', textAlign: 'left' as const, fontWeight: 700, color: '#333', borderBottom: '2px solid #eee', fontSize: 11 };
const td: React.CSSProperties   = { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', color: '#444', fontSize: 11 };

type MetricStatus = 'better' | 'worse' | 'similar';

const FleetBenchmarkDashboard: FC = () => {
  const { vin, apiParams, vinList } = useDt();
  const [od, setOd]                 = useState<any[]>([]);
  const [kpiData, setKpiData]       = useState<any[]>([]);
  const [baseline, setBaseline]     = useState<any>(null);
  const [v2vAc, setV2vAc]           = useState<any[]>([]);
  const [v2vTurn, setV2vTurn]       = useState<any[]>([]);
  const [v2vFuel, setV2vFuel]       = useState<any[]>([]);
  const [peerVin, setPeerVin]       = useState<string>('');
  const [availableVins, setAvailableVins] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [trigger, setTrigger]       = useState(0);

  // Load available VINs for peer selection
  useEffect(() => {
    fetchVinFilter().then(data => {
      const list = data.map((v: any) => v._id || v.vin || String(v)).filter(Boolean);
      setAvailableVins(list);
      // Auto-select a peer that isn't the current VIN
      const peer = list.find((v: string) => v !== vin);
      if (peer && !peerVin) setPeerVin(peer);
    }).catch(() => {});
  }, [vin]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const v2vParams = { ...apiParams, vin1: peerVin || vin };
      const [a, b, c, d, e, f] = await Promise.allSettled([
        fetchOverallData(apiParams),
        fetchOverallKpiData(apiParams),
        fetchSummaryBaselineTile(apiParams),
        peerVin ? fetchV2VAcTempDistribution(v2vParams as any) : Promise.resolve([]),
        peerVin ? fetchV2VRightTurnPercent(v2vParams as any) : Promise.resolve([]),
        peerVin ? fetchV2VFuelEvent(v2vParams as any) : Promise.resolve([]),
      ]);
      if (a.status === 'fulfilled') setOd(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setKpiData(Array.isArray(b.value) ? b.value : []);
      if (c.status === 'fulfilled') { const v = Array.isArray(c.value) ? c.value[0] : c.value; setBaseline(v || null); }
      if (d.status === 'fulfilled') setV2vAc(Array.isArray(d.value) ? d.value : []);
      if (e.status === 'fulfilled') setV2vTurn(Array.isArray(e.value) ? e.value : []);
      if (f.status === 'fulfilled') setV2vFuel(Array.isArray(f.value) ? f.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams, peerVin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const n   = od.length || 1;
  const tot = (k: string) => od.reduce((s, d) => s + Number(d[k] || 0), 0);
  const avg = (k: string) => tot(k) / n;
  const bl  = baseline || {};
  const kd  = kpiData[0] || {};

  // This vehicle metrics
  const myMetrics = {
    avgSpeed:      avg('average_speed'),
    totalDist:     tot('trip_distance'),
    harshPer100:   tot('trip_distance') > 0 ? (tot('harsh_acc_count') + tot('harsh_brk_count') + tot('harsh_turn_count')) / (tot('trip_distance') / 100) : 0,
    avgFuelEff:    avg('fuel_efficiency'),
    co2PerKm:      tot('trip_distance') > 0 ? tot('co2_emissions') / tot('trip_distance') : 0,
    overspeedCount:tot('overspeeding_count'),
    avgIdlePct:    avg('idle_time') / (avg('trip_duration_minute') * 60 || 1) * 100,
    avgAcPct:      avg('percentage_ac_on'),
  };

  // Fleet baseline metrics from df_overall_kpi_data bsline_ fields
  const fleetMetrics = {
    avgSpeed:      Number(kd.bsline_average_speed || 0),
    totalDist:     Number(kd.bsline_trip_distance || 0) * n,
    harshPer100:   0, // not directly available as rate — compute from counts
    avgFuelEff:    Number(kd.bsline_fuel_efficiency || 0) || Number(bl.bsline_fuel_efficiency || 0),
    co2PerKm:      Number(kd.bsline_co2_emissions || 0),
    overspeedCount:Number(kd.bsline_overspeeding_count || 0),
    avgIdlePct:    0,
    avgAcPct:      Number(kd.bsline_percentage_ac_on || 0),
  };

  const compare = (mine: number, fleet: number, lowerBetter: boolean): MetricStatus => {
    if (!fleet) return 'similar';
    const diff = ((mine - fleet) / fleet) * 100;
    if (Math.abs(diff) < 5) return 'similar';
    const isBetter = lowerBetter ? diff < 0 : diff > 0;
    return isBetter ? 'better' : 'worse';
  };

  const statusColor = (s: MetricStatus) => s === 'better' ? '#2e7d32' : s === 'worse' ? '#c62828' : '#555';
  const statusBg    = (s: MetricStatus) => s === 'better' ? '#e8f5e9' : s === 'worse' ? '#ffebee' : '#f5f5f5';
  const statusIcon  = (s: MetricStatus) => s === 'better' ? '✅' : s === 'worse' ? '⚠️' : '➡️';

  const comparisons = [
    { label: 'Avg Speed',          mine: myMetrics.avgSpeed,      fleet: fleetMetrics.avgSpeed,      unit: 'km/h', lowerBetter: false },
    { label: 'Avg Fuel Efficiency',mine: myMetrics.avgFuelEff,    fleet: fleetMetrics.avgFuelEff,    unit: 'km/l', lowerBetter: false },
    { label: 'CO₂ per km',         mine: myMetrics.co2PerKm,      fleet: fleetMetrics.co2PerKm,      unit: 'kg',   lowerBetter: true  },
    { label: 'Harsh Events/100km', mine: myMetrics.harshPer100,   fleet: 0,                          unit: '',     lowerBetter: true  },
    { label: 'Overspeeding Count', mine: myMetrics.overspeedCount,fleet: fleetMetrics.overspeedCount,unit: '',     lowerBetter: true  },
    { label: 'AC Usage %',         mine: myMetrics.avgAcPct,      fleet: fleetMetrics.avgAcPct,      unit: '%',    lowerBetter: false },
  ];

  // Radar chart data for visual comparison (normalised 0–100)
  const radarData = [
    { metric: 'Fuel Eff.',   vehicle: Math.min(100, myMetrics.avgFuelEff * 5),   fleet: Math.min(100, fleetMetrics.avgFuelEff * 5) },
    { metric: 'Safety',      vehicle: Math.max(0, 100 - myMetrics.harshPer100 * 10), fleet: 70 },
    { metric: 'Speed Comp.', vehicle: Math.max(0, 100 - myMetrics.overspeedCount * 2), fleet: Math.max(0, 100 - fleetMetrics.overspeedCount * 2) },
    { metric: 'AC Usage',    vehicle: myMetrics.avgAcPct,  fleet: fleetMetrics.avgAcPct },
    { metric: 'Low Idle',    vehicle: Math.max(0, 100 - myMetrics.avgIdlePct * 3), fleet: 70 },
    { metric: 'Eco Score',   vehicle: Math.max(0, 100 - myMetrics.co2PerKm * 500), fleet: Math.max(0, 100 - fleetMetrics.co2PerKm * 500) },
  ];

  // V2V AC temperature comparison
  const v2vAcData = v2vAc.map((d: any) => ({
    temp: d.temp || d.speed || d.index || '',
    thisVehicle: Number(d.value || 0),
    peerVehicle: Number(d.baseline || 0),
  })).filter(x => x.temp);

  // V2V turn comparison
  const v2vTurnData = v2vTurn.map((d: any) => ({
    category: d.category || '',
    thisVehicle: Number(d.value || 0),
    peerVehicle: Number(d.baseline || 0),
  })).filter(x => x.category);

  return (
    <div style={page} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.benchmark}
        title="Fleet Benchmark"
        subtitle="Vehicle vs fleet performance comparison and ranking"
      />
      <DateFilterBar title="Fleet Benchmark" onApply={() => setTrigger(prev => prev + 1)} />

      {/* Peer VIN Selector */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#333', fontSize: 13 }}>🔄 Compare Against Peer VIN:</div>
        <select value={peerVin} onChange={e => setPeerVin(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, minWidth: 200 }}>
          <option value="">— Fleet Baseline —</option>
          {availableVins.filter(v => v !== vin).map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <div style={{ fontSize: 11, color: '#888' }}>
          {peerVin ? `Comparing VIN ${vin} vs VIN ${peerVin}` : `Comparing VIN ${vin} vs Fleet Baseline`}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#aaa' }}>Loading benchmark data…</div>}

      {/* Comparison Table */}
      <div style={sec}>📋 Head-to-Head KPI Comparison</div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Metric</th>
              <th style={{ ...th, color: '#e91e8c' }}>This Vehicle ({vin.slice(-6)})</th>
              <th style={{ ...th, color: '#42a5f5' }}>{peerVin ? `Peer (${peerVin.slice(-6)})` : 'Fleet Baseline'}</th>
              <th style={th}>Δ vs Fleet</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => {
              const status = compare(c.mine, c.fleet, c.lowerBetter);
              const delta  = c.fleet > 0 ? ((c.mine - c.fleet) / c.fleet * 100).toFixed(1) : '—';
              return (
                <tr key={c.label} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{c.label}</td>
                  <td style={{ ...td, color: '#e91e8c', fontWeight: 700 }}>{c.mine.toFixed(2)} {c.unit}</td>
                  <td style={{ ...td, color: '#42a5f5', fontWeight: 700 }}>{c.fleet > 0 ? `${c.fleet.toFixed(2)} ${c.unit}` : '—'}</td>
                  <td style={{ ...td }}>{c.fleet > 0 ? `${Number(delta) > 0 ? '+' : ''}${delta}%` : '—'}</td>
                  <td style={td}>
                    <span style={{ background: statusBg(status), color: statusColor(status), padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {statusIcon(status)} {status === 'better' ? 'Better' : status === 'worse' ? 'Needs Attention' : 'On Par'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Radar / Dimensional comparison */}
      <div style={sec}>🎯 Multi-Dimensional Performance Radar</div>
      <div style={two}>
        <ChartCard title="Vehicle vs Fleet — Normalised Scores (0–100)" data={radarData} type="multibar" xKey="metric"
          series={[
            { key: 'vehicle', color: '#e91e8c', name: `This Vehicle` },
            { key: 'fleet',   color: '#42a5f5', name: 'Fleet Baseline' },
          ]}
          description="Higher = better on all dimensions. Fuel efficiency, safety, speed compliance, AC, idle efficiency, eco score." height={280} />
        {v2vAcData.length > 0 ? (
          <ChartCard title="AC Temperature Usage — This vs Peer Vehicle" data={v2vAcData} type="multibar" xKey="temp"
            series={[
              { key: 'thisVehicle', color: '#e91e8c', name: `VIN ${vin.slice(-6)}` },
              { key: 'peerVehicle', color: '#42a5f5', name: `VIN ${peerVin.slice(-6)}` },
            ]}
            description="AC temperature distribution comparison — source: df_v2v_ac_temperature_distribution" height={280} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
            Select a peer VIN to enable V2V AC temperature comparison
          </div>
        )}
      </div>

      {v2vTurnData.length > 0 && (
        <>
          <div style={sec}>↩️ Turn Behaviour — V2V Comparison</div>
          <div style={two}>
            <ChartCard title="Turn Percentage — This vs Peer Vehicle" data={v2vTurnData} type="multibar" xKey="category"
              series={[
                { key: 'thisVehicle', color: '#e91e8c', name: `VIN ${vin.slice(-6)}` },
                { key: 'peerVehicle', color: '#42a5f5', name: `VIN ${peerVin.slice(-6)}` },
              ]}
              description="Turn direction distribution — source: df_v2v_right_turn_percent" height={240} />
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#333', marginBottom: 12, fontSize: 13 }}>💡 Benchmark Insights</div>
              {comparisons.filter(c => c.fleet > 0).map(c => {
                const status = compare(c.mine, c.fleet, c.lowerBetter);
                return (
                  <div key={c.label} style={{ marginBottom: 10, padding: '8px 12px', background: statusBg(status), borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: statusColor(status) }}>{statusIcon(status)} {c.label}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>
                      {status === 'better'
                        ? `This vehicle performs better than fleet baseline.`
                        : status === 'worse'
                          ? `This vehicle underperforms vs fleet — review driver behaviour.`
                          : `Performance is in line with fleet average.`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FleetBenchmarkDashboard;
