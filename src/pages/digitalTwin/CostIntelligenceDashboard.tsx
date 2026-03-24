import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData, fetchOverallKpiData, fetchFuelEvents } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import PageHeader, { ICON_PATHS } from './PageHeader';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
const sec: React.CSSProperties  = { color: '#e91e8c', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5, borderLeft: '4px solid #e91e8c', paddingLeft: 10 };
const two: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };

// Default fuel prices (₹/litre or ₹/kg) for India
const DEFAULT_PETROL_PRICE = 94;
const DEFAULT_CNG_PRICE    = 75;

const fmtRupee = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const CostIntelligenceDashboard: FC = () => {
  const { apiParams } = useDt();
  const [od, setOd]             = useState<any[]>([]);
  const [kpiData, setKpiData]   = useState<any[]>([]);
  const [fuelEvents, setFe]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [petrolPrice, setPetrolPrice] = useState(DEFAULT_PETROL_PRICE);
  const [cngPrice, setCngPrice]       = useState(DEFAULT_CNG_PRICE);
  const [trigger, setTrigger]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.allSettled([
        fetchOverallData(apiParams),
        fetchOverallKpiData(apiParams),
        fetchFuelEvents(apiParams),
      ]);
      if (a.status === 'fulfilled') setOd(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setKpiData(Array.isArray(b.value) ? b.value : []);
      if (c.status === 'fulfilled') setFe(Array.isArray(c.value) ? c.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const n   = od.length || 1;
  const tot = (k: string) => od.reduce((s, d) => s + Number(d[k] || 0), 0);
  const avg = (k: string) => tot(k) / n;

  const totalDist      = tot('trip_distance');
  const avgFuelEff     = avg('fuel_efficiency');
  const avgFECng       = (() => { const ct = od.filter(d => (d.cngornot || '').toUpperCase() === 'Y'); return ct.length > 0 ? ct.reduce((s, d) => s + Number(d.trip_fe_ncng || 0), 0) / ct.length : 0; })();
  const totalIdleHrs   = tot('idle_time') / 3600;
  const totalKmsLoss   = tot('kms_loss_mlg');
  const totalHarsh     = tot('harsh_acc_count') + tot('harsh_brk_count') + tot('harsh_turn_count');
  const totalCo2       = tot('co2_emissions');

  // Cost calculations
  const fuelLitresConsumed   = avgFuelEff > 0 ? totalDist / avgFuelEff : 0;
  const totalFuelCost        = fuelLitresConsumed * petrolPrice;
  const costPerKm            = totalDist > 0 ? totalFuelCost / totalDist : 0;

  // Idle waste: ~0.5L/hr idle fuel consumption at petrol engine
  const idleFuelLitres       = totalIdleHrs * 0.5;
  const idleWasteCost        = idleFuelLitres * petrolPrice;

  // AC fuel penalty: kms_loss_mlg represents km not travelled due to AC drain
  // Estimated fuel cost of that mileage loss
  const acPenaltyLitres      = avgFuelEff > 0 ? totalKmsLoss / avgFuelEff : 0;
  const acPenaltyCost        = acPenaltyLitres * petrolPrice;

  // Harsh driving penalty: harsh events reduce FE by ~8-15% on those trips
  // We estimate 10% FE reduction on trips with harsh events
  const tripsWithHarsh       = od.filter(d => Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0) > 0).length;
  const harshTripsDist       = od.filter(d => Number(d.harsh_acc_count || 0) + Number(d.harsh_brk_count || 0) + Number(d.harsh_turn_count || 0) > 0).reduce((s, d) => s + Number(d.trip_distance || 0), 0);
  const harshPenaltyCost     = avgFuelEff > 0 ? (harshTripsDist / avgFuelEff) * 0.10 * petrolPrice : 0;

  // Normal fuel cost (excluding all waste)
  const normalFuelCost       = Math.max(0, totalFuelCost - idleWasteCost - acPenaltyCost - harshPenaltyCost);

  // Savings opportunity
  const potentialSaving      = idleWasteCost + acPenaltyCost + harshPenaltyCost;
  const monthlySaving        = n > 0 ? potentialSaving / n * 30 : 0;

  // Per-trip cost rows
  const rows = od.map(d => {
    const dist = Number(d.trip_distance || 0);
    const fe   = Number(d.fuel_efficiency || 0);
    const cost = fe > 0 ? (dist / fe) * petrolPrice : 0;
    const idle = Number(d.idle_time || 0) / 3600 * 0.5 * petrolPrice;
    const ac   = avgFuelEff > 0 ? Number(d.kms_loss_mlg || 0) / avgFuelEff * petrolPrice : 0;
    return {
      date:      (d.process_date || '').slice(5, 10),
      fuelCost:  parseFloat(cost.toFixed(1)),
      idleCost:  parseFloat(idle.toFixed(1)),
      acCost:    parseFloat(ac.toFixed(1)),
      costPerKm: dist > 0 ? parseFloat((cost / dist).toFixed(2)) : 0,
      dist:      parseFloat(dist.toFixed(1)),
    };
  });

  // Breakdown for pie-style bar
  const breakdown = [
    { category: 'Normal Fuel', cost: parseFloat(normalFuelCost.toFixed(0)) },
    { category: 'Idle Waste',  cost: parseFloat(idleWasteCost.toFixed(0)) },
    { category: 'AC Penalty',  cost: parseFloat(acPenaltyCost.toFixed(0)) },
    { category: 'Harsh Driving', cost: parseFloat(harshPenaltyCost.toFixed(0)) },
  ].filter(x => x.cost > 0);

  const kpis = [
    { label: 'Total Fuel Cost',          value: fmtRupee(totalFuelCost),           icon: '💰', color: '#e91e8c', unit: '',      lowerIsBetter: false, description: `Based on ₹${petrolPrice}/L petrol price` },
    { label: 'Cost per km',              value: costPerKm.toFixed(2),           icon: '📍', color: '#42a5f5', unit: '₹/km',  lowerIsBetter: true,  description: 'Target: < ₹6/km for petrol vehicles in India' },
    { label: 'Idle Waste Cost',          value: fmtRupee(idleWasteCost),            icon: '⏸️', color: '#ffa726', unit: '',      lowerIsBetter: true,  description: `${totalIdleHrs.toFixed(1)} hrs idle × 0.5L/hr × ₹${petrolPrice}` },
    { label: 'AC Fuel Penalty Cost',     value: fmtRupee(acPenaltyCost),            icon: '❄️', color: '#26c6da', unit: '',      lowerIsBetter: true,  description: `${totalKmsLoss.toFixed(1)} km mileage lost to AC` },
    { label: 'Harsh Driving Penalty',    value: fmtRupee(harshPenaltyCost),         icon: '⚡', color: '#ef5350', unit: '',      lowerIsBetter: true,  description: `${tripsWithHarsh} trips with harsh events — est. 10% FE loss` },
    { label: 'Total Waste Cost',         value: fmtRupee(potentialSaving),          icon: '🗑️', color: '#f44336', unit: '',      lowerIsBetter: true,  description: 'Idle + AC penalty + harsh driving combined' },
    { label: 'Monthly Saving Potential', value: fmtRupee(monthlySaving),            icon: '📈', color: '#66bb6a', unit: '/mo',   lowerIsBetter: false, description: 'Estimated monthly saving if all waste is eliminated' },
    { label: 'Fuel Consumed',           value: fuelLitresConsumed.toFixed(1),  icon: '⛽', color: '#ff7043', unit: 'L',     lowerIsBetter: false },
    { label: 'Total Distance',          value: totalDist.toFixed(1),           icon: '🛣️', color: '#78909c', unit: 'km',    lowerIsBetter: false },
    { label: 'Total CO₂ Emitted',       value: totalCo2.toFixed(1),            icon: '🌿', color: '#4caf50', unit: 'kg',    lowerIsBetter: true },
  ];

  return (
    <div style={page} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.cost}
        title="Operational Cost Intelligence"
        subtitle="Total cost of ownership, fuel costs and efficiency savings analysis"
      />
      <DateFilterBar title="Cost Analysis" onApply={() => setTrigger(prev => prev + 1)} />

      {/* Fuel Price Configurator */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#333', fontSize: 13 }}>⛽ Configure Fuel Prices:</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          Petrol (₹/L):
          <input type="number" value={petrolPrice} min={50} max={200}
            onChange={e => setPetrolPrice(Number(e.target.value))}
            style={{ width: 70, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontWeight: 700, fontSize: 13 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          CNG (₹/kg):
          <input type="number" value={cngPrice} min={30} max={150}
            onChange={e => setCngPrice(Number(e.target.value))}
            style={{ width: 70, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontWeight: 700, fontSize: 13 }} />
        </label>
        <div style={{ fontSize: 11, color: '#888' }}>All cost calculations update automatically.</div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 28, color: '#aaa' }}>Loading cost data…</div>}

      {/* Savings Opportunity Banner */}
      {potentialSaving > 0 && (
        <div style={{ background: '#e8f5e9', border: '2px solid #81c784', borderRadius: 16, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 36 }}>💡</span>
          <div>
            <div style={{ fontWeight: 800, color: '#2e7d32', fontSize: 16 }}>
              {fmtRupee(potentialSaving)} in avoidable costs detected this period
            </div>
            <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>
              Idle waste: <strong>{fmtRupee(idleWasteCost)}</strong> &nbsp;|&nbsp;
              AC penalty: <strong>{fmtRupee(acPenaltyCost)}</strong> &nbsp;|&nbsp;
              Harsh driving: <strong>{fmtRupee(harshPenaltyCost)}</strong>
              &nbsp;→&nbsp; Monthly saving potential: <strong>{fmtRupee(monthlySaving)}/month</strong>
            </div>
          </div>
        </div>
      )}

      <div style={sec}>💰 Cost KPIs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k as any} />)}
      </div>

      <div style={sec}>📊 Cost Breakdown & Trends</div>
      <div style={two}>
        <ChartCard title="Cost Breakdown — Normal vs Waste" data={breakdown} type="bar" xKey="category"
          series={[{ key: 'cost', color: '#e91e8c', name: 'Cost (₹)' }]}
          description="Normal usage vs idle waste, AC penalty, and harsh driving penalty" height={240} />
        <ChartCard title="Daily Fuel Cost per Trip" data={rows} type="area" xKey="date"
          series={[{ key: 'fuelCost', color: '#ffa726', name: 'Fuel Cost (₹)' }]}
          unit="₹" height={240} />
      </div>
      <div style={two}>
        <ChartCard title="Cost per km Trend" data={rows} type="line" xKey="date"
          series={[{ key: 'costPerKm', color: '#42a5f5', name: '₹/km' }]}
          unit="₹/km" benchmark={6} benchmarkLabel="₹6/km target" height={240} />
        <ChartCard title="Idle Waste Cost + AC Penalty per Trip" data={rows} type="multibar" xKey="date"
          series={[
            { key: 'idleCost', color: '#607d8b', name: 'Idle Waste (₹)' },
            { key: 'acCost',   color: '#26c6da', name: 'AC Penalty (₹)' },
          ]}
          height={240} description="Daily avoidable cost from idling and AC mileage loss" />
      </div>
    </div>
  );
};

export default CostIntelligenceDashboard;
