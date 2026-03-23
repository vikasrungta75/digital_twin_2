import { createModel } from '@rematch/core';
import type { RootModel } from '.';
export interface IPayloadFilter {
	fleet: string | null;
	alarmType: string | null;
	startDate: string | null;
	endDate: string | null;
	vin: string | null;
	reg: string|null;
	startTime: string | null;
	endTime: string | null;
}
interface IFilters {
	filterPayload: IPayloadFilter;
}

const initialValue: IFilters = {
	filterPayload: {
		fleet: null,
		alarmType: null,
		startDate: null,
		endDate: null,
		vin: null,
		reg: null,
		startTime: null,
		endTime: null,
	},
};
export const filters = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setFilters(state, res) {
			return {
				...state,
				filterPayload: res,
			};
		},

		cleanFilters(state) {
			return {
				...state,
				filterPayload: {
					fleet: null,
					vin: null,
					reg: null,
					alarmType: null,
					startDate: null,
					endDate: null,
					startTime: null,
					endTime: null,
				},
			};
		},
	},
	effects: (dispatch) => ({
		filtersStore(payload: any) {
			this.setFilters(payload);
		},
	}),
});
