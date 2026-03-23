import React, { useContext, FC } from 'react';
import { useTranslation } from 'react-i18next';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Select from '../../../../components/bootstrap/forms/Select';
import ThemeContext from '../../../../contexts/themeContext';

const MapSelect: FC = (): JSX.Element => {
	const { t } = useTranslation(['setup']);
	const { mobileDesign } = useContext(ThemeContext);

	return (
		<Card className={`m-auto mb-4 ${mobileDesign ? 'w-100' : 'w-75'}`}>
			<CardHeader className='pb-0'>
				<CardTitle className='fs-6'>{t('Maps')}</CardTitle>
			</CardHeader>
			<CardBody className='pt-0'>
				<Select disabled ariaLabel='select-map'>
					<option selected disabled>
						{t('Select a map')}
					</option>
					<option value='GoogleMap'>Google Map</option>
					<option value='OSM'>Open Street Map</option>
				</Select>
			</CardBody>
		</Card>
	);
};

export default MapSelect;
