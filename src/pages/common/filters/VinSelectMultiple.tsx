import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store } from '../../../store/store';
import { FormikValues } from 'formik';

interface IVinSelect {
	fleetNameFilter?: string;
	setVinFilter: any;
	vinFilter: string[];
	className: string;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isDisabled?: boolean;
	formik?: FormikValues;
	placeholder?: string;
}

const VinSelectMultiple: FC<IVinSelect> = ({
	fleetNameFilter,
	setVinFilter,
	vinFilter,
	className,
	invalidFeedback,
	isValid,
	isTouched,
	isDisabled,
	formik,
	placeholder = 'All Vins',
}): JSX.Element => {
	const { vinByFleet } = useSelector((state: RootState) => state.vehicles);
	const { t } = useTranslation(['vehicles']);
	const isLoading = useSelector(
		(state: RootState) => state.loading.effects.vehicles.getVinByFleet,
	);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const toggleDropdown = () => {
		setDropdownOpen(!dropdownOpen);
	};
	const dispatch = useDispatch();

	const { filterPayload } = useSelector((state: RootState) => state.filters);

	const [selectedVins, setSelectedVins] = useState<string[]>(vinFilter);
	const { customProperties } = store.getState().auth;

	let organisationId = customProperties.organisation_id ? customProperties.organisation_id : '';

	useEffect(() => {
		if (fleetNameFilter) {
			const payloadFilter = {
				fleetname: fleetNameFilter || 'All Fleets',
				organisation_id: organisationId, 

			};
			dispatch.vehicles.getVinByFleet(payloadFilter);
		}
	}, [fleetNameFilter, dispatch,organisationId]);

	useEffect(() => {
		setSelectedVins(vinFilter);
	}, [vinFilter]);

	const handleCheckboxChange = (vin: string) => {
		let newSelectedVins = [...selectedVins];

		// If 'All Vins' is selected
		if (vin === 'All Vins') {
			// If 'All Vins' is already selected, deselect all
			if (selectedVins.includes('All Vins')) {
				newSelectedVins = [];
			} else {
				// If 'All Vins' is not selected, select 'All Vins' and deselect others
				newSelectedVins = ['All Vins'];
			}
		} else {
			// If any other VIN is selected, deselect 'All Vins' if it's selected
			if (selectedVins.includes('All Vins')) {
				newSelectedVins = newSelectedVins.filter((item) => item !== 'All Vins');
			}

			// Toggle the selected VIN
			if (newSelectedVins.includes(vin)) {
				newSelectedVins = newSelectedVins.filter((item) => item !== vin);
			} else {
				newSelectedVins.push(vin);
			}

			// If no VINs are selected, select 'All Vins'
			if (newSelectedVins.length === 0) {
				newSelectedVins = ['All Vins'];
			}
		}
		setSelectedVins(newSelectedVins);
		setVinFilter(newSelectedVins);
		if (formik) {
			formik.setFieldValue('vin', newSelectedVins);
		}
	
	};
	useEffect(() => {
		// If vinFilter contains something else besides 'All Vins', remove 'All Vins'
		if (vinFilter.length > 1 && vinFilter.includes('All Vins')) {
			const updatedVinFilter = vinFilter.filter((vin) => vin !== 'All Vins');
			setVinFilter(updatedVinFilter);
		}

		// If no VINs are selected, add 'All Vins' to vinFilter
		if (vinFilter.length === 0) {
			setVinFilter(['All Vins']);
		}
	}, [vinFilter, setVinFilter]);

	const handleSelectAllToggle = () => {
		if (selectedVins.length === vinByFleet?.length - 1) {
			// Deselect all if all are selected
			setSelectedVins([]);
			setVinFilter([]);
		} else {
			// Select all if at least one is selected
			// const allVins = vinByFleet.map((vin) => vin.vin_no);
			// setSelectedVins(allVins);
			// setVinFilter(allVins);
		}
	};
	 
	return (
		<div className={className}>
			<div className='custom-dropdown' style={{ position: 'relative' }}>
				<button
					type='button'
					className='form-select form-control text-start vin-select-button'
					onClick={toggleDropdown}
					style={{ width: '100%' }} // Ensure button is responsive
				>
					{selectedVins.includes('All Vins') || selectedVins.length === 0
						? t(placeholder) // Display 'All Vins' or placeholder text
						: selectedVins.length === 1
						? selectedVins[0] // Show the single selected VIN
						: `${selectedVins.length} ${t('VINs Selected')}`}{' '}
					{/* Show the number of selected VINs if more than one */}
				</button>

				{dropdownOpen && (
					<div
						className='dropdown-menu'
						style={{
							padding: '10px',
							display: 'block',
							position: 'absolute',
							zIndex: 1000,
							width: '100%', // Inherit the button's width
							boxSizing: 'border-box', // Include padding and border in the element's width and height
						}}>
						<div
							style={{
								overflowY: 'auto',
								maxHeight: '200px',
							}}>
							{/* Render the "All Vins" option first */}
							<label
								className='dropdown-item-alert-vin ps-3'
								style={{ borderBottom: '1px solid #ccc' }}>
								<input
									type='checkbox'
									checked={
										(selectedVins.length === vinByFleet?.length-1) 
									}
									onChange={handleSelectAllToggle}
									disabled={isDisabled}
								/>
								<p className='m-2'>{t('All Vins')}</p>
							</label>

							{/* Filter out "All Vins" from vinByFleet and render the rest */}
							{isLoading ? (
								<div className='dropdown-item'>{t('Loading...')}</div>
							) : vinByFleet?.length > 0 ? (
								vinByFleet
									.filter(
										(value: { vin_no: string }) => value.vin_no !== 'All Vins',
									)
									.map((value: { vin_no: string }, index: number) => (
										<label key={index} className='dropdown-item'>
											<input
												type='checkbox'
												checked={
													selectedVins.includes(value.vin_no)
													// || 	selectedVins.includes('All Vins')
												}
												onChange={() => handleCheckboxChange(value.vin_no)}
												disabled={isDisabled}
											/>
											<p className='m-2'>{t(value.vin_no)}</p>
										</label>
									))
							) : (
								<div className='dropdown-item'>{t('No VINs available')}</div>
							)}
						</div>
					</div>
				)}
			</div>
			{invalidFeedback && !isValid && isTouched && (
				<div className='invalid-feedback'>{invalidFeedback}</div>
			)}
		</div>
	);
};

export default VinSelectMultiple;
