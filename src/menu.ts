export const dashboardMenu = {
    // ── Top-level standalone ───────────────────────────────────────────────────
    about:                   { id: 'dt-about',        text: 'About',                      path: 'dt/about',                 icon: 'Menu',                subMenu: null, searchable: false, hide: false },

    // ── AI / Intelligence ──────────────────────────────────────────────────────
    conversationalIntelligence: { id: 'dt-conv-intel',  text: 'Conversational Intelligence', path: 'dt/conversational-intelligence', icon: 'Chat',          subMenu: null, searchable: true,  hide: false },
    vehicleAnalysis:         { id: 'dt-vehicle-analysis', text: 'Vehicle Analysis',          path: 'dt/vehicle-analysis',     icon: 'Analytics',           subMenu: null, searchable: true,  hide: false },
    vehicleComparison:       { id: 'dt-vehicle-comparison', text: 'Vehicle Comparison',       path: 'dt/vehicle-comparison',  icon: 'CompareArrows',       subMenu: null, searchable: true,  hide: false },
    agentRecommendation:     { id: 'dt-agent-rec',    text: 'Agent Recommendation',        path: 'dt/agent-recommendation',  icon: 'Psychology',           subMenu: null, searchable: true,  hide: false },

    // ── Core Analysis ──────────────────────────────────────────────────────────
    overview:                { id: 'dt-overview',     text: 'Overview',                   path: 'dt/overview',              icon: 'GridView',            subMenu: null, searchable: true,  hide: false },
    trip:                    { id: 'dt-trip',         text: 'Trip Analysis',              path: 'dt/trip',                  icon: 'Route',               subMenu: null, searchable: true,  hide: false },
    driving:                 { id: 'dt-driving',      text: 'Driving Analysis',           path: 'dt/driving',               icon: 'Speed',               subMenu: null, searchable: true,  hide: false },
    dtc:                     { id: 'dt-dtc',          text: 'DTC Analysis',               path: 'dt/dtc',                   icon: 'Dns',                 subMenu: null, searchable: true,  hide: false },
    speedAnalysis:           { id: 'dt-speed',        text: 'Speed Analysis',             path: 'dt/speed',                 icon: 'Timer',               subMenu: null, searchable: true,  hide: false },
    fuel:                    { id: 'dt-fuel',         text: 'Fuel Analysis',              path: 'dt/fuel',                  icon: 'LocalGasStation',     subMenu: null, searchable: true,  hide: false },
    light:                   { id: 'dt-light',        text: 'Light Analysis',             path: 'dt/light',                 icon: 'FlashOn',             subMenu: null, searchable: true,  hide: false },
    climate:                 { id: 'dt-climate',      text: 'Climate Analysis',           path: 'dt/climate',               icon: 'WbSunny',             subMenu: null, searchable: true,  hide: false },

    // ── Advanced Analysis ──────────────────────────────────────────────────────
    maintenance:             { id: 'dt-maintenance',  text: 'Maintenance',                path: 'dt/maintenance',           icon: 'Build',               subMenu: null, searchable: true,  hide: false },
    warranty:                { id: 'dt-warranty',     text: 'Warranty',                   path: 'dt/warranty',              icon: 'Shield',              subMenu: null, searchable: true,  hide: false },
    environment:             { id: 'dt-environment',  text: 'Environmental',              path: 'dt/environment',           icon: 'Eco',                 subMenu: null, searchable: true,  hide: false },

    // ── Additional dashboards (kept for routing; hidden from side panel if needed) ─
    intelligence:            { id: 'dt-intelligence', text: 'Agent Recommendation',       path: 'dt/agent-recommendation',  icon: 'Psychology',          subMenu: null, searchable: true,  hide: true  },
    aiAnalysis:              { id: 'dt-ai',           text: 'Vehicle Analysis',           path: 'dt/vehicle-analysis',      icon: 'Analytics',           subMenu: null, searchable: true,  hide: true  },
    security:                { id: 'dt-security',     text: 'Security & Access',          path: 'dt/security',              icon: 'Lock',                subMenu: null, searchable: true,  hide: false },
    cost:                    { id: 'dt-cost',         text: 'Cost Intelligence',          path: 'dt/cost',                  icon: 'MonetizationOn',      subMenu: null, searchable: true,  hide: false },
    benchmark:               { id: 'dt-benchmark',    text: 'Fleet Benchmark',            path: 'dt/benchmark',             icon: 'Leaderboard',         subMenu: null, searchable: true,  hide: false },
    dtcLocation:             { id: 'dt-dtc-location', text: 'DTC Location Map',           path: 'dt/dtc-location',          icon: 'LocationOn',          subMenu: null, searchable: true,  hide: false },
    alerts:                  { id: 'dt-alerts',       text: 'Alerts Centre',              path: 'dt/alerts',                icon: 'NotificationsActive', subMenu: null, searchable: true,  hide: false },
};

export const authPages = {
    login:          { id: 'login',          text: 'Login',           path: '/',                           icon: 'Login' },
    forgetPassword: { id: 'forgotPassword', text: 'Forgot Password', path: 'auth-pages/forget-password', icon: 'Login', hide: true },
    resetPassword:  { id: 'resetPassword',  text: 'Reset Password',  path: 'home/',                       icon: 'Login', hide: true },
    page404:        { id: 'Page404',        text: '404 Page',        path: 'auth-pages/404',              icon: 'ReportGmailerrorred', hide: true },
};

export const historyPages = {
    tripDetails: { id: 'trip details', text: 'Trip Details', path: 'history/trip-details', icon: '', subMenu: null, hide: true, searchable: false },
};

export const settings = {
    profile:         { id: 'profile',         text: 'Profile',           path: 'profile',                    icon: 'AccountCircle',      hide: true, searchable: true },
    settings:        { id: 'settings',        text: 'Settings',          path: 'settings',                   icon: 'Settings',           hide: true, searchable: true },
    activityLog:     { id: 'activity log',    text: 'Activity Log',      path: 'settings/activity',          icon: 'History',            hide: true, searchable: true },
    superAdminPanel: { id: 'superAdminPanel', text: 'Super Admin Panel', path: 'settings/super-admin-panel', icon: 'AdminPanelSettings', hide: true, searchable: true },
};

export const users = {
    addUser:         { id: 'addUser',         text: 'New User Profile', path: 'setup/users/add-user',     icon: 'Add', searchable: true },
    editUser:        { id: 'editUser',        text: 'Edit User Profile', path: 'setup/users/edit-user',   icon: '',    searchable: false },
    editPermissions: { id: 'editPermission',  text: 'Edit Permissions',  path: 'edit-permissions',        icon: '',    searchable: false },
    readPermissions: { id: 'readPermissions', text: 'See Permissions',   path: 'read-permissions',        icon: '',    searchable: false },
    userDetails:     { id: 'userDetail',      text: 'User Details',      path: 'setup/users/user-detail', icon: '',    searchable: false },
};

export const driver = {
    addDriver:     { id: 'addDriver',    text: 'Add New Driver',   path: 'setup/drivers/add-driver',    icon: 'Add', searchable: true },
    editDriver:    { id: 'editDriver',   text: 'Edit Driver Info',  path: 'setup/drivers/edit-driver',  icon: '',    searchable: false },
    driverDetails: { id: 'driverDetail', text: 'Driver Details',   path: 'setup/drivers/driver-detail', icon: '',   searchable: false },
};

export const groups = {
    groupManagment: {
        id: 'groups', text: 'Group Management', path: 'groups', icon: 'BackupTable', searchable: false,
        subMenu: {
            addGroup:        { id: 'addGroup',        text: 'Create New Group', path: 'add-group',          icon: 'Add', searchable: true },
            addUsersToGroup: { id: 'addUsersToGroup', text: 'Add Users',        path: 'add-users-to-group', icon: '',    searchable: false },
            editGroup:       { id: 'editGroup',       text: 'Edit group name',  path: 'edit-group-name',    icon: '',    searchable: false },
            usersListGroup:  { id: 'usersListGroup',  text: 'Users List Group', path: 'users-list-group',   icon: '',    searchable: false },
        },
    },
};

export const rolesPages = {
    rolesManagment: {
        id: 'roles', text: 'Roles', path: 'setup/roles', icon: 'BackupTable', searchable: false,
        subMenu: {
            addUsersToRole:  { id: 'addUsersToRole',  text: 'Add Users To Role',   path: 'setup/roles/add-users-to-role',  icon: '', searchable: false },
            editPermissions: { id: 'editPermission',  text: 'Edit Permissions',    path: 'setup/roles/edit-permissions',   icon: '', searchable: false },
            readPermissions: { id: 'readPermissions', text: 'Permissions Details', path: 'edit-permissions',               icon: '', searchable: false },
            usersListRole:   { id: 'usersLisRole',    text: 'Users List Role',     path: 'setup/roles/users-list-role',    icon: '', searchable: false },
        },
    },
};

export const ticketsPages = {
    ticketManagement: {
        id: 'tickets', text: 'Tickets', path: 'setup/tickets', icon: 'BackupTable', searchable: false,
        subMenu: {
            ticketDetails: { id: 'ticketDetails', text: 'Ticket Detail',     path: 'setup/tickets/ticket-detail',  icon: 'NotificationsActive', subMenu: null, searchable: false },
            createticket:  { id: 'createTicket',  text: 'Create New Ticket', path: 'setup/tickets/create-ticket',  icon: 'Add',                 subMenu: null, searchable: true },
            editTicket:    { id: 'editTicket',    text: 'Edit Ticket',       path: 'setup/tickets/edit-ticket',    icon: '',                    subMenu: null, searchable: false },
        },
    },
};

export const maintenance = {
    addVehicleRevision:  { id: 'addVehicleRevision',  text: 'Add a vehicle revision', path: 'setup/maintenance/add-vehicle-revision',  icon: 'Add', searchable: true },
    editVehicleRevision: { id: 'editVehicleRevision', text: 'Edit vehicle revision',  path: 'setup/maintenance/edit-vehicle-revision', icon: '',    searchable: false },
};

export const superAdminPanel = {
    createSuperAdminPanel: { id: 'createSuperAdminPanel', text: 'Create Super Admin Panel', path: 'settings/create-super-admin-panel', icon: '', searchable: false },
    readSuperAdminPanel:   { id: 'readSuperAdminPanel',   text: 'Read Super Admin Panel',   path: 'settings/read-super-admin-panel',   icon: '', searchable: false },
    editSuperAdminPanel:   { id: 'editSuperAdminPanel',   text: 'Edit Super Admin Panel',   path: 'settings/edit-super-admin-panel',   icon: '', searchable: false },
};

export const reportsPage = {
    createScheduledReport: { id: 'createScheduledReport', text: 'Create Scheduled Report',   path: 'settings/create-scheduled-report', icon: '', searchable: false },
    seeScheduledReports:   { id: 'seeScheduledReport',    text: 'List of planified reports', path: 'settings/scheduled-reports',       icon: '', searchable: false },
    readScheduledReport:   { id: 'readScheduledReport',   text: 'Read Scheduled Report',     path: 'settings/read-scheduled-report',   icon: '', searchable: false },
    editScheduledReport:   { id: 'editScheduledReport',   text: 'Edit Scheduled Report',     path: 'settings/edit-scheduled-report',   icon: '', searchable: false },
};
