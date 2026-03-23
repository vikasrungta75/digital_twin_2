import React, { useContext, FC } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/bootstrap/Button';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Spinner from '../../../../components/bootstrap/Spinner';
import ThemeContext from '../../../../contexts/themeContext';
import LANG, { getLangWithKey, ILang } from '../../../../lang';

interface ILanguageSelectProps {
	languageSelected: string;
	setlanguageSelected: React.Dispatch<React.SetStateAction<string>>;
}
const LanguageSelect: FC<ILanguageSelectProps> = ({
	languageSelected,
	setlanguageSelected,
}): JSX.Element => {
	const { t, i18n } = useTranslation(['setup']);
	const { mobileDesign } = useContext(ThemeContext);

	return (
		<Card className={`m-auto mb-4 ${mobileDesign ? 'w-100' : 'w-75'}`}>
			<CardHeader className='pb-0'>
				<CardTitle className='fs-6'>{t('Languages')}</CardTitle>
			</CardHeader>
			<CardBody className='pt-0'>
				{typeof getLangWithKey(i18n.language as ILang['key']['lng'])?.icon ===
				'undefined' ? (
					<Button
						// eslint-disable-next-line react/jsx-props-no-spreading
						className='btn-only-icon'
						aria-label='Change language'
						data-tour='lang-selector'>
						<Spinner isSmall inButton='onlyIcon' isGrow />
					</Button>
				) : (
					<div className='d-flex justify-content-center'>
						<select
							value={languageSelected}
							className={`d-flex justify-content-center form-select ${
								mobileDesign ? 'w-100' : 'w-100'
							}`}
							onChange={(e: any) => {
								setlanguageSelected(e.target.value);
							}}
							aria-label='Default select example'>
							<option disabled>{t('Select a language')}</option>
							{Object.keys(LANG).map((i) => {
								return (
									<option key={LANG[i].text} value={LANG[i].lng}>
										{LANG[i].text}
									</option>
								);
							})}
						</select>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default LanguageSelect;
