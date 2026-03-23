export interface ILang {
	[key: string]: {
		text: string;
		lng: 'en-US' | 'hn-HN' | 'fr-FR' | 'ar-AR';
		icon: string;
	};
}

const LANG: ILang = {
	// AR: {
	// 	text: 'Arabic',
	// 	lng: 'ar-AR',
	// 	icon: 'CustomSaudiArabia',
	// },
	EN: {
		text: 'English',
		lng: 'en-US',
		icon: 'CustomUsa',
	},
	FR: {
		text: 'Français',
		lng: 'fr-FR',
		icon: 'CustomFrance',
	},
	// HN: {
	// 	 text: 'Hindi',
	// 	lng: 'hn-HN',
	// 	icon: 'CustomHindi',
	// },
};

export const getLangWithKey = (key: ILang['key']['lng']): ILang['key'] => {
	// @ts-ignore
	return LANG[Object.keys(LANG).filter((f) => LANG[f].lng === key)];
};

export const I18nLanguageCodeMapper : any = {

	"en-US": "en",  
	// 'hn-HN': "hn",
	'fr-FR': "fr",
	// 'ar-AR': "ar"

}
export default LANG;
