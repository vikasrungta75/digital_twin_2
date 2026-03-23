import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData, fetchTurnPercent } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties  = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' };
const sec: React.CSSProperties   = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase', letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties   = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };
const three: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 };

type HarshType = 'Acceleration'|'Brake'|'Turn';

const Radio: FC<{ opts:string[]; val:string; onChange:(v:any)=>void }> = ({ opts, val, onChange }) => (
  <div style={{ display:'flex', gap:12 }}>
    {opts.map(o=>(
      <label key={o} style={{ fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
        <input type="radio" checked={val===o} onChange={()=>onChange(o)}/> {o}
      </label>
    ))}
  </div>
);

const DrivingDashboard: FC = () => {
  const { apiParams } = useDt();
  const [od, setOd]       = useState<any[]>([]);
  const [tp, setTp]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [harshType, setHarshType]       = useState<HarshType>('Acceleration');
  const [accBeforeType, setAccBefore]   = useState<'Acceleration'|'Brake'>('Acceleration');
  const [trigger, setTrigger]           = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b] = await Promise.allSettled([fetchOverallData(apiParams), fetchTurnPercent(apiParams)]);
      if (a.status==='fulfilled') setOd(Array.isArray(a.value)?a.value:[]);
      if (b.status==='fulfilled') setTp(Array.isArray(b.value)?b.value:[]);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const n   = od.length||1;
  const tot = (k:string) => od.reduce((s,d)=>s+Number(d[k]||0),0);
  const avg = (k:string) => tot(k)/n;

  // All driving-related fields from vt_overall_data
  const totalHarshAcc     = tot('harsh_acc_count');
  const totalHarshBrk     = tot('harsh_brk_count');
  const totalHarshTurn    = tot('harsh_turn_count');
  const totalHarshAccDur  = tot('harsh_acc_dur_in_sec');
  const totalHarshBrkDur  = tot('harsh_brk_dur_in_sec');
  const totalHarshTurnDur = tot('harsh_turn_dur_in_sec');
  const totalOverspeeding = tot('overspeeding_count');
  const totalOverspeedDur = tot('overspeeding_dur_in_sec');
  const totalAccBeforeTurn= tot('acc_before_turn_count');
  const totalBrkAfterTurn = tot('brk_after_turn_count');
  const totalIdle         = tot('idle_time');
  const totalTurns        = tot('total_turns');
  const totalLeftTurns    = tot('left_turns');
  const totalRightTurns   = tot('right_turns');
  const totalDist         = od.reduce((s,d)=>s+Number(d.trip_distance||0),0);
  const totalHarsh        = totalHarshAcc + totalHarshBrk + totalHarshTurn;
  const harshPer100       = totalDist>0 ? (totalHarsh / (totalDist/100)) : 0;
  const driverScore       = Math.max(0,Math.min(100,Math.round(100 - harshPer100*2 - totalOverspeeding*0.5)));
  const avgSpeed          = avg('average_speed');
  const maxSpeed          = Math.max(...od.map(d=>Number(d.max_speed||0)),0);

  // Per-trip rows
  const rows = od.map(d => ({
    date:             (d.process_date||'').slice(5,10),
    harshAccCount:    Number(d.harsh_acc_count||0),
    harshAccDur:      Number(d.harsh_acc_dur_in_sec||0),
    harshBrkCount:    Number(d.harsh_brk_count||0),
    harshBrkDur:      Number(d.harsh_brk_dur_in_sec||0),
    harshTurnCount:   Number(d.harsh_turn_count||0),
    harshTurnDur:     Number(d.harsh_turn_dur_in_sec||0),
    overspeedCount:   Number(d.overspeeding_count||0),
    overspeedDur:     Number(d.overspeeding_dur_in_sec||0),
    accBeforeTurn:    Number(d.acc_before_turn_count||0),
    accBeforeTurnDur: Number(d.acc_before_turn_dur_in_sec||0),
    brkAfterTurn:     Number(d.brk_after_turn_count||0),
    brkAfterTurnDur:  Number(d.brk_after_turn_dur_in_sec||0),
    leftTurns:        Number(d.left_turns||0),
    rightTurns:       Number(d.right_turns||0),
    totalTurns:       Number(d.total_turns||0),
    idleTime:         Number(d.idle_time||0)/60,
    maxSpeed:         Number(d.max_speed||0),
    avgSpeed:         Number(d.average_speed||0),
  }));

  const harshMap: Record<HarshType,{ck:string;dk:string}> = {
    Acceleration: { ck:'harshAccCount',  dk:'harshAccDur'  },
    Brake:        { ck:'harshBrkCount',  dk:'harshBrkDur'  },
    Turn:         { ck:'harshTurnCount', dk:'harshTurnDur' },
  };
  const { ck, dk } = harshMap[harshType];

  const compositeRows = rows.map(r=>({ date:r.date, harshAcc:r.harshAccCount, harshBrk:r.harshBrkCount, harshTurn:r.harshTurnCount }));

  const turnPie = tp.length>0
    ? tp.map(d=>({ category:d.category, value:Number(d.value||0) }))
    : [
        { category:'Left Turn',  value: n>0 ? (totalLeftTurns/(Math.max(totalTurns,1)))*100 : 55 },
        { category:'Right Turn', value: n>0 ? (totalRightTurns/(Math.max(totalTurns,1)))*100 : 40 },
        { category:'Unclassified', value: n>0 ? (tot('unclassified')/(Math.max(totalTurns,1)))*100 : 5 },
      ];

  const kpis = [
    { label:'Harsh Acceleration',   value:totalHarshAcc,              icon:'🚀', color:'#e91e8c', unit:'events', lowerIsBetter:true, description:'G-force >0.3g longitudinal events' },
    { label:'Harsh Braking',        value:totalHarshBrk,              icon:'🛑', color:'#ef5350', unit:'events', lowerIsBetter:true, description:'Emergency braking events; linked to brake pad wear' },
    { label:'Harsh Cornering',      value:totalHarshTurn,             icon:'↩️', color:'#ffa726', unit:'events', lowerIsBetter:true, description:'Lateral G >0.3g; affects tyres and suspension' },
    { label:'Harsh Acc Duration',   value:(totalHarshAccDur/60).toFixed(1),  icon:'⏱️', color:'#f06292', unit:'min', lowerIsBetter:true },
    { label:'Harsh Brk Duration',   value:(totalHarshBrkDur/60).toFixed(1),  icon:'⏱️', color:'#ef9a9a', unit:'min', lowerIsBetter:true },
    { label:'Harsh Turn Duration',  value:(totalHarshTurnDur/60).toFixed(1), icon:'⏱️', color:'#ffcc80', unit:'min', lowerIsBetter:true },
    { label:'Overspeeding Events',  value:totalOverspeeding,          icon:'🚨', color:'#f44336', unit:'events', lowerIsBetter:true },
    { label:'Overspeeding Duration',value:(totalOverspeedDur/60).toFixed(1), icon:'⏰', color:'#ff7043', unit:'min', lowerIsBetter:true },
    { label:'Acc Before Turn',      value:totalAccBeforeTurn,         icon:'🔄', color:'#26c6da', unit:'events', lowerIsBetter:true, description:'Acceleration into turns — unsafe technique' },
    { label:'Brk After Turn',       value:totalBrkAfterTurn,          icon:'🔄', color:'#5c6bc0', unit:'events', lowerIsBetter:true, description:'Braking after turn entry — loss of control risk' },
    { label:'Total Harsh Events',   value:totalHarsh,                 icon:'⚠️', color:'#ff9800', unit:'',       lowerIsBetter:true },
    { label:'Harsh / 100 km',       value:harshPer100.toFixed(2),     icon:'📐', color:'#f06292', unit:'',       lowerIsBetter:true, description:'Normalised; industry benchmark <5 per 100 km' },
    { label:'Driver Safety Score',  value:driverScore,                icon:'⭐', color:driverScore>70?'#66bb6a':driverScore>40?'#ffa726':'#ef5350', unit:'/100', lowerIsBetter:false },
    { label:'Avg Speed',            value:avgSpeed.toFixed(1),        icon:'⚡', color:'#42a5f5', unit:'km/h', lowerIsBetter:false },
    { label:'Peak Speed',           value:maxSpeed.toFixed(0),        icon:'🏎️', color:'#7c4dff', unit:'km/h', lowerIsBetter:true },
    { label:'Total Idle Time',      value:(totalIdle/60).toFixed(1),  icon:'⏸️', color:'#607d8b', unit:'min',   lowerIsBetter:true },
    { label:'Total Turns',          value:totalTurns,                 icon:'🔁', color:'#8bc34a', unit:'',       lowerIsBetter:false },
    { label:'Left Turns',           value:totalLeftTurns,             icon:'↩️', color:'#42a5f5', unit:'',       lowerIsBetter:false },
    { label:'Right Turns',          value:totalRightTurns,            icon:'↪️', color:'#ffa726', unit:'',       lowerIsBetter:false },
  ];

  return (
    <div style={page} id="dt-page-content">
      <DateFilterBar title="Driving Analysis" onApply={() => setTrigger(prev => prev + 1)}/>
      {loading && <div style={{ textAlign:'center', padding:28, color:'#aaa' }}>Loading driving data…</div>}

      <div style={sec}>🏎️ Driving KPIs</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:12, marginBottom:20 }}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>

      <div style={sec}>💥 Harsh Event Charts</div>
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Harsh Event Count & Duration</span>
          <Radio opts={['Acceleration','Brake','Turn']} val={harshType} onChange={setHarshType}/>
        </div>
        <ChartCard title="" data={rows} type="multibar" xKey="date" expandable={false}
          series={[{ key:ck, color:'#e91e8c', name:'Count' },{ key:dk, color:'#ffa726', name:'Duration (sec)' }]}
          height={240}/>
      </div>

      <ChartCard title="All Harsh Events — Composite per Day" data={compositeRows} type="multibar" xKey="date"
        series={[
          {key:'harshAcc',color:'#e91e8c',name:'Acc'},
          {key:'harshBrk',color:'#ef5350',name:'Brk'},
          {key:'harshTurn',color:'#ffa726',name:'Turn'},
        ]} height={240} description="Side-by-side view of all three harsh event types"/>
      <div style={{ height:14 }}/>

      <div style={two}>
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:13 }}>Acc Before / Brk After Turn</span>
            <Radio opts={['Acceleration','Brake']} val={accBeforeType} onChange={setAccBefore}/>
          </div>
          <ChartCard title="" data={rows} type="multibar" xKey="date" expandable={false}
            series={accBeforeType==='Acceleration'
              ? [{key:'accBeforeTurn',color:'#42a5f5',name:'Count'},{key:'accBeforeTurnDur',color:'#1565c0',name:'Dur (sec)'}]
              : [{key:'brkAfterTurn',color:'#42a5f5',name:'Count'},{key:'brkAfterTurnDur',color:'#1565c0',name:'Dur (sec)'}]}
            height={220}/>
        </div>
        <ChartCard title="Turn Distribution (Left vs Right)" data={turnPie} type="pie" xKey="category"
          series={[{key:'value',color:'#e91e8c'}]}
          description="Balance of left/right turns across all trips" height={260}/>
      </div>

      <div style={two}>
        <ChartCard title="Overspeeding — Count & Duration" data={rows} type="multibar" xKey="date"
          series={[{key:'overspeedCount',color:'#f44336',name:'Count'},{key:'overspeedDur',color:'#ff7043',name:'Dur (sec)'}]}
          height={240}/>
        <ChartCard title="Turn Counts per Day" data={rows} type="multibar" xKey="date"
          series={[
            {key:'totalTurns',color:'#42a5f5',name:'Total'},
            {key:'leftTurns', color:'#66bb6a',name:'Left'},
            {key:'rightTurns',color:'#ffa726',name:'Right'},
          ]} height={240}/>
      </div>

      <div style={two}>
        <ChartCard title="Speed Profile — Max vs Avg" data={rows} type="multibar" xKey="date"
          series={[{key:'maxSpeed',color:'#ef5350',name:'Max'},{key:'avgSpeed',color:'#42a5f5',name:'Avg'}]}
          unit="km/h" benchmark={80} benchmarkLabel="80 km/h" height={240}/>
        <ChartCard title="Idle Time per Trip (min)" data={rows} type="bar" xKey="date"
          series={[{key:'idleTime',color:'#607d8b',name:'Idle (min)'}]}
          benchmark={5} benchmarkLabel="5 min alert" unit="min" height={240}/>
      </div>
    </div>
  );
};

export default DrivingDashboard;
