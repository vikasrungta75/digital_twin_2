import { addDays, endOfDay, startOfDay, addMonths, isSameDay } from 'date-fns';
import { convertToDateWithUTC } from '../../helpers/helpers';
import i18n from '../../i18n';
import { store } from '../../store/store';

const { preferedTimeZone } = store.getState().auth;
const localTime = convertToDateWithUTC(new Date(), preferedTimeZone);

let defineds = {
	startOfToday: startOfDay(localTime),
	endOfToday: endOfDay(localTime),
	startOfYesterday: startOfDay(addDays(localTime, -1)),
	endOfYesterday: endOfDay(addDays(localTime, -1)),
	startOfLastWeek: startOfDay(addDays(localTime, -7)),
	endOfLastWeek: endOfDay(addDays(localTime, 0)),
	startOfLast15Days: startOfDay(addDays(localTime, -14)),
	endOfLast15Days: endOfDay(addDays(localTime, 0)),
	startOfLast30Days: startOfDay(addMonths(localTime, -1)),
	endOfLast30Days: endOfDay(addMonths(localTime, 0)),
};

export const updateDatePickerDefineds = (updatedTimezone: string) => {
	const updatedLocalTime = convertToDateWithUTC(new Date(), updatedTimezone);
	return (defineds = {
		startOfToday: startOfDay(updatedLocalTime),
		endOfToday: endOfDay(updatedLocalTime),
		startOfYesterday: startOfDay(addDays(updatedLocalTime, -1)),
		endOfYesterday: endOfDay(addDays(updatedLocalTime, -1)),
		startOfLastWeek: startOfDay(addDays(updatedLocalTime, -7)),
		endOfLastWeek: endOfDay(addDays(updatedLocalTime, 0)),
		startOfLast15Days: startOfDay(addDays(updatedLocalTime, -14)),
		endOfLast15Days: endOfDay(addDays(updatedLocalTime, 0)),
		startOfLast30Days: startOfDay(addMonths(updatedLocalTime, -1)),
		endOfLast30Days: endOfDay(addMonths(updatedLocalTime, 0)),
	});
};

const staticRangeHandler: any = {
	range: {},
	isSelected(range: any) {
		const definedRange = this.range();
		return (
			isSameDay(range.startDate, definedRange.startDate) &&
			isSameDay(range.endDate, definedRange.endDate)
		);
	},
};

export function createStaticRanges(ranges: any) {
	return ranges.map((range: StaticRange) => ({ ...staticRangeHandler, ...range }));
}

export const updateDatePickerDefaultStaticRanges = () => {
	return createStaticRanges([
		{
			label: i18n.t('Today', { ns: 'vehicles' }),
			range: () => ({
				startDate: defineds.startOfToday,
				endDate: defineds.endOfToday,
			}),
		},
		{
			label: i18n.t('Yesterday', { ns: 'vehicles' }),
			range: () => ({
				startDate: defineds.startOfYesterday,
				endDate: defineds.endOfYesterday,
			}),
		},
		{
			label: i18n.t('Last Week', { ns: 'vehicles' }),
			range: () => ({
				startDate: defineds.startOfLastWeek,
				endDate: defineds.endOfLastWeek,
			}),
		},
		{
			label: i18n.t('Last 15 days', { ns: 'vehicles' }),
			range: () => ({
				startDate: defineds.startOfLast15Days,
				endDate: defineds.endOfLast15Days,
			}),
		},
		{
			label: i18n.t('Last 30 days', { ns: 'vehicles' }),
			range: () => ({
				startDate: defineds.startOfLast30Days,
				endDate: defineds.endOfLast30Days,
			}),
		},
	]);
};
