import React, { FC, useState } from 'react';
import PaginationButtons, {
	PER_COUNT,
	dataPagination,
} from '../../../components/PaginationButtons';
import useSortableData from '../../../hooks/useSortableData';
import { RootState } from '../../../store/store';
import { useSelector } from 'react-redux';
import Icon from '../../../components/icon/Icon';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Alert from '../../../components/bootstrap/Alert';
import { useTranslation } from 'react-i18next';

// Inline constants replacing deleted alarmConstants file
const TableStyle: React.CSSProperties = {
	background: '#f5f5f5',
	fontWeight: 700,
	fontSize: 13,
};

const trStyleTable: React.CSSProperties = {
	fontSize: 13,
};

const activityLogs: { name: string; key: string; sortable: boolean }[] = [
	{ name: 'Committed By', key: 'commited_by', sortable: true },
	{ name: 'Username', key: 'user_name', sortable: true },
	{ name: 'IP Address', key: 'ip_address', sortable: false },
	{ name: 'Action Type', key: 'action_type', sortable: true },
	{ name: 'Date & Time', key: 'datetime', sortable: true },
];

interface DatatableActivityLogsProps {
	activityData: any[];
}

const DatatableActivityLogs: FC<DatatableActivityLogsProps> = ({ activityData }) => {
	const { t } = useTranslation(['vehicles']);
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(PER_COUNT['5']);
	const { items, requestSort, getClassNamesFor } = useSortableData(activityData);
	const { dir } = useSelector((state: RootState) => state.appStore);

	return (
		<>
			{activityData && activityData.length > 0 ? (
				<div className='table-responsive pt-0 vehicles-dashboard'>
					{perPage === 50 && (
						<PaginationButtons
							data={items}
							label='items'
							setCurrentPage={setCurrentPage}
							currentPage={currentPage}
							perPage={perPage}
							setPerPage={setPerPage}
						/>
					)}
					<table
						className={dir === 'rtl' ? 'table table-modern-rtl' : 'table table-modern'}>
						<thead>
							<tr style={{ ...TableStyle }}>
								{activityLogs.map(({ name, key, sortable }, index) => (
									<th
										key={index}
										onClick={() =>
											sortable === true ? requestSort(key) : null
										}
										className={sortable ? 'cursor-pointer' : ''}>
										{t(name)}
										{sortable && (
											<Icon
												size='lg'
												className={`${getClassNamesFor(key)} ms-2`}
												icon='FilterList'
											/>
										)}
									</th>
								))}
								<th />
							</tr>
						</thead>
						<tbody>
							{dataPagination(items, currentPage, perPage).map((item: any, index: number) => (
								<tr style={{ zIndex: '1', ...trStyleTable }} key={index} onClick={() => {}}>
									<td>{item.commited_by}</td>
									<td>{item.user_name}</td>
									<td>{item.ip_address}</td>
									<td>{item.action_type}</td>
									<td>{item.datetime}</td>
								</tr>
							))}
						</tbody>
					</table>
					<PaginationButtons
						data={items}
						label='items'
						setCurrentPage={setCurrentPage}
						currentPage={currentPage}
						perPage={perPage}
						setPerPage={setPerPage}
					/>
				</div>
			) : (
				<Card>
					<CardBody>
						<Alert color='info' className='flex-column w-100 align-items-start'>
							<p className='w-100 fw-semibold d-flex flex-row align-items-center mb-0'>
								<Icon icon='Info' size='2x' className='me-2' />{' '}
								{'No Activity Logs Found'}
							</p>
						</Alert>
					</CardBody>
				</Card>
			)}
		</>
	);
};

export default DatatableActivityLogs;
