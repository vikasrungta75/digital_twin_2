const isProduction = window.location.hostname !== 'localhost';

export const API_DATABASE_URL = {
	API_RAVITY: isProduction ? '/cxf-proxy/' : process.env.REACT_APP_SERVICE_URL,
	API_REST_RAVITY: isProduction ? '/rest-proxy/' : process.env.REACT_APP_REST_URL,
	API_RAVITY_INGESTION: isProduction ? '/ingestion-proxy/' : process.env.REACT_APP_SERVICE_URL_INGESTION,
	API_STRAPI: 'https://platform-strapi.ravity.io',
};