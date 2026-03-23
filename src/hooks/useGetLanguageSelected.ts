import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useGetLanguageSelected = () => {

    const { i18n } = useTranslation(['help']);

	const [languageSelected, setlanguageSelected] = useState<string>('');
  
    useEffect(() => {
		if (i18n.language.includes('fr-FR')) {
			setlanguageSelected('fr');
		}
		if (i18n.language.includes('en-US')) {
			setlanguageSelected('en');
		}
		if (i18n.language.includes('hn-HN')) {
			setlanguageSelected('hn');
		}
	}, [i18n.language]);
  
    return languageSelected;
  };
  
  export default useGetLanguageSelected;