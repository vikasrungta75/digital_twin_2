import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import { INotification, initialValue } from '../type/notification-type';

export const notifications = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setSettingsNotificationsList(state, res) {
			return {
				...state,
				settingsNotificationsList: res,
			};
		},
		setNotificationsList(state, res) {
			return {
				...state,
				notificationsList: res,
			};
		},
		setNotificationsCount(state, res) {
			return {
				...state,
				notificationsCount: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
	},
	effects: (dispatch) => ({
		async addNotification(payload: any) {
			const addNotificationResponse = await dataIngestion(payload);
			if (addNotificationResponse?.success) {
				return true;
			} else {
				return false;
			}
		},
		async getAllNotificationsForSeetings(_: void, rootState) {
			const {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				user: {
					user: { id },
				},
			} = rootState.auth;
						
			const credentials = generateRestAPI([{ user_id: id }],
				process.env.REACT_APP_NOTIFICATIONS_SETTINGS)

			const getAllNotificationsResponse = await getData(
				credentials,
				'settings notifications',
			);

			if (Array.isArray(getAllNotificationsResponse)) {
				this.setSettingsNotificationsList(getAllNotificationsResponse);
			} else {
				this.setSettingsNotificationsList([]);
			}
			return getAllNotificationsResponse;
		},
		async getAllNotifications(_: void, rootState) {
			const {
				user: {
					user: { id },
				},
			} = rootState.auth;
			const notificationsPayload = generateRestAPI([{ user_id: id }],
				process.env.REACT_APP_NOTIFICATIONS_SETTINGS)
			const modalNotificationResponse = await getData(
				notificationsPayload,
				'notifications',
			);

			if (Array.isArray(modalNotificationResponse)) {
				const unreadNotificationCount = modalNotificationResponse.filter(
					(notif: INotification) => notif.read === false,
				).length;

				this.setNotificationsList(modalNotificationResponse);
				this.setNotificationsCount(unreadNotificationCount);
			} else {
				this.setNotificationsList([]);
				this.setNotificationsCount(0);
			}
			return modalNotificationResponse;
		},

		async updateNotificationsStatus(notificationId: string[]) {
			const payload = {
				notification_id: notificationId,
				read: true,
				action: 'Update notification status',
			};

			const updateNotificationsStatusResponse = await dataIngestion(payload);
			if (updateNotificationsStatusResponse?.success) {
				return true;
			} else {
				return false;
			}
		},
	}),
});
