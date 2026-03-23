import axios from 'axios';

import { API_DATABASE_URL } from './base_url';

// const API_URL_ENDPOINT_ENV = process.env.REACT_APP_SERVICE_URL;

export const http = axios.create({
	baseURL: API_DATABASE_URL.API_RAVITY,
	timeout: 60000,
	headers: {
		Accept: '*/*',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
	},
});

export const httpRest = axios.create({
	baseURL: API_DATABASE_URL.API_REST_RAVITY,
	timeout: 60000,
	headers: {
		Accept: '*/*',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
	},
});

export const httpwithtoken = axios.create({
	baseURL: API_DATABASE_URL.API_RAVITY,
	timeout: 60000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		Authorization: `Bearer ${localStorage.getItem('token')}`,
	},
});

export const httpJson = axios.create({
	baseURL: API_DATABASE_URL.API_RAVITY_INGESTION,
	timeout: 60000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
});

export function getAbortController() {
	return new AbortController();
  }
