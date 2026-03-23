import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDt } from '../../contexts/digitalTwinContext';

const AboutDashboard: FC = () => {
  const { vin, setVin, vinList, loadVins } = useDt();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    team: 'QA-MQ1',
    vehiclePart: 'Vehicle body',
    purpose: 'Study Purpose',
    ftirPurpose: 'FTIR/wty purpose',
    costSaved: '1',
    manHoursSaved: '1',
    purposeText: '',
    feedback: '',
    vinInput: vin,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Keep vinInput in sync if context VIN changes externally
  useEffect(() => {
    setFormData(f => ({ ...f, vinInput: vin }));
  }, [vin]);

  useEffect(() => {
    loadVins();
  }, [loadVins]);

  const handleVinClick = (v: string) => {
    setFormData(f => ({ ...f, vinInput: v }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formData.vinInput.trim();
    if (!trimmed) {
      setError('Please enter a VIN number');
      return;
    }
    // Save VIN to context (which also saves to sessionStorage)
    setVin(trimmed);
    setSubmitted(true);
    setError('');
    // Navigate to Overview after 1.5s so user sees confirmation
    setTimeout(() => {
      navigate('/dt/overview');
    }, 1500);
  };

  return (
    <div style={pageStyle}>
      {/* ── Info Card ── */}
      <div style={cardStyle}>
        <h3 style={{ color: '#111', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
          About Vehicle Twin Dashboard
        </h3>
        <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
          The Vehicle Twin Dashboard is a comprehensive digital interface that provides a
          real-time, data-driven view of any vehicle through its unique VIN (Vehicle Identification
          Number). Acting as a digital twin of the physical vehicle, it combines live telemetry,
          historical analytics, and performance insights into one unified platform.
        </p>

        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Dashboard Tabs</h4>
        <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
          {[
            ['Overview', "Snapshot of the vehicle's current status, identity, health indicators, and recent activity."],
            ['Climate Analysis', 'Insights into cabin and environmental conditions affecting comfort and efficiency.'],
            ['Driving Analysis', 'Evaluation of driving patterns, including acceleration, braking, and overall behavior.'],
            ['Fuel Analysis', 'Trends and efficiency metrics for monitoring fuel usage and consumption.'],
            ['Light Analysis', 'Tracking of headlight and indicator usage to assess operational efficiency and safety.'],
            ['Speed Analysis', 'Visualization of speed trends, averages, and variations across trips.'],
            ['Trip Analysis', 'Detailed breakdown of trips with distance, duration, and route performance.'],
            ['DTC Analysis', 'Monitoring of Diagnostic Trouble Codes for fault detection and predictive maintenance.'],
          ].map(([tab, desc]) => (
            <li key={tab}><strong>{tab}:</strong> {desc}</li>
          ))}
        </ul>

        {/* Available VINs */}
        {vinList.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 14, color: '#333' }}>Available VIN List:</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {vinList.map(v => (
                <span
                  key={v}
                  onClick={() => handleVinClick(v)}
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: `1px solid ${v === formData.vinInput ? '#e91e8c' : '#ddd'}`,
                    background: v === formData.vinInput ? '#fce4ec' : '#f5f5f5',
                    color: v === formData.vinInput ? '#e91e8c' : '#1565c0',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    letterSpacing: 0.5,
                    transition: 'all 0.15s',
                  }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Currently active VIN banner */}
        <div style={{
          marginTop: 16, padding: '10px 16px',
          background: '#e3f2fd', border: '1px solid #90caf9',
          borderRadius: 8, fontSize: 13, color: '#1565c0',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontWeight: 700 }}>🔑 Active VIN:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{vin}</span>
          <span style={{ color: '#888', fontSize: 12 }}>— used across all dashboards</span>
        </div>
      </div>

      {/* ── VIN Entry Form ── */}
      <div style={cardStyle}>
        <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#111' }}>
          Set Vehicle VIN
        </h4>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
          Enter a VIN below and click Submit. The selected VIN will be used across all dashboard
          pages automatically and stored for your session.
        </p>

        {submitted && (
          <div style={{
            background: '#e8f5e9', border: '1px solid #a5d6a7',
            borderRadius: 8, padding: '12px 16px',
            color: '#2e7d32', marginBottom: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ✓ VIN set to: <span style={{ fontFamily: 'monospace' }}>{formData.vinInput}</span>
            &nbsp;— Redirecting to Overview...
          </div>
        )}

        {error && (
          <div style={{
            background: '#ffebee', border: '1px solid #ef9a9a',
            borderRadius: 8, padding: '10px 16px',
            color: '#c62828', marginBottom: 16, fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              style={fieldStyle}
            />
          </div>

          {/* Dropdowns row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { key: 'team', label: 'Team', opts: ['QA-MQ1', 'QA-MQ2', 'Engineering', 'Product'] },
              { key: 'vehiclePart', label: 'Vehicle Part', opts: ['Vehicle body', 'Engine', 'Suspension', 'Electronics'] },
              { key: 'purpose', label: 'Purpose', opts: ['Study Purpose', 'Production', 'R&D', 'Quality Control'] },
              { key: 'ftirPurpose', label: 'FTIR Purpose', opts: ['FTIR/wty purpose', 'Service', 'Analysis'] },
            ].map(({ key, label, opts }) => (
              <div key={key} style={{ flex: '1 1 160px', minWidth: 160 }}>
                <label style={labelStyle}>{label}</label>
                <select
                  value={(formData as any)[key]}
                  onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                  style={fieldStyle}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Cost / Man hours */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Cost Saved in ₹</label>
              <input type="number" value={formData.costSaved}
                onChange={e => setFormData(f => ({ ...f, costSaved: e.target.value }))}
                style={fieldStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Man Hours Saved</label>
              <input type="number" value={formData.manHoursSaved}
                onChange={e => setFormData(f => ({ ...f, manHoursSaved: e.target.value }))}
                style={fieldStyle} />
            </div>
          </div>

          {/* Purpose / Feedback */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Purpose Details</label>
              <textarea rows={3} value={formData.purposeText}
                onChange={e => setFormData(f => ({ ...f, purposeText: e.target.value }))}
                style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Feedback (Optional)</label>
              <textarea rows={3} value={formData.feedback}
                onChange={e => setFormData(f => ({ ...f, feedback: e.target.value }))}
                style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
          </div>

          {/* VIN input — most important field */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...labelStyle, color: '#c0392b', fontWeight: 700, fontSize: 14 }}>
              * VIN Number
            </label>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              This VIN will be saved to your session and used across all dashboard pages.
              You can change it at any time by coming back to this page.
            </p>
            <input
              type="text"
              required
              value={formData.vinInput}
              onChange={e => { setFormData(f => ({ ...f, vinInput: e.target.value })); setError(''); }}
              style={{ ...fieldStyle, border: '2px solid #e91e8c', fontSize: 15, fontFamily: 'monospace' }}
              placeholder="Enter VIN number e.g. d4a4c7dafcbb947b"
            />
            {/* Quick select from available VINs */}
            {vinList.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#888', lineHeight: '28px' }}>Quick select:</span>
                {vinList.map(v => (
                  <span key={v} onClick={() => handleVinClick(v)} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11,
                    fontFamily: 'monospace', cursor: 'pointer',
                    border: `1px solid ${v === formData.vinInput ? '#e91e8c' : '#ddd'}`,
                    background: v === formData.vinInput ? '#fce4ec' : '#f5f5f5',
                    color: v === formData.vinInput ? '#e91e8c' : '#555',
                    transition: 'all 0.15s',
                  }}>{v}</span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" style={{
            padding: '12px 40px',
            background: 'linear-gradient(135deg,#e91e8c,#c2185b)',
            border: 'none', borderRadius: 10,
            color: '#fff', fontWeight: 700, fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(233,30,140,0.35)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
            Submit & Go to Overview →
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  padding: '32px 36px',
  background: '#f7f8fa',
  minHeight: '100vh',
  fontFamily: "'Inter', 'Roboto', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '28px 32px',
  marginBottom: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
  color: '#222',
  background: '#fafafa',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#555',
  marginBottom: 6,
  fontWeight: 500,
};

export default AboutDashboard;
