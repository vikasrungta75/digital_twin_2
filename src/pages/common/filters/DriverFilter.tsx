import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Select from '../../../components/bootstrap/forms/Select';
import { RootState } from '../../../store/store';
import { IGroupNameFilter } from '../../../type/vehicles-type';
import { useGetDriverNameFilterService } from '../../../services/ecoDrivingService';

interface IDriverFilterSelect {
	DriverNameFilter: string;
	setDriverNameFilter: (val: string) => void;
	className?: string;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isDisabled?: boolean;
}

const DriverSelect: FC<IDriverFilterSelect> = ({
	DriverNameFilter,
	setDriverNameFilter,
	className,
	invalidFeedback,
	isValid,
	isTouched,
	isDisabled,
}): JSX.Element => {
	const { data: dataDriverNameFilter, isSuccess } = useGetDriverNameFilterService();

	const isLoading = useSelector(
		(state: RootState) => state.loading.effects.vehicles.getGroupNameFilterAsync,
	);
	const { t } = useTranslation(['vehicles']);

	return (
		<div className={className}>
			<Select
				isLoading={isLoading}
				className='form-control'
				ariaLabel='driver-select'
				value={DriverNameFilter}
				invalidFeedback={invalidFeedback}
				placeholder={t('select a driver')}
				isTouched={isTouched}
				isValid={isValid}
				onChange={(e: { target: { value: string } }) => {
					setDriverNameFilter(e.target.value);
				}}
				disabled={isDisabled}>
				<option disabled>{t('select a drivers')}</option>

				{dataDriverNameFilter?.map((optionDriver: IGroupNameFilter, index: number) => {
					return (
						<option key={index} value={optionDriver._id}>
							{optionDriver._id}
						</option>
					);
				})}
			</Select>
		</div>
	);
};

export default DriverSelect;
