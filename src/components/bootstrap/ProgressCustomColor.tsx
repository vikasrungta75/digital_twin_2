import React, { Children, cloneElement, forwardRef, HTMLAttributes, ReactElement } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import '../../styles/pages/_carbon.scss';
import { hexToRGBArray } from '../../helpers/helpers';

const useStyles = createUseStyles({
	// stylelint-disable-next-line selector-type-no-unknown
	dynamicHeight: (props) => ({
		// @ts-ignore
		height: props.height,
	}),
});

const calculateColor = (
	colors: string[],
	value: number,
	startValue: number,
	maxValue: number,
	ascending: boolean,
): string => {
	const startColor: number[] = hexToRGBArray(colors[0]); // Couleur la plus claire
	const endColor: number[] = ascending ? hexToRGBArray(colors[1]) : hexToRGBArray(colors[0]); // Couleur la plus foncée pour ascendant, couleur la plus claire pour descendant
  
  // Normalisation de la valeur entre 0 et 1
  const normalizedValue = (value - startValue) / (maxValue - startValue);

  // Calcul de la couleur intermédiaire
  const color = startColor.map((channel, i) =>
    Math.round(channel + normalizedValue * (endColor[i] - channel))
  );

  
	return `rgb(${color.join(',')})`;
};

interface IProgressProps extends HTMLAttributes<HTMLDivElement> {
	typeOfProgress?: string;
	value?: number;
	min?: number;
	max?: number;
	height?: number | string | null;
	isStriped?: boolean;
	isAnimated?: boolean;
	isAutoColor?: boolean;
	color?: any;
	children?: ReactElement<IProgressProps> | ReactElement<IProgressProps>[];
	className?: string;
	isOnlyBar?: boolean;
	ascending?: boolean;
	colors?: string[];
	startValue?: number;
}
const ProgressCustomColor = forwardRef<HTMLDivElement, IProgressProps>(
	(
		{
			typeOfProgress,
			value = 0,
			min = 0,
			max = 100,
			height,
			isStriped,
			isAnimated,
			isAutoColor,
			color,
			children,
			className,
			// eslint-disable-next-line react/prop-types
			isOnlyBar,
			ascending = true,
			colors = [],
			startValue = 0,
			...props
		},
		ref,
	) => {
		// @ts-ignore
		const VALUE = (100 * (value - min)) / (max - min);

		// @ts-ignore
		const classes = useStyles({ height });
		//TODO refactor this code

		const renderProgressBar = () => (
			<div
				style={{
					width: `${VALUE}%`,
					backgroundColor:
						color || calculateColor(colors, value, startValue, max, ascending),
				}}
				className={classNames('progress-bar')}
				role='progressbar'
				aria-label={`${value}%`}
				aria-valuenow={value}
				aria-valuemin={min}
				aria-valuemax={max}
			/>
		);

		return (
			<div
				ref={ref}
				className={classNames('progress', { [classes.dynamicHeight]: !!height }, className)}
				style={{
					...props.style,
				}}
				{...props}>
				{children
					? Children.map(children, (child, index) =>
							cloneElement(child as ReactElement, { isOnlyBar: true, key: index }),
					  )
					: renderProgressBar()}
			</div>
		);
	},
);
ProgressCustomColor.displayName = 'Progress';
ProgressCustomColor.propTypes = {
	value: PropTypes.number,
	min: PropTypes.number,
	max: PropTypes.number,
	/**
	 * If the value is a number, it is automatically used as px. Example: 10, '1rem', '5vh', etc.
	 */
	height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	isStriped: PropTypes.bool,
	isAnimated: PropTypes.bool,
	isAutoColor: PropTypes.bool,
	color: PropTypes.oneOf([
		'primary',
		'secondary',
		'success',
		'info',
		'warning',
		'danger',
		'light',
		'dark',
		'link',
		'brand',
		'brand-two',
		'storybook',
	]),
	/**
	 * To use more than one `<Progress />`
	 */
	// @ts-ignore
	children: PropTypes.node,
	className: PropTypes.string,
};
ProgressCustomColor.defaultProps = {
	value: 0,
	min: 0,
	max: 100,
	height: null,
	isStriped: false,
	isAnimated: false,
	isAutoColor: false,
	color: undefined,
	children: undefined,
	className: undefined,
};

export default ProgressCustomColor;
