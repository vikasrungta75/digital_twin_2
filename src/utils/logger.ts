/**
 * logger.ts — Production-safe logging utility
 * FIX CODE-03: Replaces 72+ raw console.log/error/warn calls
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.log('Vehicle loaded', vehicle);
 *   logger.warn('Slow response', ms);
 *   logger.error('API failed', err);   ← always logged, even in production
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
	/** Logged only in development */
	log: (...args: unknown[]): void => {
		if (isDev) console.log(...args);
	},
	/** Logged only in development */
	warn: (...args: unknown[]): void => {
		if (isDev) console.warn(...args);
	},
	/** Always logged — errors are never silenced */
	error: (...args: unknown[]): void => {
		console.error(...args);
	},
	/** Debug-level — dev only */
	debug: (...args: unknown[]): void => {
		if (isDev) console.debug(...args);
	},
};
