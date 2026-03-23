import React, { ChangeEvent, FC, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './bootstrap/forms/Input';
import ThemeContext from '../contexts/themeContext';
import ScheduleIcon from '@mui/icons-material/Schedule';
interface ITimePicker {
	time: any;
	setTime: (e: ChangeEvent<HTMLInputElement>) => void;
	name: any;
}

const TimePickerOne: FC<ITimePicker> = ({ time, setTime, name }): JSX.Element => {
	const { t } = useTranslation(['vehicles']);
	const { mobileDesign } = useContext(ThemeContext);

	
	const timeInputRef: any = useRef(null);

	const handleIconClick = () => {
		if (timeInputRef.current) {
			timeInputRef.current.click();
		}
	};
	return (
		<div className={`timeBox ${mobileDesign ? 'mt-3' : ''}`}>
			<div className='d-flex time-input-container' onClick={handleIconClick}>
				<ScheduleIcon sx={{ color: 'black', fontSize: 26 }} className='custom-icon' />
				<Input
					name={name}
					type='time'
					value={time} // Keep HH:MM:SS
					required
					onChange={(e: any) => {
						const newTime = e.target.value;
						setTime(newTime); // Update time state to HH:MM:SS
					}}
					className='time-input'
				/>

				<span className='time-label hours-label'>
					{`${time.slice(0, 2)}HH ${time.slice(3, 5)}MM ${time.slice(6, 8)}SS`}
				</span>
			</div>
		</div>
	);
};

export default TimePickerOne;
