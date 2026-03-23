import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { getAllArticles, getAllCategories, getAllTopics, getTopicDetails } from '../services/help';
import { ITopic, ITopicDetail } from '../type/help-type';

const initialValue = {
	topics: [],
	categories: [] as any,
};

export const help = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setTopics(state, res) {
			return {
				...state,
				topics: res,
			};
		},
		setCategories(state, res) {
			return {
				...state,
				categories: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
	},
	effects: (dispatch) => ({
		async getAllTopicsAsync() {
			const getAllTopicsResponse: ITopic[] = await getAllTopics();
			if (getAllTopicsResponse) {
				this.setTopics(getAllTopicsResponse);
				return getAllTopicsResponse;
			} else {
				this.setTopics([]);
			}
		},
		async getAllCategoriesAsync() {
			const getAllCategoriesResponse: ITopic[] = await getAllCategories();
		
			if (getAllCategoriesResponse) {
				this.setCategories(getAllCategoriesResponse);
				return getAllCategoriesResponse;
			} else {
				this.setCategories([]);
			}
		},
		async getTopicDetailsAsync(payload) {
			const getTopicDetailsResponse: ITopicDetail[] = await getTopicDetails(payload.selectedCategory, payload.languageISOCode );
			if (getTopicDetailsResponse) {
				return getTopicDetailsResponse[0];
			} else {
				return null;
			}
		},
		async getAllArticlesAsync(payload) {
			const {payloadQuery,fieldName} = payload
			const getAllArticlesResponse = await getAllArticles(payloadQuery,fieldName);
			if (getAllArticlesResponse) {
				return getAllArticlesResponse;
			} else {
				return null;
			}
		},
	}),
});
