import { createModel } from '@rematch/core';
import { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';

const initialValue = {};

export const tickets = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {},
	effects: (dispatch) => ({
		async getTicketsAsync(payload, rootState) {
			const {
				user: {
					user: { id },
				},
			} = rootState.auth;			
			const payloadGetTickets = generateRestAPI([{ user_id: id }], process.env.REACT_APP_ALL_TICKETS)
			const getAllTicketsResponse = await getData(payloadGetTickets, 'list of tickets');
			return getAllTicketsResponse;
		},
		async addTicket(payload, rootState) {
			const {
				user: {
					user: { id, emailID, userName },
				},
			} = rootState.auth;
			
			const payloadAddTicket = {
				...payload,
				user_id: id,
				user_email: emailID,
				user_name: userName,
				fleet_id: rootState.auth.customProperties.fleetId,
			};
			const addTicketResponse = await dataIngestion(payloadAddTicket);
			if (addTicketResponse.success) {
				return true;
			} else {
				return false;
			}
		},

		async updateTicket(payload, rootState) {
			const payloadUpdateTicket = {
				...payload,
				action: 'Update ticket',
			};
			const updateTicketResponse = await dataIngestion(payloadUpdateTicket);
			if (updateTicketResponse.success) {
				return true;
			} else {
				return false;
			}
		},

		async deleteTicket(payload) {
			const payloadDeleteTicket = {
				...payload,
				action: 'delete ticket',
			};
			const deleteTicketResponse = await dataIngestion(payloadDeleteTicket);
			if (deleteTicketResponse.success) {
				return true;
			} else {
				return false;
			}
		},
	}),
});
