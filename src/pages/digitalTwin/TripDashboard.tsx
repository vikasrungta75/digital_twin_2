import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchOverallData, fetchOverallKpiData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' as const };
const sec: React.CSSProperties  = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase' as const, letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };

const TripDashboard: FC = () => {
  const { apiParams } = useDt();
  const [od, setOd]           = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b] = await Promise.allSettled([fetchOverallData(apiParams), fetchOverallKpiData(apiParams)]);
      if (a.status==='fulfilled') setOd(Array.isArray(a.value)?a.value:[]);
      if (b.status==='fulfilled') setKpiData(Array.isArray(b.value)?b.value:[]);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const n   = od.length||1;
  const tot = (k:string) => od.reduce((s,d)=>s+Number(d[k]||0),0);
  const avg = (k:string) => tot(k)/n;
  const bl  = kpiData[0]||{};

  const totalTrips   = od.length;
  const totalDist    = tot('trip_distance');
  const totalDur     = tot('trip_duration_minute');
  const totalIdle    = tot('idle_time');
  const totalKmsLoss = tot('kms_loss_mlg');
  const odoResets    = tot('odometerresetcount');
  const avgAlt       = avg('altitude_median');
  const avgGsm       = avg('gsm_strength_per');
  const longestTrip  = Math.max(...od.map(d=>Number(d.trip_distance||0)),0);
  const maxDur       = Math.max(...od.map(d=>Number(d.trip_duration_minute||0)),0);
  const avgIdleRatio = (od.reduce((s,d)=>{
    const dur=Number(d.trip_duration_minute||0)*60;
    return s+(dur>0?Number(d.idle_time||0)/dur:0);
  },0)/n*100);

  const shortTrips = od.filter(d=>Number(d.trip_distance||0)<5).length;
  const medTrips   = od.filter(d=>Number(d.trip_distance||0)>=5&&Number(d.trip_distance||0)<30).length;
  const longTrips  = od.filter(d=>Number(d.trip_distance||0)>=30).length;
  const tripsWithGps = od.filter(d=>d.trip_start_latitude&&d.trip_end_latitude).length;

  // Time-of-day distribution from trip_start_time
  const hourBuckets = Array(24).fill(0);
  od.forEach(d=>{
    const t = d.trip_start_time||'';
    const hr = parseInt(t.split('T')[1]?.slice(0,2)||t.slice(11,13)||'0',10);
    if(hr>=0&&hr<24) hourBuckets[hr]++;
  });
  const hourData = hourBuckets.map((count,hr)=>({ hour:`${String(hr).padStart(2,'0')}:00`, count })).filter(x=>x.count>0);

  const rows = od.map(d=>({
    date:       (d.process_date||'').slice(5,10),
    dur:        Number(d.trip_duration_minute||0),
    idle:       Number(d.idle_time||0)/60,
    dist:       Number(d.trip_distance||d.trip_len||0),
    avg_speed:  Number(d.average_speed||0),
    altitude:   Number(d.altitude_median||0),
    gsm:        Number(d.gsm_strength_per||0),
    start_mlg:  Number(d.start_mlg||0),
    end_mlg:    Number(d.end_mlg||0),
    kms_loss:   Number(d.kms_loss_mlg||0),
    door_lock:  Number(d.num_door_lock_events||0),
    door_unlock:Number(d.num_door_unlock_events||0),
    process_time:Number(d.process_time||0),
  }));

  const idleRatioRows = od.map(d=>{
    const dur=Number(d.trip_duration_minute||0)*60;
    return { date:(d.process_date||'').slice(5,10), ratio:dur>0?parseFloat((Number(d.idle_time||0)/dur*100).toFixed(1)):0 };
  });

  // Door security — trips ending with unlocked doors
  const tripsUnlockedEnd   = od.filter(d=>d.all_doors_lock_status===false||d.all_doors_lock_status===0).length;
  const tripsDriverUnlocked= od.filter(d=>d.driver_door_lock_status===false||d.driver_door_lock_status===0).length;

  const catData = [
    {category:'Short <5km',count:shortTrips},
    {category:'Med 5-30km',count:medTrips},
    {category:'Long >30km',count:longTrips},
  ];

  const kpis = [
    { label:'Total Trips',         value:totalTrips,               icon:'🚗', color:'#42a5f5', unit:'',    lowerIsBetter:false },
    { label:'Total Distance',      value:totalDist.toFixed(1),     icon:'📍', color:'#e91e8c', unit:'km',  lowerIsBetter:false },
    { label:'Avg Trip Duration',   value:(totalDur/n).toFixed(1),  baseline:Number(bl.bsline_trip_duration_minute||0)||null, icon:'⏱️', color:'#ffa726', unit:'min', lowerIsBetter:false },
    { label:'Avg Trip Distance',   value:(totalDist/n).toFixed(2), baseline:Number(bl.bsline_trip_distance||0)||null, icon:'📐', color:'#66bb6a', unit:'km', lowerIsBetter:false },
    { label:'Longest Trip',        value:longestTrip.toFixed(1),   icon:'🛣️', color:'#7c4dff', unit:'km',  lowerIsBetter:false },
    { label:'Max Trip Duration',   value:maxDur.toFixed(0),        icon:'⏰', color:'#ab47bc', unit:'min', lowerIsBetter:false },
    { label:'Total Idle Time',     value:(totalIdle/60).toFixed(1),baseline:Number(bl.bsline_idle_time||0)/60||null, icon:'⏸️', color:'#607d8b', unit:'min', lowerIsBetter:true },
    { label:'Avg Idle Ratio',      value:avgIdleRatio.toFixed(1),  icon:'📊', color:'#ef5350', unit:'%',   lowerIsBetter:true, description:'>25% idle is excessive' },
    { label:'Total Mileage Loss',  value:totalKmsLoss.toFixed(1),  baseline:Number(bl.bsline_kms_loss_mlg||0)||null, icon:'📉', color:'#ff7043', unit:'km', lowerIsBetter:true },
    { label:'Short Trips <5km',    value:shortTrips,               icon:'🏙️', color:'#26c6da', unit:'',    lowerIsBetter:false, description:'Short trips cause disproportionate engine wear' },
    { label:'Medium Trips 5-30km', value:medTrips,                 icon:'🛤️', color:'#8bc34a', unit:'',    lowerIsBetter:false },
    { label:'Long Trips >30km',    value:longTrips,                icon:'🚀', color:'#5c6bc0', unit:'',    lowerIsBetter:false },
    { label:'Trips with GPS',      value:tripsWithGps,             icon:'📡', color:'#4caf50', unit:'',    lowerIsBetter:false, description:'Trips with start+end coordinates recorded' },
    { label:'Door Lock Events',    value:tot('num_door_lock_events'), baseline:Number(bl.bsline_num_door_lock_events||0)||null, icon:'🔒', color:'#78909c', unit:'', lowerIsBetter:false },
    { label:'Door Unlock Events',  value:tot('num_door_unlock_events'), baseline:Number(bl.bsline_num_door_unlock_events||0)||null, icon:'🔓', color:'#90a4ae', unit:'', lowerIsBetter:false },
    { label:'Trips — Door Unlocked at End', value:tripsUnlockedEnd, icon:'🚪', color:'#f44336', unit:'trips', lowerIsBetter:true, description:'all_doors_lock_status=false when trip ended — security risk' },
    { label:'Avg Altitude',        value:avgAlt.toFixed(0),        baseline:Number(bl.bsline_altitude_median||0)||null, icon:'⛰️', color:'#795548', unit:'m', lowerIsBetter:false, description:'Higher altitude reduces fuel efficiency' },
    { label:'Avg GSM Signal',      value:avgGsm.toFixed(1),        baseline:Number(bl.bsline_gsm_strength_per||0)||null, icon:'📶', color:'#42a5f5', unit:'%', lowerIsBetter:false },
    { label:'Odometer Resets',     value:odoResets,                baseline:Number(bl.bsline_odometerresetcount||0)||null, icon:'🔄', color:'#ff5722', unit:'', lowerIsBetter:true, description:'>0 = potential tampering — warranty red flag' },
  ];

  return (
    <div style={page} id="dt-page-content">
      <DateFilterBar title="Trip Analysis" onApply={()=>setTrigger(prev=>prev+1)}/>
      {loading && <div style={{textAlign:'center',padding:28,color:'#aaa'}}>Loading trip data…</div>}

      {/* Odometer reset alert */}
      {odoResets > 0 && (
        <div style={{background:'#ffebee',border:'2px solid #ef9a9a',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:24}}>🚨</span>
          <div>
            <div style={{fontWeight:800,color:'#c62828',fontSize:14}}>ODOMETER RESET DETECTED — {odoResets} event(s)</div>
            <div style={{fontSize:13,color:'#555'}}>Potential warranty-voiding event — escalate for investigation immediately.</div>
          </div>
        </div>
      )}

      {tripsUnlockedEnd > 0 && (
        <div style={{background:'#fff3e0',border:'2px solid #ffcc02',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:24}}>🚪</span>
          <div>
            <div style={{fontWeight:800,color:'#e65100',fontSize:14}}>SECURITY ALERT — {tripsUnlockedEnd} trip(s) ended with doors unlocked</div>
            <div style={{fontSize:13,color:'#555'}}>all_doors_lock_status was false at trip end. Review locations and times.</div>
          </div>
        </div>
      )}

      <div style={sec}>🚗 Trip KPIs (vs Baseline)</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:12,marginBottom:20}}>
        {kpis.map(k=><KpiCard key={k.label} {...k as any}/>)}
      </div>

      <div style={sec}>📊 Trip Charts</div>
      <div style={two}>
        <ChartCard title="Trip Duration (min)" data={rows} type="bar" xKey="date"
          series={[{key:'dur',color:'#9fa8da',name:'Duration'}]} unit="min" height={240}/>
        <ChartCard title="Trip Distance (km)" data={rows} type="area" xKey="date"
          series={[{key:'dist',color:'#e91e8c',name:'Distance'}]} unit="km" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="Idle Time per Trip (min)" data={rows} type="bar" xKey="date"
          series={[{key:'idle',color:'#80deea',name:'Idle'}]} unit="min"
          benchmark={5} benchmarkLabel="5 min threshold" height={240}/>
        <ChartCard title="Idle Ratio per Trip (%)" data={idleRatioRows} type="area" xKey="date"
          series={[{key:'ratio',color:'#ef5350',name:'Idle %'}]} unit="%"
          benchmark={25} benchmarkLabel="25% alert" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="Trip Category Distribution" data={catData} type="bar" xKey="category"
          series={[{key:'count',color:'#66bb6a',name:'Trips'}]}
          description="Short <5 km trips cause disproportionate engine wear" height={240}/>
        <ChartCard title="Trips by Hour of Day" data={hourData} type="bar" xKey="hour"
          series={[{key:'count',color:'#42a5f5',name:'Trips'}]}
          description="Time-of-day distribution of trip start times — reveals peak usage patterns" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="Altitude per Trip (m)" data={rows} type="area" xKey="date"
          series={[{key:'altitude',color:'#795548',name:'Altitude'}]} unit="m"
          description="Higher altitude reduces engine power and fuel efficiency" height={240}/>
        <ChartCard title="GSM Signal Strength (%)" data={rows} type="line" xKey="date"
          series={[{key:'gsm',color:'#42a5f5',name:'GSM %'}]} unit="%"
          benchmark={60} benchmarkLabel="Min 60%" height={240}/>
      </div>
      <div style={two}>
        <ChartCard title="Door Lock / Unlock Events" data={rows} type="multibar" xKey="date"
          series={[{key:'door_lock',color:'#78909c',name:'Lock'},{key:'door_unlock',color:'#ef5350',name:'Unlock'}]}
          description="Unusual unlock patterns at odd hours may indicate security risk" height={240}/>
        <ChartCard title="Trip Mileage — Start / End / Loss" data={rows} type="multibar" xKey="date"
          series={[{key:'start_mlg',color:'#ffcc80',name:'Start MLG'},{key:'end_mlg',color:'#66bb6a',name:'End MLG'},{key:'kms_loss',color:'#ef9a9a',name:'KM Loss'}]}
          height={240}/>
      </div>

      {/* GPS Map of trip start/end points */}
      {tripsWithGps > 0 && (() => {
        const sample = od.find(d=>d.trip_start_latitude&&d.trip_end_latitude);
        if (!sample) return null;
        const lat = Number(sample.trip_start_latitude);
        const lng = Number(sample.trip_start_longitude);
        return (
          <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>📍 Trip Start/End Locations (sample)</div>
            <iframe title="Trip Map" style={{width:'100%',height:300,border:'none',borderRadius:10}}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-2}%2C${lat-2}%2C${lng+2}%2C${lat+2}&layer=mapnik&marker=${lat}%2C${lng}`}/>
            <p style={{fontSize:10,color:'#bbb',marginTop:4,textAlign:'right'}}>Showing first GPS-recorded trip · © OpenStreetMap contributors</p>
          </div>
        );
      })()}
    </div>
  );
};

export default TripDashboard;
