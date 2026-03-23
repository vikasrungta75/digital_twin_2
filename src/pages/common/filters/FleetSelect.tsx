import React, { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Select from '../../../components/bootstrap/forms/Select';
import { RootState } from '../../../store/store';
import { IGroupNameFilter } from '../../../type/vehicles-type';

interface IFleetSelect {
	fleetNameFilter: string;
	setFleetNameFilter: (fleetName: string) => void;
	setVinFilter?: (vin: string) => void;
	setalarmFilter?: (alarm: string) => void;
	className?: string;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isDisabled?: boolean;
}

const FleetSelect: FC<IFleetSelect> = ({
	fleetNameFilter,
	setFleetNameFilter,
	setVinFilter,
	setalarmFilter,
	className,
	invalidFeedback,
	isValid,
	isTouched,
	isDisabled,
}): JSX.Element => {
	const dispatch = useDispatch();
	const { groupNameFilterStatus } = useSelector((state: RootState) => state.vehicles);
	const isLoading = useSelector(
		(state: RootState) => state.loading.effects.vehicles.getGroupNameFilterAsync,
	);
	const { t } = useTranslation(['vehicles']);

	React.useEffect(() => {
		if (groupNameFilterStatus.length === 0) {
			dispatch.vehicles.getGroupNameFilterAsync();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupNameFilterStatus]);



	return (
		<div className={className}>
			<Select
				isLoading={isLoading}
				className='form-control'
				ariaLabel='fleet-select'
				value={fleetNameFilter}
				invalidFeedback={invalidFeedback}
				placeholder={t('select a fleet')}
				isTouched={isTouched}
				isValid={isValid}
				onChange={(e: { target: { value: string } }) => {
					
					if (setVinFilter) {
						setVinFilter('All Vins');
					}

					if (setalarmFilter) {
						setalarmFilter('All Alarms');
					}
					setFleetNameFilter(e.target.value);
				}}
				disabled={isDisabled}>
				<option disabled>{t('select a fleet')}</option>

				{groupNameFilterStatus?.map((optionFleet: IGroupNameFilter, index: number) => {
					return (
						<option key={index} value={optionFleet.fleet_id}>
							{t(`${optionFleet._id}`)}
						</option>
					);
				})}
			</Select>
		</div>
	);
};

export default FleetSelect;
