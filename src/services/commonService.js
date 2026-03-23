
import showNotification from '../components/extras/showNotification';
import { convertXmlToJson } from '../helpers/helpers';
import { store } from '../store/store';
import qs from 'qs';
import { API_GET_VEHICLES } from './api_endpoint';
import { http, httpJson, httpRest, httpwithtoken } from './http';

export const configHeaders = (auth) => {
	const user = store.getState().auth.user;

	let config = {
		headers: {
			authtoken: `${localStorage.getItem('token')}`,
			spacekey: auth?.spacekey,
			userid: auth?.id,
		},
	};

	if (!auth?.id) {
		const {
			user: { spaceKey, id },
		} = user;

		config = {
			headers: {
				authtoken: `${localStorage.getItem('token')}`,
				spacekey: spaceKey,
				userid: id,
			},
		};
	}
	return config;
};

export const configHeadersIngestion = () => {
	let config = {
		headers: {
			IngestionId: process.env.REACT_APP_INGESTIONID,
			IngestionSecret: process.env.REACT_APP_INGESTIONSECRET,
		},
	};
	return config;
};

export const configHeadersApiRest = () => {
	const config = {
		headers: {
			clientid: process.env.REACT_APP_CLIENT_ID,
			clientsecret: process.env.REACT_APP_CLIENT_SECRET,
			appname: process.env.REACT_APP_APP_NAME,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};

	return config;
};

export const getUrlEndPoint = async (payload) => {
	try {
		let response = await httpwithtoken.post(
			API_GET_VEHICLES.GET_URL_END_POINT,
			qs.stringify(payload),
			configHeaders(),
		);
		return response;
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			showNotification(
				'Server Error',
				error.response?.data?.Error ||
				'Oups! Something went wrong while fetching URL End Point. Please try again.',
				'danger',
			);
		}
	}
};

export const getRecords = async (payload, type) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(payload)) params.append(key, value);
	try {
		let { data } = await http.post(API_GET_VEHICLES.GET_RECORDS, params, configHeaders());
		return convertXmlToJson(data);
	} catch (error) {
		console.error(error);
		if (error?.response?.status !== 304) {
			showNotification(
				'Server Error',
				error.response?.data?.Error ||
				`Oups! Something went wrong while fetching ${type}. Please try again.`,
				'danger',
			);
		}
	}
};

export const getData = async (payload, type, emptyQuery = false) => {
	const { customProperties } = store.getState().auth;
	try {
		let url = `${payload}`;
		if (!payload.includes('vin=')) {
			const indexInterrogation = payload.indexOf('?');
			url += `${indexInterrogation !== -1 && indexInterrogation < payload.length - 1 ? '&' : ''
				}vin=${customProperties.vin}`;
		}
		if (!payload.includes('fleet_id=')) {
			url += `&fleet_id=${customProperties.fleetId}`;
		}
		if (!payload.includes('organisation_id=')) {

			url += `&organisation_id=${customProperties.organisationId || 2}`;
		}

		const { data } = await httpRest.get(emptyQuery ? payload : url, configHeadersApiRest());
		return data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		if (error?.response?.data?.success) {
			return [];
		} else {
			// showNotification(
			// 	'Server Error',
			// 	error.response?.data?.Error ||
			// 		`Oups! Something went wrong while fetching ${type}. Please try again.`,
			// 	'danger',
			// );
		}
	}
};

// export const dataIngestion = async (payload) => {
// 	const ipAddress = store.getState().appStore.ipAddress;
// 	const {
// 		user: {
// 			user: { id, fullName },
// 		},
// 		customProperties,
// 	} = store.getState().auth;

// 	const common = {
// 		fm_user_id: id,
// 		fm_user_name: fullName,
// 		role: customProperties.role,
// 		ip_address: ipAddress,
// 		datetime: new Date(),
// 		fleet_id: customProperties.fleetId,
// 		organisation_id: customProperties.organisationId || 2,
// 	};

// 	try {
// 		let { data } = await httpJson.post(
// 			API_GET_VEHICLES.DATA_INGESTION,
// 			{ ...common, ...payload },
// 			configHeadersIngestion(),
// 		);
// 		return data;
// 	} catch (err) {
// 		console.error('Error in data ingestion: ', err);
// 		if (err?.response?.status !== 304) {
// 			showNotification(
// 				'Server Error',
// 				err.response?.data?.Error ||
// 					'Oups! Something went wrong while using Data Ingestion API. Please try again.',
// 				'danger',
// 			);
// 		}
// 	}
// };


// array of numbers
export const dataIngestion = async (payload) => {
	const ipAddress = store.getState().appStore.ipAddress;
	const {
		user: {
			user: { id, fullName },
		},
		customProperties,
	} = store.getState().auth;

	let organisationId = customProperties.organisationId || 2;
	if (typeof organisationId === "string" && organisationId.includes(",")) {
		organisationId = organisationId.split(",").map((orgId) => Number(orgId.trim()));
	} else if (typeof organisationId === "string") {
		organisationId = [Number(organisationId)];
	} else {
		organisationId = [organisationId];
	}

	const common = {
		fm_user_id: id,
		fm_user_name: fullName,
		role: customProperties.role,
		ip_address: ipAddress,
		datetime: new Date(),
		fleet_id: customProperties.fleetId,
		organisation_id: organisationId,
	};

	try {
		let { data } = await httpJson.post(
			API_GET_VEHICLES.DATA_INGESTION,
			{ ...common, ...payload },
			configHeadersIngestion(),
		);
		return data;
	} catch (err) {
		console.error('Error in data ingestion: ', err);
		if (err?.response?.status !== 304) {
			showNotification(
				'Server Error',
				err.response?.data?.Error ||
				'Oups! Something went wrong while using Data Ingestion API. Please try again.',
				'danger',
			);
		}
	}
};