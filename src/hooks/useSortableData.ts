import { useMemo, useState } from 'react';

const useSortableData = (items: any[], config = null) => {
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(config);

	const convertToSeconds = (duration: string) => {
		const timeRegex = /(\d+)\s*(hrs|hr|h|min|mins|secs|sec|s)/gi;
		const timeUnits: Record<string, number> = {
			hrs: 60 * 60,
			hr: 60 * 60,
			h: 60 * 60,
			min: 60,
			mins: 60,
			sec: 1,
			secs: 1,
			s: 1,
		};

		let totalSeconds = 0;
		let matches;

		while ((matches = timeRegex.exec(duration))) {
			const [, value, unit] = matches;
			const numericValue = parseInt(value, 10);
			const conversionFactor = timeUnits[unit.toLowerCase()];
			totalSeconds += numericValue * conversionFactor;
		}

		return totalSeconds;
	};

	const compareValues = (a: string, b: string) => {
		const timeRegex = /\d+\s*(hrs|hr|h|min|mins|secs|sec|s)/gi;
		const numberRegex = /^\d+$/; // Expression régulière pour vérifier si c'est un nombre

		if (/^\d+ kmph$/.test(a) && /^\d+ kmph$/.test(b)) {
			const aValue = parseInt(a);
			const bValue = parseInt(b);
			return aValue - bValue;
		} else if (timeRegex.test(a) && timeRegex.test(b)) {
			const aValue = convertToSeconds(a);
			const bValue = convertToSeconds(b);
			return aValue - bValue;
		} else if (numberRegex.test(a) && numberRegex.test(b)) {
			const aValue = parseInt(a);
			const bValue = parseInt(b);
			return aValue - bValue;
		} else {
			const comparisonResult = a.localeCompare(b);
			return comparisonResult;
		}
	};

	const sortedItems = useMemo(() => {
		if (!Array.isArray(items)) return []; 
		const sortableItems = [...items];
		if (sortConfig !== null) {
			sortableItems.sort((a, b) => {
				const aValue = a[sortConfig.key];
				const bValue = b[sortConfig.key];
				return sortConfig.direction === 'ascending'
					? compareValues(aValue, bValue)
					: compareValues(bValue, aValue);
			});
		}
		return sortableItems;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items, sortConfig]);

	const requestSort = (key: any) => {
		let direction = 'ascending';
		if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending';
		}
		setSortConfig({ key, direction });
	};

	const getClassNamesFor = (key: any) => {
		if (!sortConfig) {
			return 'd-none';
		}
		return sortConfig.key === key ? sortConfig.direction : 'd-none';
	};

	return { items: sortedItems, requestSort, getClassNamesFor, sortConfig };
};

export default useSortableData;
