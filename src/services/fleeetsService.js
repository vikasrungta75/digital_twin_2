
import { generateRestAPI } from '../helpers/helpers';
import {  dataIngestion, getData } from './commonService';

export const addVehicule = async (payload) => {
	const payloadVinRegCheck = generateRestAPI(
		[{ vin: payload.vin_no }, { reg_no: payload.reg_no }],
		process.env.REACT_APP_VIN_REG_CHECK,
	);

	let dataCheck = {
		success: true,
		message: '',
		errorCheck: '',
	};
	const checkVingReg = await getData(payloadVinRegCheck, 'vin check');
	if (checkVingReg.length) {
		if (checkVingReg[0].vin !== '0') {
			dataCheck.success = false;
			dataCheck.message = checkVingReg[0].vin;
			dataCheck.errorCheck = 'vinNo';
			return dataCheck;
		} else if (checkVingReg[0].reg_no !== '0') {
			dataCheck.success = false;
			dataCheck.message = checkVingReg[0].reg_no;
			dataCheck.errorCheck = 'regNo';
			return dataCheck;
		} else {
			await dataIngestion(payload);
		}
	} else {
		await dataIngestion(payload);
	}
};
