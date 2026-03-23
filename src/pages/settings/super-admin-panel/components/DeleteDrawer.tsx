
import React, { FC, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
} from '../../../../components/bootstrap/OffCanvas';
import Button from '../../../../components/bootstrap/Button';
import ThemeContext from '../../../../contexts/themeContext';
import { useDispatch, useSelector } from 'react-redux';
import { ISuperAdminPanelResponse } from '../../../../type/settings-type';
import { RootState } from '../../../../store/store';
import showNotification from '../../../../components/extras/showNotification';

interface IDeleteDrawersProps {
	setIsDeleteModalOpen: (val: boolean) => void;
	isDeleteModalOpen: boolean;
	selectedList: string[];
	setData: (data: any[]) => void;
	topic: string;
}

const DeleteDrawer: FC<IDeleteDrawersProps> = ({
	setIsDeleteModalOpen,
	isDeleteModalOpen,
	selectedList,
	setData,
	topic,
}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation([topic]);
	const { mobileDesign } = useContext(ThemeContext);

	const scheduledReports = useSelector((state: RootState) => state.reports.scheduledReports);

	const handleConfimDeletion = () => {
		if (topic === 'superAdminPanel') {
			const payload = {
				imei: selectedList.map(Number),
				action: 'delete device',
			};
			dispatch.appStore.deleteSuperAdmin(payload).then((res: boolean) => {
				if (res) {
					setTimeout(() => {
						setIsDeleteModalOpen(false);
						dispatch.appStore
							.getSuperAdminPanelAsync()
							.then((data: ISuperAdminPanelResponse[]) => {
								setData(data);
							});
					}, 2000);
				}
			});
		} else if (topic === 'reports') {
			const arrayReportType = scheduledReports
				.filter((report) => selectedList.includes(report.sr_id))
				.map((report) => report.report_type);
			const payload = {
				report_type: arrayReportType,
				sr_id: selectedList,
				action: 'delete scheduled reports',
			};
			dispatch.reports.deleteScheduledReport(payload).then((res: boolean) => {
				if (res) {
					showNotification('', t('Scheduled Reports Successfully Deleted'), 'success');
					setTimeout(() => {
						setIsDeleteModalOpen(false);
						dispatch.reports.getScheduledReportsAsync().then((data: any[]) => {
							setData(data);
						});
					}, 2000);
				}
			});
		}
	};

	return (
		<OffCanvas
			style={{ width: 350 }}
			id='delete-unit-panel'
			titleId='delete-unit-panel'
			placement='end'
			isOpen={isDeleteModalOpen}
			setOpen={setIsDeleteModalOpen}
			isBackdrop={false}
			isBodyScroll>
			<OffCanvasHeader className='border-1 border-bottom mb-5'>
				<p className='fs-3 fw-semibold mb-0 content-heading'>{t('Confim deletion ?')}</p>
			</OffCanvasHeader>

			<OffCanvasBody className='ps-4 pe-0'>
				<div className='d-flex align-items-center flex-column'>
					<p className='fs-5'>
						{t("You're about to delete")}{' '}
						<span className='text-secondary'>
							{selectedList.length} {topic === 'reports' ? t('report') : t('unit')}
							{selectedList.length > 1 ? 's' : ''}.
						</span>
					</p>
					<p className='fs-5 fw-semibold'>{t('Do you confirm deletion ?')}</p>
					<Button
						color='dark'
						className={`py-3 my-3 ${mobileDesign ? 'w-100' : 'w-75'}`}
						onClick={handleConfimDeletion}>
						{t('Confirm')}
					</Button>

					<Button
						color='dark'
						isOutline={true}
						className={`py-3 light-btn ${mobileDesign ? 'w-100 my-3' : 'w-75'}`}
						onClick={() => setIsDeleteModalOpen(false)}>
						{t('Cancel')}
					</Button>
				</div>
			</OffCanvasBody>
		</OffCanvas>
	);
};

export default DeleteDrawer;