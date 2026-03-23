import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchSummaryBaselineTile, fetchOverallKpiData, fetchOverallData } from '../../services/digitalTwinApi';
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

const IntelligenceDashboard: FC = () => {
  const { apiParams } = useDt();
  const [summaryTile, setSummaryTile] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [overallData, setOverallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, kRes, oRes] = await Promise.allSettled([
        fetchSummaryBaselineTile(apiParams),
        fetchOverallKpiData(apiParams),
        fetchOverallData(apiParams),
      ]);
      if (sRes.status === 'fulfilled') {
        const d = Array.isArray(sRes.value) ? sRes.value[0] : sRes.value;
        setSummaryTile(d);
      }
      if (kRes.status === 'fulfilled') setKpiData(Array.isArray(kRes.value) ? kRes.value : []);
      if (oRes.status === 'fulfilled') setOverallData(Array.isArray(oRes.value) ? oRes.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const t = summaryTile || {};

  const getDelta = (val: any, base: any) => {
    if (val == null || base == null || Number(base) === 0) return null;
    return ((Number(val) - Number(base)) / Number(base) * 100);
  };

  // Enhanced KPI list with richer metadata
  const kpiItems = [
    {
      label: 'Total Distance', value: t.total_distance, baseline: t.bsline_total_distance,
      icon: '📍', color: '#e91e8c', unit: 'km', lowerIsBetter: false,
      description: 'Total kilometers driven. Compare vs fleet baseline to identify over/under-utilisation.',
    },
    {
      label: 'Average Speed', value: t.average_speed, baseline: t.bsline_average_speed,
      icon: '⚡', color: '#42a5f5', unit: 'km/h', lowerIsBetter: false,
      description: 'Mean speed across all trips. Urban benchmark: 30–40 km/h. Highway: 60–80 km/h.',
    },
    {
      label: 'Total Idle Time', value: t.total_idle_time, baseline: t.bsline_total_idle_time,
      icon: '⏸️', color: '#607d8b', unit: 'sec', lowerIsBetter: true,
      description: 'Engine-on, vehicle-stationary time. Every 10 min idle ≈ 0.1 L fuel wasted.',
    },
    {
      label: 'Harsh Acc Count', value: t.harsh_acc_count, baseline: t.bsline_harsh_acc_count,
      icon: '🚀', color: '#e91e8c', unit: '', lowerIsBetter: true,
      description: 'Longitudinal G > 0.3g events. High count = driver aggression or poor route planning.',
    },
    {
      label: 'Harsh Brake Count', value: t.harsh_brk_count, baseline: t.bsline_harsh_brk_count,
      icon: '🛑', color: '#ef5350', unit: '', lowerIsBetter: true,
      description: 'Emergency braking events. Linked to brake pad wear and rear-end risk.',
    },
    {
      label: 'Harsh Turn Count', value: t.harsh_turn_count, baseline: t.bsline_harsh_turn_count,
      icon: '↩️', color: '#ffa726', unit: '', lowerIsBetter: true,
      description: 'Lateral G > 0.3g events. Accelerates tire and suspension wear.',
    },
    {
      label: 'Overspeeding Count', value: t.overspeeding_count, baseline: t.bsline_overspeeding_count,
      icon: '🚨', color: '#f44336', unit: '', lowerIsBetter: true,
      description: 'Threshold exceeded events (>80 km/h). Key warranty and safety metric.',
    },
    {
      label: 'AC Duration', value: t.ac_duration, baseline: t.bsline_ac_duration,
      icon: '❄️', color: '#26c6da', unit: 'sec', lowerIsBetter: false,
      description: 'Total AC-on time. Directly correlates with fuel consumption impact.',
    },
    {
      label: 'AC Usage %', value: t.ac_usage, baseline: t.bsline_ac_usage,
      icon: '🌡️', color: '#5c6bc0', unit: '%', lowerIsBetter: false,
      description: 'Proportion of driving time with AC active. Climate-region normalised.',
    },
    {
      label: 'CO₂ Emissions', value: t.co2_emissions, baseline: t.bsline_co2_emissions,
      icon: '🌿', color: '#66bb6a', unit: 'kg', lowerIsBetter: true,
      description: 'Estimated carbon output. Lower values indicate efficient driving behaviour.',
    },
    {
      label: 'Mileage Loss', value: t.mileage_loss, baseline: t.bsline_mileage_loss,
      icon: '📉', color: '#ff7043', unit: 'km', lowerIsBetter: true,
      description: 'Odometer loss from idling and inefficiency. Affects warranty mileage calculations.',
    },
    {
      label: 'Trip Duration', value: t.total_trip_duration, baseline: t.bsline_total_trip_duration,
      icon: '⏱️', color: '#ab47bc', unit: 'min', lowerIsBetter: false,
      description: 'Cumulative trip time. Long durations with low distance indicate congestion.',
    },
    // Additional derived KPIs
    {
      label: 'Fuel Efficiency', value: t.fuel_efficiency || (t.average_speed && t.total_distance
        ? (Number(t.total_distance) / (Number(t.co2_emissions || 0) / 2.31 || 1)).toFixed(2)
        : null),
      baseline: t.bsline_fuel_efficiency,
      icon: '⛽', color: '#ffa726', unit: 'km/l', lowerIsBetter: false,
      description: 'Estimated fuel efficiency for the period.',
    },
    {
      label: 'Harsh Events / 100 km', value: t.total_distance
        ? (((Number(t.harsh_acc_count || 0) + Number(t.harsh_brk_count || 0) + Number(t.harsh_turn_count || 0)) / Number(t.total_distance)) * 100).toFixed(2)
        : null,
      icon: '⚠️', color: '#ff9800', unit: '', lowerIsBetter: true,
      description: 'Normalised harsh driving intensity. Industry benchmark: <5 per 100 km.',
    },
    {
      label: 'Idle Ratio', value: t.total_idle_time && t.total_trip_duration
        ? ((Number(t.total_idle_time) / (Number(t.total_trip_duration) * 60)) * 100).toFixed(1)
        : null,
      icon: '📊', color: '#607d8b', unit: '%', lowerIsBetter: true,
      description: 'Idle time as % of total engine-on time. >25% warrants driver coaching.',
    },
    { label:'Left Turn %',         value:t.left_turn_percentage,    baseline:t.bsline_left_turn_percentage,    icon:'↩️', color:'#42a5f5', unit:'%',   lowerIsBetter:false },
    { label:'Right Turn %',        value:t.right_turn_percentage,   baseline:t.bsline_right_turn_percentage,   icon:'↪️', color:'#ffa726', unit:'%',   lowerIsBetter:false },
    { label:'Acc Before Turn',     value:t.acc_before_turn_count,   baseline:t.bsline_acc_before_turn_count,   icon:'🔄', color:'#e91e8c', unit:'',    lowerIsBetter:true  },
    { label:'Brk After Turn',      value:t.brk_after_turn_count,    baseline:t.bsline_brk_after_turn_count,    icon:'🔄', color:'#ef5350', unit:'',    lowerIsBetter:true  },
    { label:'Hazard Light Count',  value:t.hazard_light_activation_count, baseline:t.bsline_hazard_light_activation_count, icon:'⚠️', color:'#ffa726', unit:'', lowerIsBetter:true },
    { label:'Headlight Duration',  value:t.headlight_on_duration,   baseline:t.bsline_headlight_on_duration,   icon:'💡', color:'#5c6bc0', unit:'sec', lowerIsBetter:false },
    { label:'Bat >15V Events',     value:t.bat_above_15v,           baseline:t.bsline_bat_above_15v,           icon:'🔋', color:'#7c4dff', unit:'',    lowerIsBetter:true  },
    { label:'Bat <9V Events',      value:t.bat_below_9v,            baseline:t.bsline_bat_below_9v,            icon:'⚡', color:'#e53935', unit:'',    lowerIsBetter:true  },
    { label:'Fuel <20% Events',    value:t.fuel_less_than_20per,    baseline:t['bsline_fuel_less_than_20per'], icon:'🪫', color:'#ef5350', unit:'',    lowerIsBetter:true  },
    { label:'Door Lock Events',    value:t.num_door_lock_events,    baseline:t.bsline_num_door_lock_events,    icon:'🔒', color:'#78909c', unit:'',    lowerIsBetter:false },
    { label:'Door Unlock Events',  value:t.num_door_unlock_events,  baseline:t.bsline_num_door_unlock_events,  icon:'🔓', color:'#90a4ae', unit:'',    lowerIsBetter:false },
    { label:'Altitude Median',     value:t.altitude_median,         baseline:t.bsline_altitude_median,         icon:'⛰️', color:'#795548', unit:'m',   lowerIsBetter:false },
    { label:'GSM Signal %',        value:t.gsm_strength_per,        baseline:t.bsline_gsm_strength_per,        icon:'📶', color:'#42a5f5', unit:'%',   lowerIsBetter:false },
    { label:'Odometer Resets',     value:t.odometerresetcount,      baseline:t.bsline_odometerresetcount,      icon:'🔄', color:'#ff5722', unit:'',    lowerIsBetter:true  },
    { label:'Inside Cabin Temp',   value:t.inside_air_temp,         baseline:t.bsline_inside_air_temp,         icon:'🌡️', color:'#ff8a65', unit:'°C',  lowerIsBetter:false },
    { label:'AC % ON',             value:t.percentage_ac_on,        baseline:t.bsline_percentage_ac_on,        icon:'❄️', color:'#26c6da', unit:'%',   lowerIsBetter:false },
    { label:'KM Loss Mileage',     value:t.kms_loss_mlg,            baseline:t.bsline_kms_loss_mlg,            icon:'📉', color:'#ff7043', unit:'km',  lowerIsBetter:true  },
    { label:'Trip FE CNG',         value:t.trip_fe_ncng,            baseline:t.bsline_trip_fe_ncng,            icon:'🍃', color:'#4caf50', unit:'km/kg',lowerIsBetter:false },
    { label:'Harsh Acc Duration',  value:t.harsh_acc_dur_in_sec,    baseline:t.bsline_harsh_acc_dur_in_sec,    icon:'⏱️', color:'#f06292', unit:'sec', lowerIsBetter:true  },
    { label:'Harsh Brk Duration',  value:t.harsh_brk_dur_in_sec,    baseline:t.bsline_harsh_brk_dur_in_sec,    icon:'⏱️', color:'#ef9a9a', unit:'sec', lowerIsBetter:true  },
    { label:'Harsh Turn Duration', value:t.harsh_turn_dur_in_sec,   baseline:t.bsline_harsh_turn_dur_in_sec,   icon:'⏱️', color:'#ffcc80', unit:'sec', lowerIsBetter:true  },
    { label:'Overspeeding Dur',    value:t.overspeeding_dur_in_sec, baseline:t.bsline_overspeeding_dur_in_sec, icon:'⏰', color:'#ff7043', unit:'sec', lowerIsBetter:true  },
  ];

  const kpiChartData = kpiData.map((d) => ({
    date: (d.process_date || d.date || '').slice(5, 10),
    avg_speed: Number(d.average_speed || 0),
    total_distance: Number(d.total_distance || 0),
    co2: Number(d.co2_emissions || 0),
    harsh_total: Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0),
    fuel_efficiency: Number(d.fuel_efficiency || 0),
    idle_time: Number(d.total_idle_time || 0) / 60,
  }));

  // Radar / spider chart data for overall health
  const healthScore = (() => {
    const scores = [
      { dim: 'Speed Compliance', score: Math.max(0, 100 - Number(t.overspeeding_count || 0) * 2) },
      { dim: 'Driving Smoothness', score: Math.max(0, 100 - (Number(t.harsh_acc_count || 0) + Number(t.harsh_brk_count || 0)) * 1.5) },
      { dim: 'Eco Driving', score: Math.max(0, 100 - Number(t.co2_emissions || 0) * 0.1) },
      { dim: 'Idle Efficiency', score: Math.max(0, 100 - (Number(t.total_idle_time || 0) / 3600) * 5) },
      { dim: 'Trip Productivity', score: t.total_distance && t.total_trip_duration
          ? Math.min(100, (Number(t.total_distance) / (Number(t.total_trip_duration) / 60)) * 2) : 50 },
    ];
    return scores;
  })();

  // Baseline comparison chart
  const baselineData = kpiItems
    .filter(k => k.baseline != null && k.value != null)
    .map(k => ({
      label: k.label.length > 16 ? k.label.slice(0, 16) + '…' : k.label,
      current: Number(k.value),
      baseline: Number(k.baseline),
    }));

  return (
    <div style={pageStyle} id="dt-page-content">
      <DateFilterBar title="Intelligence — KPI Summary" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading intelligence data…</div>}

      {/* Vehicle Health Summary Banner */}
      {healthScore.some(h => h.score < 60) && (
        <div style={{
          background: 'linear-gradient(135deg,#ffebee,#fff)', border: '1px solid #ef9a9a',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#c62828' }}>Attention Required</div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {healthScore.filter(h => h.score < 60).map(h => h.dim).join(', ')} scores are below threshold.
              Review the detailed charts below.
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div style={sectionTitle}>🎯 KPI vs Baseline</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpiItems.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value != null ? Number(kpi.value).toFixed(2) : null}
            baseline={kpi.baseline}
            icon={kpi.icon}
            color={kpi.color}
            unit={kpi.unit}
            description={kpi.description}
            lowerIsBetter={kpi.lowerIsBetter}
          />
        ))}
      </div>

      {/* Health scores */}
      <div style={sectionTitle}>🏥 Vehicle Health Dimensions</div>
      <ChartCard
        title="Health Dimension Scores (0–100)"
        data={healthScore}
        type="bar"
        xKey="dim"
        series={[{ key: 'score', color: '#42a5f5', name: 'Score' }]}
        height={280}
        benchmark={70}
        benchmarkLabel="Minimum threshold 70"
        description="Composite health scores derived from KPI performance vs industry benchmarks"
      />
      <div style={{ height: 16 }} />

      {/* Trend charts */}
      {kpiChartData.length > 0 && (
        <>
          <div style={sectionTitle}>📈 KPI Trends Over Time</div>
          <div style={twoCol}>
            <ChartCard
              title="Average Speed Trend"
              data={kpiChartData}
              type="line"
              xKey="date"
              series={[{ key: 'avg_speed', color: '#42a5f5', name: 'Avg Speed (km/h)' }]}
              unit="km/h"
              benchmark={40}
              benchmarkLabel="Urban baseline"
            />
            <ChartCard
              title="Total Distance Trend"
              data={kpiChartData}
              type="area"
              xKey="date"
              series={[{ key: 'total_distance', color: '#66bb6a', name: 'Distance (km)' }]}
              unit="km"
            />
          </div>
          <div style={twoCol}>
            <ChartCard
              title="Harsh Events (Total) Trend"
              data={kpiChartData}
              type="bar"
              xKey="date"
              series={[{ key: 'harsh_total', color: '#ffa726', name: 'Harsh Events' }]}
              description="Watch for upward trends — may indicate driver deterioration or route changes"
            />
            <ChartCard
              title="CO₂ Emissions Trend"
              data={kpiChartData}
              type="area"
              xKey="date"
              series={[{ key: 'co2', color: '#ef5350', name: 'CO₂ (kg)' }]}
              unit="kg"
            />
          </div>
          <div style={twoCol}>
            <ChartCard
              title="Fuel Efficiency Trend"
              data={kpiChartData}
              type="line"
              xKey="date"
              series={[{ key: 'fuel_efficiency', color: '#ffa726', name: 'km/l' }]}
              unit="km/l"
              benchmark={15}
              benchmarkLabel="Fleet baseline 15 km/l"
            />
            <ChartCard
              title="Idle Time Trend (min)"
              data={kpiChartData}
              type="area"
              xKey="date"
              series={[{ key: 'idle_time', color: '#607d8b', name: 'Idle (min)' }]}
              unit="min"
              description="Lower is better — high idle time inflates maintenance costs"
            />
          </div>
        </>
      )}

      {/* Current vs Baseline comparison */}
      {baselineData.length > 0 && (
        <>
          <div style={sectionTitle}>📊 Current vs Baseline Comparison</div>
          <ChartCard
            title="KPI: Current vs Baseline (all metrics)"
            data={baselineData}
            type="multibar"
            xKey="label"
            series={[
              { key: 'current', color: '#e91e8c', name: 'Current' },
              { key: 'baseline', color: '#b0bec5', name: 'Baseline' },
            ]}
            height={320}
            description="Direct side-by-side comparison of every tracked KPI against its fleet baseline"
          />
        </>
      )}
    </div>
  );
};

export default IntelligenceDashboard;
