import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import {
	IAlarmDetail,
	IAlarmTripDetail,
	IAlarmType,
	InitialDataOverview,
	PgetAlarmOperands,
} from '../type/alert-types';
const initialValue = {
	listAlarms: [],
	alarmDetail: [],
	alarmType: [],
	alarmTypeForAlert: [],
	alarmDetailTrip: [InitialDataOverview],
	alarmRoadTrip: [],
	totalCountOfAlarms: [{ total_alarm_count: '', _id: '' }],
	totalOfEachAlarms: [{ alarms: '', count: '' }],
};

export const alertsNotifications = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setListAlarms(state, res) {
			return {
				...state,
				listAlarms: res,
			};
		},
		setAlarmTypeForAlert(state, res) {
			return {
				...state,
				alarmTypeForAlert: res,
			};
		},

		setAlarmType(state, res) {
			return {
				...state,
				alarmType: res,
			};
		},
		setAlarmDetail(state, res) {
			return { ...state, alarmDetail: res };
		},
		setTotalCountAlarm(state, res) {
			return {
				...state,
				totalCountOfAlarms: res,
			};
		},
		setTotalOfEachAlarm(state, res) {
			return {
				...state,
				totalOfEachAlarms: res,
			};
		},

		setAlarmTripDetail(state, res) {
			return {
				...state,
				alarmDetailTrip: res,
			};
		},
		setAlarmTripRoadDetail(state, res) {
			return {
				...state,
				alarmRoadTrip: res,
			};
		},
	},
	effects: (dispatch) => ({
		async getListOfAlarms(payload: any) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { fleet_name, vin, alarm_type, startdate, enddate } = payload;

			const payloadStatic = generateRestAPI(
				[
					{ fleet_name },
					{ vin },
					{ alarm_type },
					{ startdate },
					{ enddate },
					{ fleet_id: fleet_name },
				],
				process.env.REACT_APP_LIST_NOTIFICATIONS,
			);

			const getListOfAlarmsResponse = await getData(payloadStatic, 'get list of alarms');
			if (getListOfAlarmsResponse) {
				this.setListAlarms(getListOfAlarmsResponse);
			} else {
				this.setListAlarms([]);
			}
		},

		async deleteAlarm(payload) {
			const deleteAlarmResponse = await dataIngestion(payload);
			if (deleteAlarmResponse?.success) {
				return true;
			} else {
				return false;
			}
		},

		async getTotalCountOfAlarms(payload: any) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { vin, startdate, enddate, alarm_type } = payload;

			const payloadStatic = generateRestAPI(
				[{ vin }, { startdate }, { alarm_type }, { enddate }],
				process.env.REACT_APP_ALL_COUNT_NOTIFICATIONS,
			);

			const getTotalCountOfAlarms = await getData(payloadStatic, 'total count of alarms');
			if (getTotalCountOfAlarms) {
				this.setTotalCountAlarm(getTotalCountOfAlarms);
			} else {
				this.setTotalCountAlarm([]);
			}
		},

		async getTotalCountOfEachAlarm(payload: any) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { vin, startdate, enddate, alarm_type } = payload;

			const payloadStatic = generateRestAPI(
				[{ vin }, { startdate }, { alarm_type }, { enddate }],
				process.env.REACT_APP_EACH_COUNT_NOTIFICATIONS,
			);

			const getTotalCountOfEachAlarmsResponse = await getData(
				payloadStatic,
				'count of each alarms',
			);
			if (getTotalCountOfEachAlarmsResponse) {
				this.setTotalOfEachAlarm(getTotalCountOfEachAlarmsResponse);
			} else {
				this.setTotalOfEachAlarm([]);
			}
		},

		async getAlarmType() {
			const payloadAlarmType = generateRestAPI([], process.env.REACT_APP_ALARM_TYPE);

			const getAlarmTypeResponse: IAlarmType[] = await getData(
				payloadAlarmType,
				'get type of alarm',
				true,
			);
			if (getAlarmTypeResponse) {
				this.setAlarmType(getAlarmTypeResponse);
			} else {
				this.setAlarmType([]);
			}
		},
		// async getAlarmTypeForAlert() {
		// 	const payloadAlarmType = generateRestAPI([], process.env.REACT_APP_ALARM_TYPE_ALERT);

		// 	const getAlarmTypeResponse: IAlarmType[] = await getData(
		// 		payloadAlarmType,
		// 		'get type of alarm',
		// 		true
		// 		);
		// 	if (getAlarmTypeResponse) {
		// 		this.setAlarmTypeForAlert(getAlarmTypeResponse);
		// 	} else {
		// 		this.setAlarmTypeForAlert([]);
		// 	}
		// },

		async getAlarmTypeDetails(payload: any) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			// 			const {  fleet_name,vin, startdate, enddate, alarm_type } = payload;

			// 			const payloadAlarmDetail = generateRestAPI(
			// 				[ { vin }, { startdate }, { alarm_type }, { enddate }],
			// 				process.env.REACT_APP_ALARM_DETAIL,
			// 			);

			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { vin, alarm_type } = payload;

			// Compute last 5 days range
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(endDate.getDate() - 5);

			// ✅ Format dates for API (no 'Z', no milliseconds)
			const formatDate = (d: Date) => d.toISOString().split('.')[0];

			const startdateStr = formatDate(startDate);
			const enddateStr = formatDate(endDate);

			// ✅ Correct order and no encoding
			const payloadAlarmDetail = generateRestAPI(
				[
					{ startdate: startdateStr },
					{ enddate: enddateStr },
					{ fleet_id: 'All Fleets' },
					{ vin },
					{ alarm_type },
					{ organisation_id: '1,2' },
				],
				process.env.REACT_APP_ALARM_DETAIL,
			);

			const getAlarmTypeResponse: IAlarmDetail[] = await getData(
				payloadAlarmDetail,
				'get detail of alarm',
			);
			if (getAlarmTypeResponse) {
				this.setAlarmDetail(getAlarmTypeResponse);
			} else {
				this.setAlarmDetail([]);
			}
		},
		async getAlarmTripDetail(payload: any) {
			const { vin, datetime } = payload;

			const payloadAlarmTripDetail = generateRestAPI(
				[{ vin }, { datetime }],
				process.env.REACT_APP_ALARM_TRIP_DETAIL,
			);

			const getAlarmTripDetailResponse: IAlarmTripDetail[] = await getData(
				payloadAlarmTripDetail,
				'get detail of trip',
			);

			if (getAlarmTripDetailResponse) {
				this.setAlarmTripDetail(getAlarmTripDetailResponse);
			} else {
				this.setAlarmTripDetail([]);
			}
		},
		async getAlarmTripRoadDetail(payload: any) {
			const { vin, datetime } = payload;

			const payloadAlarmTripDetail = generateRestAPI(
				[{ vin }, { datetime }],
				process.env.REACT_APP_ALARM_TRIP_ROUTE,
			);

			const getAlarmTripRoadDetailResponse: IAlarmTripDetail[] = await getData(
				payloadAlarmTripDetail,
				'get detail of trip',
			);

			if (getAlarmTripRoadDetailResponse) {
				this.setAlarmTripRoadDetail(getAlarmTripRoadDetailResponse);
			} else {
				this.setAlarmTripRoadDetail([]);
			}
		},
		async getAlarmOperands(payload: PgetAlarmOperands) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { alarm_type } = payload;
			const payloadAlarmOperands = generateRestAPI(
				[{ alarm_type }],
				process.env.REACT_APP_ALARM_OPERANDS,
			);

			const getAlarmOperandsResponse = await getData(payloadAlarmOperands, 'alarm operands');
			return getAlarmOperandsResponse;
		},
		async getListNameAlarms(_: void) {
			const payloadListNameAlarm = generateRestAPI([], process.env.REACT_APP_ALARM_NAME_LIST);

			const getListNameAlarmsResponse = await getData(
				payloadListNameAlarm,
				"alarms' name list",
			);
			return getListNameAlarmsResponse;
		},
		async getAlarmsSettings(_: void, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;

			const payloadListAlarmSettings = generateRestAPI(
				[{ user_id: id }, { fleet_name: customProperties.fleetName }],
				process.env.REACT_APP_ALARM_SETTINGS_LIST,
			);

			const getListSettingsResponse = await getData(
				payloadListAlarmSettings,
				"alarms Settings' name list",
				true,
			);
			return getListSettingsResponse;
		},
		async getAlarmEmails(payload: { alarm: string }, rootState) {
			const { alarm } = payload;

			const payloadListAlarmEmails = generateRestAPI(
				[{ fleet_id: rootState.auth.customProperties.fleetId }, { alarm }],
				process.env.REACT_APP_ALARM_EMAILS_API,
			);

			const getAlarmEmailsResponse = await getData(payloadListAlarmEmails, 'emails');
			return getAlarmEmailsResponse;
		},
		async addAlarm(payload, rootState) {
			const {
				user: {
					user: { id, emailID, userName },
				},
				customProperties,
			} = rootState.auth;

			const payloadAlert = {
				...payload,
				user_id: id,
				user_email: emailID,
				user_name: userName,
				fleet_id: customProperties.fleetId,
				group_name: customProperties.fleetName,
				role: customProperties.role,
			};
			const addAlarmResponse = await dataIngestion(payloadAlert);
			if (addAlarmResponse.success) {
				this.getAlarmsSettings();
				return true;
			} else {
				return false;
			}
		},
		async reportDTC(payload: any) {
			const { startdate, enddate, fleetName } = payload;

			const payloadDTCReport = generateRestAPI(
				[{ startdate }, { enddate }, { fleet_name: fleetName }],
				process.env.REACT_APP_DTC_REPORT,
			);

			const getDTCreport = await getData(payloadDTCReport, 'getDTCreport');
			if (getDTCreport) {
				return getDTCreport;
			} else {
				return [];
			}
		},
	}),
});
