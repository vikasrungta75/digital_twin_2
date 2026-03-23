export const initialValue = {
	settingsNotificationsList: [
		{
			alarm: '',
			alarm_id: '',
			driver_email: '',
			email: '',
			enabled: false,
			frequency: '',
			group: '',
			notify_driver: false,
			notify_user: false,
			other_emails: '',
			time_picker: '',
		},
	],
	notificationsList: [
		{
			vin: '',
			alarm: '',
			alarm_type: '',
			group: '',
			location: '',
			time: '',
			user_email: '',
			user_name: '',
			notification_id: '',
			read: false,
		},
	],
	notificationsCount: 0,
};

export interface INotificationSetting {
	alarm: string;
	alarm_id: string;
	driver_email: string;
	email: string;
	enabled: boolean;
	frequency: string;
	group: string;
	notify_driver: boolean;
	notify_user: boolean;
	other_emails: string;
	time_picker: string;
}
export interface INotification {
	vin: string;
	alarm: string;
	alarm_type: string;
	group: string;
	location: string;
	time: string;
	user_email: string;
	user_name: string;
	notification_id: string;
	read: boolean;
}
