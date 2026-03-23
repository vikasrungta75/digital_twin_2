import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Select from '../../../components/bootstrap/forms/Select';
import { RootState } from '../../../store/store';
import { useGetREGNO } from '../../../services/driver';

interface IRegSelect {
	handleChange: (e: string) => void;
	value: string | undefined;
	className: string;
	invalidFeedback?: string;
	isTouched?: boolean;
	isValid?: boolean;
	isDisabled?: boolean;
}

const RegSelect: FC<IRegSelect> = ({
	handleChange,
	value,
	className,
	invalidFeedback,
	isValid,
	isTouched,
	isDisabled,
}): JSX.Element => {
	const { t } = useTranslation(['vehicles']);


	const { data, refetch, isLoading } = useGetREGNO();

	const [regNo, setRegNo] = useState([])

	useEffect(() => {
		refetch()
		if (data) {
			
			setRegNo(data)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data])




	return (
		<div className={className}>
			<Select
				isLoading={isLoading}
				className='form-control'
				ariaLabel='vehicle-select'
				placeholder={t('All Regs')}
				value={value}
				invalidFeedback={invalidFeedback}
				isTouched={isTouched}
				isValid={isValid}
				onChange={(e: { target: { value: string } }) => {
					handleChange(e.target.value);
				}}>
				<option disabled selected value={value || ' '}>
					{value || t('select a Reg number')}
				</option>

				{regNo?.map((item: { reg_no: string }, index: number) => {
					return (
						<option key={index} value={item.reg_no} selected={item.reg_no === value} >
							{item.reg_no}
						</option>
					);
				})}
			</Select>
		</div>
	);
};

export default RegSelect;
