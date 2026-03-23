import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI, getDefaultFleetFilter } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import { IGeofence, IPayloadEditingGeofence } from '../type/geofences-type';

const initialValue = {
	geofences: [],
	geofence: {} as any,
};

export const geofences = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setGeofences(state, res) {
			return {
				...state,
				geofences: res,
			};
		},
		setGeofence(state, res) {
			return {
				...state,
				geofence: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
	},

	effects: (dispatch) => ({
		async getGeofencesAsync(payload, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;

			const credentials = generateRestAPI(
				[
					{ fleet_id: customProperties.fleetId },
					{ user_id: id },
					{ vin: payload?.vin || 'All Vins' },
				],
				process.env.REACT_APP_ALARM_GEOFENCE,
			);

			const getGeofencesResponse: IGeofence[] = await getData(credentials, 'geofences');

			if (Array.isArray(getGeofencesResponse)) {
				if (!payload?.vin) {
					this.setGeofences(getGeofencesResponse);
				} else {
					const selectedGeofence = getGeofencesResponse.find(
						(el) => el.geofence_id === payload.id,
					);
					this.setGeofence(selectedGeofence);
				}
			} else {
				this.setGeofences([]);
				this.setGeofence({});
			}
			return getGeofencesResponse;
		},
		async addGeofence(payload: IPayloadEditingGeofence, rootState) {
			const {
				user: {
					user: { id, emailID, userName },
				},
				customProperties,
			} = rootState.auth;
	const orgArray = customProperties.organisationId
	? customProperties.organisationId.split(",").map(Number)
	: [];

			const payloadGeofence = {
				...payload,
				user_id: id,
				user_email: emailID,
				user_name: userName,
				fleet_id: customProperties.fleetId,
				role: customProperties.role,
				organisation_id:orgArray
			};

			

			const addGeofenceResponse = await dataIngestion(payloadGeofence);
			if (addGeofenceResponse.success) {
				return true;
			} else {
				return false;
			}
		},
		async deleteGeofenceAsync(
			payload: { vin: string; geofenceId: string; gtype: string },
			rootState,
		) {
			const { vin, geofenceId, gtype } = payload;
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;

			const credentials = {
				vin,
				geofence_id: geofenceId,
				fleet_id: customProperties.fleetId,
				user_id: id,
				user_email: emailID,
				user_name: fullName,
				gtype,
				action: 'Delete geofence',
			};

			const deleteGeofenceResponse = await dataIngestion(credentials);
			if (deleteGeofenceResponse.success) {
				return true;
			} else {
				return false;
			}
		},
		async HandleAddgeofencePointOfInterest(payload: any, rootState) {
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;
			const payloadAddPointInterest = {
				action: payload[0].action,
				fleet_name: getDefaultFleetFilter(),
				role: customProperties.role,
				user_email: emailID,
				user_id: id,
				user_name: fullName,
				fleet_id: customProperties.fleetId,
				poi: payload,
				poi_id: payload[0].poi_id,
			};

			

			const addGeofencePointOfInterest = await dataIngestion(payloadAddPointInterest);
			if (addGeofencePointOfInterest.success) {
				return true;
			} else {
				return false;
			}
		},
		async handleDeleteGeofencePointOfInterest(payload: any, rootState) {
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;

		
			const payloadDeletePointInterest = {
				action: payload.action,
				fleet_name: getDefaultFleetFilter(),
				role: customProperties.role,
				user_email: emailID,
				user_id: id,
				user_name: fullName,
				fleet_id: customProperties.fleetId,
				poi_id: payload.poi_id,
			};

			const addGeofencePointOfInterest = await dataIngestion(payloadDeletePointInterest);
			if (addGeofencePointOfInterest.success) {
				return true;
			} else {
				return false;
			}
		},
	}),
});
