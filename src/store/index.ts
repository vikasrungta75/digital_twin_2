import { notifications } from './notifications';
import { Models } from '@rematch/core';
import { auth } from './auth';
import { usersGroups } from './groupsUsers';
import { usersGroupDetail } from './userGroupDetail';
import { permissionGroupChild } from './groupPermission';
import { vehicles } from './vehicles';
import { fleets } from './fleets';
import { alertsNotifications } from './alertsNotifications';
import { filters } from './filters';
import { overview } from './overview';
import { appStore } from './app';
import { geofences } from './geofences';
import { help } from './help';
import { roles } from './roles';
import { tickets } from './tickets';
import { appStoreNoPersist } from './appNonPersist';
import { reports } from './reports';
import { tasks } from './tasks';

export interface RootModel extends Models<RootModel> {
	auth: typeof auth;
	usersGroups: typeof usersGroups;
	usersGroupDetail: typeof usersGroupDetail;
	permissionGroupChild: typeof permissionGroupChild;
	vehicles: typeof vehicles;
	fleets: typeof fleets;
	alertsNotifications: typeof alertsNotifications;
	filters: typeof filters;
	overview: typeof overview;
	appStore: typeof appStore;
	geofences: typeof geofences;
	help: typeof help;
	notifications: typeof notifications;
	roles: typeof roles;
	tickets: typeof tickets;
	appStoreNoPersist: typeof appStoreNoPersist;
	reports: typeof reports;
	tasks: typeof tasks;
}

export const models: RootModel = {
	auth,
	usersGroups,
	usersGroupDetail,
	permissionGroupChild,
	vehicles,
	fleets,
	alertsNotifications,
	filters,
	overview,
	appStore,
	geofences,
	help,
	notifications,
	roles,
	tickets,
	appStoreNoPersist,
	reports,
	tasks
};
