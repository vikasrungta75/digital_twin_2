import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchSpeedDistribution, fetchOverallData, fetchOverallKpiData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' as const };
const sec: React.CSSProperties  = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase' as const, letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };

const SpeedDashboard: FC = () => {
  const { apiParams } = useDt();
  const [speedDist, setSpeedDist] = useState<any[]>([]);
  const [od, setOd]               = useState<any[]>([]);
  const [kpiData, setKpiData]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [trigger, setTrigger]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b,c] = await Promise.allSettled([
        fetchSpeedDistribution(apiParams),
        fetchOverallData(apiParams),
        fetchOverallKpiData(apiParams),
      ]);
      if (a.status==='fulfilled') setSpeedDist(Array.isArray(a.value)?a.value:[]);
      if (b.status==='fulfilled') setOd(Array.isArray(b.value)?b.value:[]);
      if (c.status==='fulfilled') setKpiData(Array.isArray(c.value)?c.value:[]);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const n   = od.length||1;
  const tot = (k:string) => od.reduce((s,d)=>s+Number(d[k]||0),0);
  const avg = (k:string) => tot(k)/n;
  const bl  = kpiData[0]||{};

  const maxSpeed       = Math.max(...od.map(d=>Number(d.max_speed||0)),0);
  const avgSpeed       = avg('average_speed');
  const avgMaxSpeed    = avg('max_speed');
  const totalOverspe   = tot('overspeeding_count');
  const totalOverspeDur= tot('overspeeding_dur_in_sec');
  const tripsAbove100  = od.filter(d=>Number(d.max_speed||0)>100).length;
  const tripsAbove120  = od.filter(d=>Number(d.max_speed||0)>120).length;
  const compliance     = od.length>0 ? ((od.length-od.filter(d=>Number(d.overspeeding_count||0)>0).length)/od.length*100) : 100;

  const rows = od.map(d=>({
    date:        (d.process_date||'').slice(5,10),
    max_speed:   Number(d.max_speed||0),
    avg_speed:   Number(d.average_speed||0),
    ov_count:    Number(d.overspeeding_count||0),
    ov_dur:      Number(d.overspeeding_dur_in_sec||0),
    '0-20':      Number(d.speed_distribution_0_20_kmh||0),
    '20-60':     Number(d.speed_distribution_20_60_kmh||0),
    '60-80':     Number(d.speed_distribution_60_80_kmh||0),
    '80-100':    Number(d.speed_distribution_80_100_kmh||0),
    '100-120':   Number(d.speed_distribution_100_120_kmh||0),
    '120-140':   Number(d.speed_distribution_120_140_kmh||0),
    '140+':      Number(d.speed_distribution_140_plus_kmh||0),
  }));

  // Speed band totals for histogram
  const BANDS = ['0-20','20-60','60-80','80-100','100-120','120-140','140+'];
  const BSLINE_KEYS: Record<string,string> = {
    '0-20':    'bsline_speed_distribution_0_20_kmh',
    '20-60':   'bsline_speed_distribution_20_60_kmh',
    '60-80':   'bsline_speed_distribution_60_80_kmh',
    '80-100':  'bsline_speed_distribution_80_100_kmh',
    '100-120': 'bsline_speed_distribution_100_120_kmh',
    '120-140': 'bsline_speed_distribution_120_140_kmh',
    '140+':    'bsline_speed_distribution_140_plus_kmh',
  };
  const OD_KEYS: Record<string,string> = {
    '0-20':'speed_distribution_0_20_kmh','20-60':'speed_distribution_20_60_kmh',
    '60-80':'speed_distribution_60_80_kmh','80-100':'speed_distribution_80_100_kmh',
    '100-120':'speed_distribution_100_120_kmh','120-140':'speed_distribution_120_140_kmh',
    '140+':'speed_distribution_140_plus_kmh',
  };
  const bandHistogram = BANDS.map(band=>({
    band,
    current:  tot(OD_KEYS[band]),
    baseline: Number(bl[BSLINE_KEYS[band]]||0)*od.length, // scale baseline to match sum
  })).filter(x=>x.current>0||x.baseline>0);

  const sdData = speedDist.length>0
    ? speedDist.map(d=>({ speed:d.speed||d.index, value:Number(d.value||0), baseline:Number(d.baseline||0) }))
    : rows;

  const kpis = [
    { label:'Peak Speed',          value:maxSpeed.toFixed(0),         baseline:Number(bl.bsline_max_speed||0)||null,             icon:'🏎️', color:'#ef5350', unit:'km/h', lowerIsBetter:true },
    { label:'Avg Speed',           value:avgSpeed.toFixed(1),         baseline:Number(bl.bsline_average_speed||0)||null,         icon:'⚡', color:'#42a5f5', unit:'km/h', lowerIsBetter:false, description:'Urban benchmark 30-40 km/h' },
    { label:'Avg Max Speed / Trip',value:avgMaxSpeed.toFixed(1),      icon:'📈', color:'#ffa726', unit:'km/h', lowerIsBetter:true },
    { label:'Overspeeding Events', value:totalOverspe,                baseline:Number(bl.bsline_overspeeding_count||0)||null,    icon:'🚨', color:'#f44336', unit:'events', lowerIsBetter:true },
    { label:'Overspeeding Duration',value:(totalOverspeDur/60).toFixed(1), baseline:Number(bl.bsline_overspeeding_dur_in_sec||0)/60||null, icon:'⏱️', color:'#ff7043', unit:'min', lowerIsBetter:true },
    { label:'Trips >100 km/h',     value:tripsAbove100,               icon:'⚠️', color:'#ff9800', unit:'trips', lowerIsBetter:true },
    { label:'Trips >120 km/h',     value:tripsAbove120,               icon:'🔴', color:'#c62828', unit:'trips', lowerIsBetter:true },
    { label:'Speed Compliance',    value:compliance.toFixed(1),       icon:'✅', color:'#66bb6a', unit:'%',    lowerIsBetter:false, description:'% trips with zero overspeeding events' },
  ];

  return (
    <div style={page} id="dt-page-content">
      <DateFilterBar title="Speed Analysis" onApply={()=>setTrigger(prev=>prev+1)}/>
      {loading && <div style={{textAlign:'center',padding:28,color:'#aaa'}}>Loading speed data…</div>}

      <div style={sec}>🚦 Speed KPIs (vs Baseline)</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:12,marginBottom:20}}>
        {kpis.map(k=><KpiCard key={k.label} {...k as any}/>)}
      </div>

      <div style={sec}>📊 Speed Charts</div>
      <div style={two}>
        <ChartCard title="Max Speed vs Avg Speed per Trip" data={rows} type="multibar" xKey="date"
          series={[{key:'max_speed',color:'#ef5350',name:'Max'},{key:'avg_speed',color:'#42a5f5',name:'Avg'}]}
          unit="km/h" benchmark={80} benchmarkLabel="80 km/h limit" height={240}/>
        <ChartCard title="Overspeeding Count & Duration per Trip" data={rows} type="multibar" xKey="date"
          series={[{key:'ov_count',color:'#f44336',name:'Count'},{key:'ov_dur',color:'#ff7043',name:'Dur (sec)'}]}
          height={240}/>
      </div>

      {bandHistogram.length>0 && (
        <>
          <ChartCard title="Speed Band Distribution — Current vs Fleet Baseline"
            data={bandHistogram} type="multibar" xKey="band"
            series={[{key:'current',color:'#42a5f5',name:'Current'},{key:'baseline',color:'#b0bec5',name:'Baseline'}]}
            height={280}
            description="Compare how much time this vehicle spends in each speed band vs fleet baseline. More time in 60-80 = efficient; more in 100+ = safety risk"/>
          <div style={{height:14}}/>
        </>
      )}

      <ChartCard title="Speed Distribution Profile (per trip)" data={sdData.length===speedDist.length && speedDist.length>0 ? sdData : rows}
        type={speedDist.length>0?'multibar':'area'}
        xKey={speedDist.length>0?'speed':'date'}
        series={speedDist.length>0
          ? [{key:'value',color:'#42a5f5',name:'Current'},{key:'baseline',color:'#b0bec5',name:'Baseline'}]
          : [{key:'0-20',color:'#ff7043'},{key:'20-60',color:'#ffa726'},{key:'60-80',color:'#66bb6a'},{key:'80-100',color:'#42a5f5'},{key:'100-120',color:'#26c6da'},{key:'120-140',color:'#7e57c2'},{key:'140+',color:'#ef5350'}]}
        height={320}
        description="Distribution of time spent in each speed band — lower bands are safer and more fuel efficient"/>
    </div>
  );
};

export default SpeedDashboard;
