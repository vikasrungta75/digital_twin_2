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

interface IDatePickerProps {
	setDateRangeFilter: Dispatch<SetStateAction<IDateRangeFilter>>;
	dateRangeFilter: IDateRangeFilter;
	className: string;
	withHours: boolean;
	position?: 'start' | 'end';
	isLoading?: boolean;
}

const DatePicker: FC<IDatePickerProps> = ({
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
		startTime: filterPayload.startTime || '00:00:00',
		endTime: filterPayload.endTime || '23:59:59',
	});

	useEffect(() => {
		updateDatePickerDefineds(preferedTimeZone);
	}, [preferedTimeZone]);
	const { i18n } = useTranslation();
	const isArabic = i18n.language === 'ar-AR';
	const useMutationObserver = (x: any) => {
		useEffect(() => {
			if (!x) return;

			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList') {
						const endEdges = document.querySelectorAll('.rdrEndEdge');
						endEdges.forEach((el: any) => {
							el.style.left = '2px';
							el.style.borderBottomLeftRadius = '1.042em';
							el.style.borderTopLeftRadius = '1.042em';
							el.style.setProperty('left', '2px', 'important');
							el.style.setProperty(
								'border-bottom-left-radius',
								'1.042em',
								'important',
							);
							el.style.setProperty('border-top-left-radius', '1.042em', 'important');

							el.style.right = '0px';
							el.style.borderBottomRightRadius = '0em';
							el.style.borderTopRightRadius = '1.0em';
							el.style.setProperty('right', '0px', 'important');
							el.style.setProperty('border-bottom-right-radius', '0px', 'important');
							el.style.setProperty('border-top-right-radius', '0px', 'important');
						});

						const startEdges = document.querySelectorAll('.rdrStartEdge');
						startEdges.forEach((el: any) => {
							el.style.right = '2px';
							el.style.borderBottomRightRadius = '1.042em';
							el.style.borderTopRightRadius = '1.042em';
							el.style.setProperty('right', '2px', 'important');
							el.style.setProperty(
								'border-bottom-right-radius',
								'1.042em',
								'important',
							);
							el.style.setProperty('border-top-right-radius', '1.042em', 'important');

							el.style.left = '0px';
							el.style.borderBottomLeftRadius = '0px';
							el.style.borderTopLeftRadius = '0px';
							el.style.setProperty('left', '0px', 'important');
							el.style.setProperty('border-bottom-left-radius', '0px', 'important');
							el.style.setProperty('border-top-left-radius', '0px', 'important');
						});
						// Handle .rdrDayEndOfWeek .rdrInRange
						const dayEndOfWeekInRange = document.querySelectorAll('.rdrDayEndOfWeek ');
						dayEndOfWeekInRange.forEach((el: any) => {
							// el.style.setProperty('right', '0px', 'important');
							el.style.setProperty(
								'border-bottom-right-radius',
								'1.042em',
								'important',
							);
							el.style.setProperty('border-top-right-radius', '1.042em', 'important');

							el.style.setProperty('left', '2px', 'important');
							el.style.setProperty('border-bottom-left-radius', '0px', 'important');
							el.style.setProperty('border-top-left-radius', '0px', 'important');
						});

						// Handle .rdrDayEndOfWeek .rdrStartEdge

						// Handle .rdrDayStartOfMonth .rdrInRange
						const dayStartOfMonthInRange =
							document.querySelectorAll('.rdrDayStartOfMonth  ');
						dayStartOfMonthInRange.forEach((el: any) => {
							el.style.setProperty('left', '2px', 'important');
							el.style.setProperty(
								'border-bottom-left-radius',
								'1.042em',
								'important',
							);
							el.style.setProperty('border-top-left-radius', '1.042em', 'important');

							el.style.setProperty('right', '2px', 'important');
							el.style.setProperty('border-bottom-right-radius', '0px', 'important');
							el.style.setProperty('border-top-right-radius', '0px', 'important');
						});

						const rdrInRange = document.querySelectorAll('.rdrInRange  ');
						rdrInRange.forEach((el: any) => {
							el.style.setProperty('border-radius', '0px', 'important');
							el.style.setProperty('left', '0px', 'important');
						});

						const rdrNextPrevButton = document.querySelectorAll('.rdrNextPrevButton  ');
						rdrNextPrevButton.forEach((el: any) => {
							el.style.setProperty('transform', 'rotate(180deg)', 'important');
						});

						// Handle .rdrDayStartOfWeek .rdrInRange
					}
				});
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			return () => {
				observer.disconnect();
			};
		}, [x]);
	};
	useMutationObserver(isArabic);
	const [date, setDate] = useState<any>([
		{
			startDate: dateRangeFilter.startDate
				? convertToDate(dateRangeFilter.startDate)
				: filterPayload.startDate
					? convertToDate(filterPayload.startDate)
					: localTime,
			endDate: dateRangeFilter.endDate
				? convertToDate(dateRangeFilter.endDate)
				: filterPayload.endDate
					? convertToDate(filterPayload.endDate)
					: localTime,
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
	const isRTL = i18n.language === 'ar-AR';
	const edgePosition = position === 'end' ? (mobileDesign ? '-10px' : '') : '0';
	return (
		<div className={className} ref={ref}>
			<div
				className='form-control date-picker d-flex align-items-center'
				onClick={() => setShowDatePicker(!showDatePicker)}>
				<label
					className='border-0 bg-transparent cursor-pointer m-auto'
					htmlFor='searchInput'>
					<Icon icon='DateRange' size='2x' color='dark' className='me-3' />
				</label>
				{/* <Input
					className='border-0 shadow-none bg-transparent p-0'
					id='date-picker-range'
					readOnly
					placeholder={t('Pick a date')}
					value={displayChoosenDate()}
					title={displayChoosenDate()}
				/> */}

				<Input
					className='border-0 shadow-none bg-transparent p-0'
					style={{
						color: '#0B1143', fontFamily: 'Inter', fontSize: '14px',
						fontWeight: 400, lineHeight: '16.94px',
						// width: '190px',
						height: '17px',
						textAlign: 'left',
					}}
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
					className='position-absolute'
					style={{
						zIndex: 10,
						left: position === 'end' ? (mobileDesign ? '-10px' : '') : '1000px',
						right: position === 'end' ? (mobileDesign ? '-10px' : '275px') : '',
					}}>
					<CardBody className='custom-cardBody'>
						<DateRangePicker
							rangeColors={['#232323']}
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
					</CardBody>
					<CardFooter className='border-top border-light  .custom-cardFooter '>
						<Button
							isOutline={true}
							className={`py-3  btn-cancel ${mobileDesign ? 'w-100 my-3' : 'w-50'}`}
							onClick={() => {
								setShowDatePicker(false);
								setDateRangeFilter({
									startDate: '',
									endDate: '',
									endTime: '23:59:59',
									startTime: '00:00:00',
								});
								setTime({ endTime: '23:59:59', startTime: '00:00:00' });
							}}>
							{t('Cancel')}
						</Button>
						<Button
							// color='secondary'
							className={`py-3 btn-apply ${mobileDesign ? 'w-100 ' : 'w-50 ms-3'}`}
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
					</CardFooter>
				</Card>
			)}
		</div>
	);
};

export default DatePicker;

