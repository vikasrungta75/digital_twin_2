import { http } from './http';
import { API_ATH, API_PROFILE } from './api_endpoint';
import qs from 'qs';
import showNotification from '../components/extras/showNotification';
import { stringifyParamArray } from '../helpers/helpers';
import { configHeaders } from './commonService';

export const logout = async () => {
	const params = new URLSearchParams();
	params.append('token', localStorage.getItem('token'));
	try {
		let { data } = await http.post(API_ATH.LOGOUT, params);
		localStorage.removeItem('token');
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const login = async (credentials) => {
	const params = new URLSearchParams();
	params.append('userid', credentials.userid);
	params.append('authType', credentials.authType);
	params.append('password', credentials.password);
	params.append('customerkey', credentials.customerKey);

	try {
		let { data } = await http.post(API_ATH.LOGIN, params);

		const { authToken } = data.users;
		if (authToken) {
			localStorage.setItem('token', authToken);
		}
		return data;
	} catch (err) {
		logout();
		localStorage.removeItem('token');
		console.error(err);
	}
};

export const getUserInfoByToken = async () => {
	const params = new URLSearchParams();
	params.append('token', localStorage.getItem('token'));
	try {
		let { data } = await http.post(API_ATH.GET_USER_INFO_BY_TOKEN, params);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const getCustomerSpaces = async (credentials) => {
	const params = new URLSearchParams();
	params.append('userid', credentials.userid);
	params.append('authType', credentials.authType);
	try {
		let { data } = await http.post(API_ATH.GET_CUSTOMER_SPACES, params);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const forgetPassword = async (usersSpace) => {
	const params = new URLSearchParams();
	params.append('emailID', usersSpace.emailID);
	params.append('spaceKey', usersSpace.spaceKey);
	try {
		let { data } = await http.post(API_ATH.FORGET_PASSWORD, params);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const updateForgotPassword = async (credentials) => {
	const params = new URLSearchParams();
	params.append('encodedToken', credentials.token);
	params.append('newpassword', credentials.newpassword);
	try {
		let { data } = await http.post(API_ATH.UPDATE_FORGOT_PASSWORD, params);
		return data;
	} catch (err) {
		console.error(err);
	}
};

export const getProfileUserDetails = async (credentials) => {
	const { spacekey } = credentials;
	const params = new URLSearchParams();
	params.append('spacekey', spacekey);
	try {
		let { data } = await http.post(
			API_PROFILE.GET_PROFILE_USER_DETAILS,
			params,
			configHeaders(credentials),
		);
		return data;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			showNotification(
				'',
				error.response.data.Error ||
					'Oups! Something went wrong while loading your profile.',
				'danger',
			);
		}
	}
};

export const updateProfile = async (payload) => {
	let selectedUserGroups = stringifyParamArray('selectedUserGroups', payload.selectedUserGroups);
	delete payload.selectedUserGroups;
	const queryString = qs.stringify(payload) + '&' + selectedUserGroups;

	try {
		let { data } = await http.post(API_PROFILE.UPDATE_PROFILE, queryString, configHeaders());
		return data;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			showNotification(
				'Server Error',
				error.response.data.Error ||
					'Oups! Something went wrong while updating your profile. Please try again.',
				'danger',
			);
		}
		return error.response;
	}
};
export const changePassword = async (payload) => {
	try {
		let { data } = await http.post(
			API_PROFILE.CHANGE_PASSWORD,
			qs.stringify(payload),
			configHeaders(),
		);
		return data;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			showNotification(
				'Server Error',
				error.response.data.Error ||
					'Oups! Something went wrong while changing your password. Please try again.',
				'danger',
			);
		}
	}
};
