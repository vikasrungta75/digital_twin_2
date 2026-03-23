import React, { useContext, FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/bootstrap/Button';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../components/bootstrap/Card';
import Spinner from '../../../../components/bootstrap/Spinner';
import ThemeContext from '../../../../contexts/themeContext';
import LANG, { getLangWithKey, ILang } from '../../../../lang';
import useGetCurrencies, { ICurrencySelectProps } from '../../../../hooks/useGetCurrencies';

const CurrencySelect: FC<ICurrencySelectProps> = ({
	languageSelected,
	currencyeSelected,
	setCurrencySelected,
}): JSX.Element => {
	const { t, i18n } = useTranslation(['setup']);
	const { mobileDesign } = useContext(ThemeContext);

	const countries = useGetCurrencies();

	return (
		<Card className={`m-auto mb-4 ${mobileDesign ? 'w-100' : 'w-75'}`}>
			<CardHeader className='pb-0'>
				<CardTitle className='fs-6'>
					{t('Currency')} - {currencyeSelected} -
				</CardTitle>
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
							// disabled
							value={currencyeSelected}
							className={`d-flex justify-content-center form-select ${
								mobileDesign ? 'w-100' : 'w-100'
							}`}
							onChange={(e: any) => {
								setCurrencySelected(e.target.value);
							}}
							aria-label='Default select example'>
							<option selected disabled value=''>
								{t('Select a Currency')}
							</option>
							{countries &&
								Object.keys(countries).map((country: string) => (
									<option key={country} value={countries[country]}>
										{country}
									</option>
								))}
						</select>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default CurrencySelect;
