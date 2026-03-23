import React, { useContext, useEffect } from 'react';
import classNames from 'classnames';
import { motion, MotionStyle } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import Brand from '../Brand/Brand';
import ThemeContext from '../../contexts/themeContext';
import useAsideTouch from '../../hooks/useAsideTouch';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const icons: Record<string, string> = {
    about:        'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    overview:     'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z',
    climate:      'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    driving:      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z',
    fuel:         'M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 7v4.5h2L8 18z',
    light:        'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    speed:        'M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.27-8.11-8.11 5.27a2 2 0 0 0 .01 2.84z',
    trip:         'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z',
    dtc:          'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-10 3h2v2h-2V6zm0 4h2v6h-2v-6zM7 6h2v2H7V6zm0 4h2v6H7v-6zm10 6h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z',
    intelligence: 'M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
    aiAnalysis:   'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z',
    maintenance:  'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    warranty:     'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    environment:  'M17 8C8 10 5.9 16.17 3.82 20.82L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c9 0 15-9.5 9-16zM8 18c-.31 0-.62-.04-.92-.1C8.38 12.6 11.07 9.5 17 8c-.5 3.5-2.5 10-9 10z',
    // ── NEW ICONS ──────────────────────────────────────────────────────────────
    security:     'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
    cost:         'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
    benchmark:    'M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z',
    dtcLocation:  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    alerts:       'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
};

const SvgIcon: React.FC<{ d: string }> = ({ d }) => (
    <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' style={{ flexShrink: 0 }}>
        <path d={d} />
    </svg>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <div style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: 1.2,
        padding: '10px 20px 4px',
    }}>{label}</div>
);

const dtNavItems = [
    { key: 'about',       label: 'About',              path: '/dt/about',        section: null },
    { key: 'overview',    label: 'Overview',            path: '/dt/overview',     section: 'CORE ANALYSIS' },
    { key: 'climate',     label: 'Climate Analysis',    path: '/dt/climate',      section: null },
    { key: 'driving',     label: 'Driving Analysis',    path: '/dt/driving',      section: null },
    { key: 'fuel',        label: 'Fuel Analysis',       path: '/dt/fuel',         section: null },
    { key: 'light',       label: 'Light Analysis',      path: '/dt/light',        section: null },
    { key: 'speed',       label: 'Speed Analysis',      path: '/dt/speed',        section: null },
    { key: 'trip',        label: 'Trip Analysis',       path: '/dt/trip',         section: null },
    { key: 'dtc',         label: 'DTC Analysis',        path: '/dt/dtc',          section: null },
    { key: 'intelligence', label: 'Intelligence',       path: '/dt/intelligence', section: null },
    { key: 'aiAnalysis',  label: 'AI Analysis',         path: '/dt/ai',           section: 'INTELLIGENCE' },
    { key: 'maintenance', label: 'Maintenance',         path: '/dt/maintenance',  section: null },
    { key: 'warranty',    label: 'Warranty Quality',    path: '/dt/warranty',     section: null },
    { key: 'environment', label: 'Environment',         path: '/dt/environment',  section: null },
    // ── NEW ────────────────────────────────────────────────────────────────────
    { key: 'security',    label: 'Security & Access',   path: '/dt/security',     section: 'ADVANCED' },
    { key: 'cost',        label: 'Cost Intelligence',   path: '/dt/cost',         section: null },
    { key: 'benchmark',   label: 'Fleet Benchmark',     path: '/dt/benchmark',    section: null },
    { key: 'dtcLocation', label: 'DTC Location Map',    path: '/dt/dtc-location', section: null },
    { key: 'alerts',      label: 'Alerts Centre',       path: '/dt/alerts',       section: null },
];

const Aside = () => {
    const { asideStatus, setAsideStatus, mobileDesign } = useContext(ThemeContext);
    const { asideStyle, touchStatus, hasTouchButton }   = useAsideTouch();
    const isModernDesign = process.env.REACT_APP_MODERN_DESGIN === 'true';
    const { dir } = useSelector((state: RootState) => state.appStore);

    useEffect(() => {
        const el = document.querySelector('.aside') as HTMLElement;
        if (el && mobileDesign) el.style.removeProperty('left');
    }, [mobileDesign]);

    return (
        <>
            <motion.aside
                style={dir === 'rtl' ? undefined : (asideStyle as MotionStyle)}
                className={classNames(
                    'aside',
                    { open: asideStatus },
                    {
                        aside_rtl:             dir === 'rtl',
                        'aside-touch-bar':       hasTouchButton && isModernDesign,
                        'aside-touch-bar-close': !touchStatus && hasTouchButton && isModernDesign,
                        'aside-touch-bar-open':   touchStatus && hasTouchButton && isModernDesign,
                    },
                )}>
                <div className='aside-head'>
                    <Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} />
                </div>
                <div className='aside-body' style={{ padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {dtNavItems.map(({ key, label, path, section }) => (
                            <React.Fragment key={key}>
                                {section && <SectionLabel label={section} />}
                                <NavLink
                                    to={path}
                                    style={({ isActive }) => ({
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 18px', borderRadius: 10, margin: '0 8px',
                                        textDecoration: 'none',
                                        fontWeight: isActive ? 700 : 500, fontSize: 13,
                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                                        background: isActive ? '#e91e8c' : 'transparent',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    })}
                                    onMouseEnter={e => {
                                        if (!e.currentTarget.style.background.includes('e91e8c'))
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!e.currentTarget.style.background.includes('e91e8c'))
                                            e.currentTarget.style.background = 'transparent';
                                    }}>
                                    <SvgIcon d={icons[key] || icons.about} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                                </NavLink>
                            </React.Fragment>
                        ))}
                    </nav>
                </div>
            </motion.aside>
            {asideStatus && mobileDesign && (
                <div
                    role='presentation'
                    className='aside-drag-area'
                    onClick={() => setAsideStatus(!asideStatus)}
                />
            )}
        </>
    );
};

export default Aside;
