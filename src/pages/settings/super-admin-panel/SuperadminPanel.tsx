import React, { FC, useContext, useEffect, useState } from 'react';
import { settings, superAdminPanel } from '../../../menu';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import { useTranslation } from 'react-i18next';
import AssistanceButton from '../../common/assitance-button/AssistanceButton';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import ThemeContext from '../../../contexts/themeContext';
import Button from '../../../components/bootstrap/Button';
import SearchBar from '../../../components/SearchBar';
import { useNavigate } from 'react-router-dom';
import DeleteDrawer from './components/DeleteDrawer';
import { ISuperAdminPanelResponse } from '../../../type/settings-type';

// Inline simple table replacing the deleted Datatable component
const SimpleTable: FC<{
	data: any[];
	columns: any[];
	withCheckbox?: boolean;
	setSelectedList: (list: any[]) => void;
	rowPath?: string;
	uniqueId?: string;
}> = ({ data, columns, withCheckbox, setSelectedList, rowPath, uniqueId }) => {
	const navigate = useNavigate();
	const [selected, setSelected] = useState<any[]>([]);

	const toggleRow = (id: any) => {
		const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
		setSelected(next);
		setSelectedList(next);
	};

	return (
		<div className='table-responsive'>
			<table className='table table-modern'>
				<thead>
					<tr>
						{withCheckbox && <th style={{ width: 40 }} />}
						{columns.map((col: any, i: number) => (
							<th key={i}>{col.name || col.label || col.title}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data && data.length > 0 ? data.map((row: any, i: number) => (
						<tr
							key={i}
							style={{ cursor: rowPath ? 'pointer' : 'default' }}
							onClick={() => rowPath && navigate(`../${rowPath}/${row[uniqueId || 'id']}`)}>
							{withCheckbox && (
								<td onClick={(e) => { e.stopPropagation(); toggleRow(row[uniqueId || 'id']); }}>
									<input
										type='checkbox'
										checked={selected.includes(row[uniqueId || 'id'])}
										onChange={() => {}}
									/>
								</td>
							)}
							{columns.map((col: any, j: number) => (
								<td key={j}>{row[col.selector] ?? row[col.key] ?? '—'}</td>
							))}
						</tr>
					)) : (
						<tr>
							<td colSpan={columns.length + (withCheckbox ? 1 : 0)} style={{ textAlign: 'center', color: '#bbb', padding: 24 }}>
								No data found
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

interface ISuperAdminPanelProps {}

const SuperAdminPanel: FC<ISuperAdminPanelProps> = () => {
	const dispatch = useDispatch();
	const { t } = useTranslation(['superAdminPanel']);
	const navigate = useNavigate();

	const { mobileDesign } = useContext(ThemeContext);
	const permissions = useSelector((state: RootState) => state.auth?.permissions);
	const superAdminPanelData = useSelector(
		(state: RootState) => state.appStore.superAdminPanelData,
	);

	const [searchInput, setSearchInput] = useState('');
	const [data, setData] = useState<ISuperAdminPanelResponse[]>(superAdminPanelData);
	const [selectedList, setSelectedList] = useState<any[]>([]);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const columns = [
		{ name: 'Device IMEI', key: 'device_imei', selector: 'device_imei' },
		{ name: 'Customer Key', key: 'customer_key', selector: 'customer_key' },
		{ name: 'Status', key: 'status', selector: 'status' },
	];

	useEffect(() => {
		dispatch.appStore.getSuperAdminPanelAsync().then((res: ISuperAdminPanelResponse[]) => {
			setData(res);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (superAdminPanelData && searchInput.length > 0) {
			const filteredResult = superAdminPanelData.filter((obj: ISuperAdminPanelResponse) => {
				return Object.keys(obj).some((key) => {
					return obj[key as keyof typeof obj]
						?.toString()
						?.toUpperCase()
						.includes(searchInput.toUpperCase());
				});
			});
			setData(filteredResult);
		} else if (searchInput.length === 0) {
			setData(superAdminPanelData);
		}
	}, [searchInput, superAdminPanelData]);

	return (
		<PageWrapper isProtected={true}>
			<Page className='mw-100 px-3'>
				<div className='d-flex'>
					<div className='fs-2 pb-3 mb-4 fw-semibold text-secondary border-bottom border-secondary w-100'>
						{t(settings.superAdminPanel.text)}
					</div>
					<div className='fs-2 pb-3 mb-4 fw-semibold text-secondary border-bottom border-secondary align-self-stretch ml-auto'>
						<AssistanceButton locationPathname={window.location.pathname} />
					</div>
				</div>

				<div className='d-flex mb-3'>
					<div
						className={`d-flex me-4 ${
							mobileDesign ? 'w-100' : permissions?.create_super_admin_panel ? 'w-75' : 'w-100'
						}`}
						data-tour='search'>
						<SearchBar
							search={searchInput}
							setSearch={setSearchInput}
							translation='superAdminPanel'
							text={t('Search unit by name or ID')}
						/>
					</div>
					{permissions?.create_super_admin_panel && (
						<Button
							icon={selectedList.length > 0 && permissions?.delete_super_admin_panel ? 'Delete' : 'Add'}
							color='secondary'
							isOutline={true}
							className={`primary-btn py-3 mb-0 ${mobileDesign ? 'w-100' : 'w-25'}`}
							onClick={() =>
								selectedList.length > 0 && permissions?.delete_super_admin_panel
									? setIsDeleteModalOpen(true)
									: navigate(`../${superAdminPanel.createSuperAdminPanel.path}`)
							}>
							{selectedList.length > 0 && permissions?.delete_super_admin_panel ? t('Delete') : t('New unit')}
						</Button>
					)}
				</div>

				<SimpleTable
					data={data}
					columns={columns}
					withCheckbox={permissions?.delete_super_admin_panel}
					setSelectedList={setSelectedList}
					rowPath={permissions?.read_super_admin_panel ? superAdminPanel.readSuperAdminPanel.path : undefined}
					uniqueId='device_imei'
				/>

				{isDeleteModalOpen && (
					<DeleteDrawer
						selectedList={selectedList}
						isDeleteModalOpen={isDeleteModalOpen}
						setIsDeleteModalOpen={setIsDeleteModalOpen}
						setData={setData}
						topic='superAdminPanel'
					/>
				)}
			</Page>
		</PageWrapper>
	);
};

export default SuperAdminPanel;
