import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { dataIngestion, getData } from '../services/commonService';
import { addVehicule } from '../services/fleeetsService';
import { generateRestAPI } from './../helpers/helpers';

export const fleets = createModel<RootModel>()({
	state: {
		success: false,
		message: '',
		errorCheck: '',
	},
	reducers: {
		addVehicule(state, res) {
			return {
				...state,
				success: res.success,
				message: res.message,
				errorCheck: res.errorCheck,
			};
		},
	},
	effects: (dispatch) => ({
		async getFleetNameAsync(_: void) {
			const payloadFleetName = generateRestAPI([], process.env.REACT_APP_FLEETNAMES);
			const response: any[] = await getData(payloadFleetName, 'fleet names');
			return response;
		},

		async getManufacturerAsync(payload) {
			const payloadManufacturer = generateRestAPI(
				[{ fleet_name: payload }],
				process.env.REACT_APP_MANUFACTURE,
			);
			const response = await getData(payloadManufacturer, 'manfacturers');
			return response;
		},
		async getMakeAsync(payload) {
			const payloadMake = generateRestAPI(
				[{ manufacturer: payload.manufacturer }],
				process.env.REACT_APP_MAKE,
			);
			const response = await getData(payloadMake, 'makes');
			return response;
		},
		async getModelAsync(payload) {
			const payloadModel = generateRestAPI(
				[{ manufacturer: payload.manufacturer, make: payload.make }],
				process.env.REACT_APP_MODEL,
			);
			const response = await getData(payloadModel, 'models');
			return response;
		},

		async getImeilAsync(payload) {
			const payloadImei = generateRestAPI(
				[{ fleet_name: payload }],
				process.env.REACT_APP_IMEI,
			);
			const response = await getData(payloadImei, 'IMEI');
			return response;
		},

		async getMobileNoAsync(payload) {
			const payloadMobileNo = generateRestAPI(
				[{ imei: payload.device_imei }],
				process.env.REACT_APP_MOBILENO,
			);
			const response = await getData(payloadMobileNo, 'mobile no');
			return response;
		},

		async getIdAsync(payload) {
			const payloadVehicleId = generateRestAPI(
				[{ manufacturer: payload.manufacturer, make: payload.make }],
				process.env.REACT_APP_VEHICLEID,
			);
			const response = await getData(payloadVehicleId, "vehicle's id");
			return response;
		},
		async addVehiculeAsync(payload) {
			const response = await addVehicule(payload);

			this.addVehicule({
				success: response?.success,
				message: response?.message,
				errorCheck: response?.errorCheck,
			});
			return response;
		},

		async deleteVehiculeAsync(payload) {
			const deleteVehiculeResponse = await dataIngestion(payload);
			if (deleteVehiculeResponse.success) {
				return true;
			} else return false;
		},
	}),
});
