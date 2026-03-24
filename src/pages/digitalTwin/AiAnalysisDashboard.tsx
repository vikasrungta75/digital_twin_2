import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';

// ─── BizWiz Config ────────────────────────────────────────────────────────────
// FIXED (belong to the VDTSIA assistant — never change):
//   assistId:  3514581148
//   connector: 238893540
//   tables:    vt_overall_data, vt_overview_vehicle_info, vt_dtc_datagrid, ...
//
// DYNAMIC (must match the logged-in user's authtoken — read from Redux):
//   spaceKey:  user?.user?.spaceKey   ← server validates this == authtoken.space
//   userID:    user?.user?.id
//   authtoken: Redux token            ← already session-scoped
const BIZVIZ_ENDPOINT  = '/bizviz-proxy/llmService';
const BIZVIZ_ASSIST_ID = '3514581148';
const BIZVIZ_CONNECTOR = '238893540';
const BIZVIZ_TABLES = [
  'vt_overall_data',          // per-trip KPIs: harsh events, fuel, speed, CO2
  'vt_overview_vehicle_info', // static vehicle info: model, variant, fuel type
  'vt_overview_veh_usage',    // vehicle usage summary: trips, distance, hours
  'vt_dtc_all_occ_count',     // DTC fault occurrence counts
  'vt_dtc_datagrid',          // DTC fault detail table
  'vt_dtc_location_map',      // DTC fault locations
  'vt_dtc_ststus_count',      // DTC status counts
  'vt_dtc_tile',              // DTC tile summary
  'vt_dtc_trend',             // DTC trend over time
  'vt_fuel_events',           // fuel fill/drain events
  'vt_ac_dist',               // AC temperature distribution
  'vt_turn_perc',             // turn percentage data
];
const BIZVIZ_DESCRIPTION =
  'You are the Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) for Maruti Suzuki. ' +
  'Query ONLY these collections: ' +
  'vt_overall_data (per-trip KPIs: vin, harsh_acc_count, harsh_brk_count, harsh_turn_count, ' +
  'overspeeding_count, fuel_efficiency, trip_distance, avg_speed, max_speed, co2_emissions, ' +
  'idle_time, process_date, trip_start_time, trip_end_time), ' +
  'vt_overview_vehicle_info (static info: vin, vehicle_model, vehicle_variant, fuel_type, engine_type, ' +
  'transmission_type, manuf_date, sale_date, last_serv, can_id), ' +
  'vt_overview_veh_usage (usage: vin, total_trips, total_distance, engine_hours, start_mileage, end_mileage), ' +
  'vt_dtc_datagrid and vt_dtc_tile (DTC fault codes), ' +
  'vt_fuel_events (fuel events), vt_ac_dist (AC data), vt_turn_perc (turns). ' +
  'The context prefix gives you vin and date range to filter on. ' +
  'Use vin field for VIN filter and process_date for date range in vt_overall_data.';
const INITIAL_SUGGESTIONS = [
  'Show harsh acceleration, braking and overspeeding counts for this VIN',
  'What is the vehicle model, variant and fuel type for this VIN?',
  'Show all DTC fault codes for this vehicle',
  'What is the total distance, trips and fuel efficiency for this VIN?',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartConfig {
  chart_type: string;
  chart_title: string;
  x_axis: string;
  y_axis: string;
  x_axis_label: string;
  y_axis_label: string;
  data: any[];
}

interface ParsedResponse {
  tableRows: any[];
  answer: string;
  analysis: string;
  explanation: string;
  suggestions: string[];
  chart: ChartConfig | null;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  parsed: ParsedResponse | null;
  isError: boolean;
  timestamp: Date;
}

// ─── SAFE default — never undefined ──────────────────────────────────────────
const EMPTY_PARSED: ParsedResponse = {
  tableRows: [], answer: '', analysis: '',
  explanation: '', suggestions: [], chart: null,
};

// ─── Response parser ──────────────────────────────────────────────────────────
// Confirmed shape from network:
// fetch returns: { original_text, response: JSON_STRING }
// JSON_STRING parses to: { data: JSON_STRING, summary, explanation, visualization: {...} }
// data JSON_STRING parses to: [{ _id, total_harsh_acceleration, ... }]
const parseResponse = (raw: any): ParsedResponse => {
  try {
    if (!raw) return { ...EMPTY_PARSED };

    // Step 1 — unwrap outer .response string
    let inner: any = {};
    try {
      const r = typeof raw?.response === 'string' ? raw.response : raw;
      inner   = typeof r === 'string' ? JSON.parse(r) : (r && typeof r === 'object' ? r : {});
    } catch {
      // response is not JSON — treat as plain text answer
      const fallback = String(raw?.response || raw || '');
      return { ...EMPTY_PARSED, answer: fallback ? `<p>${fallback}</p>` : '' };
    }

    // Step 2 — parse data rows (inner.data is itself a JSON string)
    let tableRows: any[] = [];
    try {
      const dataRaw = inner.data ?? inner.summary ?? '[]';
      const parsed  = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : dataRaw;
      tableRows     = Array.isArray(parsed) ? parsed : [];
    } catch {
      tableRows = [];
    }

    // Step 3 — visualization fields
    const viz        = (inner.visualization && typeof inner.visualization === 'object')
                         ? inner.visualization : {};
    const answer     = String(viz.Answer   || viz.answer   || '');
    const analysis   = String(viz.Analysis || viz.analysis || '');
    const explanation= String(inner.explanation || '');

    // Step 4 — suggestions (array or comma-separated string)
    let suggestions: string[] = [];
    try {
      const raw_s = viz.Suggestions || viz.suggestions || [];
      suggestions = Array.isArray(raw_s)
        ? raw_s.filter(Boolean)
        : String(raw_s).split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      suggestions = [];
    }

    // Step 5 — chart config (only if we have real data + axes)
    let chart: ChartConfig | null = null;
    if (tableRows.length > 0 && viz.chart_type && viz.x_axis && viz.y_axis) {
      chart = {
        chart_type:   String(viz.chart_type),
        chart_title:  String(viz.chart_title  || ''),
        x_axis:       String(viz.x_axis),
        y_axis:       String(viz.y_axis),
        x_axis_label: String(viz.x_axis_label || viz.x_axis),
        y_axis_label: String(viz.y_axis_label || viz.y_axis),
        data:         tableRows,
      };
    }

    return { tableRows, answer, analysis, explanation, suggestions, chart };
  } catch (e) {
    console.error('[parseResponse] unexpected error:', e);
    return { ...EMPTY_PARSED, answer: '<p>Could not parse response.</p>' };
  }
};

// ─── Inline SVG bar chart ────────────────────────────────────────────────────
const InlineBarChart: React.FC<{ cfg: ChartConfig }> = ({ cfg }) => {
  const MAX_BARS = 20;
  const rows     = (cfg.data || []).slice(0, MAX_BARS);
  if (!rows.length) return null;

  const values   = rows.map(r => Number(r[cfg.y_axis] ?? 0));
  const maxVal   = Math.max(...values, 1);
  const BAR_W    = 28;
  const GAP      = 8;
  const H_CHART  = 150;
  const LABEL_H  = 36;
  const SVG_W    = rows.length * (BAR_W + GAP);
  const SVG_H    = H_CHART + LABEL_H;

  const fmtLabel = (s: any) => {
    const str = String(s ?? '');
    return str.length > 8 ? '…' + str.slice(-6) : str;
  };
  const fmtVal = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div style={{ marginTop: 14 }}>
      {cfg.chart_title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9090b0', marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {cfg.chart_title}
        </div>
      )}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block', minWidth: Math.max(SVG_W, 300), height: SVG_H, width: '100%' }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const y = H_CHART - f * H_CHART;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={SVG_W} y2={y}
                  stroke="#2a2a38" strokeWidth={0.8}
                  strokeDasharray={f === 0 ? '' : '3,3'} />
                <text x={2} y={y - 2} fill="#404060" fontSize={8}>
                  {fmtVal(f * maxVal)}
                </text>
              </g>
            );
          })}

          {rows.map((row, i) => {
            const val  = values[i];
            const barH = Math.max((val / maxVal) * H_CHART, 2);
            const x    = i * (BAR_W + GAP);
            const y    = H_CHART - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={BAR_W} height={barH}
                  fill={`hsl(330,${60 + (i % 3) * 8}%,55%)`} rx={3} opacity={0.88}>
                  <title>{`${row[cfg.x_axis]}: ${val}`}</title>
                </rect>
                <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle"
                  fill="#c0c0e0" fontSize={7.5}>
                  {fmtVal(val)}
                </text>
                <text
                  x={x + BAR_W / 2} y={H_CHART + 13}
                  textAnchor="middle" fill="#6060a0" fontSize={7.5}
                  transform={`rotate(-30,${x + BAR_W / 2},${H_CHART + 13})`}
                >
                  {fmtLabel(row[cfg.x_axis])}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#555570' }}>{cfg.x_axis_label}</span>
        <span style={{ fontSize: 10, color: '#555570' }}>{cfg.y_axis_label}</span>
      </div>
      {cfg.data.length > MAX_BARS && (
        <div style={{ fontSize: 11, color: '#404060', marginTop: 3 }}>
          Showing first {MAX_BARS} of {cfg.data.length} — see full table below
        </div>
      )}
    </div>
  );
};

// ─── Data table ───────────────────────────────────────────────────────────────
const DataTable: React.FC<{ rows: any[] }> = ({ rows }) => {
  const [expanded, setExpanded] = useState(false);
  if (!rows || !rows.length) return null;

  const keys    = Object.keys(rows[0] || {});
  const fmtKey  = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <div style={{ marginTop: 14 }}>
      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>{keys.map(k => <th key={k}>{fmtKey(k)}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i}>{keys.map(k => <td key={k}>{row[k] ?? '—'}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ marginTop: 6, background: 'none', border: '1px solid #2a2a38',
            borderRadius: 8, color: '#6060a0', fontSize: 11,
            padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {expanded ? '▲ Show less' : `▼ Show all ${rows.length} rows`}
        </button>
      )}
    </div>
  );
};

// ─── Assistant bubble ─────────────────────────────────────────────────────────
const AssistantContent: React.FC<{
  parsed: ParsedResponse | null;
  onSuggestion: (s: string) => void;
}> = ({ parsed, onSuggestion }) => {
  // Always safe — parsed is never undefined here but guard anyway
  const p = parsed || EMPTY_PARSED;

  return (
    <div>
      {p.chart && <InlineBarChart cfg={p.chart} />}

      {p.answer && (
        <div
          dangerouslySetInnerHTML={{ __html: p.answer }}
          style={{ marginTop: p.chart ? 14 : 0 }}
        />
      )}

      {p.analysis && (
        <div
          dangerouslySetInnerHTML={{ __html: p.analysis }}
          style={{ marginTop: 10, borderTop: '1px solid #2a2a38', paddingTop: 10 }}
        />
      )}

      {p.explanation && !p.answer && (
        <p style={{ margin: 0, color: '#a0a0c0' }}>{p.explanation}</p>
      )}

      {p.tableRows.length > 0 && <DataTable rows={p.tableRows} />}

      {p.suggestions.length > 0 && (
        <div className="dt-suggestions">
          {p.suggestions.map((s, i) => (
            <button key={i} className="dt-sugg-chip" onClick={() => onSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Fallback — nothing parsed at all */}
      {!p.chart && !p.answer && !p.analysis && !p.explanation && p.tableRows.length === 0 && (
        <div style={{ color: '#808080', fontSize: 13, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 8px', color: '#e08060', fontWeight: 600 }}>⚠️ No data returned</p>
          <p style={{ margin: '0 0 6px' }}>This may be because:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>The question requires a collection not in the connector — try asking about harsh events, fuel, speed, DTC codes or vehicle info</li>
            <li>The selected VIN has no records in the date range</li>
            <li>Try asking about: harsh events, fuel efficiency, speed, distance, CO₂ or baseline comparisons</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AiAnalysisDashboard: React.FC = () => {
  const { vin, apiParams }  = useDt();
  const { token, user }     = useSelector((state: any) => state.auth);

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [inputText,   setInputText]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [sessionId,   setSessionId]   = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<{ context: string; session_id: string }[]>([]);
  const [hoveredHist, setHoveredHist] = useState<number | null>(null);
  const [,            setTrigger]     = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Session ID ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const userId = String(user?.user?.id || user?.user?.userId || 'dt_user');
    const key    = `dt_session_${userId}`;
    let sid      = localStorage.getItem(key);
    if (!sid) {
      sid = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, sid);
    }
    setSessionId(sid);
  }, [user]);

  // ── Chat history — uses rest-proxy, silently skips on 403/404 ───────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId   = String(user?.user?.id || user?.user?.userId || '');
        const spaceKey = String(user?.user?.spaceKey || '');

        const res = await fetch(`/rest-proxy/vc_chat_history_older?user_id=${userId}`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Use the space-aware credentials from the logged-in user's space
            clientid:     `GSUSJGITCDXHEDBNLIUD@${spaceKey}`,
            appname:      'demo',
            clientsecret: 'GSVDOAFXOXAAFTONROLX1774026824090',
          },
        });
        if (!res.ok) return; // 403/404 — history unavailable, continue silently
        const text = await res.text();
        if (!text || (!text.startsWith('{') && !text.startsWith('['))) return;
        const data = JSON.parse(text);
        setChatHistory(Array.isArray(data) ? data : []);
      } catch {
        // History is optional — never crash the copilot if this fails
      }
    };
    fetchHistory();
  }, [user]);

  // ── Load history session ─────────────────────────────────────────────────────
  const loadHistorySession = async (histSessionId: string) => {
    const userId   = String(user?.user?.id || user?.user?.userId || '');
    const spaceKey = String(user?.user?.spaceKey || '');
    setLoading(true);
    setMessages([]);
    try {
      const res = await fetch(
        `/rest-proxy/vc_chat_history?user_id=${userId}&session_id=${histSessionId}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            clientid:     `GSUSJGITCDXHEDBNLIUD@${spaceKey}`,
            appname:      'demo',
            clientsecret: 'GSVDOAFXOXAAFTONROLX1774026824090',
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const rebuilt: Message[] = [];
      for (const item of data) {
        if (!item) continue;
        let rawResp: any = {};
        try { rawResp = JSON.parse(item.response); } catch { rawResp = { response: item.response }; }
        rebuilt.push({
          role: 'user', text: String(item.question || ''),
          parsed: null, isError: false, timestamp: new Date(),
        });
        rebuilt.push({
          role: 'assistant', text: '',
          parsed: parseResponse(rawResp),
          isError: false, timestamp: new Date(),
        });
      }
      setMessages(rebuilt);
      setSessionId(histSessionId);
    } catch (e) {
      console.error('[loadHistorySession]', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete history ───────────────────────────────────────────────────────────
  const deleteHistorySession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;
    const userId   = String(user?.user?.id || user?.user?.userId || '');
    const spaceKey = String(user?.user?.spaceKey || '');
    try {
      await fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          IngestionId:     '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret: '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
        },
        body: JSON.stringify({
          question: '', response: '', user_id: userId, action: 'delete',
          session_id: sid, spacekey: spaceKey,
          user_name:  user?.user?.fullName || 'Unknown',
          user_email: user?.user?.emailID  || 'unknown@ravity.io',
        }),
      });
      setChatHistory(prev => prev.filter(h => h.session_id !== sid));
    } catch {}
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading) return;

    // Inject context as explicit SQL instructions, not bracket notation
    // Bracket notation was being treated as a filter by the SQL agent
    const vinFilter = vin ? `Filter results to vin = '${vin}'. ` : '';
    const dateFilter = apiParams.startdate
      ? `Use process_date between '${apiParams.startdate}' and '${apiParams.enddate}'. `
      : '';
    const contextualText = `${vinFilter}${dateFilter}${text}`;

    setInputText('');
    setMessages(prev => [...prev, {
      role: 'user', text, parsed: null, isError: false, timestamp: new Date(),
    }]);
    setLoading(true);

    // spaceKey and userID MUST match the logged-in user's authtoken
    // assistId/connector are fixed (they identify the VDTSIA assistant)
    const userId    = String(user?.user?.id || user?.user?.userId || '');
    const spaceKey  = String(user?.user?.spaceKey || '');
    const authToken = token || '';
    const sid       = sessionId ||
      `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const body = new URLSearchParams({
        serviceType: 'process_text',
        data: JSON.stringify({
          text:             contextualText,
          userID:           String(userId),
          sessionID:        sid,
          assistId:         BIZVIZ_ASSIST_ID,
          connector:        BIZVIZ_CONNECTOR,
          description:      BIZVIZ_DESCRIPTION,
          tables:           BIZVIZ_TABLES,
          selected_files:   [],
          type:             'connector',
          documentStoreIds: BIZVIZ_TABLES,
          spaceKey:         spaceKey,
        }),
        spacekey: spaceKey,
      });

      const res = await fetch(BIZVIZ_ENDPOINT, {
        method:  'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept:         'application/json, text/plain, */*',
          authtoken:      authToken,
          spacekey:       spaceKey,
          userid:         userId,
        },
        body,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}${errText ? ': ' + errText.slice(0, 150) : ''}`);
      }

      // Parse response safely — handle both JSON and plain text
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const txt = await res.text();
        try { data = JSON.parse(txt); } catch { data = { response: txt }; }
      }

      const parsed = parseResponse(data);

      setMessages(prev => [...prev, {
        role: 'assistant', text: '', parsed, isError: false, timestamp: new Date(),
      }]);
      setChatHistory(prev => [{ context: text, session_id: sid }, ...prev.slice(0, 49)]);

      // Ingestion — fire and forget
      fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          IngestionId:     '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret: '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
        },
        body: JSON.stringify({
          question: text, response: JSON.stringify(data),
          user_id: userId, action: 'add', session_id: sid, spacekey: spaceKey,
          user_name:  user?.user?.fullName || 'Unknown',
          user_email: user?.user?.emailID  || 'unknown@ravity.io',
        }),
      }).catch(() => {});

    } catch (err: any) {
      const errMsg = err?.message || 'Something went wrong.';
      setMessages(prev => [...prev, {
        role: 'assistant', text: errMsg,
        parsed: null, isError: true, timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputText, loading, vin, apiParams, token, user, sessionId]); // eslint-disable-line

  const startNewChat = () => {
    setMessages([]);
    setInputText('');
    const userId = String(user?.user?.id || user?.user?.userId || 'dt_user');
    const newSid = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(newSid);
    localStorage.setItem(`dt_session_${userId}`, newSid);
  };

  const firstName   = user?.user?.fullName?.split(' ')[0] || 'there';
  const showWelcome = messages.length === 0;

  return (
    <>
      <style>{`
        .dt-copilot-wrap{display:flex;height:calc(100vh - 72px);font-family:'DM Sans',sans-serif;background:#0f0f13;overflow:hidden}
        .dt-sidebar{width:260px;min-width:260px;background:#17171f;border-right:1px solid #2a2a38;display:flex;flex-direction:column;transition:width 0.25s;overflow:hidden}
        .dt-sidebar.collapsed{width:56px;min-width:56px}
        .dt-sidebar-btn{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#9090b0;font-size:13px;font-weight:600;cursor:pointer;border-bottom:1px solid #2a2a38;transition:background 0.15s,color 0.15s;white-space:nowrap;background:none;border-left:none;border-right:none;border-top:none;width:100%;text-align:left;font-family:inherit}
        .dt-sidebar-btn:hover{background:#1f1f2e !important;color:#fff}
        .dt-hist-list{flex:1;overflow-y:auto;padding:8px}
        .dt-hist-list::-webkit-scrollbar{width:4px}.dt-hist-list::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:4px}
        .dt-hist-item{display:flex;align-items:center;gap:6px;padding:9px 10px;border-radius:8px;cursor:pointer;color:#8080a0;font-size:12px;transition:all 0.15s;margin-bottom:2px}
        .dt-hist-item:hover{background:#1f1f2e;color:#e0e0f0}
        .dt-hist-item span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dt-hist-del{flex-shrink:0;background:none;border:none;color:transparent;cursor:pointer;font-size:13px;padding:2px 5px;border-radius:4px;transition:all 0.15s}
        .dt-hist-item:hover .dt-hist-del{color:#ff6060}
        .dt-collapse-btn{padding:12px 16px;border-top:1px solid #2a2a38;color:#404060;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:color 0.15s}
        .dt-collapse-btn:hover{color:#9090b0}
        .dt-chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#0f0f13}
        .dt-context-bar{display:flex;align-items:center;background:#13131b;border-bottom:1px solid #1e1e2a;flex-shrink:0;flex-wrap:wrap}
        .dt-ctx-pill{display:flex;align-items:center;gap:7px;padding:10px 18px;font-size:12px;border-right:1px solid #1e1e2a}
        .dt-ctx-label{color:#404060;text-transform:uppercase;letter-spacing:0.6px;font-size:10px;font-weight:600}
        .dt-ctx-value{color:#e91e8c;font-family:monospace;font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dt-ctx-value.dim{color:#404060}
        .dt-messages{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:22px}
        .dt-messages::-webkit-scrollbar{width:5px}.dt-messages::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:4px}
        .dt-welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;text-align:center}
        .dt-welcome-logo{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#e91e8c,#c2185b);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 18px;box-shadow:0 8px 32px #e91e8c44}
        .dt-welcome h2{color:#e0e0f0;font-size:22px;font-weight:700;margin:0 0 10px}
        .dt-welcome p{color:#6060a0;font-size:14px;margin:0 0 28px;max-width:440px;line-height:1.7}
        .dt-vin-badge{display:inline-flex;align-items:center;gap:8px;background:#1f1f2e;border:1px solid #2a2a38;border-radius:20px;padding:7px 16px;font-size:12px;color:#9090b0;margin-bottom:28px}
        .dt-vin-badge strong{color:#e91e8c;font-family:monospace}
        .dt-init-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:580px;width:100%}
        .dt-init-card{background:#17171f;border:1px solid #2a2a38;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;color:#8080a0;font-size:13px;line-height:1.5;transition:all 0.2s;font-family:inherit}
        .dt-init-card:hover{border-color:#e91e8c55;background:#1f1f2e;color:#e0e0f0;transform:translateY(-2px)}
        .dt-msg-user{display:flex;justify-content:flex-end}
        .dt-bubble-user{background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:12px 18px;border-radius:18px 18px 4px 18px;max-width:68%;font-size:14px;line-height:1.6;box-shadow:0 4px 16px #e91e8c30}
        .dt-msg-ai{display:flex;align-items:flex-start;gap:12px}
        .dt-ai-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#e91e8c,#c2185b);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:2px;box-shadow:0 2px 8px #e91e8c40}
        .dt-bubble-ai{background:#17171f;border:1px solid #2a2a38;color:#c0c0e0;padding:16px 20px;border-radius:4px 18px 18px 18px;max-width:calc(100% - 44px);font-size:14px;line-height:1.8;width:100%;box-sizing:border-box}
        .dt-bubble-ai.error{border-color:#ff4d4d44;background:#1a1015;color:#ff8080}
        .dt-bubble-ai p{margin:0 0 8px}.dt-bubble-ai p:last-child{margin:0}
        .dt-bubble-ai strong{color:#e0e0f0}
        .dt-bubble-ai ul,.dt-bubble-ai ol{padding-left:18px;margin:6px 0}
        .dt-ts{font-size:10px;color:#303050;margin-top:5px;text-align:right}
        .dt-table-wrap{overflow-x:auto;border-radius:10px;border:1px solid #2a2a38}
        .dt-table{border-collapse:collapse;width:100%;font-size:12.5px}
        .dt-table thead tr{background:#1f1f2e}
        .dt-table th{padding:9px 13px;text-align:left;color:#9090b0;font-weight:600;border-bottom:1px solid #2a2a38;white-space:nowrap;text-transform:uppercase;letter-spacing:0.4px;font-size:11px}
        .dt-table td{padding:8px 13px;border-bottom:1px solid #1a1a28;color:#c0c0e0}
        .dt-table tbody tr:last-child td{border-bottom:none}
        .dt-table tbody tr:hover td{background:#1f1f2e}
        .dt-suggestions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
        .dt-sugg-chip{background:#1a1a28;border:1px solid #2a2a38;color:#8080b0;padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:inherit;text-align:left}
        .dt-sugg-chip:hover{border-color:#e91e8c55;color:#e0e0f0;background:#1f1f2e}
        .dt-typing{display:flex;align-items:flex-start;gap:12px}
        .dt-typing-dots{display:flex;gap:5px;align-items:center;padding:14px 18px;background:#17171f;border:1px solid #2a2a38;border-radius:4px 18px 18px 18px}
        .dt-typing-dots span{width:7px;height:7px;border-radius:50%;background:#e91e8c;animation:dtPulse 1.2s infinite}
        .dt-typing-dots span:nth-child(2){animation-delay:.2s}
        .dt-typing-dots span:nth-child(3){animation-delay:.4s}
        @keyframes dtPulse{0%,100%{opacity:.2;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
        .dt-input-bar{padding:14px 24px 18px;background:#13131b;border-top:1px solid #1e1e2a;flex-shrink:0}
        .dt-input-inner{display:flex;align-items:center;gap:10px;background:#17171f;border:1.5px solid #2a2a38;border-radius:14px;padding:4px 4px 4px 16px;transition:border-color 0.2s}
        .dt-input-inner:focus-within{border-color:#e91e8c55;box-shadow:0 0 0 3px #e91e8c0f}
        .dt-input-field{flex:1;background:none;border:none;outline:none;color:#e0e0f0;font-size:14px;font-family:inherit;padding:8px 0}
        .dt-input-field::placeholder{color:#404060}
        .dt-send-btn{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#e91e8c,#c2185b);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;flex-shrink:0;transition:all 0.2s;box-shadow:0 2px 10px #e91e8c40}
        .dt-send-btn:hover:not(:disabled){transform:scale(1.08)}
        .dt-send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .dt-input-hint{font-size:11px;color:#2a2a48;margin-top:7px;text-align:center}
        @media(max-width:768px){.dt-sidebar{display:none}.dt-init-grid{grid-template-columns:1fr}.dt-messages{padding:14px}}
      `}</style>

      <div className="dt-copilot-wrap">

        {/* Sidebar */}
        <div className={`dt-sidebar${historyOpen ? '' : ' collapsed'}`}>
          <button className="dt-sidebar-btn" style={{ borderBottom: '1px solid #2a2a38' }} onClick={startNewChat}>
            <span>✦</span>
            {historyOpen && <span>New Conversation</span>}
          </button>
          <button className="dt-sidebar-btn" style={{ borderBottom: '1px solid #2a2a38' }} onClick={() => setHistoryOpen(p => !p)}>
            <span>🕑</span>
            {historyOpen && <span>History</span>}
          </button>
          {historyOpen && (
            <div className="dt-hist-list">
              {chatHistory.length === 0 && (
                <div style={{ padding: '16px 10px', color: '#303050', fontSize: 12 }}>
                  No previous conversations
                </div>
              )}
              {chatHistory.map((item, idx) => (
                <div key={idx} className="dt-hist-item"
                  onMouseEnter={() => setHoveredHist(idx)}
                  onMouseLeave={() => setHoveredHist(null)}
                  onClick={() => loadHistorySession(item.session_id)}>
                  <span title={item.context}>💬 {item.context}</span>
                  <button className="dt-hist-del"
                    onClick={e => deleteHistorySession(e, item.session_id)}
                    title="Delete">🗑</button>
                </div>
              ))}
            </div>
          )}
          <div className="dt-collapse-btn" onClick={() => setHistoryOpen(p => !p)}>
            <span>{historyOpen ? '◀' : '▶'}</span>
            {historyOpen && <span>Collapse</span>}
          </div>
        </div>

        {/* Main chat */}
        <div className="dt-chat-main">

          {/* Context bar */}
          <div className="dt-context-bar">
            <div className="dt-ctx-pill">
              <span className="dt-ctx-label">VIN</span>
              <span className={`dt-ctx-value${vin ? '' : ' dim'}`}>{vin || 'not selected'}</span>
            </div>
            <div className="dt-ctx-pill">
              <span className="dt-ctx-label">From</span>
              <span className="dt-ctx-value">{apiParams.startdate}</span>
            </div>
            <div className="dt-ctx-pill">
              <span className="dt-ctx-label">To</span>
              <span className="dt-ctx-value">{apiParams.enddate}</span>
            </div>
            <div style={{ padding: '4px 12px' }}>
              <DateFilterBar title="" onApply={() => setTrigger(p => p + 1)} />
            </div>
          </div>

          {/* Welcome or messages */}
          {showWelcome ? (
            <div className="dt-welcome">
              <div className="dt-welcome-logo">🤖</div>
              <h2>Hey {firstName}, I'm your Vehicle Copilot</h2>
              <p>
                Ask me anything about this vehicle — fuel efficiency, fault codes,
                driving behaviour, maintenance, warranty risk, or fleet comparisons.
                I query the telematics data directly and show you charts and tables.
              </p>
              {vin && (
                <div className="dt-vin-badge">
                  <span>Analysing</span>
                  <strong>{vin}</strong>
                  <span>·</span>
                  <span>{apiParams.startdate} → {apiParams.enddate}</span>
                </div>
              )}
              <div className="dt-init-grid">
                {INITIAL_SUGGESTIONS.map((q, i) => (
                  <button key={i} className="dt-init-card" onClick={() => sendMessage(q)}>{q}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="dt-messages">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  {msg.role === 'user' ? (
                    <div className="dt-msg-user">
                      <div>
                        <div className="dt-bubble-user">{msg.text}</div>
                        <div className="dt-ts">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="dt-msg-ai">
                      <div className="dt-ai-avatar">🤖</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={`dt-bubble-ai${msg.isError ? ' error' : ''}`}>
                          {msg.isError
                            ? <p>{msg.text}</p>
                            : <AssistantContent parsed={msg.parsed} onSuggestion={sendMessage} />
                          }
                        </div>
                        <div className="dt-ts">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="dt-typing">
                  <div className="dt-ai-avatar">🤖</div>
                  <div className="dt-typing-dots"><span /><span /><span /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="dt-input-bar">
            <div className="dt-input-inner">
              <input
                ref={inputRef}
                className="dt-input-field"
                placeholder={vin ? `Ask about VIN ${vin}…` : 'Ask about this vehicle…'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                disabled={loading}
              />
              <button className="dt-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !inputText.trim()}
                title="Send (Enter)">
                ➤
              </button>
            </div>
            <div className="dt-input-hint">VIN &amp; date range are automatically included in every question</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiAnalysisDashboard;
