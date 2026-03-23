import React, { FC, useContext } from 'react';
import PropTypes from 'prop-types';
import { CardFooter, CardFooterLeft, CardFooterRight } from './bootstrap/Card';
import Pagination, { PaginationItem } from './bootstrap/Pagination';
import Select from './bootstrap/forms/Select';
import Option from './bootstrap/Option';
import { useTranslation } from 'react-i18next';
import ThemeContext from '../contexts/themeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const PER_COUNT = {
	5: 5,
	10: 10,
	25: 25,
	50: 50,
};

export const dataPagination = (data: any[], currentPage: number, perPage: number) =>
	data.filter(
		(i, index) => index + 1 > (currentPage - 1) * perPage && index + 1 <= currentPage * perPage,
	);

interface IPaginationButtonsProps {
	setCurrentPage(...args: unknown[]): unknown;
	currentPage: number;
	perPage: number;
	setPerPage(...args: unknown[]): unknown;
	data: unknown[];
	label: string;
	children?: React.ReactNode;
}
const PaginationButtons: FC<IPaginationButtonsProps> = ({
	setCurrentPage,
	currentPage,
	perPage,
	setPerPage,
	data,
	label,
	children, 
}) => {
	const { mobileDesign } = useContext(ThemeContext);
	const totalItems = data.length;
	const totalPage = Math.ceil(totalItems / perPage);
	const { t } = useTranslation(['common']);

	const pagination = () => {
		let items = [];

		let i = currentPage - 1;
		while (i >= currentPage - 1 && i > 0) {
			items.push(
				<PaginationItem key={i} onClick={() => setCurrentPage(currentPage - 1)}>
					{i}
				</PaginationItem>,
			);

			i -= 1;
		}

		items = items.reverse();

		items.push(
			<PaginationItem key={currentPage} isActive onClick={() => setCurrentPage(currentPage)}>
				{currentPage}
			</PaginationItem>,
		);

		i = currentPage + 1;
		while (i <= currentPage + 1 && i <= totalPage) {
			items.push(
				<PaginationItem key={i} onClick={() => setCurrentPage(currentPage + 1)}>
					{i}
				</PaginationItem>,
			);

			i += 1;
		}

		return items;
	};

	const getInfo = () => {
		const start = perPage * (currentPage - 1) + 1;

		const end = perPage * currentPage;

		return (
			<span className='pagination__desc'>
				{t(`Showing`, {
					start: start,
					end: end > totalItems ? totalItems : end,
					totalItems: totalItems,
					label: t(`${label}`),
				})}
			</span>
		);
	};
	const { dir } = useSelector((state: RootState) => state.appStore);

	return (
		<CardFooter className={mobileDesign && totalPage < 2 ? 'flex-row' : ''}>
			<CardFooterLeft>
				<span className='text-muted'>{getInfo()}</span>
			</CardFooterLeft>

			<CardFooterRight className='d-flex'>
				{totalPage > 1 && (
					<Pagination ariaLabel={label}>
						<PaginationItem 
							className={dir === 'rtl' ? 'rotate-180' : ''}
							isFirst
							isDisabled={!(currentPage  + 1 <= totalPage)}
							onClick={() => setCurrentPage(1)}
						/>
						<PaginationItem
							className={dir === 'rtl' ? 'rotate-180' : ''}
							isPrev
							isDisabled={!(currentPage - 1 > 0)}
							onClick={() => setCurrentPage(currentPage - 1)}
						/>
						{currentPage - 1 > 1 && (
							<PaginationItem onClick={() => setCurrentPage(currentPage - 2)}>
								...
							</PaginationItem>
						)}
						{pagination()}
						{currentPage + 1 < totalPage && (
							<PaginationItem onClick={() => setCurrentPage(currentPage + 2)}>
								...
							</PaginationItem>
						)}
						<PaginationItem
							className={dir === 'rtl' ? 'rotate-180' : ''}
							isNext
							isDisabled={!(currentPage + 1 <= totalPage)}
							onClick={() => setCurrentPage(currentPage + 1)}
						/>
						<PaginationItem
							className={dir === 'rtl' ? 'rotate-180' : ''}
							isLast
							isDisabled={!(currentPage + 1 <= totalPage)}
							onClick={() => setCurrentPage(totalPage)}
						/>
					</Pagination>
				)}

				<Select
					size='sm'
					ariaLabel='Per'
					style={{height:"38px"}}
					onChange={(e: { target: { value: string } }) => {
						setPerPage(parseInt(e.target.value, 10));
						setCurrentPage(1);
					}}
					value={perPage.toString()}>
					{Object.keys(PER_COUNT).map((i) => (
						<Option key={i} value={i}>
							{i}
						</Option>
					))}
				</Select>
				 {children}
			</CardFooterRight>
		</CardFooter>
	);
};
PaginationButtons.propTypes = {
	setCurrentPage: PropTypes.func.isRequired,
	currentPage: PropTypes.number.isRequired,
	perPage: PropTypes.number.isRequired,
	setPerPage: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	data: PropTypes.array.isRequired,
	label: PropTypes.string.isRequired,
};
PaginationButtons.defaultProps = {
	label: 'items',
};

export default PaginationButtons;