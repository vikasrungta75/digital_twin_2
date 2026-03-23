import CheckedIcon from '../assets/img/wanna/checked24.png';
import AddIcon from '../assets/img/wanna/add32.png';
import moment from 'moment';
import timezones from '../common/data/timezone/timezones.json';
import { IDateRangeFilter } from '../type/history-type';
import { IPayloadFilter } from '../store/filters';
import { store } from '../store/store';
import { ICoordinates } from '../type/geofences-type';
import { IAuthPermissions } from '../type/auth-type';
import { useTranslation } from 'react-i18next';
export function test() {
	return null;
}

export function getOS() {
	const { userAgent } = window.navigator;
	const { platform } = window.navigator;
	const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
	let os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
		os = 'MacOS';
	} else if (iosPlatforms.indexOf(platform) !== -1) {
		os = 'iOS';
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
		os = 'Windows';
	} else if (/Android/.test(userAgent)) {
		os = 'Android';
	} else if (!os && /Linux/.test(platform)) {
		os = 'Linux';
	}

	// @ts-ignore
	document.documentElement.setAttribute('os', os);
	return os;
}

export const hasNotch = () => {
	/**
	 * For storybook test
	 */
	const storybook = window.location !== window.parent.location;
	// @ts-ignore
	const iPhone = /iPhone/.test(navigator.userAgent) && !window.MSStream;
	const aspect = window.screen.width / window.screen.height;
	const aspectFrame = window.innerWidth / window.innerHeight;
	return (
		(iPhone && aspect.toFixed(3) === '0.462') ||
		(storybook && aspectFrame.toFixed(3) === '0.462')
	);
};

export const mergeRefs = (refs: any[]) => {
	return (value: any) => {
		refs.forEach((ref) => {
			if (typeof ref === 'function') {
				ref(value);
			} else if (ref != null) {
				ref.current = value;
			}
		});
	};
};

export const randomColor = () => {
	const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger'];

	const color = Math.floor(Math.random() * colors.length);

	return colors[color];
};

export const priceFormat = (price: number) => {
	return price.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
	});
};

export const average = (array: any[]) => array.reduce((a, b) => a + b) / array.length;

export const percent = (value1: number, value2: number) =>
	Number(((value1 / value2 - 1) * 100).toFixed(2));

export const getFirstLetter = (text: string, letterCount = 2): string =>
	// @ts-ignore
	text
		.toUpperCase()
		.match(/\b(\w)/g)
		.join('')
		.substring(0, letterCount);

export const debounce = (func: (arg0: any) => void, wait = 1000) => {
	let timeout: string | number | NodeJS.Timeout | undefined;

	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			// @ts-ignore
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

export const capitalizeFirstLetter = (string: string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};

export const displayColorIcon = (criteria: boolean | undefined) => {
	switch (criteria) {
		case false:
			return 'success';
		case true:
			return 'danger';
		default:
			return undefined;
	}
};

export const displayIcon = (criteria: boolean | undefined) => {
	switch (criteria) {
		case false:
			return 'CheckCircleOutline';
		case true:
			return 'CancelOutlined';
		default:
			return 'ArrowRight';
	}
};

export function checkUppercase(str: string) {
	for (var i = 0; i < str.length; i++) {
		if (str.charAt(i) === str.charAt(i).toUpperCase() && str.charAt(i).match(/[a-z]/i)) {
			return true;
		}
	}
	return false;
}
export function checkLowercase(str: string) {
	for (var i = 0; i < str.length; i++) {
		if (str.charAt(i) === str.charAt(i).toLowerCase() && str.charAt(i).match(/[A-Z]/i)) {
			return true;
		}
	}
	return false;
}

export let addedPermissions = [
	10001, 10020, 10021, 10022, 10023, 10024, 10025, 10026, 10027, 10028, 10029, 100100, 10001,
	10190859, 10190860,
];

export let menuPermissions = [10190859, 10190860];

export const stringifyParamArray = (param: string, arr: string[] | number[]) => {
	if (arr) {
		let strArr = arr
			.map((perm) => {
				return `${param}[]=${perm}`;
			})
			.join('&');
		return strArr;
	}
	return '';
};

// style of multiple select
export const ColorStyles = {
	control: (styles: any, state: any) => ({
		...styles,
		backgroundColor: '#f8f9fa',
		border: state.isFocused ? '1px solid #b6aee9' : '1px solid #e3e3e3',
		boxShadow: state.isFocused ? '' : 'inset 0 1px 2px rgb(0 0 0 / 8%)',
	}),

	option: (styles: any, { isSelected }: any) => {
		if (isSelected) {
			return {
				...styles,
				backgroundColor: 'white',
				color: 'black',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				minHeight: '50px',
				':after': {
					content: `url(${CheckedIcon})`,
					width: '32px',
					textAlign: 'center',
				},
			};
		}

		return {
			...styles,
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			minHeight: '50px',
			':after': {
				content: `url(${AddIcon})`,
			},
		};
	},

	multiValue: (styles: any) => {
		return {
			...styles,
			backgroundColor: 'white',
			border: '3px solid #0BB4F1',
			borderRadius: '30px',
			position: 'relative',
			paddingLeft: '15px',
			paddingRight: '5px',
		};
	},

	multiValueRemove: (styles: any) => {
		return {
			...styles,
			position: 'absolute',
			top: '4px',
			left: '2px',
			cursor: 'pointer',
			':hover': {
				color: 'black',
			},
		};
	},
};

export interface IGenerateWSDLFilters {
	[key: string]: string | number;
}
export const generateWSDL = (
	token: string | undefined,
	filters: IGenerateWSDLFilters[],
	serviceName: string | undefined,
) => {
	const filtersToDisplay = filters
		.map((filter: IGenerateWSDLFilters) =>
			Object.keys(filter).map((key) => `<${key}>${filter[key]}</${key}>`),
		)
		.join('\n');
	const xlmString = `<Envelope
	xmlns="http://schemas.xmlsoap.org/soap/envelope/">
	<Body>
		<executeQuery
			xmlns="http://webservice.required.bdbizviz.com">
			<filter
				xmlns="">
				${filtersToDisplay}
            
			</filter>
			<AuthToken
				xmlns="">${token}
            
			</AuthToken>
			<key
				xmlns="">
				<serviceName>${serviceName}</serviceName>
				<dataType>JSON</dataType>
				<Limit></Limit>
			</key>
		</executeQuery>
	</Body>
</Envelope>`;

	return xlmString;
};

export const generateRestAPI = (
	filters: any[],
	serviceName: any | undefined,
) => {
	// Convertir les filtres en une seule liste d'objets clé-valeur
	const mergedFilters = filters.reduce((acc, filter) => {
		Object.keys(filter).forEach((key) => {
			acc[key] = filter[key];
		});
		return acc;
	}, {});

	// Convertir les filtres en chaîne de requête
	const queryString: string = Object.keys(mergedFilters)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(mergedFilters[key])}`)
		.join('&');

	// Construire l'URL avec les filtres
	return `${serviceName}?${queryString}`;
};

export const convertXmlToJson = (data: string) => {
	const parser = new DOMParser();
	const xml: any = parser.parseFromString(data, 'text/xml');
	const convertedToJson = JSON.parse(xml.getElementsByTagName('records')[0].textContent);
	return convertedToJson;
};

export const flatDeep = (arr: any[]): any[] => {
	return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val) : val), []);
};

/**
 *
 * @param arr : array of data
 * @param key (string) : object.key to compare
 * @returns array sorted by key
 */
export const sortData = (arr: string[], key: any): any[] => {
	return arr.sort((a: any, b: any) => a[key].localeCompare(b[key]));
};

export const convertToDate = (dateStr: any) => {
	const [year, month, day] = dateStr.split('-');
	return new Date(`${month}/${day}/${year}`);
};

/**
 * @returns date in format YYYY-MM-DD by default otherwise defined format
 */
export const dateFormatter = (date: Date | undefined, format = 'YYYY-MM-DD'): string => {
	return moment(date).format(format);
};
export const dateFormatterwithHours = (date: any, format = 'YYYY-MM-DD HH:mm:ss'): string => {
	 
	return   moment(date?.$date).format(format);
};

/**
 * @returns  new Date() according to favorite timezone
 * (if no timezone defined, browser timezone will be choosen)
 */
export const convertToDateWithUTC = (dateStr: Date, timezone: string) => {
	let utc;
	if (timezone) {
		utc = timezones.find((tz) => tz.text === timezone)?.utc[0];
	} else {
		utc = Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
	return new Date(dateStr.toLocaleString('en-US', { timeZone: utc }));
};
/**
 * Converts a date to UTC based on the given timezone
 * @param dateStr The date to convert
 * @param timezone The source timezone
 * @returns Date in UTC
 */
// export const convertToDateWithUTC2 = (dateStr: Date, timezone: string): Date => {
// 	// Get the timezone's UTC offset in minutes
// 	const timeZoneOffset = timezones.find((tz) => tz.text === timezone)?.offset || 0;
	
// 	// Convert hours to milliseconds (offset * 60 min * 60 sec * 1000 ms)
// 	const offsetMs = timeZoneOffset * 60 * 60 * 1000;
	
// 	// Subtract the offset to convert to UTC
// 	return new Date(dateStr.getTime() - offsetMs);
// };
// export const convertToDateWithUTC2 = (dateStr: Date, timezone: string): string => {
//   const timeZoneOffset = timezones.find((tz) => tz.text === timezone)?.offset || 0;
//   const offsetMs = timeZoneOffset * 60 * 60 * 1000;

//   const localDate = new Date(dateStr.getTime() - offsetMs);

//   // Format manually without the trailing Z
//   return localDate.toISOString().replace('Z', '');
// };
export const convertToDateWithUTC2 = (dateStr: Date, timezone: string): string => {
  const timeZoneOffset = timezones.find((tz) => tz.text === timezone)?.offset || 0;
  const offsetMs = timeZoneOffset * 60 * 60 * 1000;
  const localDate = new Date(dateStr.getTime() - offsetMs);

  // Build YYYY-MM-DDTHH:mm:ss (no .000 and no Z)
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const convertToDateWithUTC3 = (dateStr: Date, timezone: string): string => {
	// Get the timezone's UTC offset in minutes
	const timeZoneOffset = timezones.find((tz) => tz.text === timezone)?.offset || 0;
	
	// Convert hours to milliseconds (offset * 60 min * 60 sec * 1000 ms)
	const offsetMs = timeZoneOffset * 60 * 60 * 1000;
	
	// Add the offset to get timezone time (instead of subtracting for UTC)
	const date = new Date(dateStr.getTime() + offsetMs);
	
	// Format the date as YYYY-MM-DD HH:mm:ss
	return date.toISOString()
		.replace('T', ' ')      // Replace T with space
		.substring(0, 19);      // Take only the first 19 characters (removes milliseconds and Z)
};

/**
 * @returns browser timezone text (from timezones.json )
 *  i.e : "text": "(UTC-11:00) Coordinated Universal Time-11"
 */
export const getBrowserDateUTCByText = (): string => {
	const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const browserTimezoneText = timezones.find((timezone) =>
		timezone.utc.includes(browserTimezone),
	)?.text;
	return browserTimezoneText || '';
};

/**
 * @returns Converted date from UTC to prefered Timzone. Format by default will be : 2023-01-15 3:43:00 PM
 */
export const convertFromUTCtoTZ = (
	date: Date | string,
	preferedTimeZone: string,
	format: string = 'YYYY-MM-DD HH:mm:ss',
): string => {
	let timezoneOffset =
		timezones.find((timezone) => timezone.text === preferedTimeZone)?.offset || 0;
	if (date instanceof Date) {
		return dateFormatter(new Date(date.getTime() + timezoneOffset * 60 * 60 * 1000), format);
	} else {
		// instance of string
		const newDate = new Date(date);
		return dateFormatter(new Date(newDate.getTime() + timezoneOffset * 60 * 60 * 1000), format);
	}
};
export const convertTimestampToDateWithUTC = (
	timestamp: { "$date": number },
	preferedTimeZone: string,
	format: string = 'YYYY-MM-DD HH:mm:ss',
): string => {
	
	// Find the timezone offset based on the preferred time zone
	let timezoneOffset =
		timezones.find((timezone) => timezone.text === preferedTimeZone)?.offset || 0;

	// Create a new Date object from the timestamp and adjust for the timezone offset
	let date = new Date(timestamp.$date + timezoneOffset * 60 * 60 * 1000);

	// Format the date based on the provided format
	return dateFormatter(date, format);
};

/**
 * @returns Converted date from prefered Timzone to UTC. Format by default will be : 2023-01-15 3:43:00 PM
 */
export const convertFromTZToUTC = (
	date: Date,
	preferedTimeZone: string,
	format: string = 'YYYY-MM-DD HH:mm:ss',
): string => {
	let timezoneOffset =
		timezones.find((timezone) => timezone.text === preferedTimeZone)?.offset || 0;
	return dateFormatter(new Date(date.getTime() - timezoneOffset * 60 * 60 * 1000), format);
};

export const displayButtonAccordingToPermissions = (
	groupName: string,
	permissions: { [key: string]: boolean },
) => {
	if (permissions?.edit_permissions_for_each_roles && groupName === 'Fleet Admin') {
		return true;
	}
	if (permissions?.edit_permissions_for_each_roles && groupName === 'Fleet Manager') {
		return true;
	}
	if (
		(permissions?.edit_permissions_for_viewer_role ||
			permissions?.edit_permissions_for_each_roles) &&
		groupName === 'Viewer Role'
	) {
		return true;
	}
};

/**
 * This function initialize state default values with filters stored in Redux (if exists)
 * and with prefered timezone
 * @param preferedTimeZone
 * @param filterPayload
 * @returns startDate, endDate, startTime and endTime
 */
export const getDefaultDateRangeFilter = (
	preferedTimeZone: string,
	filterPayload?: IPayloadFilter,
): IDateRangeFilter => {
	return {
		startDate:
			(filterPayload && filterPayload.startDate) ||
			convertFromTZToUTC(new Date(), preferedTimeZone, 'YYYY-MM-DD'),
		endDate:
			(filterPayload && filterPayload.endDate) ||
			convertFromTZToUTC(new Date(), preferedTimeZone, 'YYYY-MM-DD'),
		startTime: (filterPayload && filterPayload.startTime) || '01:01:01',
		endTime: (filterPayload && filterPayload.endTime) || '23:59:59',
	};
};

/**
 * This function initialize state default values with filters stored in Redux (if exists)
 * and with prefered timezone
 * @param preferedTimeZone
 * @param filterPayload
 * @returns startDate, endDate, startTime and endTime
 */
export const getDefaultDateFilter = (
	preferedTimeZone: string,
	filterPayload?: IPayloadFilter,
): any => {
	return  (filterPayload && filterPayload.startDate) || convertFromTZToUTC(new Date(), preferedTimeZone);
};

/**
 * This function initialize state default values with filters stored in Redux (if exists)
 * and with prefered timezone
 * @param preferedTimeZone
 * @param filterPayload
 * @returns startDate, endDate, startTime and endTime
 */
export const getDefaultDateFilter2 = (
	preferedTimeZone: string,
	filterPayload?: IPayloadFilter,
	date?: any,
): any => {
	return  (filterPayload && filterPayload.startDate) || convertFromTZToUTC(new Date(date), preferedTimeZone);
};
/**
 * This function initialize state default values with filters stored in Redux (if !== null).
 * It will check fleet list to return first on the list if list === 1
 * If list > 1, it will return All Fleets
 * @returns fleet's name or All Fleets
 */
export const getDefaultFleetFilter2 = (): string => {
	const filterFleetPayload = store.getState().filters.filterPayload.fleet;
	const allFleets = store.getState().vehicles.groupNameFilterStatus;
	if (filterFleetPayload === null) {
		if (allFleets.length === 1) {
			return allFleets[0]._id;
		} else return 'All Fleets';
	} else return filterFleetPayload;
};

export const getDefaultFleetFilter = (): string => {
	const { customProperties } = store.getState().auth; 
	let fleetId= customProperties.fleetId ? customProperties.fleetId : 'All Fleets';
	return fleetId;
 
};

export const getColorPalette = (numColors: number, baseColors: string[]): string[] => {
	const colorPalette: string[] = [];

	for (let i = 0; i < numColors; i++) {
		const baseColorIndex = i % baseColors.length;
		const shadeIndex = Math.floor(i / baseColors.length);
		const shadeMultiplier = 1 - shadeIndex * 0.1;
		const newColor = adjustColor(baseColors[baseColorIndex], shadeMultiplier);
		colorPalette.push(newColor);
	}

	return colorPalette;
};

const adjustColor = (color: string, shadeMultiplier: number): string => {
	// Extraire les valeurs R, G et B de la chaîne hexadécimale
	const [r, g, b] =
		color
			.slice(1)
			.match(/.{2}/g)
			?.map((value) => parseInt(value, 16)) ?? [];

	// Vérifier que les valeurs R, G et B ont été correctement extraites
	if (typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined') {
		throw new Error(`Invalid color format: ${color}`);
	}

	// Calculer la nouvelle valeur RGB pour chaque canal de couleur
	const newR = Math.round(r * shadeMultiplier);
	const newG = Math.round(g * shadeMultiplier);
	const newB = Math.round(b * shadeMultiplier);

	// Convertir la nouvelle valeur RGB en code couleur hexadécimale
	const newColor = `#${[newR, newG, newB]
		.map((value) => {
			const hex = value.toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		})
		.join('')}`;

	return newColor;
};

export const getLocation = (): Promise<ICoordinates> => {
	return new Promise((resolve, reject) => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const coords: ICoordinates = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					resolve(coords);
				},
				(error) => reject(error),
			);
		} else {
			reject(new Error("La géolocalisation n'est pas prise en charge par ce navigateur."));
		}
	});
};

export const rotateAccordingToCoordinates = (coordinate: string): number => {
	switch (coordinate) {
		case 'N':
			return 0;
		case 'NE':
			return 45;
		case 'E':
			return 90;
		case 'SE':
			return 135;
		case 'S':
			return 180;
		case 'SW':
			return 225;
		case 'W':
			return 270;
		case 'NW':
			return 315;
		default:
			return 0;
	}
};
export interface NumberInfo {
	sign: string;
	beforeDecimal: string;
	afterDecimal?: string;
	totalInMillis?: number;
}

export function processNumber(number: number): NumberInfo {
	const result: NumberInfo = {
		sign: 'add',
		beforeDecimal: '',
	};

	// Check if the number is a float
	if (!Number.isInteger(number)) {
		result.sign = number < 0 ? 'minus' : 'add';

		const numberString = Math.abs(number).toString();
		const parts = numberString.split('.');

		result.beforeDecimal = parts[0];
		result.afterDecimal = parts[1] || ''; // Handle case when no decimal part exists

		// Convert hours to milliseconds
		const hoursInMillis = parseInt(result.beforeDecimal) * 60 * 60 * 1000;

		// Convert minutes to milliseconds
		const minutesInMillis = parseInt(result.afterDecimal) * 60 * 1000;

		// Calculate the total sum in milliseconds
		result.totalInMillis = hoursInMillis + minutesInMillis;
	} else {
		result.sign = number < 0 ? 'minus' : 'add';
		result.totalInMillis = Math.abs(number);
	}

	return result;
}
export const transformArray = (inputArray: any) => {
	const RoadTripReformed = inputArray.map((TripRoute: any) => {
		const container = {
			lat: 0,
			lng: 0,
		};
		container.lat = parseFloat(TripRoute.Mapped_latitude);
		container.lng = parseFloat(TripRoute.Mapped_longitude);
		return container;
	});
	return RoadTripReformed;
};

export const updateMarkerPosition = (tripRouteRoadState: any) => {
	if (tripRouteRoadState.length !== 0) {
		const MarkerPostion = {
			Departure: {
				lat: Number(tripRouteRoadState[0].Mapped_latitude) ?? '',
				lng: Number(tripRouteRoadState[0].Mapped_longitude) ?? '',
			},
			Current: {
				lat:
					Number(
						tripRouteRoadState[Object.keys(tripRouteRoadState).length - 1]
							.Mapped_latitude,
					) ?? '',
				lng:
					Number(
						tripRouteRoadState[Object.keys(tripRouteRoadState).length - 1]
							.Mapped_longitude,
					) ?? '',
			},
		};
		return MarkerPostion;
	}
};

export const colorsOptionMap: any = {
	'0': '#FF0000',
	'1': '#0cf054',
	'2': '#556B2F',
	'3': '#0000FF',
};

export function transformString(input: string) {
	return input.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export const hexToRGBArray = (hex: string): number[] => {
	// Supprimer le caractère '#' si présent
	hex = hex.replace(/^#/, '');

	// Extraire les composants R, G, B
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;

	return [r, g, b];
};
export function convertDatesToTimestamp(data: { name: string; data: [string, number][] }[] | null | undefined) {
	// Return empty array if data is null/undefined
	if (!data) return [];

	const newData = data.map((item) => ({
		name: item.name,
		data: (item.data || []).map((entry) => {
			if (Array.isArray(entry)) {
				const [dateString, value] = entry;
				if (!dateString) return [0, 0];
				
				const [day, month, year] = dateString.split('/');
				const timestamp = new Date(`${year}-${month}-${day}`).getTime();
				return [timestamp, value?.toFixed(2) || 0];
			}
			return entry || 0;
		}),
	}));

	return newData;
}
export function transformData(originalData: any) {
	return originalData.map((entry: any) => {
		const { x, y } = entry.data[0];
		const [day, month, year] = x.split('/');
		const timestamp = new Date(`${year}-${month}-${day}`).getTime();
		return { data: [{ x: timestamp, y }], name: entry.name };
	});
}

export const convertToNumeric = (value: string): number => {
	if (typeof value !== 'string') {
		// Handle cases where value is not a string (e.g., undefined or null)
		return 0; // Return default value or handle as appropriate
	}

	// Split the value by space to separate time components
	const parts = value.split(' ');

	// Initialize variables to hold hours, minutes, and seconds
	let hours = 0;
	let minutes = 0;
	let seconds = 0;

	// Iterate over the parts to extract hours, minutes, and seconds
	parts.forEach((part) => {
		if (part.includes('hrs')) {
			hours += parseInt(part);
		} else if (part.includes('mins')) {
			minutes += parseInt(part);
		} else if (part.includes('secs')) {
			seconds += parseInt(part);
		} else {
			// If the part is not hours, minutes, or seconds, try to parse it as a numeric value
			const numericValue = parseFloat(part);
			if (!isNaN(numericValue)) {
				// Add the numeric value to minutes if it's a whole number
				minutes += Math.floor(numericValue);
				// Add the decimal part to seconds (assuming it's representing seconds)
				seconds += (numericValue - Math.floor(numericValue)) * 60;
			}
		}
	});

	// Convert hours, minutes, and seconds to total seconds
	const totalSeconds = hours * 3600 + minutes * 60 + seconds;

	return totalSeconds;
};

export const calculateTotal = (dataxx: any[], field: string): string => {
	const total = dataxx.reduce((acc, obj) => {
		const value = obj[field];
		if (!isNaN(convertToNumeric(value)) && value !== 'Data not available') {
			acc += convertToNumeric(value);
		}
		return acc;
	}, 0);
	return `${total.toFixed(2)}`;
	// return `${total.toFixed(2)} ${field.endsWith('/h') ? 'L/h' : 'L'}`;
};


export const convertToTimeFormat = (valueInSeconds: number,t:any): string => {
	// Calculate hours, minutes, and remaining seconds
	const hours = Math.floor(valueInSeconds / 3600);
	const minutes = Math.floor((valueInSeconds % 3600) / 60);
	const seconds = valueInSeconds % 60;

	// Construct the time format string
	return `${hours} ${t("hours")}, ${minutes} ${t("minutes")}, ${seconds} ${t("seconds")}`;
};

export function extractReportNames(
	data: any,
	permissions: IAuthPermissions,
): { [key: string]: string }[] {
	const reportNames: { [key: string]: string }[] = [];

	data.forEach((item: any) => {
		item.repports.forEach((reportCategory: any) => {
			reportCategory.reports.forEach((report: any) => {
				const filteredReportAccordingToPermissions =
					permissions[stringWithUnderscore(report.id)] === true;
				
				if (filteredReportAccordingToPermissions) {
					reportNames.push({ label: report.name, value: report.name });
				}
			});
		});
	});

	return reportNames.sort((a, b) => a.label.localeCompare(b.label));
}

export const stringWithUnderscore = (value: string): string =>
	value.replace(/\s/g, '_').toLocaleLowerCase();

export function extractAlertsForPieChart(alerts: { count: number; alert_type: string }[] | null | undefined) {
	// Return empty chart data if alerts is null/undefined or empty
	if (!alerts || alerts.length === 0) {
		return [{
			data: [{
				series: [],
				labels: []
			}],
			name: 'Alerts Distribution'
		}];
	}

	// Group alerts by type and sum their counts
	const groupedAlerts = alerts.reduce((acc: { [key: string]: number }, curr) => {
		acc[curr.alert_type] = (acc[curr.alert_type] || 0) + curr.count;
		return acc;
	}, {});

	return [{
		data: [{
			series: Object.values(groupedAlerts),
			labels: Object.keys(groupedAlerts)
		}],
		name: 'Alerts Distribution'
	}];
}

export function extractFuelUsageForRadialChart(fuelUsageAvg: number | null | undefined) {
	// Return empty chart data if value is null/undefined
	if (fuelUsageAvg === null || fuelUsageAvg === undefined) {
		return [{
			data: [{
				series: [0],
				labels: ['Fuel Usage']
			}],
			name: 'Fuel Usage'
		}];
	}
	
	return [{
		data: [{
			series: [fuelUsageAvg],
			labels: ['Fuel Usage']
		}],
		name: 'Fuel Usage'
	}];
}
 
interface FuelEfficiencyData {
	efficiency: number;
	_id: string;
}

export const getFuelEfficiencyForVin = (
	fuelEfficiencyData: FuelEfficiencyData[],
	selectedVins: string[]
): any => {
	// Default value if no match is found
	const defaultEfficiency = 0;

	// If no data or no selected VINs, return default
	if (!fuelEfficiencyData?.length || !selectedVins?.length) {
		return defaultEfficiency;
	}

	// Find the efficiency for the first selected VIN
	const selectedVinData = fuelEfficiencyData.find(item => 
		selectedVins.includes(item._id)
	);

	// Return the efficiency if found, otherwise return default
	return selectedVinData?.efficiency ?? defaultEfficiency;
};

export function formatTripsData(data: any[] | null | undefined) {
	if (!data || data.length === 0) {
		return [];
	}

	return [{
		name: 'numbers of trips',
		data: data[0].data.map((item: any) => {
			// Convert YYYY-MM-DD to DD/MM
			const [year, month, day] = item.x.split('-');
			const formattedDate = `${day}/${month}`;
			
			return {
				x: formattedDate,
				y: item.y
			};
		})
	}];
}

export function formatTripsDataForMultiDay(tripData: any[] | null | undefined) {
	// Return empty array if data is invalid
	if (!tripData || !Array.isArray(tripData) || tripData.length === 0) {
		return [];
	}

	return [{
		name: '',
		data: tripData.map(dataPoint => {
			// Validate dataPoint and x value
			if (!dataPoint || !dataPoint.x || typeof dataPoint.x !== 'string') {
				return {
					x: 'Invalid Date',
					y: 0
				};
			}

			try {
				// Split DD-MM-YYYY format
				const [day, month] = dataPoint.x.split('-');
				return {
					x: `${day}/${month}`, // Format as DD/MM
					y: dataPoint.y || 0
				};
			} catch (error) {
				console.warn('Error formatting trip data point:', error);
				return {
					x: 'Invalid Date',
					y: 0
				};
			}
		})
	}];
}

export function formatTemperatureData(temperatureData: [string, number][] | null | undefined) {
	// Return empty chart data if data is null/undefined or empty
	if (!temperatureData || temperatureData.length === 0) {
		return [{
			data: [{
				series: [0],
				labels: ['Temperature']
			}],
			name: 'Temperature'
		}];
	}
	
	// Get the most recent temperature value
	const latestTemperature = temperatureData[temperatureData.length - 1][1];
	
	return [{
		data: [{
			series: [latestTemperature],
			labels: ['Temperature']
		}],
		name: 'Temperature'
	}];
}
 
