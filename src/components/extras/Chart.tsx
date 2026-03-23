import React, { FC, HTMLAttributes, memo } from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
import classNames from 'classnames';
import { ApexOptions } from 'apexcharts';
import { getColorPalette } from '../../helpers/helpers';

interface IChartProps extends HTMLAttributes<HTMLDivElement> {
	series: ApexOptions['series'];
	options: ApexOptions;
	type: any;
	width?: string | number;
	height?: string | number;
	className?: string;
}
const Chart: FC<IChartProps> = ({ series, options, type, width, height, className, ...props }) => {
	const colors = getColorPalette(series?.length || 0, [
		'#FE85D5',
		'#FEC487',
		'#E4C3FD',
		'#7EF7BD',
		'#FCE07C',
		'#86C4FF',
		'#FE8686',
		'#E5E2F2',
		'#DBA18F',
		'#CED0CF',
	]);

	return (
		// eslint-disable-next-line react/jsx-props-no-spreading
		<div className={classNames('apex-chart', className)} {...props}>
			<ReactApexChart
				options={{
					colors,
					plotOptions: {
						candlestick: {
							colors: {
								upward: process.env.REACT_APP_SUCCESS_COLOR,
								downward: process.env.REACT_APP_DANGER_COLOR,
							},
						},
						boxPlot: {
							colors: {
								upper: process.env.REACT_APP_SUCCESS_COLOR,
								lower: process.env.REACT_APP_DANGER_COLOR,
							},
						},
					},
					...options,
				}}
				series={series}
				type={type ?? 'donut'}
				// type='radialBar'
				width={width}
				height={height}
			/>
		</div>
	);
};
Chart.propTypes = {
	// @ts-ignore
	series: PropTypes.arrayOf(
		PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.number,
			PropTypes.shape({
				name: PropTypes.string,
				data: PropTypes.arrayOf(
					PropTypes.oneOfType([
						PropTypes.string,
						PropTypes.number,
						PropTypes.arrayOf(
							PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
						),
						PropTypes.shape({
							x: PropTypes.oneOfType([
								PropTypes.string,
								PropTypes.number,
								PropTypes.arrayOf(
									PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
								),
								PropTypes.object,
							]),
							y: PropTypes.oneOfType([
								PropTypes.string,
								PropTypes.number,
								PropTypes.arrayOf(
									PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
								),
								PropTypes.object,
							]),
						}),
					]),
				),
			}),
		]),
	).isRequired,
	// @ts-ignore
	options: PropTypes.shape({
		// eslint-disable-next-line react/forbid-prop-types
		annotations: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		chart: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		colors: PropTypes.array,
		// eslint-disable-next-line react/forbid-prop-types
		dataLabels: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		fill: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		grid: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		labels: PropTypes.array,
		// eslint-disable-next-line react/forbid-prop-types
		legend: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		markers: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		noData: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		plotOptions: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		responsive: PropTypes.array,
		// eslint-disable-next-line react/forbid-prop-types
		series: PropTypes.array,
		// eslint-disable-next-line react/forbid-prop-types
		states: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		stroke: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		subtitle: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		theme: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		title: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		tooltip: PropTypes.object,
		// eslint-disable-next-line react/forbid-prop-types
		xaxis: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
		// eslint-disable-next-line react/forbid-prop-types
		yaxis: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
	}).isRequired,
	type: PropTypes.oneOf([
		'line',
		'area',
		'bar',
		'pie',
		'donut',
		'scatter',
		'bubble',
		'heatmap',
		'radialBar',
		'rangeBar',
		'candlestick',
		'boxPlot',
		'radar',
		'polarArea',
	]),
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	className: PropTypes.string,
};
Chart.defaultProps = {
	type: 'line',
	width: '100%',
	height: 'auto',
	className: undefined,
};

/**
 * For use useState
 */
export interface IChartOptions extends Record<string, any> {
	series: ApexOptions['series'];
	options: ApexOptions;
}

export default memo(Chart);
