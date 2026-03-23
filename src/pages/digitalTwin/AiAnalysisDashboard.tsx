import React, { FC, useCallback, useState } from 'react';
import { useDt } from '../../contexts/digitalTwinContext';
import DateFilterBar from './DateFilterBar';

// ─── Ravity BizWiz LLM Configuration ─────────────────────────────────────────
// BizWiz is a SQL Intelligence Agent — it takes a SHORT natural-language question,
// generates SQL against the connected tables internally, and returns interpreted results.
// DO NOT send large data payloads in `text`. Send concise questions only.
// ─────────────────────────────────────────────────────────────────────────────

const BIZVIZ_ENDPOINT =
  process.env.REACT_APP_BIZVIZ_ENDPOINT || '/bizviz-proxy/llmService';

const BIZVIZ_SPACE_KEY  = process.env.REACT_APP_BIZVIZ_SPACE_KEY  || '5129';
const BIZVIZ_USER_ID    = process.env.REACT_APP_BIZVIZ_USER_ID    || '1217690654';
const BIZVIZ_ASSIST_ID  = process.env.REACT_APP_BIZVIZ_ASSIST_ID  || '3514581148';
const BIZVIZ_CONNECTOR  = process.env.REACT_APP_BIZVIZ_CONNECTOR  || '238893540';
const BIZVIZ_TABLES     = ['synthetic_data_kpi', 'qac_kpi_baseline_data'];

const BIZVIZ_AUTH_TOKEN_DEFAULT = process.env.REACT_APP_BIZVIZ_AUTH_TOKEN || '';

// System description — matches what the assistant was configured with
const VDTSIA_DESCRIPTION =
  'ROLE: Ravity Vehicle Digital Twin SQL Intelligence Agent (VDTSIA) ' +
  'PLATFORM: Ravity Digital Twin Dashboard — Maruti Suzuki Victoris Project ' +
  'ARCHITECTURE: Privacy-first, SQL-native, on-premise execution ' +
  'MARKET: India | STANDARDS: BS6 / ARAI | OEM: Maruti Suzuki ' +
  'You are a specialised automotive intelligence agent embedded in the Ravity Vehicle Digital Twin platform. ' +
  'Your job is to answer questions about vehicle health, driver behaviour, fuel efficiency, DTC faults, ' +
  'warranty risk, fleet performance, and operational costs using the connected SQL tables.';

const makeSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// ─── Preset analysis questions ────────────────────────────────────────────────
// These are short natural-language questions BizWiz can SQL-query directly.
const PRESET_QUESTIONS = [
  { label: '📋 Full Vehicle Summary',       text: (vin: string, start: string, end: string) => `Give me a complete vehicle health and performance summary for VIN ${vin} between ${start} and ${end}` },
  { label: '🏎️ Driving Behaviour',          text: (vin: string, start: string, end: string) => `Analyse driving behaviour for VIN ${vin} from ${start} to ${end} including harsh acceleration, harsh braking, overspeeding and harsh turns` },
  { label: '⛽ Fuel & Efficiency',           text: (vin: string, start: string, end: string) => `What is the fuel efficiency and fuel events analysis for VIN ${vin} between ${start} and ${end}` },
  { label: '🔴 DTC Fault Codes',            text: (vin: string, start: string, end: string) => `List all DTC fault codes and their severity for VIN ${vin} from ${start} to ${end}` },
  { label: '🔧 Maintenance Recommendations',text: (vin: string, start: string, end: string) => `What maintenance actions are recommended for VIN ${vin} based on data from ${start} to ${end}` },
  { label: '🛡️ Warranty Risk',              text: (vin: string, start: string, end: string) => `Assess warranty risk for VIN ${vin} based on driving patterns and fault codes from ${start} to ${end}` },
  { label: '📊 Fleet Benchmark',            text: (vin: string, start: string, end: string) => `How does VIN ${vin} compare to fleet baseline benchmarks for the period ${start} to ${end}` },
  { label: '⚠️ Safety Alerts',              text: (vin: string, start: string, end: string) => `Identify any safety concerns or critical alerts for VIN ${vin} from ${start} to ${end}` },
];

// ─── Single BizWiz call ───────────────────────────────────────────────────────
const callBizWiz = async (
  authToken: string,
  question: string,
  sessionId: string,
  log: (m: string) => void
): Promise<string> => {
  log('🔗 Sending to Ravity BizWiz LLM...');

  const body = new URLSearchParams();
  body.append('serviceType', 'process_text');
  body.append('data', JSON.stringify({
    text:             question,
    userID:           BIZVIZ_USER_ID,
    sessionID:        sessionId,
    assistId:         BIZVIZ_ASSIST_ID,
    connector:        BIZVIZ_CONNECTOR,
    description:      VDTSIA_DESCRIPTION,
    tables:           BIZVIZ_TABLES,
    selected_files:   [],
    type:             'connector',
    documentStoreIds: BIZVIZ_TABLES,
    spaceKey:         BIZVIZ_SPACE_KEY,
  }));
  body.append('spacekey', BIZVIZ_SPACE_KEY);

  const res = await fetch(BIZVIZ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'authtoken':    authToken.trim(),
      'spacekey':     BIZVIZ_SPACE_KEY,
      'userid':       BIZVIZ_USER_ID,
      'accept':       'application/json, text/plain, */*',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`BizWiz returned ${res.status}: ${errText.slice(0, 300)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let text = '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    text = data?.response || data?.answer || data?.text || data?.message || data?.result ||
           (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    text = await res.text();
  }

  if (!text || text.trim().length === 0)
    throw new Error('BizWiz returned an empty response. The authtoken may have expired.');

  log(`✅ Response received (${text.length.toLocaleString()} chars)`);
  return text;
};

// ─── Severity helper ──────────────────────────────────────────────────────────
type Severity = 'good' | 'warning' | 'critical' | 'info';

const detectSeverity = (text: string): Severity =>
  text.includes('🔴') || /critical|immediate/i.test(text) ? 'critical'
  : text.includes('⚠️') || /warning|concern|risk/i.test(text) ? 'warning'
  : /good|normal|excellent|compliant/i.test(text) ? 'good'
  : 'info';

const sevStyle = (s: Severity) => ({
  good:     { border: '#a5d6a7', bg: '#f1f8e9', badge: '#2e7d32', badgeBg: '#e8f5e9' },
  warning:  { border: '#ffe082', bg: '#fffde7', badge: '#f57f17', badgeBg: '#fff9c4' },
  critical: { border: '#ef9a9a', bg: '#ffebee', badge: '#c62828', badgeBg: '#ffcdd2' },
  info:     { border: '#90caf9', bg: '#e3f2fd', badge: '#1565c0', badgeBg: '#bbdefb' },
}[s]);

interface ResultCard { label: string; question: string; answer: string; severity: Severity; }

const RAVITY = '#e91e8c';

// ─── Main Component ───────────────────────────────────────────────────────────
const AiAnalysisDashboard: FC = () => {
  const { vin, apiParams } = useDt();

  const [authToken,  setAuthToken]  = useState(BIZVIZ_AUTH_TOKEN_DEFAULT);
  const [showToken,  setShowToken]  = useState(false);
  const [sessionId]                 = useState(makeSessionId);

  // Which preset questions are selected
  const [selected,   setSelected]   = useState<Set<number>>(new Set([0]));
  // Custom question input
  const [customQ,    setCustomQ]    = useState('');

  const [loading,    setLoading]    = useState(false);
  const [results,    setResults]    = useState<ResultCard[]>([]);
  const [error,      setError]      = useState('');
  const [log,        setLog]        = useState<string[]>([]);
  const [progress,   setProgress]   = useState(0);
  const [expanded,   setExpanded]   = useState<Record<number, boolean>>({ 0: true });
  const [trigger,    setTrigger]    = useState(0);

  const addLog = (m: string) => setLog(prev => [...prev, m]);

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const runAnalysis = useCallback(async () => {
    if (!authToken.trim()) { setError('Please enter your Ravity BizWiz authtoken.'); return; }
    if (!vin) { setError('No VIN selected. Please select a vehicle first.'); return; }

    // Build list of questions to ask
    const questions: { label: string; question: string }[] = [];
    PRESET_QUESTIONS.forEach((p, i) => {
      if (selected.has(i))
        questions.push({ label: p.label, question: p.text(vin, apiParams.startdate, apiParams.enddate) });
    });
    if (customQ.trim())
      questions.push({ label: '💬 Custom Question', question: customQ.trim() });

    if (questions.length === 0) { setError('Select at least one analysis topic or enter a custom question.'); return; }

    setLoading(true); setError(''); setResults([]); setLog([]); setProgress(0); setExpanded({ 0: true });

    const answers: ResultCard[] = [];
    for (let i = 0; i < questions.length; i++) {
      const { label, question } = questions[i];
      addLog(`📊 [${i + 1}/${questions.length}] ${label}...`);
      try {
        const answer = await callBizWiz(authToken, question, sessionId, addLog);
        answers.push({ label, question, answer, severity: detectSeverity(answer) });
      } catch (e: any) {
        answers.push({ label, question, answer: `❌ ${e.message}`, severity: 'critical' });
        addLog(`❌ Failed: ${e.message}`);
      }
      setProgress(Math.round(((i + 1) / questions.length) * 100));
      setResults([...answers]);
      // Small delay between calls to avoid rate limiting
      if (i < questions.length - 1) await new Promise(r => setTimeout(r, 800));
    }

    addLog(`✅ All ${questions.length} analyses complete`);
    setLoading(false);
  }, [vin, apiParams, authToken, sessionId, selected, customQ]); // eslint-disable-line

  const downloadReport = () => {
    const hdr = `VEHICLE DIGITAL TWIN — AI ANALYSIS REPORT\n${'='.repeat(60)}\nVIN: ${vin}\nPeriod: ${apiParams.startdate} to ${apiParams.enddate}\nProvider: Ravity BizWiz LLM (VDTSIA)\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    const body = results.map(r => `## ${r.label}\nQuestion: ${r.question}\n\n${r.answer}\n\n${'─'.repeat(60)}\n`).join('\n');
    const blob = new Blob([hdr + body], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.download = `AI_Analysis_${vin}_${apiParams.startdate}.txt`;
    a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const page: React.CSSProperties = { padding: '20px 24px', background: '#f7f8fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box' };
  const secHdr: React.CSSProperties = { color: RAVITY, fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5, borderLeft: `4px solid ${RAVITY}`, paddingLeft: 10 };

  return (
    <div style={page} id="dt-page-content">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h1 style={{ color: RAVITY, fontWeight: 900, fontSize: 26, marginBottom: 4 }}>🤖 AI Vehicle Analysis</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Powered by <strong style={{ color: RAVITY }}>Ravity BizWiz LLM</strong> — VDTSIA (Vehicle Digital Twin SQL Intelligence Agent)
      </p>

      <DateFilterBar title="AI Analysis" onApply={() => setTrigger(prev => prev + 1)} />

      {/* ── Auth Panel ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={secHdr}>🔐 BizWiz Authentication</div>

        {/* Service info */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Endpoint', value: 'platform.ravity.io' },
            { label: 'Space',    value: `#${BIZVIZ_SPACE_KEY}` },
            { label: 'Assist',   value: BIZVIZ_ASSIST_ID },
            { label: 'VIN',      value: vin || '— not selected —' },
          ].map(b => (
            <div key={b.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: '5px 12px', fontSize: 12 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>{b.label}: </span>
              <span style={{ color: vin || b.label !== 'VIN' ? '#333' : '#e91e8c', fontFamily: 'monospace', fontWeight: b.label === 'VIN' ? 700 : 400 }}>{b.value}</span>
            </div>
          ))}
        </div>

        {/* Token input */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>
            BizWiz Auth Token
            <span style={{ marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 400 }}>
              (F12 → Network tab on platform.ravity.io → copy the <code>authtoken</code> request header)
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="eyJzZXNpb25WYWxpZGF0ZSI6Ii..."
              value={authToken}
              onChange={e => setAuthToken(e.target.value)}
              style={{
                width: '100%', padding: '10px 44px 10px 14px',
                border: `1.5px solid ${authToken ? RAVITY : '#ddd'}`,
                borderRadius: 10, fontSize: 12, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'monospace',
                background: authToken ? `${RAVITY}08` : '#fafafa',
              }}
            />
            <button onClick={() => setShowToken(s => !s)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#aaa' }}>
              {showToken ? '🙈' : '👁'}
            </button>
          </div>
          {authToken && <div style={{ fontSize: 11, color: '#4caf50', marginTop: 4, fontWeight: 600 }}>✅ Token set ({authToken.length} chars)</div>}
        </div>
      </div>

      {/* ── Question selector ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={secHdr}>📋 Select Analysis Topics</div>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 14, marginTop: -8 }}>
          Each selected topic sends one question to BizWiz. The agent queries the SQL tables and returns interpreted results.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 18 }}>
          {PRESET_QUESTIONS.map((p, i) => (
            <button key={i} onClick={() => toggleSelect(i)} style={{
              padding: '10px 14px', borderRadius: 10, fontWeight: 600, fontSize: 13,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              border: `2px solid ${selected.has(i) ? RAVITY : '#e0e0e0'}`,
              background: selected.has(i) ? `${RAVITY}10` : '#fafafa',
              color: selected.has(i) ? RAVITY : '#555',
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom question */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>
            💬 Custom Question (optional)
          </label>
          <input
            type="text"
            placeholder={`e.g. "What is the average fuel efficiency for VIN ${vin || 'XXX'} in January 2024?"`}
            value={customQ}
            onChange={e => setCustomQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) runAnalysis(); }}
            style={{
              width: '100%', padding: '10px 14px',
              border: `1.5px solid ${customQ ? RAVITY : '#ddd'}`,
              borderRadius: 10, fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
              background: customQ ? `${RAVITY}08` : '#fafafa',
            }}
          />
        </div>

        {/* Run button */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={runAnalysis} disabled={loading} style={{
            padding: '12px 32px',
            background: loading ? '#f0f0f0' : `linear-gradient(135deg,${RAVITY},${RAVITY}cc)`,
            border: 'none', borderRadius: 10, color: loading ? '#aaa' : '#fff',
            fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 16px ${RAVITY}44`,
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid #aaa', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> Analysing…</>
              : <>🤖 Run Analysis ({selected.size + (customQ.trim() ? 1 : 0)} questions)</>
            }
          </button>
          <button onClick={() => setSelected(new Set(PRESET_QUESTIONS.map((_, i) => i)))}
            style={{ padding: '10px 16px', border: `1px solid ${RAVITY}`, borderRadius: 10, background: 'transparent', color: RAVITY, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Select All
          </button>
          <button onClick={() => setSelected(new Set())}
            style={{ padding: '10px 16px', border: '1px solid #ddd', borderRadius: 10, background: 'transparent', color: '#888', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Clear All
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#ffebee', border: '2px solid #ef9a9a', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 24 }}>❌</span>
          <div>
            <div style={{ fontWeight: 700, color: '#c62828', fontSize: 14 }}>Error</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4, whiteSpace: 'pre-wrap' }}>{error}</div>
            {(error.includes('401') || error.includes('403') || error.includes('authtoken')) && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#e65100', background: '#fff3e0', padding: '8px 12px', borderRadius: 8 }}>
                💡 Your authtoken has likely expired. Open platform.ravity.io → F12 → Network → copy a fresh <code>authtoken</code> header.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {(loading || log.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>📡 Progress</div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${RAVITY},${RAVITY}cc)`, borderRadius: 3, transition: 'width 0.4s ease' }}/>
          </div>
          <div style={{ background: '#0d1117', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, maxHeight: 160, overflowY: 'auto', lineHeight: 1.9 }}>
            {log.map((m, i) => (
              <div key={i} style={{ color: m.startsWith('✅') ? '#3fb950' : m.startsWith('❌') ? '#f85149' : m.startsWith('⚠️') ? '#f0c040' : '#58a6ff' }}>{m}</div>
            ))}
            {loading && <div style={{ color: '#f0c040' }}>▊</div>}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={secHdr}>📊 Results — VIN: {vin} · {apiParams.startdate} → {apiParams.enddate}</div>
            <button onClick={downloadReport} style={{ padding: '9px 20px', background: `linear-gradient(135deg,${RAVITY},${RAVITY}cc)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 12px ${RAVITY}44`, display: 'flex', alignItems: 'center', gap: 7 }}>
              📥 Download Report (.txt)
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setExpanded(Object.fromEntries(results.map((_, i) => [i, true])))}
              style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9', cursor: 'pointer', fontSize: 12, color: '#555', fontWeight: 600 }}>
              ⬇ Expand All
            </button>
            <button onClick={() => setExpanded({})}
              style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9', cursor: 'pointer', fontSize: 12, color: '#555', fontWeight: 600 }}>
              ⬆ Collapse All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {results.map((r, i) => {
              const st = sevStyle(r.severity);
              const isOpen = !!expanded[i];
              const words = r.answer.split(/\s+/);
              const preview = words.slice(0, 25).join(' ') + (words.length > 25 ? '…' : '');

              return (
                <div key={i} style={{
                  background: isOpen ? st.bg : '#fff',
                  border: `1.5px solid ${isOpen ? st.border : '#e8e8e8'}`,
                  borderRadius: 14, overflow: 'hidden',
                  boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}>
                  <div onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer',
                    background: isOpen ? `${st.border}28` : 'transparent',
                    borderBottom: isOpen ? `1px solid ${st.border}44` : 'none',
                    userSelect: 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isOpen ? 0 : 3 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{r.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: st.badgeBg, color: st.badge, textTransform: 'uppercase', letterSpacing: 0.6, flexShrink: 0 }}>
                            {r.severity}
                          </span>
                        </div>
                        {!isOpen && <div style={{ fontSize: 12, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>}
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginLeft: 12,
                      background: isOpen ? st.border : '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: isOpen ? '#fff' : '#888', transition: 'all 0.2s',
                    }}>
                      {isOpen ? '▲' : '▼'}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '18px 22px 20px' }}>
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, fontFamily: 'monospace', background: '#f8f8f8', padding: '6px 10px', borderRadius: 6 }}>
                        Q: {r.question}
                      </div>
                      <div style={{ fontSize: 14, color: '#222', lineHeight: 2, whiteSpace: 'pre-line' }}>
                        {r.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && !error && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '60px 40px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>AI Vehicle Analysis</div>
          <div style={{ fontSize: 14, color: '#888', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Enter your <strong style={{ color: RAVITY }}>BizWiz authtoken</strong>, select the topics you want analysed,
            then click <strong style={{ color: RAVITY }}>Run Analysis</strong>. Each topic queries the{' '}
            <code>synthetic_data_kpi</code> and <code>qac_kpi_baseline_data</code> tables directly.
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisDashboard;
