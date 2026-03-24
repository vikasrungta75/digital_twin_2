import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData } from '../../services/digitalTwinApi';
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

const EnvironmentDashboard: FC = () => {
  const { apiParams } = useDt();
  const [overallData, setOverallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchOverallData(apiParams);
      setOverallData(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Emissions calculations (ARAI methodology)
  // CO2 = distance / fuel_efficiency * 2.31 kg/l (petrol)
  const totalDistance = overallData.reduce((s, d) => s + Number(d.trip_distance || 0), 0);
  const totalCo2 = overallData.reduce((s, d) => s + Number(d.co2_emissions || 0), 0);
  const avgFuelEff = overallData.length > 0
    ? overallData.reduce((s, d) => s + Number(d.fuel_efficiency || 0), 0) / overallData.length : 0;

  // Estimated fuel consumed
  const estimatedFuelLitres = avgFuelEff > 0 ? totalDistance / avgFuelEff : 0;
  // NOx estimate (BS6: ~60 mg/km)
  const estimatedNOx = (totalDistance * 0.06).toFixed(2); // grams
  // HC estimate (BS6: ~100 mg/km)
  const estimatedHC = (totalDistance * 0.1).toFixed(2); // grams
  // PM2.5 estimate (BS6 gasoline: ~4.5 mg/km)
  const estimatedPM = (totalDistance * 0.0045).toFixed(2);

  // Eco score: higher efficiency, lower idle, lower harsh = better
  const totalIdle = overallData.reduce((s, d) => s + Number(d.idle_time || 0), 0) / 3600;
  const totalHarsh = overallData.reduce((s, d) => s + Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0), 0);
  const co2PerKm = totalDistance > 0 ? totalCo2 / totalDistance : 0;
  const ecoScore = Math.max(0, Math.min(100, Math.round(
    100 - (co2PerKm > 0.12 ? (co2PerKm - 0.12) * 200 : 0) - (totalIdle * 3) - (totalHarsh * 0.5)
  )));

  // Carbon footprint equivalents
  const treesNeeded = (totalCo2 / 21).toFixed(1); // avg tree absorbs 21 kg CO2/year
  const kmsElectricEquiv = (estimatedFuelLitres * 8).toFixed(0); // 1L petrol ≈ 8 kWh EV equiv

  // Per-trip chart
  const emissionData = overallData.map(d => ({
    date: (d.process_date || '').slice(5, 10),
    co2: Number(d.co2_emissions || 0),
    fuel_efficiency: Number(d.fuel_efficiency || 0),
    idle_time: Number(d.idle_time || 0) / 60,
    harsh: Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0),
  }));

  // Eco grade distribution
  const tripGrades = overallData.map(d => {
    const eff = Number(d.fuel_efficiency || 0);
    if (eff >= 18) return 'A+';
    if (eff >= 15) return 'A';
    if (eff >= 12) return 'B';
    if (eff >= 9) return 'C';
    return 'D';
  });
  const gradeCount = ['A+', 'A', 'B', 'C', 'D'].map(g => ({
    grade: g, count: tripGrades.filter(x => x === g).length,
  }));

  // Speed-efficiency correlation
  const speedEffData = overallData.map(d => ({
    speed: Number(d.average_speed || 0).toFixed(0),
    efficiency: Number(d.fuel_efficiency || 0),
  })).filter(d => Number(d.speed) > 0 && d.efficiency > 0);

  const kpis = [
    { label: 'Eco Score', value: ecoScore, icon: '🌿', color: ecoScore > 70 ? '#66bb6a' : ecoScore > 50 ? '#ffa726' : '#ef5350', unit: '/100', lowerIsBetter: false, description: 'Composite eco-driving score: lower CO₂ intensity + less idle + fewer harsh events = higher score' },
    { label: 'Total CO₂ Emitted', value: totalCo2.toFixed(2), icon: '☁️', color: '#607d8b', unit: 'kg', lowerIsBetter: true },
    { label: 'CO₂ Intensity', value: co2PerKm.toFixed(4), icon: '📊', color: '#ef5350', unit: 'kg/km', lowerIsBetter: true, description: 'BS6 benchmark: ~0.12 kg/km for petrol' },
    { label: 'Est. Fuel Consumed', value: estimatedFuelLitres.toFixed(1), icon: '⛽', color: '#ffa726', unit: 'L', lowerIsBetter: true },
    { label: 'Avg Fuel Efficiency', value: avgFuelEff.toFixed(2), icon: '🎯', color: '#42a5f5', unit: 'km/l', lowerIsBetter: false },
    { label: 'Trees to Offset CO₂', value: treesNeeded, icon: '🌳', color: '#66bb6a', unit: 'trees/yr', lowerIsBetter: true, description: 'Number of trees needed to absorb the CO₂ over 1 year' },
    { label: 'Est. NOx Emitted', value: estimatedNOx, icon: '🔴', color: '#ab47bc', unit: 'g', lowerIsBetter: true, description: 'Estimated nitrogen oxide emission (BS6 limit 60 mg/km)' },
    { label: 'Est. HC Emitted', value: estimatedHC, icon: '🟡', color: '#ff9800', unit: 'g', lowerIsBetter: true, description: 'Estimated hydrocarbon emission (BS6 limit 100 mg/km)' },
    { label: 'Total Idle Hours', value: totalIdle.toFixed(2), icon: '⏸️', color: '#607d8b', unit: 'hrs', lowerIsBetter: true },
    { label: 'EV Distance Equiv.', value: kmsElectricEquiv, icon: '⚡', color: '#5c6bc0', unit: 'km', description: 'If this vehicle were an EV, it could cover this distance on the equivalent energy', lowerIsBetter: false },
  ];

  return (
    <div style={pageStyle} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.environment}
        title="Environmental Impact"
        subtitle="CO₂ emissions, fuel burn and environmental compliance"
      />
      <DateFilterBar title="Environment & Emissions" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Calculating emissions…</div>}

      <div style={sectionTitle}>🌍 Eco KPIs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      <div style={sectionTitle}>📊 Emission Trends</div>
      <div style={twoCol}>
        <ChartCard
          title="CO₂ Emissions per Trip"
          data={emissionData}
          type="area"
          xKey="date"
          series={[{ key: 'co2', color: '#607d8b', name: 'CO₂ (kg)' }]}
          unit="kg"
          description="Daily CO₂ output — rising trend requires driver behaviour intervention"
        />
        <ChartCard
          title="Fuel Efficiency Trend (km/l)"
          data={emissionData}
          type="line"
          xKey="date"
          series={[{ key: 'fuel_efficiency', color: '#66bb6a', name: 'km/l' }]}
          unit="km/l"
          benchmark={15}
          benchmarkLabel="Fleet avg 15 km/l"
        />
      </div>

      <div style={twoCol}>
        <ChartCard
          title="Idle Time per Trip (min)"
          data={emissionData}
          type="bar"
          xKey="date"
          series={[{ key: 'idle_time', color: '#ffa726', name: 'Idle (min)' }]}
          unit="min"
          description="Each idle minute emits ~8g CO₂ at typical engine load"
        />
        <ChartCard
          title="Harsh Events (Acc + Brk) per Trip"
          data={emissionData}
          type="bar"
          xKey="date"
          series={[{ key: 'harsh', color: '#ef5350', name: 'Harsh Events' }]}
          description="Harsh events increase fuel consumption 10-20% above smooth driving"
        />
      </div>

      <div style={twoCol}>
        <ChartCard
          title="Trip Eco Grade Distribution"
          data={gradeCount}
          type="bar"
          xKey="grade"
          series={[{ key: 'count', color: '#42a5f5', name: 'Trips' }]}
          description="A+ = >18 km/l, A = >15, B = >12, C = >9, D = <9 km/l"
        />
        <ChartCard
          title="Emission Breakdown Estimate"
          data={[
            { pollutant: 'CO₂ (kg)', value: parseFloat(totalCo2.toFixed(1)) },
            { pollutant: 'NOx (g)', value: parseFloat(estimatedNOx) },
            { pollutant: 'HC (g)', value: parseFloat(estimatedHC) },
            { pollutant: 'PM2.5 (g)', value: parseFloat(estimatedPM) },
          ]}
          type="bar"
          xKey="pollutant"
          series={[{ key: 'value', color: '#ab47bc', name: 'Emission' }]}
          description="Estimated pollutant output across the period (ARAI BS6 methodology)"
        />
      </div>
    </div>
  );
};

export default EnvironmentDashboard;
