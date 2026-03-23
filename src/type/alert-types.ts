export interface IAlarmsList {
	vin: string;
	alarm: string;
}

export interface IAlarmType {
	_id: 'string';
}

export interface IAlarmDetail {
	vin: string;
	location: string;
	model: string;
	fuel_type: string;
	time: string;
	start_time: string;
	end_time: string;
	alarm_detail: string;
}

export interface IAlarmsTotalCountProps {
	total_alarm_count: any;
	isLoadingTotalAlarmCount: boolean;
}

export interface IAlarmsListDataTableProps {
	alarmsDetailData: IAlarmDetail[];
}

export interface IAlarmTripDetail {
	alarmTripDetail: IAlarmTrip[];
}

export interface IAlarmTrip {
	distance: string;
	fuel_consumed: string;
	duration: string;
	start_time: string;
	end_time: string;
	startlocation: string;
	endlocation: string;
}

export interface IAlarmTripRoadDetail {
	alarmTripRoadDetail: IAlarmRoadTrip;
}

export interface IAlarmRoadTrip {
	index: string;
	latitude: string;
	longitude: string;
	time: string;
}

export const InitialDataOverview = {
	distance: '',
	fuel_consumed: '',
	duration: '',
	start_time: '',
	end_time: '',
	startlocation: '',
	endlocation: '',
};

export interface OverViewDataType {
	key: string;
	value: string;
}

export interface IAlarmSettings {
	sign: string;
	value: string;
	alarm: string;
	notify_me: boolean | string;
	notify_sms: boolean | string;
	notify_email: boolean | string;
	notify_web_push: boolean | string;
	users: [
		{
			groupname: string;
			user_email: string;
			notify_sms: boolean | string;
			notify_email: boolean | string;
			web_push_user: boolean | string;
		},
	];
	user_id: string;
	user_email: string;
	user_name: string;
	alarm_id: string;
	enabled: boolean;
	group_name: string;
	duration_type: string;
	duration_value: string;
	duration_unit: string;
	end_value: string;
}
export interface PgetAlarmOperands {
	alarm_type: string;
}
export interface IAlarmEmails {
	email: string;
}
export interface IOperands {
	operands: string;
}
export interface IMetrics {
	alarm_name: string;
}

export interface ISelectOptions {
	operands: IOperands[];
}

export interface IReportDTC {
	dtc_code: string;
	dtc_description: string;
	recurrence: string;
	reporting_date: string;
	vin: string;
}
