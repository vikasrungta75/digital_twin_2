import { createModel } from '@rematch/core';
import { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { getData } from '../services/commonService';

const initialValue = {
	roles: [],
};

export const roles = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setRoles(state, res) {
			return {
				...state,
				roles: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
	},

	effects: () => ({
		async getRolesAsync(_: void, rootState) {
			const credentials = generateRestAPI([], process.env.REACT_APP_ROLES)

			const getRolesResponse = await getData(credentials, 'roles', true);

			if (Array.isArray(getRolesResponse)) {
				this.setRoles(getRolesResponse);
			} else {
				this.setRoles([]);
			}
			return getRolesResponse;
		},
	}),
});
