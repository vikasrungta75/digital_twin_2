import React, { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import Select from '../../../components/bootstrap/forms/Select';
import { useTranslation } from 'react-i18next';

interface IAlarmTypeSelectProps {
	alarmFilter: string;
	setalarmFilter: (value: string) => void;
	className?: string;
	defaultFilter?: string;
	defaultoptionValue?: string;
}

const AlarmTypeSelect: FC<IAlarmTypeSelectProps> = ({
	alarmFilter,
	setalarmFilter,
	className,
	defaultFilter = 'All Alarms',
	defaultoptionValue,
}): JSX.Element => {
	const dispatch = useDispatch();
	const { alarmType } = useSelector((state: RootState) => state.alertsNotifications);
	const isLoadingAlarmType = useSelector(
		(state: RootState) => state.loading.effects.alertsNotifications.getAlarmType,
	);
	const { t } = useTranslation(['vehicles']);

	useEffect(() => {
		let alarmFilterCheckSelected = alarmType.find((a: any) =>
			a.alarm_name.includes(alarmFilter),
		);
		if (alarmFilterCheckSelected === undefined) {
			setalarmFilter(defaultFilter);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alarmType, alarmFilter]);

	// useEffect(() => {
	// 	const getAlarmType = async () => {
	// 		await dispatch.alertsNotifications.getAlarmType();
	// 	};
	// 	if (alarmType.length === 0) {
	// 		getAlarmType();
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [alarmType]);

		useEffect(() => {
		const getAlarmType = async () => {
			await dispatch.alertsNotifications.getAlarmType();
		};
		if (alarmType.length === 0) {
			getAlarmType();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className={className}>
			<Select
				isLoading={isLoadingAlarmType}
				className='form-control'
				ariaLabel='fleet-select'
				value={alarmFilter}
				placeholder={t(defaultFilter)}
				onChange={(e: { target: { value: string } }) => {
					setalarmFilter(e.target.value);
				}}>
				<option disabled>{t('Select alarm type')}</option>
				<option value={defaultoptionValue ? defaultoptionValue : 'All Alarms'}>
					{t('All Alarms')}
				</option>

				{alarmType?.map((value: { alarm_name: string }, index: number) => {
					return (
						<option key={index} value={value.alarm_name}>
							{t(value.alarm_name)}
						</option>
					);
				})}
			</Select>
		</div>
	);
};

export default AlarmTypeSelect;
