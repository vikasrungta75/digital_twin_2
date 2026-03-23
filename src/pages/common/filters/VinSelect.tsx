// import React, { FC, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useDispatch, useSelector } from 'react-redux';
// import Select from '../../../components/bootstrap/forms/Select';
// import { RootState, store } from '../../../store/store';
// import { FormikValues } from 'formik';

// interface IVinSelect {
// 	fleetNameFilter?: string;
// 	setVinFilter: (e: string) => void;
// 	vinFilter: string;
// 	className: string;
// 	invalidFeedback?: string;
// 	isTouched?: boolean;
// 	isValid?: boolean;
// 	isDisabled?: boolean;
// 	formik?: FormikValues;
// 	placeholder?: any;
// }

// const VinSelect: FC<IVinSelect> = ({
// 	fleetNameFilter,
// 	setVinFilter,
// 	vinFilter,
// 	className,
// 	invalidFeedback,
// 	isValid,
// 	isTouched,
// 	isDisabled,
// 	formik,
// 	placeholder = 'All Vins',
// }): JSX.Element => {
// 	const { vinByFleet } = useSelector((state: RootState) => state.vehicles);
// 	const { t } = useTranslation(['vehicles']);


// 	const [searchText, setSearchText] = useState('');
// 	const [filteredVinList, setFilteredVinList] = useState(vinByFleet || []);

// 	const isLoading = useSelector(
// 		(state: RootState) => state.loading.effects.vehicles.getVinByFleet,
// 	);

// 	const isLoadingGroupNameFilter = useSelector(
// 		(state: RootState) => state.loading.effects.vehicles.getGroupNameFilterAsync,
// 	);

// 	const dispatch = useDispatch();

// 	const { filterPayload } = useSelector((state: RootState) => state.filters);
// 	const { customProperties } = store.getState().auth;
// 	let fleetId = customProperties.fleetId ? customProperties.fleetId : 'All Fleets';
// 	let organisationId = customProperties.organisation_id ? customProperties.organisation_id : '';

// 	useEffect(() => {
// 		//if (fleetNameFilter && groupNameFilterStatus.length > 0) { // why groupNameFilterStatus!!! ???
// 		const payloadFilter = {
// 			fleetname: fleetNameFilter ? fleetNameFilter : fleetId,	organisation_id: organisationId,
// 		};
// 		dispatch.vehicles.getVinByFleet(payloadFilter);
// 		//}
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [fleetNameFilter]);
	
// 	const filteredVinByFleet = vinByFleet?.filter(
// 		(value: { vin_no: string }) => value.vin_no !== 'All Vins',
// 	);

// 	useEffect(() => {
// 		const filtered = vinByFleet
// 			?.filter((value: { vin_no: string }) => value.vin_no !== 'All Vins')
// 			?.filter((value: { vin_no: string }) =>
// 				value.vin_no.toLowerCase().includes(searchText.toLowerCase())
// 			);
// 		setFilteredVinList(filtered || []);
// 	}, [vinByFleet, searchText]);


// 	return (
// 		<div className={className}>
// 			<input
// 				type="text"
// 				className="form-control mb-2"
// 				placeholder={t('Search VIN')}
// 				value={searchText}
// 				onChange={(e) => setSearchText(e.target.value)}
// 				disabled={fleetNameFilter?.length === 0 || isLoading || isDisabled}
// 			/>
// 			<Select
// 				isLoading={isLoading}
// 				disabled={fleetNameFilter?.length === 0 || isLoading || isDisabled}
// 				className='form-control'
// 				ariaLabel='vehicle-select'
// 				placeholder={t(placeholder)}
// 				value={vinFilter}
// 				invalidFeedback={invalidFeedback}
// 				isTouched={isTouched}
// 				isValid={isValid}
// 				onChange={(e: { target: { value: string } }) => {
// 					setVinFilter(e.target.value);
// 					if (formik) formik.setFieldValue('vin', e.target.value);
// 				}}>
// 				<option disabled value=' '>
// 					{t(placeholder)}
// 				</option>
// 				<option value='All Vins'>{t('All Vins')}</option>
// 				{filteredVinList?.map((value: { vin_no: string }, index: number) => {
// 					return (
// 						<option
// 							selected={filterPayload.vin === value.vin_no}
// 							key={index}
// 							value={value.vin_no}>
// 							{t(value.vin_no)}
// 						</option>
// 					);
// 				})}
// 			</Select>
// 		</div>
// 	);
// };

// export default VinSelect;


import React, { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { RootState, store } from '../../../store/store';
import { FormikValues } from 'formik';

interface IVinSelect {
	fleetNameFilter?: string;
	setVinFilter: (e: string) => void;
	vinFilter: string;
	className: string;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isDisabled?: boolean;
	formik?: FormikValues;
	placeholder?: string;
	style?: React.CSSProperties;
}

const VinSelect: FC<IVinSelect> = ({
	fleetNameFilter,
	setVinFilter,
	vinFilter,
	className,
	invalidFeedback,
	isValid,
	isTouched,
	isDisabled,
	formik,
	style,
	// placeholder = 'All Vins',
	placeholder = 'Search VIN',
}) => {
	const { vinByFleet } = useSelector((state: RootState) => state.vehicles);
	const { t } = useTranslation(['vehicles']);

	const isLoading = useSelector(
		(state: RootState) => state.loading.effects.vehicles.getVinByFleet,
	);

	const dispatch = useDispatch();
	const { customProperties } = store.getState().auth;
	const fleetId = customProperties.fleetId || 'All Fleets';
	const organisationId = customProperties.organisation_id || '';

	useEffect(() => {
		const payloadFilter = {
			fleetname: fleetNameFilter || fleetId,
			organisation_id: organisationId,
		};
		dispatch.vehicles.getVinByFleet(payloadFilter);
	}, [dispatch.vehicles, fleetId, fleetNameFilter, organisationId]);

	const options = vinByFleet
		?.filter((item) => item.vin_no !== 'All Vins')
		.map((item) => ({
			value: item.vin_no,
			label: item.vin_no,
		})) || [];

	// Add "All Vins" as the first option
	options.unshift({ value: 'All Vins', label: t('All Vins') });

	const selectedOption = options.find((opt) => opt.value === vinFilter);

	

	return (
		<div className={className} style={style}>
			<Select
				isDisabled={fleetNameFilter?.length === 0 || isLoading || isDisabled}
				isLoading={isLoading}
				options={options}
				value={selectedOption}
				onChange={(option: any) => {
					setVinFilter(option.value);
					if (formik) formik.setFieldValue('vin', option.value);
				}}
				// placeholder={t(placeholder)}
				placeholder={t('Search VIN')}
				classNamePrefix="react-select"
				menuPlacement="top" 
				isSearchable={true} 
				noOptionsMessage={() => t('No VIN found')}
			/>
			{invalidFeedback && isTouched && !isValid && (
				<div className="invalid-feedback d-block">{invalidFeedback}</div>
			)}
		</div>
	);
};

export default VinSelect;

