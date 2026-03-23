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
}

const AlarmTypeSelectAlerts: FC<IAlarmTypeSelectProps> = ({
	alarmFilter,
	setalarmFilter,
	className,
	defaultFilter = 'All Alarms',
}): JSX.Element => {
	const dispatch = useDispatch();
	const { alarmTypeForAlert  } = useSelector((state: RootState) => state.alertsNotifications);
	
	const { t } = useTranslation(['vehicles']);

	useEffect(() => {
		let alarmFilterCheckSelected = alarmTypeForAlert .find((a: any) => a._id.includes(alarmFilter));
		if (alarmFilterCheckSelected === undefined) {
			setalarmFilter(defaultFilter);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alarmTypeForAlert , alarmFilter]);

	useEffect(() => {
		
		const getAlarmTypeForAlert = async () => {
			await dispatch.alertsNotifications.getAlarmTypeForAlert();
		};
		if (alarmTypeForAlert .length === 0) {
			getAlarmTypeForAlert();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alarmTypeForAlert ]);

	return (
		<div className={className}>
			<Select
				// isLoading={isLoadingAlarmType}
				className='form-control'
				ariaLabel='fleet-select'
				value={alarmFilter}
				placeholder={t(defaultFilter)}
				onChange={(e: { target: { value: string } }) => {
					setalarmFilter(e.target.value);
				}}>
				<option disabled>{t('Select alarm type')}</option>
				<option value={'All Alarms'}>{t('All Alarms')}</option>
				{alarmTypeForAlert ?.map((value: { _id: string }, index: number) => {
					return (
						<option key={index} value={value._id}>
							{t(value._id)}
						</option>
					);
				})}
			</Select>
		</div>
	);
};

export default AlarmTypeSelectAlerts;