import React, { useState, FC } from 'react';
import { useLocation } from 'react-router-dom';
import FieldsCard from '../../../components/FieldsCard';
import {
	superAdminPanelFieldsForCreation,
	superAdminPanelFieldsForEdition,
} from './constant/constant';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import AssistanceButton from '../../common/assitance-button/AssistanceButton';
import { superAdminPanel } from '../../../menu';
import { useTranslation } from 'react-i18next';
import Page from '../../../layout/Page/Page';
import GoBack from '../../../components/GoBack';

interface IReadUpdateSuperPanelAdmin {
	isCreating?: boolean;
}

const ReadUpdateSuperPanelAdmin: FC<IReadUpdateSuperPanelAdmin> = ({ isCreating = false }) => {
	const { t } = useTranslation(['settings']);

	const location = useLocation();
	const stateLocation = location.state;

	const [edit, setEdit] = useState(isCreating);

	const formik = useFormik({
		initialValues: {
			_id: stateLocation?._id ?? '',
			vin_no: stateLocation?.vin ?? '',
			reg_no: stateLocation?.reg_no ?? '',
			device_imei: stateLocation?.device_imei ?? '',
			seen: stateLocation?.seen ?? '',
			creation_time: stateLocation?.last_connexion ?? '',
			sim_mobile_no: stateLocation?.sim_mobile_no ?? '',
			firmware: stateLocation?.firmware ?? '',
			last_firmware_update: stateLocation?.last_firmware_update ?? '',
			plan: stateLocation?.plan ?? '',
			comment: stateLocation?.comment ?? '',
			customer: stateLocation?.customer ?? '',
		},

		validate: (values) => {
			const errors: {} = {};
			return errors;
		},
		validateOnChange: true,
		onSubmit: async (values) => {
		
		},
		onReset: () => {
			formik.resetForm();
		},
	});
	return (
		<PageWrapper isProtected={true}>
			<Page className='mw-100 px-3'>
				<div className='d-flex'>
					<div className=' d-flex pb-3 mb-4 border-bottom border-secondary w-100'>
						<GoBack />
						<h1 className='fs-2 ms-4 fw-semibold text-secondary'>
							{t(
								isCreating
									? superAdminPanel.createSuperAdminPanel.text
									: !edit
									? superAdminPanel.readSuperAdminPanel.text
									: superAdminPanel.editSuperAdminPanel.text,
							)}
						</h1>
					</div>
					<div className='fs-2 pb-3 mb-4 fw-semibold text-secondary border-bottom border-secondary align-self-stretch ml-auto'>
						<AssistanceButton locationPathname={window.location.pathname} />
					</div>
				</div>

				<FieldsCard
					data={
						isCreating
							? superAdminPanelFieldsForCreation
							: superAdminPanelFieldsForEdition
					}
					formik={formik}
					edit={edit}
					setEdit={setEdit}
					isEditable={isCreating}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ReadUpdateSuperPanelAdmin;
