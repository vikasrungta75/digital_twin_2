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

const LightDashboard: FC = () => {
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

  // Aggregates
  const totalHazardDur = overallData.reduce((s, d) => s + Number(d.hazard_light_activation_duration || d.hazard_light_on_duration || 0), 0);
  const totalHazardCount = overallData.reduce((s, d) => s + Number(d.hazard_light_activation_count || 0), 0);
  const totalHeadlightDur = overallData.reduce((s, d) => s + Number(d.headlight_on_duration || 0), 0);
  const totalIndicatorLeft = overallData.reduce((s, d) => s + Number(d.left_indicator_count || 0), 0);
  const totalIndicatorRight = overallData.reduce((s, d) => s + Number(d.right_indicator_count || 0), 0);
  const tripsWithHazard = overallData.filter(d => Number(d.hazard_light_activation_count || 0) > 0).length;
  const avgHazardPerTrip = overallData.length > 0
    ? (totalHazardCount / overallData.length).toFixed(2) : null;
  const headlightUsageRatio = overallData.length > 0
    ? ((totalHeadlightDur / Math.max(overallData.reduce((s, d) => s + Number(d.trip_duration_minute || 0) * 60, 0), 1)) * 100).toFixed(1)
    : null;

  const lightData = overallData.map((d) => ({
    date: `${(d.process_date || '').slice(5, 10)}`,
    hazardLightDur: Number(d.hazard_light_activation_duration || d.hazard_light_on_duration || 0),
    hazardLightCount: Number(d.hazard_light_activation_count || 0),
    headlightDur: Number(d.headlight_on_duration || 0),
    leftIndicator: Number(d.left_indicator_count || 0),
    rightIndicator: Number(d.right_indicator_count || 0),
  }));

  // Indicator balance
  const indicatorData = [
    { type: 'Left Indicator', count: totalIndicatorLeft },
    { type: 'Right Indicator', count: totalIndicatorRight },
  ];

  // Hazard duration threshold analysis
  const hazardSeverity = overallData.map(d => {
    const dur = Number(d.hazard_light_activation_duration || 0);
    return {
      date: (d.process_date || '').slice(5, 10),
      short: dur > 0 && dur < 60 ? dur : 0,   // <1 min — minor
      medium: dur >= 60 && dur < 300 ? dur : 0, // 1-5 min — moderate
      long: dur >= 300 ? dur : 0,              // >5 min — severe
    };
  });

  const kpis = [
    { label: 'Hazard Light Events', value: totalHazardCount, icon: '⚠️', color: '#ffa726', unit: 'events', description: 'Total hazard light activations; high count may indicate accident-prone routes', lowerIsBetter: true },
    { label: 'Hazard Light Duration', value: (totalHazardDur / 60).toFixed(1), icon: '⏱️', color: '#ef5350', unit: 'min', description: 'Total time hazard lights were active', lowerIsBetter: true },
    { label: 'Trips with Hazard', value: tripsWithHazard, icon: '🚨', color: '#f44336', unit: 'trips', description: 'Number of trips that had any hazard light activation', lowerIsBetter: true },
    { label: 'Avg Hazard / Trip', value: avgHazardPerTrip, icon: '📊', color: '#ff7043', unit: '', description: 'Average hazard light activations per trip', lowerIsBetter: true },
    { label: 'Headlight Duration', value: (totalHeadlightDur / 3600).toFixed(2), icon: '💡', color: '#42a5f5', unit: 'hrs', description: 'Total headlight-on time; reflects night or poor visibility driving', lowerIsBetter: false },
    { label: 'Headlight Usage Ratio', value: headlightUsageRatio, icon: '🌙', color: '#5c6bc0', unit: '%', description: 'Percentage of driving time with headlights on', lowerIsBetter: false },
    { label: 'Left Indicator Events', value: totalIndicatorLeft, icon: '↩️', color: '#66bb6a', unit: 'events', description: 'Left turn indicator activations', lowerIsBetter: false },
    { label: 'Right Indicator Events', value: totalIndicatorRight, icon: '↪️', color: '#26c6da', unit: 'events', description: 'Right turn indicator activations', lowerIsBetter: false },
    { label: 'Indicator Balance', value: (totalIndicatorLeft + totalIndicatorRight) > 0
        ? (totalIndicatorLeft / (totalIndicatorLeft + totalIndicatorRight) * 100).toFixed(0) + '% L'
        : null,
      icon: '⚖️', color: '#ab47bc', unit: '', description: 'Left-right indicator balance; extreme imbalance indicates route bias' },
  ];

  return (
    <div style={pageStyle} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.light}
        title="Light & Indicator Analysis"
        subtitle="Indicator usage, hazard activations and light event patterns"
      />
      <DateFilterBar title="Light & Indicator Analysis" onApply={() => setTrigger(prev => prev + 1)} />
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading light data…</div>}

      <div style={sectionTitle}>💡 Light System KPIs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi as any} />)}
      </div>

      <div style={sectionTitle}>📊 Light Usage Charts</div>
      <div style={twoCol}>
        <ChartCard
          title="Hazard Light Activation Count"
          data={lightData}
          type="bar"
          xKey="date"
          series={[{ key: 'hazardLightCount', color: '#ffd54f', name: 'Events' }]}
          description="Frequent hazard activations may indicate heavy-traffic routes or emergency stops"
        />
        <ChartCard
          title="Hazard Light Duration (sec)"
          data={lightData}
          type="area"
          xKey="date"
          series={[{ key: 'hazardLightDur', color: '#ef9a9a', name: 'Duration (sec)' }]}
          unit="sec"
          benchmark={300}
          benchmarkLabel="5 min alert"
        />
      </div>

      <div style={twoCol}>
        <ChartCard
          title="Headlight ON Duration (sec)"
          data={lightData}
          type="bar"
          xKey="date"
          series={[{ key: 'headlightDur', color: '#4dd0e1', name: 'Duration (sec)' }]}
          unit="sec"
          description="Headlight usage reflects night driving frequency"
        />
        <ChartCard
          title="Indicator Events (Left vs Right)"
          data={lightData}
          type="multibar"
          xKey="date"
          series={[
            { key: 'leftIndicator', color: '#66bb6a', name: 'Left Indicator' },
            { key: 'rightIndicator', color: '#ffa726', name: 'Right Indicator' },
          ]}
          description="Directional balance across trips"
        />
      </div>

      <div style={twoCol}>
        <ChartCard
          title="Hazard Severity Classification (sec)"
          data={hazardSeverity}
          type="multibar"
          xKey="date"
          series={[
            { key: 'short', color: '#ffd54f', name: '<1 min (Minor)' },
            { key: 'medium', color: '#ffa726', name: '1-5 min (Moderate)' },
            { key: 'long', color: '#ef5350', name: '>5 min (Severe)' },
          ]}
          description="Categorises hazard events by duration severity"
        />
        <ChartCard
          title="Indicator Distribution"
          data={indicatorData}
          type="pie"
          xKey="type"
          series={[{ key: 'count', color: '#66bb6a' }]}
          description="Overall left vs right indicator usage split"
        />
      </div>
    </div>
  );
};

export default LightDashboard;
