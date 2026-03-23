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
import Spinner from './bootstrap/Spinner';
import './stylesDatePickerTask.scss';
import TimePickerTask from './TimePickerTask';
interface IDatePickerProps {
	setDateRangeFilter: any;
	dateRangeFilter: any;
	className: string;
	withHours: boolean;
	position?: 'start' | 'end';
	isLoading?: boolean;
}

const DatePickerTask: FC<IDatePickerProps> = ({
	setDateRangeFilter,
	dateRangeFilter,
	className,
	withHours,
	position = 'end',
	isLoading = false,
}): JSX.Element => {
	const { t } = useTranslation(['vehicles']);
	const { mobileDesign } = useContext(ThemeContext);
	const ref = useRef<HTMLHeadingElement>(null);
	const { filterPayload } = useSelector((state: RootState) => state.filters);
	const { preferedTimeZone } = useSelector((state: RootState) => state.auth);

	const localTime = convertToDateWithUTC(new Date(), preferedTimeZone);

	const [showDatePicker, setShowDatePicker] = useState(false);
	const [time, setTime] = useState({
		startTime: filterPayload.startTime || '01:01:01',
		endTime: filterPayload.endTime || '23:59:20',
	});
	// useEffect(() => {
	// 	updateDatePickerDefineds(preferedTimeZone);
	// }, [preferedTimeZone]);

	function extractTime(timestamp: any) {
		const date = new Date(timestamp);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	}
	useEffect(() => {
	 
		const hours = extractTime(dateRangeFilter);
		 
		setTime({ endTime: hours, startTime: hours });
	}, [dateRangeFilter]);

	 
	const [date, setDate] = useState<any>({
		startDate: new Date(),
		endDate: new Date(),
		key: 'selection',
	});

	useEffect(() => {
		 
		if (dateRangeFilter) {
			const startDateFormatted = formatDateString(dateRangeFilter.substring(0, 10));
		 
			setDate({
				startDate: startDateFormatted,
				endDate: startDateFormatted,
				key: 'selection',
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
	}, []);

	const handleSelect = (ranges: any) => {
		const { startDate, endDate } = ranges.selection;
		const selectedDate = startDate < date.startDate ? startDate : endDate;
		 

		setDate((prevDate: any) => ({
			...prevDate,
			startDate: selectedDate,
			endDate: selectedDate,
		}));
		setDateRangeFilter(startDate);
	};

	const displayChoosenDate = () => {
	 
		// if (dateRangeFilter!="") {
		return dateFormatter(date.startDate) + ' ' + time.startTime;

		// return !withHours ? chosenDate : `${chosenDate}   ${dateRangeFilter.startTime}`;
		// } else return '';
	};
	const yourStyle = {
		position: 'absolute',
		zIndex: 10,
		left: '0px',
	};
	return (
		<div className={className} ref={ref}>
			<div
				className='form-control d-flex align-items-center'
				onClick={() => setShowDatePicker(!showDatePicker)}>
				<label
					className='border-0 bg-transparent cursor-pointer m-auto'
					htmlFor='searchInput'>
					<Icon icon='DateRange' size='2x' color='dark' className='me-3' />
				</label>
				<Input
					className='border-0 shadow-none bg-transparent p-0'
					id='date-picker-range'
					readOnly
					placeholder={t('Pick a date')}
					value={displayChoosenDate()}
					title={displayChoosenDate()}
				/>

				{isLoading && (
					<div className='d-flex align-items-center'>
						<Spinner color='secondary' size={20} className='spinner-center' />
					</div>
				)}
			</div>
			{showDatePicker && (
				<Card
					style={{
						position: 'absolute',

						zIndex: 10,
						left: position === 'end' ? (mobileDesign ? '-10px' : '') : '0',
						right: position === 'end' ? (mobileDesign ? '-10px' : '0') : '',
					}}>
					<CardBody>
						<DateRangePicker
							rangeColors={['#FFB400']}
							onChange={handleSelect}
							moveRangeOnFirstSelection={false}
							months={1}
							ranges={[date]}
							direction='horizontal'
							inputRanges={[]}
							staticRanges={updateDatePickerDefaultStaticRanges()}
						/>
						{withHours && <TimePickerTask time={time} setTime={setTime} />}
					</CardBody>
					<CardFooter className='border-top border-light'>
						<Button
							color='secondary'
							isOutline={true}
							className={`py-3 light-btn ${mobileDesign ? 'w-100 my-3' : 'w-50'}`}
							onClick={() => {
								setShowDatePicker(false);
								setDateRangeFilter('');
								setTime({ endTime: '23:59:59', startTime: '01:01:01' });
							}}>
							{t('Cancel')}
						</Button>
						<Button
							color='secondary'
							className={`py-3  ${mobileDesign ? 'w-100 ' : 'w-50 ms-3'}`}
							onClick={() => {
								setDateRangeFilter(
									dateFormatter(date.startDate) + ' ' + time.startTime,
								);
								setShowDatePicker(false);
							}}>
							{t('Apply')}
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	);
};

export default DatePickerTask;
const formatDateString = (dateString: any) => {
	const date = new Date(dateString);

	// Get day of the week, month, day, year, and time parts

	const month = date.toLocaleString('en-US', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear();
 
	return new Date(`${month}/${day}/${year}`);
};
const extractTimeComponents = (dateTimeString: any) => {
	let timeString = '';

	// Check if dateTimeString matches the first format: YYYY-MM-DDTHH:mm:ss.sssZ
	if (dateTimeString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
		const date = new Date(dateTimeString);
		const hh = date.getUTCHours().toString().padStart(2, '0');
		const mm = date.getUTCMinutes().toString().padStart(2, '0');
		const ss = date.getUTCSeconds().toString().padStart(2, '0');
		timeString = `${hh}:${mm}:${ss}`;
	}
	// Check if dateTimeString matches the second format: YYYY-MM-DD HH:mm:ss
	else if (dateTimeString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
		const [datePart, timePart] = dateTimeString.split(' ');
		const [hh, mm, ss] = timePart.split(':').map((num: any) => parseInt(num, 10));
		timeString = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss
			.toString()
			.padStart(2, '0')}`;
	}
	// Handle other formats or invalid inputs gracefully if needed

	return timeString;
};
