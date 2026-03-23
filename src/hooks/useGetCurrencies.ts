import { useEffect, useState } from 'react';
export interface ICurrencySelectProps {
	languageSelected: string;
	currencyeSelected: string;
	setCurrencySelected: React.Dispatch<React.SetStateAction<string>>;
}
export interface CountryData {
	name: string;
	currencies: { code: string }[];
}
const useGetCurrencies = () => {


	const [countries, setCountries] = useState<any>({});
    useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('https://restcountries.com/v2/all');
				const data: CountryData[] = await response.json();
				const countryData: { [key: string]: string } = {};
				data.forEach((country) => {
					const name = country.name;
					const currency =
						typeof country.currencies !== 'undefined'
							? country.currencies[0].code
							: 'unknown';
					countryData[name] = currency;
				});

				setCountries(countryData);
			} catch (error) {
				
			}
		};

		fetchData();
	}, []);

    return countries;
    
  };
  
  export default useGetCurrencies;