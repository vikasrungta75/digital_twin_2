import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import {
	createGroup,
	createUser,
	getGroupsList,
	getUsersList,
	updateGroup,
	updatePermissionGroup,
	userGroupOperations,
} from '../services/groupsService';
import { IGroupAssignedToRole } from '../type/groups-type';
import { IUserAssignedToRole } from '../type/users-type';

const initialValue = {
	success: false,
	users: [],
	message: '',
	userGroupsList: [],
	groupsList: [],
	lisUsersByGroups: [],
	messageCode: '',
	usersListAssignedToRole: [] as IUserAssignedToRole[],
	groupsListAssignedToRole: [] as IGroupAssignedToRole[],
};

export const usersGroups = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setGroupsList(state, res) {
			return {
				...state,
				success: res.success,
				userGroupsList: res.userGroupsList,
			};
		},

		setUsersList(state, res) {
			return {
				...state,
				success: res.success,
				users: res.users,
				message: res.message,
			};
		},

		responseStatus(state, res) {
			return {
				...state,
				success: res.success,
				message: res.errorMessage || res.message,
				messageCode: res.messageCode,
			};
		},
		setUsersListAssignedToRole(state, res) {
			return {
				...state,
				usersListAssignedToRole: res,
			};
		},
		setGroupsListAssignedToRole(state, res) {
			return {
				...state,
				groupsListAssignedToRole: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
	},
	effects: (dispatch) => ({
		async updateGroupIngestion(payload) {
			const updateGroupResponse = await dataIngestion(payload);
			if (updateGroupResponse?.success) {
				dispatch.auth.getProfileUserDetailsAsync();
			} else {
				return false;
			}
		},
		async updateGroupAsync(payload) {
			const { groupName, groupID, userid } = payload;

			const payloadIngestionGroupUpdate = {
				fm_user_id: userid,
				group_id: Number(groupID),
				group_name: groupName,
				action: 'update group',
			};
			const response = await updateGroup(payload);
			if (response?.userGroups.success) {
				dispatch.usersGroups.updateGroupIngestion(payloadIngestionGroupUpdate);
			}
			return response.userGroups;
		},
		async updatePermissionGroupAsync(payload) {
			const response = await updatePermissionGroup(payload);
			if (response?.userGroups.success) {
				dispatch.auth.getProfileUserDetailsAsync();
			}
			return response.userGroups;
		},

		async getUserListAsync(_: void, rootState) {
			const { spaceKey, id } = rootState.auth.user.user;
			const payload = {
				spacekey: spaceKey,
				id: id,
			};
			const response = await getUsersList(payload);
			if (response?.userGroups.success) {
				dispatch.usersGroups.setUsersList(response.userGroups);
			}
		},

		async createNewGroup(payload, rootState) {
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;

			const createGroupResponse = await createGroup(payload);

			if (createGroupResponse?.userGroups.success) {
				const payloadCreateNewGroup = {
					fleet_id: customProperties.fleetId,
					fm_user_id: id,
					fm_user_name: fullName,
					fm_user_email: emailID,
					group_id: createGroupResponse.userGroups.userGroup.id,
					group_name: payload.groupName,
					action: 'Add group',
				};

				const createGroupDataIngestionResponse = await dataIngestion(payloadCreateNewGroup);
				if (createGroupDataIngestionResponse.success) {
					dispatch.auth.getProfileUserDetailsAsync();
					return createGroupResponse?.userGroups;
				} else {
					return createGroupResponse?.userGroups;
				}
			} else {
				return createGroupResponse?.userGroups;
			}
		},

		async getGroupsListAsync(_: void, rootState) {
			const {
				token,
				user: {
					user: { id, spaceKey },
				},
			} = rootState.auth;
			const payload = {
				header: {
					authToken: token,
					spacekey: spaceKey,
					userid: id,
				},
				credentials: {
					page: '0',
					rows: '9999',
					spacekey: spaceKey,
				},
			};
			const getGroupsListResponse: any = await getGroupsList(payload);

			if (getGroupsListResponse.userGroups?.success) {
				dispatch.usersGroups.setGroupsList(getGroupsListResponse.userGroups);
				return getGroupsListResponse.userGroups;
			} else {
				dispatch.groupsUsers.responseStatus(getGroupsListResponse.userGroups);
			}
		},

		async createUserAsync(payload, rootState) {
			const createUserResponse = await createUser(payload);
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;

			if (createUserResponse?.users?.success) {
				const payloadCreateUser = {
					user_email: payload.uniqueId,
					user_name: payload.fullName,
					selectedUserGroups: payload.selectedUserGroups,
					role: payload.role,
					user_id: createUserResponse.users.user.id,
					fm_user_id: id,
					fm_user_email: emailID,
					fm_user_name: fullName,
					fleet_id: customProperties.fleetId,
					action: 'add user',
				};

				const createUserDataIngestionResponse = await dataIngestion(payloadCreateUser);

				if (createUserDataIngestionResponse.success) {
					return createUserDataIngestionResponse;
				} else {
					return createUserDataIngestionResponse;
				}
			} else {
				return createUserResponse?.users;
			}
		},

		async blockGroupOperations(groupID, rootState) {
			const { spaceKey } = rootState.auth.user.user;

			const credentials = {
				spacekey: spaceKey,
				operationType: 2,
				groupID,
			};
			const {
				user: {
					user: { id },
				},
			} = rootState.auth;

			let payloadDeletion = {
				fm_user_id: id,
				group_id: groupID,
				action: 'delete group',
			};
			const blockUserGroupOperationsResponseGroup = await userGroupOperations(credentials);

			const blockUserGroupOperationsResponse = await dataIngestion(payloadDeletion);
			if (
				blockUserGroupOperationsResponse.success &&
				blockUserGroupOperationsResponseGroup.userGroups.success
			) {
				dispatch.usersGroups.getGroupsListAsync();
				dispatch.auth.getProfileUserDetailsAsync();

				return true;
			} else {
				return false;
			}
		},

		async getUsersListAssignedToRoleAsync(_: void, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;

			const credentials = generateRestAPI(
				[{ user_id: id }, { role: customProperties.role }],
				process.env.REACT_APP_USERS,
			);

			const getUsersResponse = await getData(credentials, "users' list");

			if (Array.isArray(getUsersResponse)) {
				this.setUsersListAssignedToRole(getUsersResponse);
			} else {
				this.setUsersListAssignedToRole([]);
			}
			return getUsersResponse;
		},
		async getGroupsListAssignedToRoleAsync(_: void, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;
			const credentials = generateRestAPI(
				[{ user_id: id }, { role: customProperties.role }],
				process.env.REACT_APP_GROUPS,
			);

			const getGroupsListResponse = await getData(credentials, "groups' list");

			if (Array.isArray(getGroupsListResponse)) {
				this.setGroupsListAssignedToRole(getGroupsListResponse);
			} else {
				this.setGroupsListAssignedToRole([]);
			}
			return getGroupsListResponse;
		},
	}),
});
