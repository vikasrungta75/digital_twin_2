import React, { FC } from 'react';
import Icon from '../../../components/icon/Icon';
import { displayColorIcon, displayIcon } from '../../../helpers/helpers';
import { useTranslation } from 'react-i18next';

interface PasswordCriteriaProps {
	lengthError: boolean | undefined;
	specialCharacterMissing: boolean | undefined;
	uppercaseMissing: boolean | undefined;
	lowercaseMissing: boolean | undefined;
	numberMissing: boolean | undefined;
}

const PasswordCriteria: FC<PasswordCriteriaProps> = ({
	lengthError,
	specialCharacterMissing,
	uppercaseMissing,
	lowercaseMissing,
	numberMissing,
}) => {
	const { t } = useTranslation(['authPage']);
	const contrains = [
		{ text: `${t('min/max', { min: 8, max: 15 })}`, hasError: lengthError },
		{ text: `${t('at least, one special character')}`, hasError: specialCharacterMissing },
		{ text: `${t('at least, one Uppercase Alphabet')}`, hasError: uppercaseMissing },
		{ text: `${t('at least, one Lowercase Alphabet')}`, hasError: lowercaseMissing },
		{ text: `${t('at least, one number')}`, hasError: numberMissing },
	];
	return (
		<div className='ms-2'>
			<div className='fw-bold'>{t('Password must contain:')} </div>
			<ul className='mt-3 mb-4 ps-0'>
				{contrains.map(({ text, hasError }, index) => {
					return (
						<div key={index}>
							<Icon
								icon={displayIcon(hasError)}
								color={displayColorIcon(hasError)}
								className='me-2'
							/>
							{text}
						</div>
					);
				})}
			</ul>
		</div>
	);
};

export default PasswordCriteria;
