import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nLanguageCodeMapper } from '../lang';

const useLanguage = () => {

    const { i18n } = useTranslation(['help']);

    const [languageISOCode, setLanguageISOCode] = useState<string>(I18nLanguageCodeMapper[i18n.language]);
  
    useEffect(() => {
      setLanguageISOCode(I18nLanguageCodeMapper[i18n.language]);
    }, [i18n.language, languageISOCode]);
  
    return languageISOCode;
  };
  
  export default useLanguage;