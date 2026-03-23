import React, { FC, useEffect, useState } from 'react';
import Spinner from './bootstrap/Spinner';
import NoData from './NoData';
import { useGetTripTimeline } from '../services/vehiclesService';
import { useTranslation } from 'react-i18next';

interface IHorizontalStackedBarChart {
	vin?: string;
	startdate?: string | null;
	enddate?: string | null;
}

const convertDurationToSeconds = (duration: string): number => {
	let seconds = 0;

	const hr = duration.match(/(\d+)\s*hrs?/);
	const min = duration.match(/(\d+)\s*mins?/);
	const sec = duration.match(/(\d+)\s*secs?/);

	if (hr) seconds += parseInt(hr[1]) * 3600;
	if (min) seconds += parseInt(min[1]) * 60;
	if (sec) seconds += parseInt(sec[1]);

	return seconds;
};

const STATUS_COLORS: any = {
	running: '#4CAF50',
	idle: '#F4C542',
	stopped: '#FF4C4C',
	parked: '#4DA6FF',
};

const StackedBar = ({ data }: any) => {
	const totalSec = data.running + data.idle + data.stopped + data.parked;

	const getPercent = (value: number) => {
		if (totalSec === 0) return '0%';
		let p = (value / totalSec) * 100;
		if (p < 1 && value > 0) p = 1;
		return `${p}%`;
	};

	return (
		<>
			<div
				style={{
					height: 14,
					width: '100%',
					background: '#e6e6e6',
					borderRadius: 20,
					display: 'flex',
					overflow: 'hidden',
					marginBottom: 10,
				}}>
				<div
					style={{ width: getPercent(data.running), background: STATUS_COLORS.running }}
				/>
				<div style={{ width: getPercent(data.idle), background: STATUS_COLORS.idle }} />
				<div
					style={{ width: getPercent(data.stopped), background: STATUS_COLORS.stopped }}
				/>
				<div style={{ width: getPercent(data.parked), background: STATUS_COLORS.parked }} />
			</div>

			<div style={{ fontSize: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
				<span>
					<strong>Running:</strong> {(data.running / 3600).toFixed(2)} hrs
				</span>
				<span>
					<strong>Idle:</strong> {(data.idle / 3600).toFixed(2)} hrs
				</span>
				<span>
					<strong>Stopped:</strong> {(data.stopped / 3600).toFixed(2)} hrs
				</span>
				{data.parked > 0 && (
					<span>
						<strong>Parked:</strong> {(data.parked / 3600).toFixed(2)} hrs
					</span>
				)}
			</div>
		</>
	);
};

const HorizontalStackedBarChart: FC<IHorizontalStackedBarChart> = ({ vin, startdate, enddate }) => {
	const { t } = useTranslation(['vehicles']);

	const { data, isLoading } = useGetTripTimeline({ vin, startdate, enddate });

	const [totals, setTotals] = useState({
		running: 0,
		idle: 0,
		stopped: 0,
		parked: 0,
	});

	useEffect(() => {
		if (data && data[0]) {
			let sum = { running: 0, idle: 0, stopped: 0, parked: 0 };

			data[0].duration.forEach((dur: string, i: number) => {
				const sec = convertDurationToSeconds(dur);
				const sts = data[0].status[i];

				if (sts === 'running') sum.running += sec;
				else if (sts === 'idle') sum.idle += sec;
				else if (sts === 'stopped') sum.stopped += sec;
				else sum.parked += sec;
			});

			setTotals(sum);
		}
	}, [data]);

	if (isLoading)
		return (
			<div className='d-flex justify-content-center h-100 align-items-center'>
				<Spinner className='spinner-center' color='secondary' size='5rem' />
			</div>
		);

	if (!data || !data[0]) return <NoData text={t('details not found')} withCard={false} />;

	return (
		<>
			<p style={{ fontWeight: 600, fontSize: 16 }}>Running Status</p>
			<StackedBar data={totals} />
		</>
	);
};

export default HorizontalStackedBarChart;
