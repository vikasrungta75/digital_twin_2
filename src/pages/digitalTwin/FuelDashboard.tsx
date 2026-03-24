import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchFuelEvents, fetchOverallData, fetchOverallKpiData } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import PageHeader, { ICON_PATHS } from './PageHeader';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' };
const sec: React.CSSProperties  = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase' as const, letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };

const FuelDashboard: FC = () => {
  const { apiParams } = useDt();
  const [fuelEvents, setFuelEvents] = useState<any[]>([]);
  const [od, setOd]                 = useState<any[]>([]);
  const [kpiData, setKpiData]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [trigger, setTrigger]       = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.allSettled([
        fetchFuelEvents(apiParams),
        fetchOverallData(apiParams),
        fetchOverallKpiData(apiParams),
      ]);
      if (a.status === 'fulfilled') setFuelEvents(Array.isArray(a.value) ? a.value : []);
      if (b.status === 'fulfilled') setOd(Array.isArray(b.value) ? b.value : []);
      if (c.status === 'fulfilled') setKpiData(Array.isArray(c.value) ? c.value : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const n   = od.length || 1;
  const tot = (k: string) => od.reduce((s, d) => s + Number(d[k] || 0), 0);
  const avg = (k: string) => tot(k) / n;

  const bl          = kpiData[0] || {};
  const avgFuelEff  = avg('fuel_efficiency');
  const totalCo2    = tot('co2_emissions');
  const totalDist   = tot('trip_distance');
  const co2PerKm    = totalDist > 0 ? totalCo2 / totalDist : 0;
  const fuelLow20   = tot('fuel_less_than_20per');
  const batAbove15  = tot('bat_above_15v');
  const batBelow9   = tot('bat_below_9v');
  const odoResets   = tot('odometerresetcount');
  const totalFill   = fuelEvents.reduce((s,d)=>s+Number(d.filling_detected||0), 0);
  const totalDrain  = fuelEvents.reduce((s,d)=>s+Number(d.emptying_detected||0), 0);
  const totalAdult  = fuelEvents.reduce((s,d)=>s+Number(d.fueladulteration||0), 0);
  const totalClean  = fuelEvents.reduce((s,d)=>s+Number(d.tank_cleaning_events||0), 0);

  const cngTrips    = od.filter(d=>(d.cngornot||'').toUpperCase()==='Y');
  const petrolTrips = od.filter(d=>(d.cngornot||'').toUpperCase()!=='Y');
  const avgFECng    = cngTrips.length>0    ? cngTrips.reduce((s,d)=>s+Number(d.trip_fe_ncng||0),0)/cngTrips.length       : null;
  const avgFEPetrol = petrolTrips.length>0 ? petrolTrips.reduce((s,d)=>s+Number(d.fuel_efficiency||0),0)/petrolTrips.length : null;
  const avgFEUnk    = avg('trip_fe_unknown_unit');

  const rows = od.map(d=>({
    date:     (d.process_date||'').slice(5,10),
    fe:       Number(d.fuel_efficiency||0),
    fe_cng:   Number(d.trip_fe_ncng||0),
    co2:      Number(d.co2_emissions||0),
    low20:    Number(d.fuel_less_than_20per||0),
    batHi:    Number(d.bat_above_15v||0),
    batLo:    Number(d.bat_below_9v||0),
  }));

  const feTrend = rows.map((r,i,arr)=>{
    const w = arr.slice(Math.max(0,i-6),i+1);
    return { ...r, roll: parseFloat((w.reduce((s,x)=>s+x.fe,0)/w.length).toFixed(2)) };
  });

  const fuelEventRows = fuelEvents.map(d=>({
    trip:  (d.trip_id||'').slice(-6),
    fill:  Number(d.filling_detected||0),
    drain: Number(d.emptying_detected||0),
    adult: Number(d.fueladulteration||0),
    clean: Number(d.tank_cleaning_events||0),
  }));

  const cngCompare = [
    { type:'CNG',    fe:avgFECng    ||0, trips:cngTrips.length },
    { type:'Petrol', fe:avgFEPetrol ||0, trips:petrolTrips.length },
  ].filter(x=>x.trips>0);

  const kpis = [
    { label:'Avg Fuel Efficiency',  value:avgFuelEff.toFixed(2),   baseline:bl.bsline_fuel_efficiency||null,         icon:'⛽', color:'#ffa726', unit:'km/l',  lowerIsBetter:false, description:'Mean trip fuel efficiency across all trips' },
    { label:'Total CO₂ Emission',   value:totalCo2.toFixed(2),     baseline:bl.bsline_co2_emissions||null,            icon:'🌿', color:'#66bb6a', unit:'kg',    lowerIsBetter:true },
    { label:'CO₂ Intensity',        value:co2PerKm.toFixed(4),     icon:'🌍', color:'#26c6da', unit:'kg/km', lowerIsBetter:true, description:'BS6 benchmark ~0.12 kg/km for petrol' },
    { label:'Fuel <20% Events',     value:fuelLow20,               baseline:bl['bsline_fuel_less_than_20per']||null,  icon:'🪫', color:'#ef5350', unit:'events',lowerIsBetter:true },
    { label:'Battery >15V Events',  value:batAbove15,              baseline:bl.bsline_bat_above_15v||null,            icon:'🔋', color:'#7c4dff', unit:'events',lowerIsBetter:true, description:'Overcharge — check alternator' },
    { label:'Battery <9V Events',   value:batBelow9,               baseline:bl.bsline_bat_below_9v||null,             icon:'⚡', color:'#e53935', unit:'events',lowerIsBetter:true },
    { label:'CNG Fuel Efficiency',  value:avgFECng?.toFixed(2)||null, icon:'🍃', color:'#4caf50', unit:'km/kg', lowerIsBetter:false, description:'trip_fe_ncng — efficiency for CNG-mode trips only' },
    { label:'Petrol Efficiency',    value:avgFEPetrol?.toFixed(2)||null, icon:'⛽', color:'#ff9800', unit:'km/l', lowerIsBetter:false },
    { label:'Unknown-Unit FE',      value:avgFEUnk>0?avgFEUnk.toFixed(2):null, icon:'❓', color:'#90a4ae', unit:'', lowerIsBetter:false, description:'trip_fe_unknown_unit — non-zero = ECU reporting unclassified FE unit; data quality flag' },
    { label:'Fuel Fill Events',     value:totalFill,  icon:'🛢️', color:'#4caf50', unit:'events', lowerIsBetter:false },
    { label:'Fuel Drain Events',    value:totalDrain, icon:'📉', color:'#ff5722', unit:'events', lowerIsBetter:true, description:'Abnormal drop — possible siphoning' },
    { label:'Adulteration Events',  value:totalAdult, icon:'☣️', color:'#f44336', unit:'events', lowerIsBetter:true, description:'Warranty trigger — document immediately' },
    { label:'Tank Cleaning Events', value:totalClean, icon:'🧹', color:'#78909c', unit:'events', lowerIsBetter:false },
    { label:'Odometer Resets',      value:odoResets,  baseline:bl.bsline_odometerresetcount||null, icon:'🔄', color:'#ff5722', unit:'', lowerIsBetter:true, description:'Any reset > 0 is a warranty red flag' },
    { label:'Total Distance',       value:totalDist.toFixed(1), icon:'📍', color:'#e91e8c', unit:'km', lowerIsBetter:false },
  ];

  return (
    <div style={page} id="dt-page-content">
      <PageHeader
        iconPath={ICON_PATHS.fuel}
        title="Fuel & Energy Analysis"
        subtitle="Fuel efficiency, consumption events and adulteration detection"
      />
      <DateFilterBar title="Fuel & Energy Analysis" onApply={()=>setTrigger(prev=>prev+1)} />
      {loading && <div style={{textAlign:'center',padding:28,color:'#aaa'}}>Loading fuel data…</div>}

      {odoResets > 0 && (
        <div style={{background:'#ffebee',border:'2px solid #ef9a9a',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:24}}>🚨</span>
          <div>
            <div style={{fontWeight:800,color:'#c62828',fontSize:14}}>ODOMETER RESET DETECTED — {odoResets} event(s)</div>
            <div style={{fontSize:13,color:'#555'}}>Potential warranty-voiding event — escalate for investigation immediately.</div>
          </div>
        </div>
      )}

      {totalAdult > 0 && (
        <div style={{background:'#fce4ec',border:'2px solid #f48fb1',borderRadius:12,padding:'12px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:24}}>☣️</span>
          <div>
            <div style={{fontWeight:800,color:'#880e4f',fontSize:14}}>FUEL ADULTERATION: {totalAdult} event(s)</div>
            <div style={{fontSize:13,color:'#555'}}>Document these trips for warranty claim processing.</div>
          </div>
        </div>
      )}

      <div style={sec}>⛽ Fuel & Battery KPIs</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:12,marginBottom:20}}>
        {kpis.map(k=><KpiCard key={k.label} {...k as any}/>)}
      </div>

      <div style={sec}>📈 Efficiency Trends</div>
      <div style={two}>
        <ChartCard title="Fuel Efficiency with 7-Trip Rolling Avg" data={feTrend} type="multibar" xKey="date"
          series={[{key:'fe',color:'#ffa726',name:'FE (km/l)'},{key:'roll',color:'#1565c0',name:'7-Trip Avg',type:'line'}]}
          unit="km/l" benchmark={15} benchmarkLabel="Fleet Avg" height={240}/>
        <ChartCard title="CO₂ Emissions per Trip" data={rows} type="area" xKey="date"
          series={[{key:'co2',color:'#66bb6a',name:'CO₂ (kg)'}]} unit="kg" height={240}/>
      </div>

      {cngCompare.length > 1 && (
        <div style={two}>
          <ChartCard title="CNG vs Petrol — Avg Efficiency Comparison" data={cngCompare} type="bar" xKey="type"
            series={[{key:'fe',color:'#4caf50',name:'Efficiency'}]}
            description="trip_fe_ncng (CNG) vs fuel_efficiency (petrol)" height={240}/>
          <ChartCard title="CNG vs Petrol Efficiency per Trip" data={rows} type="multibar" xKey="date"
            series={[{key:'fe',color:'#ff9800',name:'Petrol FE'},{key:'fe_cng',color:'#4caf50',name:'CNG FE'}]}
            description="Gaps indicate fuel mode switching mid-period" height={240}/>
        </div>
      )}

      <div style={two}>
        <ChartCard title="Battery Voltage Events" data={rows} type="multibar" xKey="date"
          series={[{key:'batHi',color:'#ef5350',name:'Bat >15V'},{key:'batLo',color:'#1565c0',name:'Bat <9V'}]}
          height={240}/>
        <ChartCard title="Fuel Below 20% Events" data={rows} type="bar" xKey="date"
          series={[{key:'low20',color:'#ef5350',name:'Low Fuel'}]}
          description="Repeated low-fuel driving accelerates fuel pump wear" height={240}/>
      </div>

      {fuelEventRows.length > 0 && (
        <>
          <div style={sec}>🛢️ Fuel Events</div>
          <ChartCard title="Fuel Events — Fill / Drain / Adulteration / Tank Clean" data={fuelEventRows}
            type="multibar" xKey="trip"
            series={[
              {key:'fill',color:'#66bb6a',name:'Filling'},
              {key:'drain',color:'#ef5350',name:'Emptying'},
              {key:'adult',color:'#ffa726',name:'Adulteration'},
              {key:'clean',color:'#42a5f5',name:'Tank Clean'},
            ]} height={300}/>
        </>
      )}
    </div>
  );
};

export default FuelDashboard;
