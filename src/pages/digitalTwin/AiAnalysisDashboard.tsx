import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';

// ─── BizWiz Digital Twin Config ───────────────────────────────────────────────
const BIZVIZ_ENDPOINT      = '/bizviz-proxy/llmService';
const BIZVIZ_SPACE_KEY     = process.env.REACT_APP_BIZVIZ_SPACE_KEY  || '5129';
const BIZVIZ_USER_ID       = process.env.REACT_APP_BIZVIZ_USER_ID    || '1217690654';
const BIZVIZ_ASSIST_ID     = process.env.REACT_APP_BIZVIZ_ASSIST_ID  || '3514581148';
const BIZVIZ_CONNECTOR     = process.env.REACT_APP_BIZVIZ_CONNECTOR  || '238893540';
const BIZVIZ_TABLES        = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];
const BIZVIZ_DESCRIPTION   =
  'ROLE: Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) ' +
  'PLATFORM: Ravity Digital Twin Dashboard — Maruti Suzuki Victoris Project ' +
  'MARKET: India | STANDARDS: BS6 / ARAI | OEM: Maruti Suzuki. ' +
  'Answer questions about vehicle health, driver behaviour, fuel efficiency, ' +
  'DTC faults, warranty risk, and fleet benchmarks using SQL on connected tables.';

// ─── Suggested questions — Digital Twin context ───────────────────────────────
const INITIAL_SUGGESTIONS = [
  'What is the fuel efficiency trend for this vehicle over the selected period?',
  'Show me all active DTC fault codes and their severity',
  'How does this vehicle compare to the fleet baseline for harsh driving events?',
  'What are the top maintenance recommendations based on recent data?',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  text: string;
  htmlContent?: string;
  suggestions?: string[];
  isError?: boolean;
  timestamp: Date;
}

// ─── Response parser (matches fleet copilot logic) ────────────────────────────
const safeParseData = (data: any): any[] => {
  if (!data) return [];
  try {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') return [data];
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') return [parsed];
    }
  } catch {}
  return [];
};

const buildTableHTML = (parsedData: any[]): string => {
  if (!parsedData.length) return '';
  const keys = Object.keys(parsedData[0]);
  const fmtKey = (k: string) =>
    k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const headers = keys.map(k => `<th>${fmtKey(k)}</th>`).join('');
  const rows = parsedData
    .map(row => `<tr>${keys.map(k => `<td>${row[k] ?? '—'}</td>`).join('')}</tr>`)
    .join('');
  return `
    <div class="dt-table-wrap">
      <table class="dt-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
};

const parseResponse = (raw: any): { html: string; suggestions: string[] } => {
  let parsed: any;
  try { parsed = JSON.parse(raw?.response ?? raw); }
  catch { parsed = { html: raw?.response ?? String(raw) }; }

  if (parsed?.html) return { html: parsed.html, suggestions: [] };

  // Strip noise fields
  delete parsed?.query;
  delete parsed?.dashboards;
  delete parsed?.data_refreshed_at;

  const tableHTML   = buildTableHTML(safeParseData(parsed?.data));
  const viz         = parsed?.visualization || {};
  const answer      = viz.Answer   || viz.answer   || '';
  const analysis    = viz.Analysis || viz.analysis || '';
  const explanation = parsed?.explanation ? `<p>${parsed.explanation}</p>` : '';

  const rawSugg = viz.Suggestions || viz.suggestions || '';
  const suggestions: string[] = Array.isArray(rawSugg)
    ? rawSugg
    : String(rawSugg).split(',').map((s: string) => s.trim()).filter(Boolean);

  const html = `${tableHTML}${answer}${analysis}${explanation}` || 'No response available.';
  return { html, suggestions };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAnalysisDashboard: React.FC = () => {
  const { vin, apiParams }  = useDt();
  const { token, user }     = useSelector((state: any) => state.auth);

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [inputText,   setInputText]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [sessionId,   setSessionId]   = useState<string>('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<{ context: string; session_id: string }[]>([]);
  const [hoveredHist, setHoveredHist] = useState<number | null>(null);
  const [trigger,     setTrigger]     = useState(0);

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Session ID — persisted per user ─────────────────────────────────────────
  useEffect(() => {
    const userId = user?.user?.id || user?.user?.userId || BIZVIZ_USER_ID;
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
        const res = await fetch(
          `/rest-proxy/vc_chat_history_older?user_id=${userId}`,
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
        const text = await res.text();
        const data = text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : [];
        setChatHistory(Array.isArray(data) ? data : []);
      } catch {}
    };
    fetchHistory();
  }, [user]);

  // ── Load history session into chat ──────────────────────────────────────────
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
        let fp: any = {};
        try { fp = JSON.parse(item.response); } catch { fp = { response: item.response }; }
        let sp: any = {};
        try { sp = JSON.parse(fp.response); } catch { sp = fp; }
        const { html, suggestions } = parseResponse(sp);
        rebuilt.push({ role: 'user',      text: item.question, timestamp: new Date() });
        rebuilt.push({ role: 'assistant', text: '', htmlContent: html, suggestions, timestamp: new Date() });
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          IngestionId:     '0a20cc5f-18e3-4610-8e70-71ed68af1b3f',
          IngestionSecret: '3xNIv66LGHA5DYU6ha2XgYdqg94mxE751+6OnJkWQNCbibCdD6ea1Q013khFQssA',
        },
        body: JSON.stringify({
          question: '', response: '', user_id: userId, action: 'delete',
          session_id: sid, spacekey: spaceKey,
          user_name:  user?.user?.fullName  || 'Unknown',
          user_email: user?.user?.emailID   || 'unknown@ravity.io',
        }),
      });
      setChatHistory(prev => prev.filter(h => h.session_id !== sid));
    } catch {}
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading) return;

    // Inject VIN + date context automatically
    const contextualText =
      `[VIN: ${vin || 'not selected'} | Period: ${apiParams.startdate} to ${apiParams.enddate}] ${text}`;

    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    setLoading(true);

    const authToken = token;
    const userId    = user?.user?.id || user?.user?.userId || BIZVIZ_USER_ID;
    const spaceKey  = user?.user?.spaceKey || BIZVIZ_SPACE_KEY;
    const sid       = sessionId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

      const data                      = await res.json();
      const { html, suggestions }     = parseResponse(data);

      setMessages(prev => [...prev, {
        role: 'assistant', text: '', htmlContent: html, suggestions, timestamp: new Date(),
      }]);

      // Add to sidebar history
      setChatHistory(prev => [{ context: text, session_id: sid }, ...prev.slice(0, 49)]);

      // Ingestion (fire-and-forget)
      fetch('/ingestion-proxy/ingestion/dataIngestion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json',
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
          user_name:  user?.user?.fullName  || 'Unknown',
          user_email: user?.user?.emailID   || 'unknown@ravity.io',
        }),
      }).catch(() => {});

    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.message || 'Something went wrong.', isError: true, timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [inputText, loading, vin, apiParams, token, user, sessionId]);

  const startNewChat = () => {
    setMessages([]);
    setInputText('');
    const userId = user?.user?.id || user?.user?.userId || BIZVIZ_USER_ID;
    const newSid = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(newSid);
    localStorage.setItem(`dt_session_${userId}`, newSid);
  };

  const firstName = user?.user?.fullName?.split(' ')[0] || 'there';
  const showWelcome = messages.length === 0;

  return (
    <>
      <style>{`
        .dt-copilot-wrap { display:flex; height:calc(100vh - 72px); font-family:'DM Sans',sans-serif; background:#0f0f13; overflow:hidden; }

        /* ── Sidebar ── */
        .dt-sidebar { width:260px; min-width:260px; background:#17171f; border-right:1px solid #2a2a38; display:flex; flex-direction:column; transition:width 0.25s; overflow:hidden; }
        .dt-sidebar.collapsed { width:56px; min-width:56px; }
        .dt-sidebar-btn { display:flex; align-items:center; gap:10px; padding:14px 16px; color:#9090b0; font-size:13px; font-weight:600; cursor:pointer; border-bottom:1px solid #2a2a38; transition:background 0.15s,color 0.15s; white-space:nowrap; }
        .dt-sidebar-btn:hover { background:#1f1f2e; color:#fff; }
        .dt-sidebar-btn .icon { font-size:16px; flex-shrink:0; }
        .dt-hist-list { flex:1; overflow-y:auto; padding:8px; }
        .dt-hist-list::-webkit-scrollbar { width:4px; } .dt-hist-list::-webkit-scrollbar-track { background:transparent; } .dt-hist-list::-webkit-scrollbar-thumb { background:#2a2a38; border-radius:4px; }
        .dt-hist-item { display:flex; align-items:center; gap:6px; padding:9px 10px; border-radius:8px; cursor:pointer; color:#8080a0; font-size:12px; transition:all 0.15s; margin-bottom:2px; }
        .dt-hist-item:hover { background:#1f1f2e; color:#e0e0f0; }
        .dt-hist-item span { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dt-hist-del { flex-shrink:0; background:none; border:none; color:transparent; cursor:pointer; font-size:14px; padding:2px 4px; border-radius:4px; transition:all 0.15s; }
        .dt-hist-item:hover .dt-hist-del { color:#ff4d4d; }
        .dt-hist-del:hover { background:#3a1a1a; }
        .dt-collapse-btn { padding:14px 16px; border-top:1px solid #2a2a38; color:#555570; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:8px; transition:color 0.15s; }
        .dt-collapse-btn:hover { color:#9090b0; }

        /* ── Chat main ── */
        .dt-chat-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }

        /* Context bar */
        .dt-context-bar { display:flex; align-items:center; gap:0; padding:0; border-bottom:1px solid #1e1e2a; background:#13131b; flex-shrink:0; }
        .dt-ctx-pill { display:flex; align-items:center; gap:7px; padding:10px 20px; font-size:12px; font-weight:600; border-right:1px solid #1e1e2a; }
        .dt-ctx-pill .label { color:#555570; text-transform:uppercase; letter-spacing:0.6px; font-size:10px; }
        .dt-ctx-pill .value { color:#e91e8c; font-family:'DM Mono',monospace; font-size:12px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dt-ctx-pill .value.dim { color:#6060a0; }
        .dt-datefilter-wrap { padding:0 16px; display:flex; align-items:center; }

        /* Messages */
        .dt-messages { flex:1; overflow-y:auto; padding:24px 32px; display:flex; flex-direction:column; gap:20px; }
        .dt-messages::-webkit-scrollbar { width:5px; } .dt-messages::-webkit-scrollbar-track { background:transparent; } .dt-messages::-webkit-scrollbar-thumb { background:#2a2a38; border-radius:4px; }

        /* Welcome */
        .dt-welcome { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 32px; text-align:center; }
        .dt-welcome-logo { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#e91e8c,#c2185b); display:flex; align-items:center; justify-content:center; font-size:24px; margin:0 auto 20px; box-shadow:0 8px 32px #e91e8c44; }
        .dt-welcome h2 { color:#e0e0f0; font-size:22px; font-weight:700; margin:0 0 8px; }
        .dt-welcome p { color:#6060a0; font-size:14px; margin:0 0 32px; max-width:420px; line-height:1.6; }
        .dt-vin-badge { display:inline-flex; align-items:center; gap:6px; background:#1f1f2e; border:1px solid #2a2a38; border-radius:20px; padding:6px 14px; font-size:12px; color:#9090b0; margin-bottom:28px; }
        .dt-vin-badge strong { color:#e91e8c; font-family:'DM Mono',monospace; }
        .dt-init-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:600px; width:100%; }
        .dt-init-card { background:#17171f; border:1px solid #2a2a38; border-radius:12px; padding:14px 16px; cursor:pointer; text-align:left; color:#9090b0; font-size:13px; line-height:1.5; transition:all 0.2s; }
        .dt-init-card:hover { border-color:#e91e8c55; background:#1f1f2e; color:#e0e0f0; transform:translateY(-2px); box-shadow:0 4px 20px #0007; }

        /* Bubbles */
        .dt-msg-user { display:flex; justify-content:flex-end; }
        .dt-bubble-user { background:linear-gradient(135deg,#e91e8c,#c2185b); color:#fff; padding:12px 18px; border-radius:18px 18px 4px 18px; max-width:70%; font-size:14px; line-height:1.6; box-shadow:0 4px 16px #e91e8c30; }
        .dt-msg-ai { display:flex; align-items:flex-start; gap:12px; }
        .dt-ai-avatar { width:32px; height:32px; border-radius:10px; background:linear-gradient(135deg,#e91e8c,#c2185b); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; margin-top:2px; box-shadow:0 2px 8px #e91e8c40; }
        .dt-bubble-ai { background:#17171f; border:1px solid #2a2a38; color:#c0c0e0; padding:16px 20px; border-radius:4px 18px 18px 18px; max-width:calc(100% - 44px); font-size:14px; line-height:1.8; }
        .dt-bubble-ai.error { border-color:#ff4d4d44; background:#1a1015; color:#ff8080; }
        .dt-bubble-ai p { margin:0 0 10px; } .dt-bubble-ai p:last-child { margin:0; }
        .dt-bubble-ai strong { color:#e0e0f0; }
        .dt-bubble-ai ul, .dt-bubble-ai ol { padding-left:18px; margin:8px 0; }
        .dt-bubble-ai li { margin-bottom:4px; }

        /* Table */
        .dt-table-wrap { overflow-x:auto; margin:12px 0; border-radius:10px; border:1px solid #2a2a38; }
        .dt-table { border-collapse:collapse; width:100%; font-size:12.5px; }
        .dt-table thead tr { background:#1f1f2e; }
        .dt-table th { padding:10px 14px; text-align:left; color:#9090b0; font-weight:600; border-bottom:1px solid #2a2a38; white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px; font-size:11px; }
        .dt-table td { padding:9px 14px; border-bottom:1px solid #1e1e2a; color:#c0c0e0; }
        .dt-table tbody tr:last-child td { border-bottom:none; }
        .dt-table tbody tr:hover td { background:#1f1f2e; }

        /* Suggestions after response */
        .dt-suggestions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
        .dt-sugg-chip { background:#1a1a28; border:1px solid #2a2a38; color:#8080b0; padding:7px 14px; border-radius:20px; font-size:12px; cursor:pointer; transition:all 0.2s; }
        .dt-sugg-chip:hover { border-color:#e91e8c55; color:#e0e0f0; background:#1f1f2e; }

        /* Typing indicator */
        .dt-typing { display:flex; align-items:flex-start; gap:12px; }
        .dt-typing-dots { display:flex; gap:5px; align-items:center; padding:14px 18px; background:#17171f; border:1px solid #2a2a38; border-radius:4px 18px 18px 18px; }
        .dt-typing-dots span { width:7px; height:7px; border-radius:50%; background:#e91e8c; opacity:0.4; animation:dtPulse 1.2s infinite; }
        .dt-typing-dots span:nth-child(2) { animation-delay:0.2s; }
        .dt-typing-dots span:nth-child(3) { animation-delay:0.4s; }
        @keyframes dtPulse { 0%,100%{opacity:0.2;transform:scale(0.85)} 50%{opacity:1;transform:scale(1.1)} }

        /* Timestamp */
        .dt-ts { font-size:10px; color:#404060; margin-top:5px; text-align:right; }

        /* Input bar */
        .dt-input-bar { padding:16px 24px 20px; background:#13131b; border-top:1px solid #1e1e2a; flex-shrink:0; }
        .dt-input-inner { display:flex; align-items:center; gap:10px; background:#17171f; border:1.5px solid #2a2a38; border-radius:14px; padding:4px 4px 4px 16px; transition:border-color 0.2s; }
        .dt-input-inner:focus-within { border-color:#e91e8c55; box-shadow:0 0 0 3px #e91e8c10; }
        .dt-input-field { flex:1; background:none; border:none; outline:none; color:#e0e0f0; font-size:14px; font-family:inherit; padding:8px 0; }
        .dt-input-field::placeholder { color:#404060; }
        .dt-send-btn { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#e91e8c,#c2185b); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px; flex-shrink:0; transition:all 0.2s; box-shadow:0 2px 10px #e91e8c40; }
        .dt-send-btn:hover:not(:disabled) { transform:scale(1.08); box-shadow:0 4px 16px #e91e8c60; }
        .dt-send-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
        .dt-input-hint { font-size:11px; color:#303050; margin-top:8px; text-align:center; }

        @media (max-width:768px) {
          .dt-sidebar { display:none; }
          .dt-init-grid { grid-template-columns:1fr; }
          .dt-messages { padding:16px; }
        }
      `}</style>

      <div className="dt-copilot-wrap">

        {/* ── Sidebar ── */}
        <div className={`dt-sidebar${historyOpen ? '' : ' collapsed'}`}>
          <div className="dt-sidebar-btn" onClick={startNewChat}>
            <span className="icon">✦</span>
            {historyOpen && <span>New Conversation</span>}
          </div>
          <div className="dt-sidebar-btn" onClick={() => setHistoryOpen(p => !p)}>
            <span className="icon">🕑</span>
            {historyOpen && <span>History</span>}
          </div>

          {historyOpen && (
            <div className="dt-hist-list">
              {chatHistory.length === 0 && (
                <div style={{ padding:'16px 10px', color:'#404060', fontSize:12 }}>
                  No previous conversations
                </div>
              )}
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="dt-hist-item"
                  style={{ background: hoveredHist === idx ? '#1f1f2e' : undefined }}
                  onMouseEnter={() => setHoveredHist(idx)}
                  onMouseLeave={() => setHoveredHist(null)}
                  onClick={() => loadHistorySession(item.session_id)}
                >
                  <span title={item.context}>💬 {item.context}</span>
                  <button
                    className="dt-hist-del"
                    onClick={e => deleteHistorySession(e, item.session_id)}
                    title="Delete"
                  >🗑</button>
                </div>
              ))}
            </div>
          )}

          <div className="dt-collapse-btn" onClick={() => setHistoryOpen(p => !p)}>
            <span>{historyOpen ? '◀' : '▶'}</span>
            {historyOpen && <span>Collapse</span>}
          </div>
        </div>

        {/* ── Main chat area ── */}
        <div className="dt-chat-main">

          {/* Context bar + date filter */}
          <div className="dt-context-bar">
            <div className="dt-ctx-pill">
              <span className="label">VIN</span>
              <span className={`value${vin ? '' : ' dim'}`}>{vin || 'not selected'}</span>
            </div>
            <div className="dt-ctx-pill">
              <span className="label">From</span>
              <span className="value">{apiParams.startdate}</span>
            </div>
            <div className="dt-ctx-pill">
              <span className="label">To</span>
              <span className="value">{apiParams.enddate}</span>
            </div>
            <div className="dt-datefilter-wrap">
              <DateFilterBar title="" onApply={() => setTrigger(p => p + 1)} />
            </div>
          </div>

          {/* Messages or welcome */}
          {showWelcome ? (
            <div className="dt-welcome">
              <div className="dt-welcome-logo">🤖</div>
              <h2>Hey {firstName}, I'm your Vehicle Copilot</h2>
              <p>
                Ask me anything about this vehicle — fuel efficiency, fault codes, driving behaviour,
                maintenance, warranty risk, or fleet comparisons. I query the Maruti Suzuki telematics
                data directly.
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
                          {msg.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="dt-msg-ai">
                      <div className="dt-ai-avatar">🤖</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div
                          className={`dt-bubble-ai${msg.isError ? ' error' : ''}`}
                          dangerouslySetInnerHTML={{
                            __html: msg.htmlContent || `<p>${msg.text}</p>`,
                          }}
                        />
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="dt-suggestions">
                            {msg.suggestions.map((s, i) => (
                              <button key={i} className="dt-sugg-chip" onClick={() => sendMessage(s)}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="dt-ts">
                          {msg.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
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
                    <span/><span/><span/>
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
              >
                ➤
              </button>
            </div>
            <div className="dt-input-hint">
              VIN & date range are automatically included in every question
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiAnalysisDashboard;
