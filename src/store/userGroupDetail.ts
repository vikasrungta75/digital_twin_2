import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { dataIngestion } from '../services/commonService';
import {
	getUserDetails,
	getUserGroupDetails,
	removeUserOperations,
} from '../services/groupsService';

const initalValues = {
	success: false,
	assignedUsers: [],
	groupDetail: { name: '', status: 0, id: 0 },
	userDetails: {
		assignedUserGroups: [],
		user: {
			id: '',
			customproperties: '',
			userName: '',
			fullName: '',
			emailID: '',
			description: '',
			mobileNumber: '',
			landNumber: '',
			address: '',
			pincode: '',
			state: '',
			country: '',
			city: '',
		},
	},
	addPermissionsToGroupUtils: [],
};

export const usersGroupDetail = createModel<RootModel>()({
	state: { ...initalValues },
	reducers: {
		getUserGroupDetails(state, res) {
			return {
				...state,
				success: res.userGroups.success,
				assignedUsers: res.userGroups.assignedUsers,
				groupDetail: res.userGroups.userGroup,
				addPermissionsToGroupUtils: res.userGroups.addPermissionsToGroupUtils,
			};
		},
		setUserDetails(state, res) {
			return {
				...state,
				success: res.success,
				userDetails: res,
			};
		},
		cleanUserDetails(state) {
			return {
				...state,
				userDetails: {
					assignedUserGroups: [],
					user: {
						id: '',
						customproperties: '',
						userName: '',
						fullName: '',
						emailID: '',
						description: '',
						mobileNumber: '',
						landNumber: '',
						address: '',
						pincode: '',
						state: '',
						country: '',
						city: '',
					},
				},
			};
		},
		cleanGroupDetail(state) {
			return { ...state, groupDetail: { name: '', status: 0, id: 0 } };
		},
		cleanStore() {
			return { ...initalValues };
		},
	},
	effects: (dispatch) => ({
		async getUserGroupDetailsAsync(payload, rootState) {
			const { spaceKey, id } = rootState.auth.user.user;
			const { groupID } = payload;
			const credentials = {
				spacekey: spaceKey,
				id,
				groupID,
			};
			const response = await getUserGroupDetails(credentials);
			if (response.data.userGroups.success) {
				dispatch.usersGroupDetail.getUserGroupDetails(response.data);
				return response.data.userGroups.assignedUsers;
			}
		},

		async getUserDetailsAsync(payload) {
			const getUserDetailsResponse = await getUserDetails(payload);
			if (getUserDetailsResponse?.users.success)
				dispatch.usersGroupDetail.setUserDetails(getUserDetailsResponse.users);
			return getUserDetailsResponse.users.user;
		},

		async deleteUserAsync(userId, rootState) {
			const { spaceKey } = rootState.auth.user.user;
			// const { userID } = payload;
			const credentials = {
				spacekey: spaceKey,
				operationType: 2,
				userID: userId,
			};

			// return removeUserOperationsResponse;

			const {
				user: {
					user: { id },
				},
			} = rootState.auth;

			let payloadDeletion = {
				fm_user_id: id,
				user_id: userId,
				action: 'delete user',
			};
			const removeUserOperationsResponseUser = await removeUserOperations(credentials);
			const removeUserOperationsResponse = await dataIngestion(payloadDeletion);
			if (
				removeUserOperationsResponse.success &&
				removeUserOperationsResponseUser.users.success
			) {
				return true;
			} else {
				return false;
			}
		},
		async updatePermissionsAsync(payload) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { permissions_category, user_id } = payload;
			const payloadUpdatePermissions = {
				permissions_category,
				user_id,
				action: 'update permission',
			};

			const payloadUpdatePermissionsResponse = await dataIngestion(payloadUpdatePermissions);
			if (payloadUpdatePermissionsResponse.success) {
				return true;
			} else {
				return false;
			}
		},
	}),
});
