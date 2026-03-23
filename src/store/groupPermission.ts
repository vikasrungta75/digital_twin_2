import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { getPermissionList } from '../services/groupsService';

export const permissionGroupChild = createModel<RootModel>()({
	state: {
		success: false,
		permissionsList: [],
	},
	reducers: {
		getPermissionList(state, res) {
			return {
				...state,
				success: res.permissions.success,
				permissionsList: res.permissions.permissionsList,
			};
		},
	},
	effects: (dispatch) => ({
		async getPermissionListAsync(auth) {
			const response = await getPermissionList(auth);
			if (response.data.permissions.success) dispatch.permissionGroupChild.getPermissionList(response.data);
		},
	}),
});
