import React, { FC, useCallback, useEffect, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import { fetchDtcInfo, fetchDtcTile, fetchDtcTrend, fetchDtcStatusCount, fetchDtcOccurrence } from '../../services/digitalTwinApi';
import DateFilterBar from './DateFilterBar';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';

const page: React.CSSProperties = { padding:'20px 24px', background:'#f7f8fa', minHeight:'100vh', width:'100%', boxSizing:'border-box' as const };
const sec: React.CSSProperties  = { color:'#e91e8c', fontWeight:800, fontSize:15, marginBottom:14, textTransform:'uppercase' as const, letterSpacing:0.5, borderLeft:'4px solid #e91e8c', paddingLeft:10 };
const two: React.CSSProperties  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 };
const th: React.CSSProperties   = { background:'#f5f5f5', padding:'9px 12px', textAlign:'left' as const, fontWeight:700, color:'#333', borderBottom:'2px solid #eee', fontSize:11 };
const td: React.CSSProperties   = { padding:'8px 12px', borderBottom:'1px solid #f0f0f0', color:'#444', fontSize:11 };

const badge = (s: string): React.CSSProperties => ({
  background: s.toLowerCase().includes('current') ? '#ffebee' : s.toLowerCase().includes('no failure') ? '#e8f5e9' : '#fff3e0',
  color:      s.toLowerCase().includes('current') ? '#c62828' : s.toLowerCase().includes('no failure') ? '#2e7d32' : '#e65100',
  padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, display:'inline-block',
});

const DTC_DESC: Record<string, string> = {
  P0011:'Camshaft Timing Over-Advanced',P0100:'MAF Sensor Circuit',P0101:'MAF Range/Performance',
  P0115:'ECT Sensor Circuit',P0116:'ECT Range/Performance',P0130:'O2 Sensor (B1S1)',
  P0171:'System Too Lean',P0172:'System Too Rich',P0200:'Injector Circuit',
  P0300:'Random Cylinder Misfire',P0420:'Catalyst Below Threshold',P0440:'EVAP System',
  P0500:'Vehicle Speed Sensor',P0560:'System Voltage',P0600:'Serial Comm Link',
  P0700:'TCM Malfunction',U0001:'CAN Bus',U0100:'Lost Comm ECM',
  B0001:'Driver Airbag Stage 1',C0001:'ABS Front Left',
};
const dtcDesc = (code: string) => DTC_DESC[code?.toUpperCase()] || '—';
const getCategory = (c: string) => ({ P:'Powertrain', B:'Body Electronics', C:'Chassis/Safety', U:'CAN Network' }[c?.[0]?.toUpperCase()] || 'Other');
const ECU_NAMES: Record<string, string> = {
  ECM:'Engine Control Module', TCM:'Transmission Control Module', ABS:'Anti-lock Brake System',
  BCM:'Body Control Module',   SRS:'Airbag / Safety Restraint',  EPS:'Electric Power Steering',
  HVAC:'Climate Control',      TPMS:'Tyre Pressure Monitor',
};
const ecuName = (e: string) => ECU_NAMES[(e||'').toUpperCase()] || e || '—';

const DtcDashboard: FC = () => {
  const { apiParams } = useDt();
  const [dtcInfo,   setDtcInfo]   = useState<any[]>([]);
  const [dtcTile,   setDtcTile]   = useState<any>(null);
  const [dtcTrend,  setDtcTrend]  = useState<any[]>([]);
  const [dtcStatus, setDtcStatus] = useState<any[]>([]);
  const [dtcOcc,    setDtcOcc]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [trigger, setTrigger] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,b,c,d,e] = await Promise.allSettled([
        fetchDtcInfo(apiParams), fetchDtcTile(apiParams),
        fetchDtcTrend(apiParams), fetchDtcStatusCount(apiParams), fetchDtcOccurrence(apiParams),
      ]);
      if (a.status==='fulfilled') setDtcInfo(Array.isArray(a.value)?a.value:[]);
      if (b.status==='fulfilled') { const v=Array.isArray(b.value)?b.value[0]:b.value; setDtcTile(v||null); }
      if (c.status==='fulfilled') setDtcTrend(Array.isArray(c.value)?c.value:[]);
      if (d.status==='fulfilled') setDtcStatus(Array.isArray(d.value)?d.value:[]);
      if (e.status==='fulfilled') setDtcOcc(Array.isArray(e.value)?e.value:[]);
    } catch(err){console.error(err);} finally{setLoading(false);}
  }, [apiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{load();},[load]);

  const tile = dtcTile || {};

  // Status counts
  const currentFaults = dtcInfo.filter(d=>(d.diagnosticinfo_data_status||'').toLowerCase().includes('current')).length;
  const histFaults    = dtcInfo.filter(d=>(d.diagnosticinfo_data_status||'').toLowerCase().includes('history')).length;
  const noFail        = dtcInfo.filter(d=>(d.diagnosticinfo_data_status||'').toLowerCase().includes('no failure')).length;
  const uniqueCodes   = Array.from(new Set(dtcInfo.map(d=>d.diagnosticinfo_data_dtc||'').filter(Boolean)));
  const uniqueEcus    = Array.from(new Set(dtcInfo.map(d=>d.ecu||'').filter(Boolean)));
  const criticalDtcs  = dtcInfo.filter(d=>{ const c=(d.diagnosticinfo_data_dtc||'').toUpperCase(); return c.startsWith('P03')||c.startsWith('P06')||c.startsWith('U0'); });

  // ECU breakdown for pie chart
  const ecuMap: Record<string,number> = dtcInfo.reduce((acc: Record<string,number>, d) => {
    const e = d.ecu || 'Unknown';
    acc[e] = (acc[e] || 0) + 1;
    return acc;
  }, {});
  const ecuBreakdown: { ecu: string; count: number }[] = Object.entries(ecuMap)
    .map(([e, n]) => ({ ecu: ecuName(e), count: n as number }))
    .sort((a, b) => b.count - a.count);

  // DTC type breakdown (P/B/C/U) from vt_dtc_trend.dtc_type
  const typeBreakdown = dtcTrend.reduce((acc: Record<string,number>, d)=>{
    const t = d.dtc_type || getCategory(d.weekStart?.[0]||'');
    acc[t] = (acc[t]||0) + Number(d.count||0);
    return acc;
  }, {});
  const typePieData = Object.entries(typeBreakdown).map(([type,count])=>({ type, count }));

  // avg_per_dtc trend
  const avgPerDtcTrend = dtcTrend.map(d=>({
    week:    (d.weekStart||d.week_start_date||'').slice(0,10),
    count:   Number(d.count||0),
    avgPerDtc: Number(d.average_per_dtc||0),
    type:    d.dtc_type||'',
  }));

  const occData = dtcOcc.map(d=>({ dtc:d._id||d.diagnosticinfo_data_dtc||'', count:Number(d.count||d.value||1) }))
    .sort((a,b)=>b.count-a.count).slice(0,20);

  const statusPie = dtcStatus.length>0
    ? dtcStatus.map(d=>({ category:d.category, value:Number(d.value||0) }))
    : [{ category:'Current',value:currentFaults },{ category:'History',value:histFaults },{ category:'No Failure',value:noFail }];

  const trendData = dtcTrend.map(d=>({
    week:    (d.weekStart||d.week_start_date||'').slice(0,10),
    history: Number(d.history||d.History||0),
    current: Number(d.current||d.Current||0),
    noFail:  Number(d.no_failure||d['No Failure']||0),
  }));

  const geoMap: Record<string,number> = dtcInfo.reduce((acc: Record<string,number>, d) => {
    const k = d.state || d.city || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const geoData: { state: string; count: number }[] = Object.entries(geoMap)
    .map(([state, n]) => ({ state, count: n as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mapPin = dtcInfo.find(d=>d.latitude&&d.longitude);
  const lat = mapPin ? Number(mapPin.latitude) : 19.076;
  const lng = mapPin ? Number(mapPin.longitude) : 72.877;

  const filtered = dtcInfo.filter(d=>{
    const code=(d.diagnosticinfo_data_dtc||'').toLowerCase();
    const st=(d.state||'').toLowerCase();
    const city=(d.city||'').toLowerCase();
    const ecu=(d.ecu||'').toLowerCase();
    return !search || code.includes(search.toLowerCase())||st.includes(search.toLowerCase())||city.includes(search.toLowerCase())||ecu.includes(search.toLowerCase());
  });

  const kpis = [
    { label:'Total DTC Count',   value:tile.total_dtc_count??dtcInfo.length, icon:'🔴', color:'#f44336', unit:'',     lowerIsBetter:true },
    { label:'Unique DTC Codes',  value:uniqueCodes.length,                   icon:'🔍', color:'#ff7043', unit:'codes', lowerIsBetter:true },
    { label:'Current Faults',    value:currentFaults,                        icon:'🔥', color:'#c62828', unit:'',     lowerIsBetter:true, description:'Active faults — require immediate action' },
    { label:'History Faults',    value:histFaults,                           icon:'📜', color:'#e65100', unit:'',     lowerIsBetter:true },
    { label:'Critical DTCs',     value:criticalDtcs.length,                  icon:'⛔', color:'#b71c1c', unit:'',     lowerIsBetter:true, description:'P03xx misfire / P06xx ECU / U0xx CAN codes' },
    { label:'ECUs Affected',     value:uniqueEcus.length,                    icon:'🔧', color:'#7c4dff', unit:'',     lowerIsBetter:false },
    { label:'Fault-Free Rate',   value:dtcInfo.length>0?((noFail/dtcInfo.length)*100).toFixed(1):'100', icon:'✅', color:'#2e7d32', unit:'%', lowerIsBetter:false },
    { label:'Last DTC Code',     value:tile.last_dtc_code||'—',              icon:'⚠️', color:'#ff9800', unit:'',     lowerIsBetter:false },
    { label:'Last DTC Status',   value:tile.last_dtc_status||'—',            icon:'📋', color:'#5c6bc0', unit:'',     lowerIsBetter:false },
  ];

  return (
    <div style={page} id="dt-page-content">
      <DateFilterBar title="DTC & Fault Analysis" onApply={()=>setTrigger(prev=>prev+1)}/>
      {loading && <div style={{textAlign:'center',padding:28,color:'#aaa'}}>Loading DTC data…</div>}

      {/* Last-Fault Banner */}
      {(tile.last_dtc_code||currentFaults>0) && (
        <div style={{
          background:currentFaults>0?'#ffebee':'#fff3e0',
          border:`2px solid ${currentFaults>0?'#ef9a9a':'#ffcc02'}`,
          borderRadius:12, padding:'12px 20px', marginBottom:16,
          display:'flex', alignItems:'center', gap:14,
        }}>
          <span style={{fontSize:28}}>{currentFaults>0?'🔴':'🟡'}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:800, color:currentFaults>0?'#c62828':'#e65100', fontSize:14}}>
              {currentFaults>0 ? `${currentFaults} ACTIVE FAULT(S) — IMMEDIATE ACTION REQUIRED` : 'RECENT DTC ACTIVITY'}
            </div>
            <div style={{fontSize:12,color:'#555',marginTop:2}}>
              Last code: <strong style={{fontFamily:'monospace'}}>{tile.last_dtc_code||'—'}</strong>
              {tile.last_dtc_time && <> &nbsp;·&nbsp; {tile.last_dtc_time}</>}
              {tile.last_dtc_status && <> &nbsp;·&nbsp; Status: <strong>{tile.last_dtc_status}</strong></>}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:22,fontWeight:900,color:currentFaults>0?'#c62828':'#888'}}>{tile.total_dtc_count||dtcInfo.length}</div>
            <div style={{fontSize:10,color:'#aaa'}}>Total DTCs</div>
          </div>
        </div>
      )}

      <div style={sec}>🔴 DTC KPIs</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:12,marginBottom:20}}>
        {kpis.map(k=><KpiCard key={k.label} {...k as any}/>)}
      </div>

      <div style={sec}>📊 Fault Charts</div>
      <div style={two}>
        <ChartCard title="Top DTC Occurrences" data={occData.length>0?occData:dtcInfo.slice(0,10).map(d=>({dtc:d.diagnosticinfo_data_dtc||'—',count:1}))}
          type="bar" xKey="dtc" series={[{key:'count',color:'#42a5f5',name:'Count'}]}
          description="Most-repeated fault codes — focus warranty analysis here" height={240}/>
        <ChartCard title="DTC Status Distribution" data={statusPie} type="pie" xKey="category"
          series={[{key:'value',color:'#42a5f5'}]} height={240}/>
      </div>

      {ecuBreakdown.length>0 && (
        <div style={two}>
          <ChartCard title="Faults by ECU Module" data={ecuBreakdown} type="bar" xKey="ecu"
            series={[{key:'count',color:'#7c4dff',name:'Fault Count'}]}
            description="Which ECU modules are generating the most fault codes — isolates problem subsystems" height={240}/>
          {typePieData.length>0 ? (
            <ChartCard title="DTC Category Distribution (P/B/C/U)" data={typePieData} type="pie" xKey="type"
              series={[{key:'count',color:'#e91e8c'}]}
              description="P=Powertrain, B=Body, C=Chassis, U=Network" height={240}/>
          ) : (
            <ChartCard title="Geographic Distribution" data={geoData} type="bar" xKey="state"
              series={[{key:'count',color:'#ab47bc',name:'DTC Count'}]} height={240}/>
          )}
        </div>
      )}

      {trendData.length>0 && (
        <>
          <div style={sec}>📈 DTC Trend</div>
          <div style={two}>
            <ChartCard title="Weekly DTC Trend" data={trendData} type="multibar" xKey="week"
              series={[{key:'history',color:'#80cbc4',name:'History'},{key:'noFail',color:'#66bb6a',name:'No Failure'},{key:'current',color:'#ef5350',name:'Current'}]}
              description="Rising 'Current' trend = deteriorating vehicle health" height={240}/>
            {avgPerDtcTrend.filter(d=>d.avgPerDtc>0).length>0 && (
              <ChartCard title="Avg Occurrences per DTC Code (Weekly)" data={avgPerDtcTrend} type="line" xKey="week"
                series={[{key:'avgPerDtc',color:'#ff9800',name:'Avg per DTC'}]}
                description="average_per_dtc — rising means same codes are repeating more often; systemic fault indicator" height={240}/>
            )}
          </div>
        </>
      )}

      {/* DTC Detail Table */}
      <div style={sec}>📋 DTC Detail Table</div>
      <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',marginBottom:16}}>
        <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
          <input placeholder="Search by DTC code, ECU, state, city…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{flex:1,minWidth:200,padding:'7px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:12}}/>
          <span style={{fontSize:11,color:'#888'}}>{filtered.length} of {dtcInfo.length} records</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr>{['DTC Code','Description','ECU Module','FTB Data','Status','City','State','Time'].map(h=>(
                <th key={h} style={th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.slice(0,30).map((d,i)=>{
                const code = d.diagnosticinfo_data_dtc||d.dtc||'—';
                const status = d.diagnosticinfo_data_status||d.status||'—';
                return (
                  <tr key={i} style={{background:i%2===0?'#fff':'#fafafa'}}>
                    <td style={{...td,fontWeight:700,color:'#e91e8c',fontFamily:'monospace'}}>{code}</td>
                    <td style={{...td,maxWidth:180,color:'#555'}}>{dtcDesc(code)}</td>
                    <td style={{...td,color:'#333'}}>{ecuName(d.ecu)}</td>
                    <td style={{...td,maxWidth:160,color:'#777',fontSize:10,fontFamily:'monospace'}}
                      title={d.diagnosticinfo_data_ftb||''}>{(d.diagnosticinfo_data_ftb||'—').slice(0,24)}{(d.diagnosticinfo_data_ftb||'').length>24?'…':''}</td>
                    <td style={td}><span style={badge(status)}>{status}</span></td>
                    <td style={td}>{d.city||'—'}</td>
                    <td style={td}>{d.state||'—'}</td>
                    <td style={{...td,fontSize:10,fontFamily:'monospace'}}>{(d.occurrencetime||'—').slice(0,16)}</td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={8} style={{...td,textAlign:'center',color:'#bbb',padding:28}}>No DTC data for selected period</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map */}
      <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>📍 DTC Location Map</div>
        <p style={{fontSize:11,color:'#666',marginBottom:10}}>
          Shows <span style={{color:'#e91e8c',fontWeight:600}}>Current</span> status DTCs. Data reflects previous day regardless of date filter.
        </p>
        <iframe title="DTC Map" style={{width:'100%',height:320,border:'none',borderRadius:10}}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-3}%2C${lat-3}%2C${lng+3}%2C${lat+3}&layer=mapnik&marker=${lat}%2C${lng}`}/>
        <p style={{fontSize:10,color:'#bbb',marginTop:4,textAlign:'right'}}>© Leaflet | © OpenStreetMap contributors</p>
      </div>
    </div>
  );
};

export default DtcDashboard;
