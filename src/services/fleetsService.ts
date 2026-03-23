/**
 * fleetsService.ts
 * FIX CODE-02: Renamed from fleeetsService.js (triple-e typo), converted to TypeScript.
 * Update all imports: 'fleeetsService' → 'fleetsService'
 */
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from './commonService';

// ── Response interfaces ───────────────────────────────────────────────────────

export interface VinRegCheckResult {
	vin: string;
	reg_no: string;
}

export interface AddVehicleCheckResult {
	success: boolean;
	message: string;
	errorCheck: '' | 'vinNo' | 'regNo';
}

export interface VehiclePayload {
	vin_no: string;
	reg_no: string;
	[key: string]: unknown;
}

// ── Service functions ─────────────────────────────────────────────────────────

export const addVehicule = async (
	payload: VehiclePayload,
): Promise<AddVehicleCheckResult | undefined> => {
	const payloadVinRegCheck = generateRestAPI(
		[{ vin: payload.vin_no }, { reg_no: payload.reg_no }],
		process.env.REACT_APP_VIN_REG_CHECK,
	);

	const dataCheck: AddVehicleCheckResult = {
		success: true,
		message: '',
		errorCheck: '',
	};

	const checkVingReg: VinRegCheckResult[] = await getData(payloadVinRegCheck, 'vin check');

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
