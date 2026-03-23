import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';

// ─── BizWiz Digital Twin Config ───────────────────────────────────────────────
const BIZVIZ_ENDPOINT    = '/bizviz-proxy/llmService';
const BIZVIZ_SPACE_KEY   = process.env.REACT_APP_BIZVIZ_SPACE_KEY || '5129';
const BIZVIZ_ASSIST_ID   = process.env.REACT_APP_BIZVIZ_ASSIST_ID || '3514581148';
const BIZVIZ_CONNECTOR   = process.env.REACT_APP_BIZVIZ_CONNECTOR || '238893540';
const BIZVIZ_TABLES      = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];
const BIZVIZ_DESCRIPTION =
  'ROLE: Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) ' +
  'PLATFORM: Ravity Digital Twin Dashboard — Maruti Suzuki Victoris Project ' +
  'ARCHITECTURE: Privacy-first, SQL-native, on-premise execution ' +
  'MARKET: India | STANDARDS: BS6 / ARAI | OEM: Maruti Suzuki  ' +
  'You are a specialised automotive intelligence agent embedded in the Ravity Vehicle Digital Twin platform. ' +
  'Your job is to answer questions about vehicle health, driver behaviour, fuel efficiency, DTC faults, ' +
  'warranty risk, fleet performance, and operational costs — without any raw vehicle data ever leaving ' +
  'the secure local environment.';

// ─── Initial suggestions ──────────────────────────────────────────────────────
const INITIAL_SUGGESTIONS = [
  'How many harsh acceleration events per VIN?',
  'Show fuel efficiency trend for this vehicle over the selected period',
  'List all active DTC fault codes and their severity',
  'How does this vehicle compare to the fleet baseline?',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartConfig {
  chart_type: string;   // BarChart | LineChart | PieChart etc.
  chart_title?: string;
  x_axis: string;       // key name for x
  y_axis: string;       // key name for y
  x_axis_label?: string;
  y_axis_label?: string;
  data: any[];          // parsed rows
}

interface ParsedResponse {
  tableRows: any[];
  answer: string;
  analysis: string;
  explanation: string;
  suggestions: string[];
  chart?: ChartConfig;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  parsed?: ParsedResponse;
  isError?: boolean;
  timestamp: Date;
}

// ─── Response parser ──────────────────────────────────────────────────────────
// Response shape (confirmed from network):
// { original_text, response: JSON_STRING {
//     data: JSON_STRING (array of rows),
//     summary: JSON_STRING,
//     explanation: string,
//     query: string,
//     visualization: {
//       chart_type, chart_title, x_axis, y_axis,
//       x_axis_label, y_axis_label,
//       Answer: HTML string,
//       Analysis: HTML string,
//       Suggestions: string[],
//     }
//   }
// }
const parseResponse = (raw: any): ParsedResponse => {
  const empty: ParsedResponse = {
    tableRows: [], answer: '', analysis: '', explanation: '', suggestions: [],
  };
  if (!raw) return empty;

  // Unwrap outer response string
  let inner: any = {};
  try {
    inner = typeof raw.response === 'string' ? JSON.parse(raw.response) : raw.response;
  } catch {
    return { ...empty, answer: String(raw.response || raw) };
  }

  // Parse data rows (it's a JSON string inside)
  let tableRows: any[] = [];
  try {
    const dataRaw = inner.data ?? inner.summary ?? '[]';
    tableRows = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : (Array.isArray(dataRaw) ? dataRaw : []);
  } catch {}

  const viz         = inner.visualization || {};
  const answer      = viz.Answer    || viz.answer    || '';
  const analysis    = viz.Analysis  || viz.analysis  || '';
  const explanation = inner.explanation || '';

  const rawSugg   = viz.Suggestions || viz.suggestions || [];
  const suggestions: string[] = Array.isArray(rawSugg)
    ? rawSugg
    : String(rawSugg).split(',').map((s: string) => s.trim()).filter(Boolean);

  // Chart config — only build if we have data + axes
  let chart: ChartConfig | undefined;
  if (tableRows.length > 0 && viz.chart_type && viz.x_axis && viz.y_axis) {
    chart = {
      chart_type:   viz.chart_type,
      chart_title:  viz.chart_title || '',
      x_axis:       viz.x_axis,
      y_axis:       viz.y_axis,
      x_axis_label: viz.x_axis_label || viz.x_axis,
      y_axis_label: viz.y_axis_label || viz.y_axis,
      data:         tableRows,
    };
  }

  return { tableRows, answer, analysis, explanation, suggestions, chart };
};

// ─── Mini inline bar chart (pure SVG, no dependencies) ───────────────────────
const InlineBarChart: React.FC<{ cfg: ChartConfig }> = ({ cfg }) => {
  const MAX_BARS  = 20;
  const data      = cfg.data.slice(0, MAX_BARS);
  const values    = data.map(r => Number(r[cfg.y_axis] ?? 0));
  const maxVal    = Math.max(...values, 1);
  const W         = 100; // % viewBox units per bar slot
  const BAR_W     = 28;
  const GAP       = 8;
  const H_CHART   = 160;
  const LABEL_H   = 40;
  const SVG_W     = data.length * (BAR_W + GAP);
  const SVG_H     = H_CHART + LABEL_H;

  const fmtLabel  = (s: string) =>
    String(s).length > 8 ? '…' + String(s).slice(-6) : String(s);
  const fmtVal    = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div style={{ marginTop: 14 }}>
      {cfg.chart_title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9090b0', marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {cfg.chart_title}
        </div>
      )}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block', minWidth: Math.max(SVG_W, 320), height: SVG_H, width: '100%' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const y = H_CHART - f * H_CHART;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={SVG_W} y2={y}
                  stroke="#2a2a38" strokeWidth={0.8} strokeDasharray={i === 0 ? '' : '3,3'} />
                <text x={2} y={y - 3} fill="#404060" fontSize={9}>
                  {fmtVal(f * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((row, i) => {
            const val  = values[i];
            const barH = (val / maxVal) * H_CHART;
            const x    = i * (BAR_W + GAP);
            const y    = H_CHART - barH;
            const hue  = 330; // pink family
            const sat  = 60 + (i % 3) * 10;
            return (
              <g key={i}>
                <rect x={x} y={y} width={BAR_W} height={barH}
                  fill={`hsl(${hue},${sat}%,55%)`} rx={3} opacity={0.9}>
                  <title>{`${row[cfg.x_axis]}: ${val}`}</title>
                </rect>
                {/* Value on top */}
                <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle"
                  fill="#c0c0e0" fontSize={8}>
                  {fmtVal(val)}
                </text>
                {/* X label */}
                <text
                  x={x + BAR_W / 2} y={H_CHART + 14}
                  textAnchor="middle" fill="#6060a0" fontSize={8}
                  transform={`rotate(-30, ${x + BAR_W / 2}, ${H_CHART + 14})`}
                >
                  {fmtLabel(String(row[cfg.x_axis]))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {data.length < cfg.data.length && (
        <div style={{ fontSize: 11, color: '#404060', marginTop: 4 }}>
          Showing first {MAX_BARS} of {cfg.data.length} results. See table below for all data.
        </div>
      )}
      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#555570' }}>{cfg.x_axis_label}</span>
        <span style={{ fontSize: 10, color: '#555570' }}>{cfg.y_axis_label}</span>
      </div>
    </div>
  );
};

// ─── Data table ───────────────────────────────────────────────────────────────
const DataTable: React.FC<{ rows: any[] }> = ({ rows }) => {
  const [expanded, setExpanded] = useState(false);
  if (!rows.length) return null;
  const keys        = Object.keys(rows[0]);
  const fmtKey      = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const visible     = expanded ? rows : rows.slice(0, 10);

  return (
    <div style={{ marginTop: 14 }}>
      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>{keys.map(k => <th key={k}>{fmtKey(k)}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i}>
                {keys.map(k => <td key={k}>{row[k] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ marginTop: 6, background: 'none', border: '1px solid #2a2a38',
            borderRadius: 8, color: '#6060a0', fontSize: 11, padding: '4px 12px', cursor: 'pointer' }}
        >
          {expanded ? '▲ Show less' : `▼ Show all ${rows.length} rows`}
        </button>
      )}
    </div>
  );
};

// ─── Assistant bubble content ─────────────────────────────────────────────────
const AssistantContent: React.FC<{ parsed: ParsedResponse; onSuggestion: (s: string) => void }> = ({ parsed, onSuggestion }) => (
  <div>
    {/* Chart */}
    {parsed.chart && <InlineBarChart cfg={parsed.chart} />}

    {/* Answer */}
    {parsed.answer && (
      <div dangerouslySetInnerHTML={{ __html: parsed.answer }}
        style={{ marginTop: parsed.chart ? 16 : 0 }} />
    )}

    {/* Analysis */}
    {parsed.analysis && (
      <div dangerouslySetInnerHTML={{ __html: parsed.analysis }}
        style={{ marginTop: 8, borderTop: '1px solid #2a2a38', paddingTop: 10 }} />
    )}

    {/* Explanation */}
    {parsed.explanation && !parsed.answer && (
      <p style={{ margin: 0, color: '#a0a0c0' }}>{parsed.explanation}</p>
    )}

    {/* Table */}
    {parsed.tableRows.length > 0 && <DataTable rows={parsed.tableRows} />}

    {/* Suggestions */}
    {parsed.suggestions.length > 0 && (
      <div className="dt-suggestions">
        {parsed.suggestions.map((s, i) => (
          <button key={i} className="dt-sugg-chip" onClick={() => onSuggestion(s)}>{s}</button>
        ))}
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [trigger,     setTrigger]     = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Session ID ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const userId = user?.user?.id || user?.user?.userId || '1217690654';
    const key    = `dt_session_${userId}`;
    let sid      = localStorage.getItem(key);
    if (!sid) {
      sid = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, sid);
    }
    setSessionId(sid);
  }, [user]);

  // ── Fetch chat history ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      const userId = user?.user?.id || user?.user?.userId;
      if (!userId) return;
      try {
        const res = await fetch(`/rest-proxy/vc_chat_history_older?user_id=${userId}`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            clientid:     'GSUSJGITCDXHEDBNLIUD@5129',
            appname:      'demo',
            clientsecret: 'GSVDOAFXOXAAFTONROLX1774026824090',
          },
        });
        if (!res.ok) return;
        const text = await res.text();
        const data = (text.startsWith('{') || text.startsWith('[')) ? JSON.parse(text) : [];
        setChatHistory(Array.isArray(data) ? data : []);
      } catch {}
    };
    fetchHistory();
  }, [user]);

  // ── Load history session ─────────────────────────────────────────────────────
  const loadHistorySession = async (histSessionId: string) => {
    const userId = user?.user?.id || user?.user?.userId;
    if (!userId) return;
    setLoading(true);
    setMessages([]);
    try {
      const res = await fetch(
        `/rest-proxy/vc_chat_history?user_id=${userId}&session_id=${histSessionId}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            clientid:     'GSUSJGITCDXHEDBNLIUD@5129',
            appname:      'demo',
            clientsecret: 'GSVDOAFXOXAAFTONROLX1774026824090',
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      const rebuilt: Message[] = [];
      for (const item of data) {
        let rawResp: any;
        try { rawResp = JSON.parse(item.response); } catch { rawResp = { response: item.response }; }
        rebuilt.push({ role: 'user',      text: item.question, timestamp: new Date() });
        rebuilt.push({ role: 'assistant', text: '', parsed: parseResponse(rawResp), timestamp: new Date() });
      }
      setMessages(rebuilt);
      setSessionId(histSessionId);
    } catch {}
    finally { setLoading(false); }
  };

  // ── Delete history session ───────────────────────────────────────────────────
  const deleteHistorySession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;
    const userId   = user?.user?.id || user?.user?.userId;
    const spaceKey = user?.user?.spaceKey || BIZVIZ_SPACE_KEY;
    try {
      await fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          IngestionId:      '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret:  '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
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

    // Inject VIN + date context
    const contextualText =
      `[VIN: ${vin || 'all'} | Period: ${apiParams.startdate} to ${apiParams.enddate}] ${text}`;

    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    setLoading(true);

    const userId    = user?.user?.id || user?.user?.userId || '1217690654';
    const spaceKey  = user?.user?.spaceKey || BIZVIZ_SPACE_KEY;
    const authToken = token;
    const sid       = sessionId || `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const body = new URLSearchParams({
        serviceType: 'process_text',
        data: JSON.stringify({
          text:             contextualText,
          userID:           userId,
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
          userid:         String(userId),
        },
        body,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`BizWiz ${res.status}: ${err.slice(0, 200)}`);
      }

      const data   = await res.json();
      const parsed = parseResponse(data);

      setMessages(prev => [...prev, { role: 'assistant', text: '', parsed, timestamp: new Date() }]);
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
          question:   text,
          response:   JSON.stringify(data),
          user_id:    userId,
          action:     'add',
          session_id: sid,
          spacekey:   spaceKey,
          user_name:  user?.user?.fullName || 'Unknown',
          user_email: user?.user?.emailID  || 'unknown@ravity.io',
        }),
      }).catch(() => {});

    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.message || 'Something went wrong.',
        isError: true, timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [inputText, loading, vin, apiParams, token, user, sessionId]); // eslint-disable-line

  const startNewChat = () => {
    setMessages([]);
    setInputText('');
    const userId = user?.user?.id || user?.user?.userId || '1217690654';
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

        /* Sidebar */
        .dt-sidebar{width:260px;min-width:260px;background:#17171f;border-right:1px solid #2a2a38;display:flex;flex-direction:column;transition:width 0.25s;overflow:hidden}
        .dt-sidebar.collapsed{width:56px;min-width:56px}
        .dt-sidebar-btn{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#9090b0;font-size:13px;font-weight:600;cursor:pointer;border-bottom:1px solid #2a2a38;transition:background 0.15s,color 0.15s;white-space:nowrap}
        .dt-sidebar-btn:hover{background:#1f1f2e;color:#fff}
        .dt-hist-list{flex:1;overflow-y:auto;padding:8px}
        .dt-hist-list::-webkit-scrollbar{width:4px}.dt-hist-list::-webkit-scrollbar-track{background:transparent}.dt-hist-list::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:4px}
        .dt-hist-item{display:flex;align-items:center;gap:6px;padding:9px 10px;border-radius:8px;cursor:pointer;color:#8080a0;font-size:12px;transition:all 0.15s;margin-bottom:2px}
        .dt-hist-item:hover{background:#1f1f2e;color:#e0e0f0}
        .dt-hist-item span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dt-hist-del{flex-shrink:0;background:none;border:none;color:transparent;cursor:pointer;font-size:13px;padding:2px 5px;border-radius:4px;transition:all 0.15s}
        .dt-hist-item:hover .dt-hist-del{color:#ff6060}
        .dt-hist-del:hover{background:#3a1a1a !important}
        .dt-collapse-btn{padding:12px 16px;border-top:1px solid #2a2a38;color:#404060;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:color 0.15s}
        .dt-collapse-btn:hover{color:#9090b0}

        /* Chat main */
        .dt-chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#0f0f13}

        /* Context bar */
        .dt-context-bar{display:flex;align-items:center;background:#13131b;border-bottom:1px solid #1e1e2a;flex-shrink:0;flex-wrap:wrap}
        .dt-ctx-pill{display:flex;align-items:center;gap:7px;padding:10px 18px;font-size:12px;border-right:1px solid #1e1e2a}
        .dt-ctx-label{color:#404060;text-transform:uppercase;letter-spacing:0.6px;font-size:10px;font-weight:600}
        .dt-ctx-value{color:#e91e8c;font-family:'DM Mono',monospace;font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dt-ctx-value.dim{color:#404060}

        /* Messages */
        .dt-messages{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:22px}
        .dt-messages::-webkit-scrollbar{width:5px}.dt-messages::-webkit-scrollbar-track{background:transparent}.dt-messages::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:4px}

        /* Welcome */
        .dt-welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;text-align:center}
        .dt-welcome-logo{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#e91e8c,#c2185b);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 18px;box-shadow:0 8px 32px #e91e8c44}
        .dt-welcome h2{color:#e0e0f0;font-size:22px;font-weight:700;margin:0 0 10px}
        .dt-welcome p{color:#6060a0;font-size:14px;margin:0 0 28px;max-width:440px;line-height:1.7}
        .dt-vin-badge{display:inline-flex;align-items:center;gap:8px;background:#1f1f2e;border:1px solid #2a2a38;border-radius:20px;padding:7px 16px;font-size:12px;color:#9090b0;margin-bottom:28px}
        .dt-vin-badge strong{color:#e91e8c;font-family:'DM Mono',monospace}
        .dt-init-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:580px;width:100%}
        .dt-init-card{background:#17171f;border:1px solid #2a2a38;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;color:#8080a0;font-size:13px;line-height:1.5;transition:all 0.2s;font-family:inherit}
        .dt-init-card:hover{border-color:#e91e8c55;background:#1f1f2e;color:#e0e0f0;transform:translateY(-2px);box-shadow:0 4px 20px #0008}

        /* Bubbles */
        .dt-msg-user{display:flex;justify-content:flex-end}
        .dt-bubble-user{background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:12px 18px;border-radius:18px 18px 4px 18px;max-width:68%;font-size:14px;line-height:1.6;box-shadow:0 4px 16px #e91e8c30}
        .dt-msg-ai{display:flex;align-items:flex-start;gap:12px}
        .dt-ai-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#e91e8c,#c2185b);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:2px;box-shadow:0 2px 8px #e91e8c40}
        .dt-bubble-ai{background:#17171f;border:1px solid #2a2a38;color:#c0c0e0;padding:16px 20px;border-radius:4px 18px 18px 18px;max-width:calc(100% - 44px);font-size:14px;line-height:1.8;width:100%}
        .dt-bubble-ai.error{border-color:#ff4d4d44;background:#1a1015;color:#ff8080}
        .dt-bubble-ai p{margin:0 0 8px}.dt-bubble-ai p:last-child{margin:0}
        .dt-bubble-ai strong{color:#e0e0f0}
        .dt-bubble-ai ul,.dt-bubble-ai ol{padding-left:18px;margin:6px 0}
        .dt-bubble-ai li{margin-bottom:4px}
        .dt-ts{font-size:10px;color:#303050;margin-top:5px;text-align:right}

        /* Table */
        .dt-table-wrap{overflow-x:auto;border-radius:10px;border:1px solid #2a2a38;margin-top:4px}
        .dt-table{border-collapse:collapse;width:100%;font-size:12.5px}
        .dt-table thead tr{background:#1f1f2e}
        .dt-table th{padding:9px 13px;text-align:left;color:#9090b0;font-weight:600;border-bottom:1px solid #2a2a38;white-space:nowrap;text-transform:uppercase;letter-spacing:0.4px;font-size:11px}
        .dt-table td{padding:8px 13px;border-bottom:1px solid #1a1a28;color:#c0c0e0}
        .dt-table tbody tr:last-child td{border-bottom:none}
        .dt-table tbody tr:hover td{background:#1f1f2e}

        /* Suggestions */
        .dt-suggestions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
        .dt-sugg-chip{background:#1a1a28;border:1px solid #2a2a38;color:#8080b0;padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.2s;font-family:inherit;text-align:left}
        .dt-sugg-chip:hover{border-color:#e91e8c55;color:#e0e0f0;background:#1f1f2e}

        /* Typing */
        .dt-typing{display:flex;align-items:flex-start;gap:12px}
        .dt-typing-dots{display:flex;gap:5px;align-items:center;padding:14px 18px;background:#17171f;border:1px solid #2a2a38;border-radius:4px 18px 18px 18px}
        .dt-typing-dots span{width:7px;height:7px;border-radius:50%;background:#e91e8c;animation:dtPulse 1.2s infinite}
        .dt-typing-dots span:nth-child(2){animation-delay:.2s}
        .dt-typing-dots span:nth-child(3){animation-delay:.4s}
        @keyframes dtPulse{0%,100%{opacity:.2;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}

        /* Input */
        .dt-input-bar{padding:14px 24px 18px;background:#13131b;border-top:1px solid #1e1e2a;flex-shrink:0}
        .dt-input-inner{display:flex;align-items:center;gap:10px;background:#17171f;border:1.5px solid #2a2a38;border-radius:14px;padding:4px 4px 4px 16px;transition:border-color 0.2s,box-shadow 0.2s}
        .dt-input-inner:focus-within{border-color:#e91e8c55;box-shadow:0 0 0 3px #e91e8c0f}
        .dt-input-field{flex:1;background:none;border:none;outline:none;color:#e0e0f0;font-size:14px;font-family:inherit;padding:8px 0}
        .dt-input-field::placeholder{color:#404060}
        .dt-send-btn{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#e91e8c,#c2185b);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;flex-shrink:0;transition:all 0.2s;box-shadow:0 2px 10px #e91e8c40}
        .dt-send-btn:hover:not(:disabled){transform:scale(1.08);box-shadow:0 4px 16px #e91e8c60}
        .dt-send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .dt-input-hint{font-size:11px;color:#2a2a48;margin-top:7px;text-align:center}

        @media(max-width:768px){.dt-sidebar{display:none}.dt-init-grid{grid-template-columns:1fr}.dt-messages{padding:14px}}
      `}</style>

      <div className="dt-copilot-wrap">

        {/* ── Sidebar ── */}
        <div className={`dt-sidebar${historyOpen ? '' : ' collapsed'}`}>
          <div className="dt-sidebar-btn" onClick={startNewChat}>
            <span style={{ fontSize: 16 }}>✦</span>
            {historyOpen && <span>New Conversation</span>}
          </div>
          <div className="dt-sidebar-btn" onClick={() => setHistoryOpen(p => !p)}>
            <span style={{ fontSize: 16 }}>🕑</span>
            {historyOpen && <span>History</span>}
          </div>

          {historyOpen && (
            <div className="dt-hist-list">
              {chatHistory.length === 0 && (
                <div style={{ padding: '16px 10px', color: '#303050', fontSize: 12 }}>
                  No previous conversations
                </div>
              )}
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="dt-hist-item"
                  onMouseEnter={() => setHoveredHist(idx)}
                  onMouseLeave={() => setHoveredHist(null)}
                  onClick={() => loadHistorySession(item.session_id)}
                >
                  <span title={item.context}>💬 {item.context}</span>
                  <button
                    className="dt-hist-del"
                    onClick={e => deleteHistorySession(e, item.session_id)}
                    title="Delete conversation"
                  >🗑</button>
                </div>
              ))}
            </div>
          )}

          <div className="dt-collapse-btn" onClick={() => setHistoryOpen(p => !p)}>
            <span>{historyOpen ? '◀' : '▶'}</span>
            {historyOpen && <span>Collapse sidebar</span>}
          </div>
        </div>

        {/* ── Main chat ── */}
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

          {/* Welcome screen */}
          {showWelcome ? (
            <div className="dt-welcome">
              <div className="dt-welcome-logo">🤖</div>
              <h2>Hey {firstName}, I'm your Vehicle Copilot</h2>
              <p>
                Ask me anything about this vehicle — fuel efficiency, fault codes,
                driving behaviour, maintenance, warranty risk, or fleet comparisons.
                I query the Maruti Suzuki telematics data directly and show you charts and tables.
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
                  <button key={i} className="dt-init-card" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
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
                          {msg.isError ? (
                            <p>{msg.text}</p>
                          ) : msg.parsed ? (
                            <AssistantContent
                              parsed={msg.parsed}
                              onSuggestion={sendMessage}
                            />
                          ) : null}
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
                  <div className="dt-typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input bar */}
          <div className="dt-input-bar">
            <div className="dt-input-inner">
              <input
                ref={inputRef}
                className="dt-input-field"
                placeholder={vin ? `Ask about VIN ${vin}…` : 'Ask about this vehicle…'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={loading}
              />
              <button
                className="dt-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !inputText.trim()}
                title="Send (Enter)"
              >➤</button>
            </div>
            <div className="dt-input-hint">
              VIN &amp; date range are automatically included in every question
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AiAnalysisDashboard;
