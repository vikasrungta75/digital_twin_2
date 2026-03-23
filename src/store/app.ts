import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';

const initialValue = {
	dir: 'ltr',
	ipAddress: '',
	superAdminPanelData: [],
};

export const appStore = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setDir(state, res) {
			return {
				...state,
				dir: res,
			};
		},
		setIpAddress(state, res) {
			return {
				...state,
				ipAddress: res,
			};
		},
		setSuperAdminPanelData(state, res) {
			return {
				...state,
				superAdminPanelData: res,
			};
		},
	},

	effects: (dispatch) => ({
		changeDir(payload: string) {
			this.setDir(payload);
		},
		async updateIpAddress(stateRun: string) {
			this.setIpAddress(stateRun);
		},
		async getSuperAdminPanelAsync() {
			const payload = generateRestAPI([], process.env.REACT_APP_DEVICE_MANAGEMENT_INFO);
			const getSuperAdminPanelResponse: any[] = await getData(
				payload,
				'device management info',
			);
			if (
				Array.isArray(getSuperAdminPanelResponse) &&
				getSuperAdminPanelResponse.length > 0
			) {
				this.setSuperAdminPanelData(getSuperAdminPanelResponse);
			} else {
				this.setSuperAdminPanelData([]);
			}
			return getSuperAdminPanelResponse;
		},
		async superAdminPanelEdition(payload:any) {
			const superAdminPanelEditionResponse = await dataIngestion(payload);
			if (superAdminPanelEditionResponse.success) {
				return true;
			} else {
				return false;
			}
		},
		async deleteSuperAdmin(payload) {
			const deleteSuperAdminResponse = await dataIngestion(payload);
			if (deleteSuperAdminResponse?.success) {
				return true;
			} else {
				return false;
			}
		},
	}),
});
