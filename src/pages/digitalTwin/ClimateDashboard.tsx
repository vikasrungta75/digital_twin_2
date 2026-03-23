import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchAcDistribution, fetchOverallData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' };
const sec: React.CSSProperties  = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase', letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };

const ClimateDashboard: FC = () => {
  const { apiParams } = useDt();
  const [acDist, setAcDist] = useState<any[]>([]);
  const [od, setOd]         = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b] = await Promise.allSettled([fetchAcDistribution(apiParams), fetchOverallData(apiParams)]);
      if (a.status==='fulfilled') setAcDist(Array.isArray(a.value)?a.value:[]);
      if (b.status==='fulfilled') setOd(Array.isArray(b.value)?b.value:[]);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const n   = od.length||1;
  const tot = (k:string) => od.reduce((s,d)=>s+Number(d[k]||0),0);
  const avg = (k:string) => tot(k)/n;

  // AC fields from vt_overall_data
  const totalAcDur      = tot('ac_usage_duration');
  const totalAcFreq     = tot('ac_usage_frequency');
  const avgAcPct        = avg('percentage_ac_on');
  const totalKmsLoss    = tot('kms_loss_mlg');
  const avgInsideTemp   = avg('inside_air_temp');
  const totalDelayedAc  = od.filter(d=>(d.delayed_ac_usage||'').toLowerCase()==='yes'||d.delayed_ac_usage==='1'||d.delayed_ac_usage===1).length;
  const totalDist       = od.reduce((s,d)=>s+Number(d.trip_distance||0),0);

  // AC temperature status bands (from JSON schema)
  const acTempTot = (k:string) => od.reduce((s,d)=>s+Number(d[k]||0),0);
  const tempBands = [
    { band:'<15°C',    val: acTempTot('ac_temperature_status_lt_15c') },
    { band:'15-20°C',  val: acTempTot('ac_temperature_status_15c_20c') },
    { band:'20-25°C',  val: acTempTot('ac_temperature_status_20c_25c') },
    { band:'25-35°C',  val: acTempTot('ac_temperature_status_25c_35c') },
    { band:'35-40°C',  val: acTempTot('ac_temperature_status_35c_40c') },
    { band:'40-45°C',  val: acTempTot('ac_temperature_status_40c_45c') },
    { band:'45-50°C',  val: acTempTot('ac_temperature_status_45c_50c') },
    { band:'50-60°C',  val: acTempTot('ac_temperature_status_50c_60c') },
    { band:'>60°C',    val: acTempTot('ac_temperature_status_gt_60c') },
  ].filter(x=>x.val>0);

  const acMileagePct = totalDist>0 ? ((totalKmsLoss/totalDist)*100) : 0;
  const mostUsedBand = tempBands.length>0 ? tempBands.reduce((a,b)=>a.val>b.val?a:b).band : '—';

  // Per-trip rows
  const rows = od.map(d=>({
    date:       (d.process_date||'').slice(5,10),
    acDur:      Number(d.ac_usage_duration||0),
    acFreq:     Number(d.ac_usage_frequency||0),
    acPct:      Number(d.percentage_ac_on||0),
    kmsLoss:    Number(d.kms_loss_mlg||0),
    insideTemp: Number(d.inside_air_temp||0),
    tripDur:    Number(d.trip_duration_minute||0)*60,
  }));

  const acDistData = acDist.map(d=>({ temp:d.temp||d.index, value:Number(d.value||0), baseline:Number(d.baseline||0) }));

  const kpis = [
    { label:'Avg AC Duration/Trip',  value:(totalAcDur/n).toFixed(1),   icon:'❄️', color:'#42a5f5', unit:'sec',  lowerIsBetter:false },
    { label:'Total AC Switch Events',value:totalAcFreq,                  icon:'🔄', color:'#26c6da', unit:'',     lowerIsBetter:false, description:'High cycling may indicate compressor issues' },
    { label:'Avg AC Usage %',        value:avgAcPct.toFixed(1),          icon:'📊', color:'#5c6bc0', unit:'%',    lowerIsBetter:false },
    { label:'Total Mileage Loss (AC)',value:totalKmsLoss.toFixed(1),      icon:'📉', color:'#ef5350', unit:'km',   lowerIsBetter:true },
    { label:'AC Mileage Impact',     value:acMileagePct.toFixed(1),       icon:'⛽', color:'#ffa726', unit:'%',    lowerIsBetter:true, description:'Benchmark: 8-12% for Indian conditions' },
    { label:'Avg Cabin Temp',        value:avgInsideTemp.toFixed(1),      icon:'🌡️', color:'#ff8a65', unit:'°C',   lowerIsBetter:false, description:'Mean inside air temperature from sensor' },
    { label:'Most Used AC Temp Band',value:mostUsedBand,                  icon:'🎯', color:'#ab47bc', unit:'',     lowerIsBetter:false },
    { label:'Delayed AC Events',     value:totalDelayedAc,               icon:'⏳', color:'#78909c', unit:'trips', lowerIsBetter:false, description:'Trips where AC was switched on with a delay' },
    { label:'AC Efficiency Score',   value:avgAcPct>0 ? Math.max(0,100-acMileagePct*5).toFixed(0):null, icon:'⭐', color:'#66bb6a', unit:'/100', lowerIsBetter:false },
  ];

  return (
    <div style={page} id="dt-page-content">
      <DateFilterBar title="Climate & HVAC Analysis" onApply={() => setTrigger(prev => prev + 1)}/>
      {loading && <div style={{ textAlign:'center', padding:28, color:'#aaa' }}>Loading climate data…</div>}

      <div style={sec}>🌡️ HVAC KPIs</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:12, marginBottom:20 }}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>

      <div style={sec}>📊 HVAC Charts</div>
      <div style={two}>
        <ChartCard title="AC Usage Duration (sec/trip)" data={rows} type="bar" xKey="date"
          series={[{key:'acDur',color:'#42a5f5',name:'Duration (sec)'}]} unit="sec" height={240}/>
        <ChartCard title="AC Usage Frequency (events/trip)" data={rows} type="bar" xKey="date"
          series={[{key:'acFreq',color:'#5c6bc0',name:'Events'}]}
          description="High frequency = compressor cycling — check refrigerant level" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="% of Trip with AC ON" data={rows} type="area" xKey="date"
          series={[{key:'acPct',color:'#ffa726',name:'AC ON %'}]} unit="%"
          benchmark={60} benchmarkLabel="Typical 60%" height={240}/>
        <ChartCard title="Mileage Loss due to AC (km)" data={rows} type="bar" xKey="date"
          series={[{key:'kmsLoss',color:'#ef5350',name:'KM Loss'}]} unit="km"
          description="Fuel-equivalent mileage reduction from AC compressor load" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="Cabin Inside Air Temperature (°C)" data={rows} type="area" xKey="date"
          series={[{key:'insideTemp',color:'#ff8a65',name:'Inside Temp'}]} unit="°C"
          benchmark={28} benchmarkLabel="28°C comfort" height={240}/>
        <ChartCard title="AC Active vs Engine-On Time" data={rows} type="multibar" xKey="date"
          series={[{key:'tripDur',color:'#b0bec5',name:'Engine-On (sec)'},{key:'acDur',color:'#42a5f5',name:'AC-On (sec)'}]}
          description="Ratio of AC-on to total engine-on time" height={240}/>
      </div>
      {tempBands.length>0 && (
        <ChartCard title="AC Temperature Band Distribution (all trips)"
          data={tempBands} type="bar" xKey="band"
          series={[{key:'val',color:'#7e57c2',name:'Usage Count'}]}
          description="How much time the cabin temperature was in each band — reflects HVAC effectiveness and ambient heat"
          height={280}/>
      )}
      {acDistData.length>0 && (
        <>
          <div style={{ height:14 }}/>
          <ChartCard title="AC Setting Temperature Distribution (current vs baseline)"
            data={acDistData} type="multibar" xKey="temp"
            series={[{key:'value',color:'#7e57c2',name:'Current'},{key:'baseline',color:'#b0bec5',name:'Baseline'}]}
            height={280} description="AC set-temperature frequency; skewed right means passenger prefers very cold settings"/>
        </>
      )}
    </div>
  );
};

export default ClimateDashboard;
