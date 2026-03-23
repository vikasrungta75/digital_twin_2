// import { createModel } from '@rematch/core';
// import type { RootModel } from '.';
// import { generateRestAPI } from '../helpers/helpers';
// import { dataIngestion, getData } from '../services/commonService';
// import { IScheduledReports } from '../type/reports-types';

// const initialValue = {
// 	scheduledReports: [] as IScheduledReports[],
// };

// export const reports = createModel<RootModel>()({
// 	state: { ...initialValue },
// 	reducers: {
// 		setScheduledReports(state, res) {
// 			return {
// 				...state,
// 				scheduledReports: res,
// 			};
// 		},
// 	},

// 	effects: (dispatch) => ({
// 		async getScheduledReportsAsync(_, rootState) {
// 			const {
// 				user: {
// 					user: { id },
// 				},
// 			} = rootState.auth;

// 			const payload = generateRestAPI(
// 				[{ user_id: id },
// 				{ organisation_id: [2] },
// 				],
// 				process.env.REACT_APP_SCHEDULED_REPORTS,
// 			);
// 			const getScheduledReportsResponse: any[] = await getData(
// 				payload,
// 				'scheduled reports',
// 				true,
// 			);
// 			if (
// 				Array.isArray(getScheduledReportsResponse) &&
// 				getScheduledReportsResponse.length > 0
// 			) {
// 				this.setScheduledReports(getScheduledReportsResponse);
// 			} else {
// 				this.setScheduledReports([]);
// 			}
// 			return getScheduledReportsResponse;
// 		},
// 		async scheduledReportEdition(payload: any) {
// 			const ScheduledReportEditionResponse = await dataIngestion(payload);
// 			if (ScheduledReportEditionResponse.success) {
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		},
// 		async deleteScheduledReport(payload) {
// 			const deleteScheduledReportResponse = await dataIngestion(payload);
// 			if (deleteScheduledReportResponse?.success) {
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		},
// 	}),
// });





//
import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import { IScheduledReports } from '../type/reports-types';

const initialValue = {
  scheduledReports: [] as IScheduledReports[],
};

export const reports = createModel<RootModel>()({
  state: { ...initialValue },
  reducers: {
    setScheduledReports(state, res) {
      return {
        ...state,
        scheduledReports: res,
      };
    },
  },

  effects: (dispatch) => ({
    async getScheduledReportsAsync(_, rootState) {
      const {
        user: {
          user: { id },
        },
        customProperties,
      } = rootState.auth;

      // const organisationIdParsed = /^\d+$/.test(customProperties.organisationId)
      //   ? [customProperties.organisationId]
      //   : [2]; 

      const organisationIdParsed = /^\d+$/.test(customProperties.organisationId)
      ? [customProperties.organisationId] 
      : customProperties.organisationId
        ? customProperties.organisationId.split(",").map(Number) 
        : [2]; 
   
      const payload = generateRestAPI(
        [
          { user_id: id },
          { organisation_id: organisationIdParsed },
        ],
        process.env.REACT_APP_SCHEDULED_REPORTS,
      );

      const getScheduledReportsResponse: any[] = await getData(
        payload,
        'scheduled reports',
        true,
      );

      if (
        Array.isArray(getScheduledReportsResponse) &&
        getScheduledReportsResponse.length > 0
      ) {
        this.setScheduledReports(getScheduledReportsResponse);
      } else {
        this.setScheduledReports([]);
      }
      return getScheduledReportsResponse;
    },

    async scheduledReportEdition(payload: any) {
      const ScheduledReportEditionResponse = await dataIngestion(payload);
      return ScheduledReportEditionResponse.success || false;
    },

    async deleteScheduledReport(payload) {
      const deleteScheduledReportResponse = await dataIngestion(payload);
      return deleteScheduledReportResponse?.success || false;
    },
  }),
});
