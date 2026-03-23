import React, {
	FC,
	useState,
	useContext,
	Dispatch,
	SetStateAction,
	useRef,
	useEffect,
} from 'react';
import { DateRangePicker } from 'react-date-range';
import Button from './bootstrap/Button';
import { useTranslation } from 'react-i18next';
import ThemeContext from '../contexts/themeContext';
import Input from './bootstrap/forms/Input';
import { convertToDate, convertToDateWithUTC, dateFormatter } from '../helpers/helpers';
import { IDateRangeFilter } from '../type/history-type';
import Icon from './icon/Icon';
import Card, { CardBody, CardFooter } from './bootstrap/Card';
import {
	updateDatePickerDefaultStaticRanges,
	updateDatePickerDefineds,
} from '../common/other/DatePickerConstant';
import TimePicker from './TimePicker';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface IDatePickerProps {
	setDateRangeFilter: Dispatch<SetStateAction<IDateRangeFilter>>;
	dateRangeFilter: IDateRangeFilter;
	withHours: boolean;
	position?: 'start' | 'end';
	leftStyle?: string;
	rightStyle?: string;
	topStyle?: string;
	leftMobile?: string;
	rightMobile?: string;
	topMobile?: string;
	setShowDatePicker: (showDatePicker: boolean) => void;
	showDatePicker: boolean;
}

const DatePickerPerso: FC<IDatePickerProps> = ({
	setDateRangeFilter,
	dateRangeFilter,
	withHours,
	position = 'end',
	leftStyle,
	rightStyle,
	leftMobile,
	rightMobile,
	topMobile,
	setShowDatePicker,
	showDatePicker,
}): JSX.Element => {
	const { t } = useTranslation(['vehicles']);
	const { mobileDesign } = useContext(ThemeContext);
	const ref = useRef<HTMLHeadingElement>(null);
	const { filterPayload } = useSelector((state: RootState) => state.filters);
	const { preferedTimeZone } = useSelector((state: RootState) => state.auth);

	const localTime = convertToDateWithUTC(new Date(), preferedTimeZone);

	const [time, setTime] = useState({
		startTime: filterPayload.startTime || '00:00:00',
		endTime: filterPayload.endTime || '23:59:59',
	});

	useEffect(() => {
		updateDatePickerDefineds(preferedTimeZone);
	}, [preferedTimeZone]);

	const [date, setDate] = useState<any>([
		{
			startDate: filterPayload.startDate ? convertToDate(filterPayload.startDate) : localTime,
			endDate: filterPayload.endDate ? convertToDate(filterPayload.endDate) : localTime,
			key: 'selection',
		},
	]);

	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (ref.current && !ref.current.contains(target)) {
			setShowDatePicker(false);
		}
	};

	useEffect(() => {
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fromDate = dateFormatter(date[0]?.startDate);
	const toDate = dateFormatter(date[0]?.endDate);

	const displayChoosenDate = () => {
		if (dateRangeFilter.startDate.length && dateRangeFilter.startDate.length) {
			if (fromDate === toDate) {
				return !withHours
					? toDate
					: `${toDate} ${t('from')} ${dateRangeFilter.startTime} ${t('to')} ${dateRangeFilter.endTime
					}`;
			} else
				return !withHours
					? `${t('From')} ${fromDate} ${t('to')} ${toDate}`
					: `${t('From')} ${fromDate} ${dateRangeFilter.startTime} ${t('to')} ${toDate} ${dateRangeFilter.endTime
					} `;
		} else return '';
	};

	return (
	
				<div className='custom-calendar'>
					<DateRangePicker
						rangeColors={['#f00d69']}
						className='justify-content-center'
						onChange={(item) => setDate([item.selection])}
						moveRangeOnFirstSelection={false}
						months={1}
						ranges={date}
						direction='horizontal'
						maxDate={localTime}
						inputRanges={[]}
						staticRanges={updateDatePickerDefaultStaticRanges()}
					/>
					{withHours && <TimePicker time={time} setTime={setTime} />}
					{/*<CardFooter className='border-top border-light'>
						<Button
							color='secondary'
							className={`py-3  ${mobileDesign ? 'w-100 ' : 'w-50 ms-3'}`}
							onClick={() => {
								setDateRangeFilter({
									endTime: time.endTime,
									startTime: time.startTime,
									startDate: dateFormatter(date[0].startDate),
									endDate: dateFormatter(date[0].endDate),
								});

								setShowDatePicker(false);
							}}>
							{t('Apply')}
						</Button>
						</CardFooter>*/}
				</div>
		
	);
};

export default DatePickerPerso;
