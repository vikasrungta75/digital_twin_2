import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchVehicleInfo, fetchVehicleUsage, fetchOverallData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';

const page: React.CSSProperties  = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' };
const sec: React.CSSProperties   = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase', letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const tile: React.CSSProperties  = { background:'#fff', borderRadius:12, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:70 };
const tval: React.CSSProperties  = { fontSize:16, fontWeight:800, color:'#111', marginBottom:3, textAlign:'center', wordBreak:'break-all' };
const tlbl: React.CSSProperties  = { fontSize:11, color:'#666', fontWeight:600, textAlign:'center', lineHeight:1.3 };
const two: React.CSSProperties   = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };

const InfoTile: FC<{ label:string; value:any; accent?:string }> = ({ label, value, accent='#e91e8c' }) => (
  <div style={{ ...tile, borderTop:`3px solid ${accent}` }}>
    <div style={tval}>{value||'—'}</div>
    <div style={tlbl}>{label}</div>
  </div>
);

const OverviewDashboard: FC = () => {
  const { vin, apiParams } = useDt();
  const [vi, setVi]     = useState<any>({});
  const [us, setUs]     = useState<any>({});
  const [od, setOd]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b,c] = await Promise.allSettled([
        fetchVehicleInfo(vin),
        fetchVehicleUsage({ vin:apiParams.vin, startdate:apiParams.startdate, enddate:apiParams.enddate }),
        fetchOverallData(apiParams),
      ]);
      if (a.status==='fulfilled') { const d = Array.isArray(a.value)?a.value[0]:a.value; setVi(d||{}); }
      if (b.status==='fulfilled') { const d = Array.isArray(b.value)?b.value[0]:b.value; setUs(d||{}); }
      if (c.status==='fulfilled') setOd(Array.isArray(c.value)?c.value:[]);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [vin, apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const accents = ['#42a5f5','#e91e8c','#ffa726','#66bb6a','#ab47bc','#ef5350','#26c6da','#8bc34a','#ff7043','#5c6bc0','#00bcd4','#f06292','#80cbc4','#ffca28','#78909c','#795548'];

  // vt_overview_vehicle_info fields
  const infoTiles = [
    { label:'Vehicle Model',       value: vi.vehicle_model||vi.vehicleModel||'—' },
    { label:'Variant',             value: vi.vehicle_variant||vi.modelVariant||'—' },
    { label:'Transmission',        value: vi.transmission_type||'—' },
    { label:'Fuel Type',           value: vi.fuel_type||vi.fuelType||'—' },
    { label:'Engine Type',         value: vi.engine_type||vi.engineType||'—' },
    { label:'Vehicle Status',      value: vi.vehicle_status||vi.vehicleStatus||'Active' },
    { label:'CNG Fitted',          value: vi.cng==='Y'||vi.cngornot==='Y'?'Yes':'No' },
    { label:'CAN ID',              value: vi.can_id||vi.canType||'CAN10' },
    { label:'Manufacture Date',    value: vi.manuf_date||vi.mfgDate||'—' },
    { label:'Sale Date / FCOK',    value: vi.sale_date||vi.fcok||'—' },
    { label:'Last Service',        value: vi.last_serv||vi.last_service_date||'—' },
    { label:'Last Warranty Claim', value: vi.last_war_claim||vi.last_warranty||'—' },
    { label:'Dealer Code / Name',  value: vi.dealercode_nameloc||vi.dealer||'—' },
    { label:'Product Model Code',  value: od[0]?.product_model_code||'—' },
  ];

  // vt_vehicle_usage fields - all of them
  const trendRows = od.slice(-30).map(d=>({
    date:    (d.process_date||'').slice(5,10),
    dist:    Number(d.trip_distance||0),
    speed:   Number(d.average_speed||0),
    harsh:   Number(d.harsh_acc_count||0)+Number(d.harsh_brk_count||0)+Number(d.harsh_turn_count||0),
    co2:     Number(d.co2_emissions||0),
    idle:    Number(d.idle_time||0)/60,
    overspe: Number(d.overspeeding_count||0),
  }));

  const n = od.length||1;
  const totalDist     = od.reduce((s,d)=>s+Number(d.trip_distance||0),0);
  const totalEngHr    = Number(us.total_eng_hr||0);
  const driverScore   = (() => {
    const h100 = od.reduce((s,d)=>s+Number(d.harsh_acc_count||0)+Number(d.harsh_brk_count||0)+Number(d.harsh_turn_count||0),0)/(Math.max(totalDist,1)/100);
    const ov   = Number(us.overspeeding_count||0);
    return Math.max(0,Math.min(100,Math.round(100-h100*2-ov*0.5)));
  })();

  const usageKpis = [
    { label:'Total Trips',       value:us.total_trips,              icon:'🚗', color:'#42a5f5', unit:'',    lowerIsBetter:false },
    { label:'Total Distance',    value:us.total_distance ? Number(us.total_distance).toFixed(1):null, icon:'📍', color:'#e91e8c', unit:'km',  lowerIsBetter:false },
    { label:'Total Engine Hours',value:totalEngHr.toFixed(1),       icon:'⏱️', color:'#ffa726', unit:'hrs', lowerIsBetter:false },
    { label:'Avg Speed',         value:us.avg_speed ? Number(us.avg_speed).toFixed(1):null,        icon:'⚡', color:'#66bb6a', unit:'km/h',lowerIsBetter:false, description:'Mean speed; benchmark 40 km/h urban' },
    { label:'Max Speed',         value:us.max_speed ? Number(us.max_speed).toFixed(1):null,        icon:'🏎️', color:'#ef5350', unit:'km/h',lowerIsBetter:true },
    { label:'Min Speed',         value:us.min_speed ? Number(us.min_speed).toFixed(1):null,        icon:'🐢', color:'#ab47bc', unit:'km/h',lowerIsBetter:false },
    { label:'Total DTC Count',   value:us.total_dtc,                icon:'🔴', color:'#f44336', unit:'',    lowerIsBetter:true, description:'Any DTC requires investigation' },
    { label:'Total Harsh Events',value:us.total_harsh,              icon:'⚠️', color:'#ff9800', unit:'',    lowerIsBetter:true },
    { label:'Total Turns',       value:us.total_turns,              icon:'↩️', color:'#5c6bc0', unit:'',    lowerIsBetter:false },
    { label:'CO₂ Emission',      value:us.total_co2_emission ? Number(us.total_co2_emission).toFixed(2):null, icon:'🌿', color:'#26c6da', unit:'kg',  lowerIsBetter:true },
    { label:'Overspeeding Count',value:us.overspeeding_count,       icon:'🚨', color:'#e53935', unit:'',    lowerIsBetter:true },
    { label:'Start Mileage',     value:us.start_mileage,            icon:'🔢', color:'#78909c', unit:'km',  lowerIsBetter:false },
    { label:'End Mileage',       value:us.end_mileage,              icon:'🔢', color:'#607d8b', unit:'km',  lowerIsBetter:false },
    { label:'Driver Safety Score',value:driverScore,                icon:'⭐', color:driverScore>70?'#66bb6a':driverScore>40?'#ffa726':'#ef5350', unit:'/100', lowerIsBetter:false, description:'Score out of 100; based on harsh events and overspeeding per 100 km' },
  ];

  return (
    <div style={page} id="dt-page-content">
      <h1 style={{ color:'#e91e8c', fontWeight:900, fontSize:26, marginBottom:20, letterSpacing:1 }}>
        🚗 Vehicle Digital Twin — Overview
      </h1>
      <DateFilterBar title="Vehicle Overview" onApply={() => setTrigger(prev => prev + 1)}/>
      {loading && <div style={{ textAlign:'center', padding:28, color:'#aaa' }}>Loading…</div>}

      <div style={sec}>🪪 Vehicle Identity</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:10, marginBottom:20 }}>
        {infoTiles.map((t,i) => <InfoTile key={t.label} label={t.label} value={t.value} accent={accents[i%accents.length]}/>)}
      </div>

      {(us.start_location||us.end_location) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:20 }}>
          <InfoTile label="Start Location" value={us.start_location} accent="#42a5f5"/>
          <InfoTile label="End Location"   value={us.end_location}   accent="#e91e8c"/>
          <InfoTile label="Start Mileage (km)" value={us.start_mileage} accent="#ffa726"/>
          <InfoTile label="End Mileage (km)"   value={us.end_mileage}   accent="#66bb6a"/>
        </div>
      )}

      <div style={sec}>📊 Vehicle Usage KPIs</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:12, marginBottom:20 }}>
        {usageKpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>

      {trendRows.length>0 && (
        <>
          <div style={sec}>📈 Performance Trends</div>
          <div style={two}>
            <ChartCard title="Daily Distance" data={trendRows} type="area" xKey="date"
              series={[{key:'dist',color:'#e91e8c',name:'Distance (km)'}]} unit="km" height={240}/>
            <ChartCard title="Average Speed" data={trendRows} type="line" xKey="date"
              series={[{key:'speed',color:'#42a5f5',name:'Avg Speed'}]} unit="km/h"
              benchmark={40} benchmarkLabel="Urban avg" height={240}/>
          </div>
          <div style={two}>
            <ChartCard title="Harsh Events Total" data={trendRows} type="bar" xKey="date"
              series={[{key:'harsh',color:'#ffa726',name:'Harsh Events'}]} height={240}/>
            <ChartCard title="CO₂ Emissions" data={trendRows} type="area" xKey="date"
              series={[{key:'co2',color:'#66bb6a',name:'CO₂ (kg)'}]} unit="kg" height={240}/>
          </div>
          <div style={two}>
            <ChartCard title="Idle Time per Day (min)" data={trendRows} type="bar" xKey="date"
              series={[{key:'idle',color:'#607d8b',name:'Idle (min)'}]} unit="min"
              benchmark={30} benchmarkLabel="30 min alert" height={240}/>
            <ChartCard title="Overspeeding Events" data={trendRows} type="bar" xKey="date"
              series={[{key:'overspe',color:'#f44336',name:'Events'}]} height={240}
              description="Days with overspeeding events — zero should be the target"/>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewDashboard;
