import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import { NavLink } from 'react-router-dom';
import ThemeContext from '../../contexts/themeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

// ─── SVG icon paths ────────────────────────────────────────────────────────────
const icons: Record<string, string> = {
    about:                     'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    conversationalIntelligence:'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
    vehicleAnalysis:           'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z',
    vehicleComparison:         'M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z',
    agentRecommendation:       'M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
    overview:                  'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z',
    trip:                      'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z',
    driving:                   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z',
    dtc:                       'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-10 3h2v2h-2V6zm0 4h2v6h-2v-6zM7 6h2v2H7V6zm0 4h2v6H7v-6zm10 6h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z',
    speed:                     'M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.27-8.11-8.11 5.27a2 2 0 0 0 .01 2.84z',
    fuel:                      'M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 7v4.5h2L8 18z',
    light:                     'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    climate:                   'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    maintenance:               'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    warranty:                  'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    environment:               'M17 8C8 10 5.9 16.17 3.82 20.82L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c9 0 15-9.5 9-16zM8 18c-.31 0-.62-.04-.92-.1C8.38 12.6 11.07 9.5 17 8c-.5 3.5-2.5 10-9 10z',
};

const SvgIcon: React.FC<{ d: string }> = ({ d }) => (
    <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' style={{ flexShrink: 0 }}>
        <path d={d} />
    </svg>
);

interface NavItem { key: string; label: string; path: string; section?: string | null; }

const dtNavItems: NavItem[] = [
    { key: 'about',                     label: 'About',                       path: '/dt/about',                       section: null },
    { key: 'conversationalIntelligence',label: 'Conversational Intelligence',  path: '/dt/conversational-intelligence', section: 'AI FEATURES' },
    { key: 'vehicleAnalysis',           label: 'Vehicle Analysis',             path: '/dt/vehicle-analysis',            section: null },
    { key: 'vehicleComparison',         label: 'Vehicle Comparison',           path: '/dt/vehicle-comparison',          section: null },
    { key: 'agentRecommendation',       label: 'Agent Recommendation',         path: '/dt/agent-recommendation',        section: null },
    { key: 'overview',                  label: 'Overview',                     path: '/dt/overview',                    section: 'CORE ANALYSIS' },
    { key: 'trip',                      label: 'Trip Analysis',                path: '/dt/trip',                        section: null },
    { key: 'driving',                   label: 'Driving Analysis',             path: '/dt/driving',                     section: null },
    { key: 'dtc',                       label: 'DTC Analysis',                 path: '/dt/dtc',                         section: null },
    { key: 'speed',                     label: 'Speed Analysis',               path: '/dt/speed',                       section: null },
    { key: 'fuel',                      label: 'Fuel Analysis',                path: '/dt/fuel',                        section: null },
    { key: 'light',                     label: 'Light Analysis',               path: '/dt/light',                       section: null },
    { key: 'climate',                   label: 'Climate Analysis',             path: '/dt/climate',                     section: null },
    { key: 'maintenance',               label: 'Maintenance',                  path: '/dt/maintenance',                 section: 'ADVANCED ANALYSIS' },
    { key: 'warranty',                  label: 'Warranty',                     path: '/dt/warranty',                    section: null },
    { key: 'environment',               label: 'Environmental',                path: '/dt/environment',                 section: null },
];

const ACCENT       = '#e91e8c';
const WIDTH_OPEN   = 220;
const WIDTH_CLOSED = 62;

const Aside = () => {
    const { asideStatus, setAsideStatus, mobileDesign } = useContext(ThemeContext);
    const { dir } = useSelector((state: RootState) => state.appStore);

    // Persist collapse state across sessions
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem('aside_collapsed') === 'true'; } catch { return false; }
    });

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        try { localStorage.setItem('aside_collapsed', String(next)); } catch {}
        setAsideStatus(!next);
    };

    // Sync ThemeContext on first mount so wrapper knows the initial width
    useEffect(() => {
        setAsideStatus(!collapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const w = collapsed ? WIDTH_CLOSED : WIDTH_OPEN;

    return (
        <>
            {/* ── Inject styles ─────────────────────────────────────────────── */}
            <style>{`
                /* Override the SCSS-based aside entirely — use our own fixed panel */
                .aside, .aside.open, .aside:not(.open) {
                    display: none !important;
                }

                /* Our panel */
                .dt-aside {
                    position: fixed;
                    top: 0; left: 0; bottom: 0;
                    z-index: 1035;
                    display: flex;
                    flex-direction: column;
                    background: #1F1E1E;
                    overflow: hidden;
                    transition: width 0.22s cubic-bezier(.4,0,.2,1);
                    box-shadow: 2px 0 12px rgba(0,0,0,0.18);
                }

                /* Scrollable nav body */
                .dt-aside-body {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 6px 0 24px;
                    scrollbar-width: none;
                }
                .dt-aside-body::-webkit-scrollbar { display: none; }

                /* Push .wrapper content to the right of our panel */
                .wrapper {
                    padding-left: ${w}px !important;
                    transition: padding-left 0.22s cubic-bezier(.4,0,.2,1) !important;
                    margin-left: 0 !important;
                    left: 0 !important;
                }
                .wrapper-RTL {
                    padding-right: ${w}px !important;
                    transition: padding-right 0.22s cubic-bezier(.4,0,.2,1) !important;
                }

                /* Tooltip on icons when collapsed */
                .dt-nav-item { position: relative; }
                .dt-tooltip {
                    display: none;
                    position: absolute;
                    left: calc(100% + 10px);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #222;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 5px 10px;
                    border-radius: 6px;
                    white-space: nowrap;
                    z-index: 9999;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
                    pointer-events: none;
                }
                .dt-tooltip::before {
                    content: '';
                    position: absolute;
                    right: 100%; top: 50%;
                    transform: translateY(-50%);
                    border: 5px solid transparent;
                    border-right-color: #222;
                }
                .dt-aside.collapsed .dt-nav-item:hover .dt-tooltip { display: block; }

                /* Section labels collapse */
                .dt-section-label {
                    overflow: hidden;
                    transition: max-height 0.22s, opacity 0.15s, padding 0.22s;
                    max-height: 40px;
                }
                .dt-aside.collapsed .dt-section-label {
                    max-height: 0 !important;
                    opacity: 0;
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                }

                /* Toggle button */
                .dt-toggle {
                    display: flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; border-radius: 50%;
                    border: none; cursor: pointer;
                    background: rgba(255,255,255,0.10);
                    color: rgba(255,255,255,0.7);
                    transition: background 0.15s;
                    flex-shrink: 0;
                }
                .dt-toggle:hover { background: rgba(255,255,255,0.22); color: #fff; }
            `}</style>

            {/* ── Panel ─────────────────────────────────────────────────────── */}
            <div className={classNames('dt-aside', { collapsed })} style={{ width: w }}>

                {/* Brand header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '14px 0' : '12px 12px 12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    flexShrink: 0,
                    minHeight: 60,
                    gap: 8,
                }}>
                    {/* Logo tile */}
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: `linear-gradient(135deg,${ACCENT},#c2185b)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 900, color: '#fff',
                        boxShadow: `0 2px 8px ${ACCENT}44`,
                    }}>R</div>

                    {/* Wordmark — hidden when collapsed */}
                    {!collapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.2, lineHeight: 1.2 }}>
                                Ravity DT
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
                                Digital Twin
                            </div>
                        </div>
                    )}

                    {/* Collapse / expand button */}
                    <button
                        className='dt-toggle'
                        onClick={toggle}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{ marginLeft: collapsed ? 0 : 'auto' }}
                    >
                        <svg viewBox='0 0 24 24' width='15' height='15' fill='currentColor'>
                            {collapsed
                                ? <path d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'/>
                                : <path d='M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z'/>
                            }
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className='dt-aside-body'>
                    {dtNavItems.map((item) => (
                        <React.Fragment key={item.key}>
                            {item.section && (
                                <div className='dt-section-label' style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '12px 12px 4px',
                                }}>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                    <span style={{
                                        fontSize: 9, fontWeight: 800,
                                        color: 'rgba(255,255,255,0.32)',
                                        textTransform: 'uppercase', letterSpacing: 1.4,
                                        whiteSpace: 'nowrap',
                                    }}>{item.section}</span>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                </div>
                            )}

                            <div className='dt-nav-item'>
                                <NavLink
                                    to={item.path}
                                    title={item.label}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        gap: 10,
                                        padding: collapsed ? '10px 0' : '9px 11px',
                                        margin: '1px 6px',
                                        borderRadius: 8,
                                        textDecoration: 'none',
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: 13,
                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.70)',
                                        background: isActive
                                            ? `linear-gradient(90deg,${ACCENT},${ACCENT}cc)`
                                            : 'transparent',
                                        boxShadow: isActive ? `0 3px 10px ${ACCENT}40` : 'none',
                                        transition: 'background 0.13s',
                                        overflow: 'hidden',
                                        borderLeft: isActive && !collapsed
                                            ? `3px solid rgba(255,255,255,0.4)`
                                            : '3px solid transparent',
                                    })}
                                    onMouseEnter={e => {
                                        if (!e.currentTarget.style.background.includes('e91e8c'))
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!e.currentTarget.style.background.includes('e91e8c'))
                                            e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <SvgIcon d={icons[item.key] ?? icons.about} />
                                    {!collapsed && (
                                        <span style={{
                                            whiteSpace: 'nowrap', overflow: 'hidden',
                                            textOverflow: 'ellipsis', letterSpacing: 0.1,
                                        }}>
                                            {item.label}
                                        </span>
                                    )}
                                </NavLink>
                                <span className='dt-tooltip'>{item.label}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            {/* Mobile overlay */}
            {mobileDesign && asideStatus && (
                <div
                    role='presentation'
                    onClick={() => setAsideStatus(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1034,
                        background: 'rgba(0,0,0,0.45)',
                    }}
                />
            )}
        </>
    );
};

export default Aside;
