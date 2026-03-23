import showNotification from '../components/extras/showNotification';
import { API_DATABASE_URL } from './base_url';
import { http } from './http';

export const getAllTopics = async () => {
	try {
		const { data, status } = await http.get(`${API_DATABASE_URL.API_STRAPI}/api/topics?populate=*`);
		if (status === 200) {
			return data.data;
		}
	} catch (err) {
		console.error(err);

		if (err?.response?.status !== 304) {
			showNotification(
				'Server Error',
				err.response.data.Error ||
				'Oups! Something went wrong while fetching help topics. Please try again.',
				'danger',
			);
		}
	}
};

export const getAllCategories = async () => {
	try {
		const { data, status } = await http.get(`${API_DATABASE_URL.API_STRAPI}/api/catgories?populate=*`);
	
		if (status === 200 && data.data.length > 0) {
			return data.data;
		}
	} catch (err) {
		console.error(err);
		if (err?.response?.status !== 304) {
			showNotification(
				'Server Error',
				err.response.data.Error ||
				'Oups! Something went wrong while fetching help categories. Please try again.',
				'danger',
			);
		}
	}
};

export const getTopicDetails = async (selectedCategory, languageISOCode) => {
	try {
		const { data, status } = await http.get(
			`${API_DATABASE_URL.API_STRAPI}/api/topics?filters[topic_name_${languageISOCode}][$eq]=${selectedCategory}&&populate=*`,
			// `${API_DATABASE_URL.API_STRAPI}/categories?name_${languageISOCode}=${selectedCategory}`,
		);
		if (status === 200 && data.data.length > 0) {
			return data.data;
		}
	} catch (err) {
		console.error(err);
		if (err?.response?.status !== 304) {
			showNotification(
				'Server Error',
				err.response.data.Error ||
				'Oups! Something went wrong while fetching help category. Please try again.',
				'danger',
			);
		}
	}
};

export const getAllArticles = async (payloadQuery, fieldName) => {
	try {
		const { data, status } = await http.get(
			// `${API_DATABASE_URL.API_STRAPI}/helps?${fieldName}&slug=${payloadQuery}`,
			`${API_DATABASE_URL.API_STRAPI}/api/topics?filters[${fieldName}][$contains]=${payloadQuery}&&populate=*`,
		);
		if (status === 200 && data.data.length > 0) {
			return data.data;
		}
	} catch (err) {
		console.error(err);
		/* if (err?.response?.status !== 304 || err?.response?.status !== 404) {
			showNotification(
				'Server Error',
				err.response.data.Error ||
					'Oups! Something went wrong while fetching help articles. Please try again.',
				'danger',
			);
		} */
	}
};
