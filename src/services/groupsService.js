import { httpwithtoken, http } from './http';
import { API_GROUPS_USERS } from './api_endpoint';
import qs from 'qs';
import { generateRestAPI, stringifyParamArray } from '../helpers/helpers';
import showNotification from '../components/extras/showNotification';
import i18next from 'i18next';
import { configHeaders, getData } from './commonService';
import { useQuery } from '@tanstack/react-query';
import { store } from '../store/store';

export const getUsersList = async (user) => {
	const params = new URLSearchParams();
	params.append('spacekey', user.spacekey);
	try {
		let { data } = await http.post(
			API_GROUPS_USERS.GET_USERS_LISTS,
			params,
			configHeaders(user),
		);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const useGetFleetManagers = () => {
	const {
		user: {
			user: { id },
		},
		customProperties
	} = store.getState().auth;

	const payload = generateRestAPI(
		[{ user_id: id }, { role: customProperties.role }],
		process.env.REACT_APP_USERS,
	);

	return useQuery({
		queryKey: ['getFleetManagers', payload],
		staleTime: 300000,
		retryOnMount: true,
		queryFn: () => getData(payload, 'all fleet managers'),
	});
};

export const createGroup = async (newGroup) => {
	let usersIDstr = stringifyParamArray('userIDs', newGroup.userIDs);
	let addedPermissionstr = stringifyParamArray('addedPermissions', newGroup.addedPermissions);
	let menuPermissionstr = stringifyParamArray('menuPermissions', newGroup.menuPermissions);
	let payload = {
		...newGroup,
	};
	delete payload.addedPermissions;
	delete payload.menuPermissions;
	delete payload.userIDs;
	let convertIdPermission = encodeURI(
		addedPermissionstr + '&' + menuPermissionstr + '&' + usersIDstr,
	);

	let dataStr = qs.stringify(payload) + '&' + convertIdPermission;

	try {
		let { data } = await http.post(
			API_GROUPS_USERS.SET_NEW_GROUPS_USER,
			dataStr,
			configHeaders(newGroup),
		);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const updateGroup = async (payload) => {
	let usersIDstr = stringifyParamArray('userIDs', payload.assignedUsers);
	let permissionsIDstr = stringifyParamArray('addedPermissions', payload.assignedPermission);

	delete payload.assignedUsers;
	delete payload.assignedPermission;
	payload.groupID = parseInt(payload.groupID);

	let convertIdPermission = encodeURI(usersIDstr + '&' + permissionsIDstr);
	let dataStr = qs.stringify(payload) + '&' + convertIdPermission;

	try {
		let { data } = await http.post(
			API_GROUPS_USERS.UPDATE_GROUP,
			dataStr,
			configHeaders(payload),
		);
		return data;
	} catch (err) {
		console.error(err);
	}

	// here the base logique of update group
};

export const updatePermissionGroup = async (payload) => {
	let usersIDstr = stringifyParamArray('userIDs', payload.assignedUsers);
	let permissionsIDstr = stringifyParamArray('addedPermissions', payload.assignedPermission);
	delete payload.assignedUsers;
	delete payload.assignedPermission;
	payload.groupID = parseInt(payload.groupID);
	let dataStr =
		qs.stringify(payload) +
		'&' +
		usersIDstr +
		'&' +
		permissionsIDstr +
		'&menuPermissions[]=10190859&menuPermissions[]=10190860';

	try {
		let { data } = await http.post(
			API_GROUPS_USERS.UPDATE_GROUP,
			dataStr,
			configHeaders(payload),
		);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const getGroupsList = async (payload) => {
	const { header, credentials } = payload;
	let config = {
		headers: header,
	};
	try {
		let { data } = await httpwithtoken.post(
			API_GROUPS_USERS.GET_GROUPS_LISTS,
			qs.stringify(credentials),
			config,
		);
		return data;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			if (i18next.language === 'fr-FR') {
				showNotification(
					'Erreur du serveur',
					error.response.data.Error ||
						"Oups ! Une erreur s'est produite lors de la récupération des groupes. Veuillez réessayer.",
					'danger',
				);
			} else {
				showNotification(
					'Server Error',
					error.response.data.Error ||
						'Oups! Something went wrong while Fetching Groups. Please try again.',
					'danger',
				);
			}
		}
	}
};

export const createUser = async (user) => {
	let selectedUserGroups = stringifyParamArray('selectedUserGroups', user.selectedUserGroups);
	let payload = {
		...user,
	};
	delete payload.selectedUserGroups;

	let dataStr = qs.stringify(payload) + '&' + encodeURI(selectedUserGroups);

	try {
		let { data } = await http.post(API_GROUPS_USERS.CREATE_USER, dataStr, configHeaders(user));

		return data;
	} catch (err) {
		console.error(err);
	}
};

export const getLisUsersByGroups = async (idGroup, user) => {
	const params = new URLSearchParams();
	params.append('groupID', idGroup);
	params.append('spacekey', user.spaceKey);
	try {
		let { data } = await http.post(
			API_GROUPS_USERS.GET_LIST_USERS_GROUP,
			params,
			configHeaders(user),
		);

		return data;
	} catch (err) {
		console.error(err);
	}
};
export const getUserDetails = async (payload) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(payload)) params.append(key, value);
	try {
		let { data } = await http.post(API_GROUPS_USERS.GET_USER_DETAILS, params, configHeaders());
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const getUserGroupDetails = async (payload) => {
	let response = await httpwithtoken.post(
		API_GROUPS_USERS.GET_USERS_IN_GROUP,
		qs.stringify(payload),
		configHeaders(),
	);
	return response;
};

export const userGroupOperations = async (credentials) => {
	try {
		let { data } = await httpwithtoken.post(
			API_GROUPS_USERS.USER_GROUP_OPERATIONS,
			qs.stringify(credentials),
			configHeaders(),
		);
		return data;
	} catch (error) {
		console.error(error);
		if (i18next.language === 'fr-FR') {
			showNotification(
				'Erreur du serveur',
				error.response.data.Error ||
					"Oups ! Une erreur s'est produite lors du blocage du groupe. Veuillez réessayer.",
				'danger',
			);
		} else {
			showNotification(
				'Server Error',
				error.response.data.Error ||
					'Oups! Something went wrong while blocking group. Please try again.',
				'danger',
			);
		}
	}
};

export const getPermissionList = async (auth) => {
	const params = new URLSearchParams();
	params.append('spacekey', auth.spacekey);
	params.append('groupID', auth.groupID);
	let response = await httpwithtoken.post(
		API_GROUPS_USERS.GET_PERMISSION_LIST,
		params,
		configHeaders(auth),
	);
	return response;
};

export const removeUserOperations = async (credentials) => {
	try {
		let { data } = await httpwithtoken.post(
			API_GROUPS_USERS.REMOVE_USER_OPERATIONS,
			qs.stringify(credentials),
			configHeaders(),
		);
		return data;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			if (i18next.language === 'fr-FR') {
				showNotification(
					'Erreur du serveur',
					error.response.data.Error ||
						"Oups ! Une erreur s'est produite lors de la suppression de l'utilisateur. Veuillez réessayer.",
					'danger',
				);
			}
			showNotification(
				'Server Error',
				error.response.data.Error ||
					'Oups! Something went wrong while delete user. Please try again.',
				'danger',
			);
		}
		return error.response;
	}
};
