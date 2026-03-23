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
			<div className='d-flex'>
				<label
					className='border-0 bg-transparent cursor-pointer m-auto me-3'
					htmlFor='searchInput'>
					{t('From')}
				</label>
				<Input
					name='startTime'
					type='time'
					value={time.startTime}
					step={1}
					required
					onChange={(e: ChangeEvent) => handleChangeTime(e)}
				/>
				<label
					className='border-0 bg-transparent cursor-pointer m-auto mx-3'
					htmlFor='searchInput'>
					{t('to')}
				</label>
				<Input
					name='endTime'
					type='time'
					value={time.endTime}
					step={1}
					min={time.startTime}
					required
					onChange={(e: ChangeEvent) => handleChangeTime(e)}
				/>
			</div>
		</div>
	);
};

export default TimePicker;
