import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import timezones from '../common/data/timezone/timezones.json';
import { generateRestAPI } from '../helpers/helpers';
import i18n from '../i18n';
import {
	changePassword,
	forgetPassword,
	getCustomerSpaces,
	getProfileUserDetails,
	getUserInfoByToken,
	login,
	logout,
	updateForgotPassword,
	updateProfile,
} from '../services/authService';
import { dataIngestion, getData } from '../services/commonService';
import {
	CredentialsInterface,
	IAuthPermissions,
	IAuthPermissionsCategories,
	LoginAndUserInfoByTokenResponseInterface,
	SpacesSpacesInterface,
	UsersInterface,
} from '../type/auth-type';
import OneSignal from 'react-onesignal';

export interface IspacesModel {
	spaceName: string;
	spaceKey: number;
	customerKey: string;
	userId: string;
}

export interface ISpace {
	token: string | undefined;
	user: any;
	permissions: IAuthPermissions;
	permissionsWithCategories: IAuthPermissionsCategories[];
	preferedTimeZone: string;
	success: Boolean | null;
	message: string;
	messageCode: string;
	joyrideRun: boolean;
	spaces: IspacesModel[];
	customProperties: { [key: string]: string };
}

export const auth = createModel<RootModel>()({
	state: {
		token: '',
		permissions: {} as IAuthPermissions,
		permissionsWithCategories: [] as IAuthPermissionsCategories[],
		preferedTimeZone: '',
		user: {},
		customProperties: {},
		success: null,
		message: '',
		messageCode: '',
		spaces: [],
		joyrideRun: true,
	} as ISpace,
	reducers: {
		setCustomerSpace(state, res) {
			return {
				...state,
				success: res.success,
				spaces: res.spaces,
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
		getToken(state: ISpace, payload: string | undefined) {
			return { ...state, token: payload };
		},
		setUser(state: ISpace, res: UsersInterface) {
			return {
				...state,
				user: res,
				success: res.success,
				message: '',
				messageCode: '',
			};
		},
		deleteToken(state: ISpace) {
			return {
				...state,
				token: '',
				user: {},
				permissions: {} as IAuthPermissions,
				permissionsWithCategories: [] as IAuthPermissionsCategories[],
				preferedTimeZone: '',
				spaces: [],
				message: '',
				messageCode: '',
			};
		},
		setTimeZone(state: ISpace, res: string) {
			return {
				...state,
				preferedTimeZone: res,
			};
		},
		setPermissions(state: ISpace, res: IAuthPermissionsCategories[], isSameId) {
			const flatPermissions = res
				.map(({ permissions }: any) => permissions)
				.flat()
				.reduce((acc: any, perm: any) => {
					Object.keys(perm).forEach((permission) => {
						acc[permission] = perm[permission];
					});
					return acc;
				}, {});
			return {
				...state,
				permissions: isSameId ? flatPermissions : state.permissions,
				permissionsWithCategories: res,
			};
		},
		setJoyrideState(state: ISpace, res: boolean) {
			return {
				...state,
				joyrideRun: res,
			};
		},
		setCustomProperties(state, res) {
			return {
				...state,
				customProperties: res,
			};
		},
	},
	effects: (dispatch) => ({
		async getCustomerSpacesAsync(spaceCustomer) {
			const getCustomerSpacesResponse = await getCustomerSpaces(spaceCustomer);
			if (getCustomerSpacesResponse.spaces.success) {
				const fleetSpace = getCustomerSpacesResponse.spaces.spaces.find(
					(space: SpacesSpacesInterface) =>
						space.spaceName === process.env.REACT_APP_SPACE_NAME,
				);
				dispatch.auth.setCustomerSpace(getCustomerSpacesResponse.spaces);

				let usersSpace = {
					emailID: spaceCustomer.userid,
					spaceKey: fleetSpace?.spaceKey,
				};

				const forgetPasswordResponse = await forgetPassword(usersSpace);
				dispatch.auth.responseStatus(forgetPasswordResponse.users);
			} else {
				dispatch.auth.responseStatus(getCustomerSpacesResponse.spaces);
			}
		},
		async getResetPassword(credentials) {
			const updateForgotPasswordResponse = await updateForgotPassword(credentials);
			dispatch.auth.responseStatus(updateForgotPasswordResponse?.users);
		},
		async deleteTokenAsync() {
			const logoutResponse = await logout();
			if (logoutResponse?.users?.success) {
				OneSignal.logout();
				dispatch.auth.deleteToken();
				dispatch.vehicles.clearStore();
				dispatch.usersGroupDetail.cleanStore();
				dispatch.usersGroups.clearStore();
				dispatch.overview.clearStore();
				dispatch.geofences.clearStore();
				dispatch.help.clearStore();
				dispatch.roles.clearStore();
				dispatch.notifications.clearStore();
			}
		},
		async getLogin(credentials) {
			const { userid, password } = credentials;
			let customCredentials: CredentialsInterface = { userid, authType: 'ep' };

			const customerSpacesResponse = await getCustomerSpaces(customCredentials);

			if (customerSpacesResponse?.spaces?.success) {
				const fleetSpace = customerSpacesResponse.spaces.spaces.find(
					(space: SpacesSpacesInterface) =>
						space.spaceName === process.env.REACT_APP_SPACE_NAME,
				);

				dispatch.auth.setCustomerSpace(customerSpacesResponse.spaces);

				customCredentials = {
					password,
					customerKey: fleetSpace?.customerKey,
					...customCredentials,
				};

				const loginResponse: LoginAndUserInfoByTokenResponseInterface = await login(
					customCredentials,
				);

				if (loginResponse?.users?.success) {
					const getUserInfoByTokenResponse: LoginAndUserInfoByTokenResponseInterface =
						await getUserInfoByToken();

					if (getUserInfoByTokenResponse?.users?.success) {
						dispatch.auth.getToken(loginResponse?.users?.authToken);
						let newCredentials = {
							authtoken: loginResponse?.users?.authToken,
							id: getUserInfoByTokenResponse?.users?.user?.id,
							spacekey: getUserInfoByTokenResponse?.users?.user?.spaceKey,
						};

						const getProfileUserDetailsResponse = await getProfileUserDetails(
							newCredentials,
						);

						if (getProfileUserDetailsResponse?.users?.success) {
							dispatch.auth.setUser(getProfileUserDetailsResponse?.users);

							const customProperties = JSON.parse(
								getUserInfoByTokenResponse?.users?.user?.customproperties || '{}',
							);
							const fleetId =
								customProperties?.find(
									(prop: any) => prop?.key?.toUpperCase() === 'FLEET_ID',
								)?.value || 'All Fleets';

							const organisationId =
								customProperties?.find(
									(prop: any) => prop?.key === 'Organisation_id',
								)?.value || '1';

							const fleetName =
								customProperties?.find(
									(prop: any) => prop?.key?.toUpperCase() === 'FLEET_NAME',
								)?.value || 'All Fleets';

							const role =
								customProperties?.find(
									(prop: any) => prop?.key?.toUpperCase() === 'ROLE',
								)?.value || '';

							const vin =
								customProperties?.find(
									(prop: any) => prop?.key?.toUpperCase() === 'VIN',
								)?.value || 'All Vins';

							this.setCustomProperties({
								role,
								vin,
								fleetId,
								fleetName,
								organisationId,
							});

							dispatch.vehicles.getEndPointUrlAsync().then((endPointUrlRes) => {
								if (endPointUrlRes?.success) {
									dispatch.auth
										.getLanguageAndTimezoneAsync()
										.then((settingsRes) => {
											if (settingsRes[0].language.includes('EN-US')) {
												dispatch.appStore.changeDir('ltr');
												i18n.changeLanguage('en-US');
											}
											if (settingsRes[0].language.includes('FR')) {
												dispatch.appStore.changeDir('ltr');
												i18n.changeLanguage('fr-FR');
											}
											if (settingsRes[0].language.includes('AR')) {
												dispatch.appStore.changeDir('rtl');
												i18n.changeLanguage('ar-AR');
											}
											if (settingsRes[0].timezone) {
												this.setTimeZone(settingsRes[0].timezone);
											}
										});

									dispatch.auth.getPermissionsAsync(
										getUserInfoByTokenResponse?.users?.user?.id,
									);
								}
							});
						} else {
							dispatch.auth.responseStatus(getProfileUserDetailsResponse?.users);
						}
					} else {
						dispatch.auth.responseStatus(getUserInfoByTokenResponse?.users);
					}
				} else {
					dispatch.auth.responseStatus(loginResponse?.users);
				}
			} else {
				dispatch.auth.responseStatus(customerSpacesResponse?.spaces);
			}
		},
		async getProfileUserDetailsAsync(_: void, rootState) {
			const { spaceKey } = rootState.auth.user.user;
			const getProfileUserDetailsResponse = await getProfileUserDetails({
				spacekey: spaceKey,
			});
			if (getProfileUserDetailsResponse?.users?.success) {
				dispatch.auth.setUser(getProfileUserDetailsResponse?.users);
			} else {
				dispatch.auth.responseStatus(getProfileUserDetailsResponse?.users);
			}
		},
		async updateUser(payload) {
			const updateUserResponse = await dataIngestion(payload);
			if (updateUserResponse?.success) {
				dispatch.auth.getProfileUserDetailsAsync();
			} else {
				return false;
			}
		},
		async updateProfileAsync(credentials) {
			const { id, role, createdEmail, userName } = credentials;
			const payloadUpdateUser = {
				fm_user_id: Number(createdEmail),
				user_id: id,
				user_name: userName,
				role: role,
				action: 'update user',
			};
			const updateProfileResponse = await updateProfile(credentials);

			if (updateProfileResponse?.users?.success) {
				dispatch.auth.updateUser(payloadUpdateUser);
			}
			return updateProfileResponse;
		},
		async changePasswordAsync(credentials) {
			const { changePasswordPayload } = credentials;
			const changePasswordResponse = await changePassword(changePasswordPayload);
			if (
				changePasswordResponse?.users?.success &&
				changePasswordResponse?.users?.message === 'Updated new password successfully!'
			) {
				return changePasswordResponse?.users;
			} else {
				dispatch.auth.responseStatus(changePasswordResponse?.users);
				return changePasswordResponse?.users;
			}
		},
		async GetValiditOfTokenAsync() {
			const getUserInfoByTokenResponse: LoginAndUserInfoByTokenResponseInterface =
				await getUserInfoByToken();
			if (!getUserInfoByTokenResponse.users.user) {
				return false;
			} else {
				return true;
			}
		},
		async getLanguageAndTimezoneAsync(_: void, rootState: any) {
			const { id } = rootState.auth.user.user;
			const payload = generateRestAPI([{ userid: id }], process.env.REACT_APP_LANGUAGE);

			const getLanguageAndTimezoneResponse: any = await getData(
				payload,
				"user's language and timezone",
				true,
			);

			if (getLanguageAndTimezoneResponse.length > 0) {
				return getLanguageAndTimezoneResponse;
			} else {
				return [{ language: 'EN-US', timezone: '(UTC) Edinburgh, London' }];
			}
		},

		async UpdateUserLanguageAsync(preferred_language: string, rootState) {
			const {
				user: {
					user: { id },
				},
			} = rootState.auth;
			if (preferred_language === 'FR-FR') {
				const payload = {
					user_id: id,
					language: 'Frensh',
					language_code: 'FR',
					action: 'Update language',
				};
				const handleChangeLanguageUser = await dataIngestion(payload);
				if (handleChangeLanguageUser.success) {
					return true;
				} else {
					return false;
				}
			}
			if (preferred_language === 'EN-US') {
				const payload = {
					user_id: id,
					language: 'English',
					language_code: 'EN-US',
					action: 'Update language',
				};
				const handleChangeLanguageUser = await dataIngestion(payload);
				if (handleChangeLanguageUser.success) {
					return true;
				} else {
					return false;
				}
			}
			if (preferred_language === 'AR-AR') {
				const payload = {
					user_id: id,
					language: 'Arabic',
					language_code: 'AR',
					action: 'Update language',
				};
				const handleChangeLanguageUser = await dataIngestion(payload);
				if (handleChangeLanguageUser.success) {
					return true;
				} else {
					return false;
				}
			}
			if (preferred_language === 'HN-HN') {
				const payload = {
					user_id: id,
					language: 'Hindi',
					language_code: 'hn-HN',
					action: 'Update language',
				};
				const handleChangeLanguageUser = await dataIngestion(payload);
				if (handleChangeLanguageUser.success) {
					return true;
				} else {
					return false;
				}
			}
		},
		async updateTimeZone(selectedTimezone: string, rootState) {
			const {
				user: {
					user: { id },
				},
			} = rootState.auth;
			const timezoneDetails = timezones.find(
				(timezone) => timezone.text === selectedTimezone,
			);
			const payload = {
				user_id: id,
				value: timezoneDetails?.value,
				text: selectedTimezone,
				utc: timezoneDetails?.utc,
				action: 'Update timezone',
			};
			const updateTimeZoneResponse = await dataIngestion(payload);
			if (updateTimeZoneResponse.success) {
				this.setTimeZone(selectedTimezone);
				return true;
			} else {
				return false;
			}
		},
		async getPermissionsAsync(user_id, rootState) {
			const { id } = rootState.auth.user.user;
			const payload = generateRestAPI([{ user_id }], process.env.REACT_APP_PERMISSIONS);

			const getPermissionsForRolesResponse: any = await getData(payload, 'permissions', true);
			if (getPermissionsForRolesResponse.length > 0) {
				this.setPermissions(
					getPermissionsForRolesResponse[0]?.permissions_category,
					id === user_id,
				);
			}
			return getPermissionsForRolesResponse[0]?.permissions_category;
		},
		async updateJoyrideRun(stateRun: boolean) {
			this.setJoyrideState(stateRun);
		},
	}),
});
