import React, { useContext, FC } from 'react';
import { useTranslation } from 'react-i18next';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Select from '../../../../components/bootstrap/forms/Select';
import ThemeContext from '../../../../contexts/themeContext';
import timezones from '../../../../common/data/timezone/timezones.json';

interface ITimezoneSelectProps {
	timezoneSelected: string;
	setTimezoneSelected: React.Dispatch<React.SetStateAction<string>>;
}
const TimezoneSelect: FC<ITimezoneSelectProps> = ({
	timezoneSelected,
	setTimezoneSelected,
}): JSX.Element => {
	const { t } = useTranslation(['setup']);
	const { mobileDesign } = useContext(ThemeContext);

	return (
		<Card className={`m-auto ${mobileDesign ? 'w-100' : 'w-75'}`}>
			<CardHeader className='pb-0'>
				<CardTitle className='fs-6'>{t('Timezones')}</CardTitle>
			</CardHeader>
			<CardBody className='pt-0'>
				<Select
					ariaLabel='select-timezone'
					value={timezoneSelected}
					onChange={(e: { target: { value: string } }) => {
						setTimezoneSelected(e.target.value);
					}}>
					<option disabled>{t('Select a timezone')}</option>
					{timezones.map(({ text }) => {
						return (
							<option key={text} value={text}>
								{text}
							</option>
						);
					})}
				</Select>
			</CardBody>
		</Card>
	);
};

export default TimezoneSelect;
