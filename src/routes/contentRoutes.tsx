import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { authPages, dashboardMenu, settings, superAdminPanel } from '../menu';
import Login from '../pages/auth/login/Login';

const AUTH = {
    RESET_PASSWORD:  lazy(() => import('../pages/auth/resetPassword/ResetPassword')),
    FORGET_PASSWORD: lazy(() => import('../pages/auth/forgetPassword/ForgetPassword')),
};
const ERRORS = {
    PAGE_404: lazy(() => import('../pages/common/error/Page404')),
};
const APP_PROFILE = {
    VIEW: lazy(() => import('../pages/settings/profile/ProfilePage')),
    EDIT: lazy(() => import('../pages/settings/profile/EditProfile')),
};
const APP_SETTINGS = {
    APP_SETTINGS:      lazy(() => import('../pages/settings/language/SettingsPages')),
    ACTIVITY_LOGS:     lazy(() => import('../pages/settings/activity-logs/ActivityLogsPage')),
    SUPER_ADMIN_PANEL: lazy(() => import('../pages/settings/super-admin-panel/SuperadminPanel')),
};
const APP_SUPER_ADMIN = {
    READ_UPDATE: lazy(() => import('../pages/settings/super-admin-panel/CreateReadUpdate')),
};

// ── Digital Twin pages ────────────────────────────────────────────────────────
const DT = {
    ABOUT:                     lazy(() => import('../pages/digitalTwin/AboutDashboard')),
    OVERVIEW:                  lazy(() => import('../pages/digitalTwin/OverviewDashboard')),
    CLIMATE:                   lazy(() => import('../pages/digitalTwin/ClimateDashboard')),
    DRIVING:                   lazy(() => import('../pages/digitalTwin/DrivingDashboard')),
    FUEL:                      lazy(() => import('../pages/digitalTwin/FuelDashboard')),
    LIGHT:                     lazy(() => import('../pages/digitalTwin/LightDashboard')),
    SPEED:                     lazy(() => import('../pages/digitalTwin/SpeedDashboard')),
    TRIP:                      lazy(() => import('../pages/digitalTwin/TripDashboard')),
    DTC:                       lazy(() => import('../pages/digitalTwin/DtcDashboard')),
    // ── AI Features ────────────────────────────────────────────────────────────
    CONVERSATIONAL_INTELLIGENCE: lazy(() => import('../pages/digitalTwin/ConversationalIntelligence')),
    VEHICLE_ANALYSIS:          lazy(() => import('../pages/digitalTwin/AiAnalysisDashboard')),
    AGENT_RECOMMENDATION:      lazy(() => import('../pages/digitalTwin/IntelligenceDashboard')),
    // ── Advanced Analysis ──────────────────────────────────────────────────────
    MAINTENANCE:               lazy(() => import('../pages/digitalTwin/MaintenanceDashboard')),
    WARRANTY:                  lazy(() => import('../pages/digitalTwin/WarrantyDashboard')),
    ENVIRONMENT:               lazy(() => import('../pages/digitalTwin/EnvironmentDashboard')),
    // ── Additional dashboards ──────────────────────────────────────────────────
    SECURITY:                  lazy(() => import('../pages/digitalTwin/SecurityDashboard')),
    COST:                      lazy(() => import('../pages/digitalTwin/CostIntelligenceDashboard')),
    BENCHMARK:                 lazy(() => import('../pages/digitalTwin/FleetBenchmarkDashboard')),
    DTC_LOCATION:              lazy(() => import('../pages/digitalTwin/DtcLocationDashboard')),
    ALERTS:                    lazy(() => import('../pages/digitalTwin/AlertsCentreDashboard')),
};

const loading = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#bbb', fontSize: 15 }}>
        Loading…
    </div>
);

const W = (C: React.ReactElement) => <Suspense fallback={loading}>{C}</Suspense>;

const contents = [
    { path: 'overview',                                       element: <Navigate to='/dt/about' replace />, exact: true },

    // ── Top ────────────────────────────────────────────────────────────────────
    { path: dashboardMenu.about.path,                         element: W(<DT.ABOUT />),                       exact: true },

    // ── AI Features ────────────────────────────────────────────────────────────
    { path: dashboardMenu.conversationalIntelligence.path,    element: W(<DT.CONVERSATIONAL_INTELLIGENCE />),  exact: true },
    { path: dashboardMenu.vehicleAnalysis.path,               element: W(<DT.VEHICLE_ANALYSIS />),             exact: true },
    { path: dashboardMenu.agentRecommendation.path,           element: W(<DT.AGENT_RECOMMENDATION />),         exact: true },

    // ── Legacy alias routes (keep old paths working during transition) ─────────
    { path: dashboardMenu.aiAnalysis.path,                    element: <Navigate to='/dt/vehicle-analysis' replace />,             exact: true },
    { path: dashboardMenu.intelligence.path,                  element: <Navigate to='/dt/agent-recommendation' replace />,         exact: true },

    // ── Core Analysis ──────────────────────────────────────────────────────────
    { path: dashboardMenu.overview.path,                      element: W(<DT.OVERVIEW />),                    exact: true },
    { path: dashboardMenu.trip.path,                          element: W(<DT.TRIP />),                        exact: true },
    { path: dashboardMenu.driving.path,                       element: W(<DT.DRIVING />),                     exact: true },
    { path: dashboardMenu.dtc.path,                           element: W(<DT.DTC />),                         exact: true },
    { path: dashboardMenu.speedAnalysis.path,                 element: W(<DT.SPEED />),                       exact: true },
    { path: dashboardMenu.fuel.path,                          element: W(<DT.FUEL />),                        exact: true },
    { path: dashboardMenu.light.path,                         element: W(<DT.LIGHT />),                       exact: true },
    { path: dashboardMenu.climate.path,                       element: W(<DT.CLIMATE />),                     exact: true },

    // ── Advanced Analysis ──────────────────────────────────────────────────────
    { path: dashboardMenu.maintenance.path,                   element: W(<DT.MAINTENANCE />),                 exact: true },
    { path: dashboardMenu.warranty.path,                      element: W(<DT.WARRANTY />),                    exact: true },
    { path: dashboardMenu.environment.path,                   element: W(<DT.ENVIRONMENT />),                 exact: true },

    // ── Additional dashboards ──────────────────────────────────────────────────
    { path: dashboardMenu.security.path,                      element: W(<DT.SECURITY />),                    exact: true },
    { path: dashboardMenu.cost.path,                          element: W(<DT.COST />),                        exact: true },
    { path: dashboardMenu.benchmark.path,                     element: W(<DT.BENCHMARK />),                   exact: true },
    { path: dashboardMenu.dtcLocation.path,                   element: W(<DT.DTC_LOCATION />),                exact: true },
    { path: dashboardMenu.alerts.path,                        element: W(<DT.ALERTS />),                      exact: true },

    // ── Auth / settings ───────────────────────────────────────────────────────
    { path: authPages.page404.path,                           element: W(<ERRORS.PAGE_404 />),                              exact: true },
    { path: authPages.login.path,                             element: <Login />,                                           exact: true },
    { path: authPages.forgetPassword.path,                    element: W(<AUTH.FORGET_PASSWORD />),                         exact: true },
    { path: authPages.resetPassword.path,                     element: W(<AUTH.RESET_PASSWORD />),                          exact: true },
    { path: settings.profile.path,                            element: W(<APP_PROFILE.VIEW />),                             exact: true },
    { path: `${settings.profile.path}/edit`,                  element: W(<APP_PROFILE.EDIT />),                             exact: true },
    { path: settings.settings.path,                           element: W(<APP_SETTINGS.APP_SETTINGS />),                    exact: true },
    { path: settings.activityLog.path,                        element: W(<APP_SETTINGS.ACTIVITY_LOGS />),                   exact: true },
    { path: settings.superAdminPanel.path,                    element: W(<APP_SETTINGS.SUPER_ADMIN_PANEL />),               exact: true },
    { path: superAdminPanel.createSuperAdminPanel.path,       element: W(<APP_SUPER_ADMIN.READ_UPDATE isCreating />),        exact: true },
    { path: superAdminPanel.readSuperAdminPanel.path,         element: W(<APP_SUPER_ADMIN.READ_UPDATE />),                   exact: true },
];

export default contents;
