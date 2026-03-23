import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import loadingPlugin, { ExtraModelsFromLoading } from '@rematch/loading';
import createPersistPlugin from '@rematch/persist';
import storage from 'redux-persist/lib/storage';
import { models, RootModel } from '../store';

const persistPlugin: any = createPersistPlugin({
	key: 'root',
	storage,
	version: 2,
	whitelist: [
		'auth',
		'usersGroups',
		'vehicles',
		'fleets',
		'usersGroupDetail',
		'filters',
		'overview',
		'appStore',
		'geofences',
		'help',
		'notifications',
		'roles',
		'reports'
	],
});

type FullModel = ExtraModelsFromLoading<RootModel>;

export const store = init<RootModel, FullModel>({
	models,
	plugins: [persistPlugin, loadingPlugin()],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, FullModel>;
