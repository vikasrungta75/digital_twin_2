import React, { ChangeEvent, FC, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './bootstrap/forms/Input';
import ThemeContext from '../contexts/themeContext';

interface ITimePicker {
	setTime: any;
	time: { [key: string]: string };
}

const TimePicker: FC<ITimePicker> = ({ setTime, time }): JSX.Element => {
	const { t } = useTranslation(['vehicles']);
	const { mobileDesign } = useContext(ThemeContext);

	const handleChangeTime = (e: ChangeEvent) => {
		const { name, value } = e.target as HTMLInputElement;
		setTime({ ...time, [name]: value });
	};

	return (
		<div className={`timeBox ${mobileDesign ? 'mt-3' : ''}`}>
			<div className='row d-flex justify-content-center  '>
				<div className=' d-flex col-2  justify-content-center'>
					<label
						className='border-0 bg-transparent cursor-pointer m-auto me-3  '
						htmlFor='searchInput'>
						{'HH:mm:ss'}
					</label>
				</div>
				<div className='col-6'>
					<Input
						name='startTime'
						type='time'
						value={time.startTime}
						step={1}
						required
						onChange={(e: ChangeEvent) => handleChangeTime(e)}
					/>
				</div>
			</div>
		</div>
	);
};

export default TimePicker;
