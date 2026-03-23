import React, { useState, FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FieldsCard from '../../../components/FieldsCard';
import {
	superAdminPanelFieldsForEdition,
	superAdminPanelFieldsForCreation,
} from './constant/constant';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import AssistanceButton from '../../common/assitance-button/AssistanceButton';
import { settings, superAdminPanel } from '../../../menu';
import { useTranslation } from 'react-i18next';
import Page from '../../../layout/Page/Page';
import GoBack from '../../../components/GoBack';
import { useDispatch } from 'react-redux';
import showNotification from '../../../components/extras/showNotification';

interface ICreateReadUpdateSuperPanelAdmin {
	isCreating?: boolean;
}

const CreateReadUpdateSuperPanelAdmin: FC<ICreateReadUpdateSuperPanelAdmin> = ({
	isCreating = false,
}) => {
	const { t } = useTranslation(['superAdminPanel']);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const stateLocation = location.state;
	const [edit, setEdit] = useState(isCreating);

	const selectOptions = { plans: ['Basic', 'Premium', 'Standard'] };

	const formik = useFormik({
		initialValues: {
			vin: stateLocation?.vin ?? '',
			reg_no: stateLocation?.reg_no ?? '',
			device_imei: stateLocation?.device_imei ?? '',
			last_connection: stateLocation?.last_connection ?? '',
			creation_time: stateLocation?.creation_time ?? '',
			sim_no: stateLocation?.sim_no ?? '',
			firmware: stateLocation?.firmware ?? '',
			last_fm_update: stateLocation?.last_fm_update ?? '',
			plan: stateLocation?.plan ?? '',
			comment: stateLocation?.comment ?? '',
			customer: stateLocation?.customer ?? '',
		},

		validate: (values) => {
			const errors: { [key: string]: string } = {};

			if (values.vin?.length !== 17) {
				errors.vin = t('VIN must contain 17 characters');
			}

			if (values.reg_no?.length < 5 || values.reg_no?.length > 12) {
				errors.reg_no = t('Reg no must contain between 5 and 13 characters');
			}

			if (!/^[0-9]+$/.test(values.device_imei)) {
				errors.device_imei = t('Device IMEI must contain only numeric characters');
			}
			if (!/^[0-9]+$/.test(values.sim_no)) {
				errors.sim_no = t('Sim number must contain only numeric characters');
			}

			return errors;
		},
		validateOnChange: true,
		onSubmit: async (values) => {
			const payload = {
				...values,
				action: isCreating ? 'add device' : 'update device',
				imei: Number(values.device_imei),
				sim_no: Number(values.sim_no),
			};

			delete payload.device_imei;

			dispatch.appStore.superAdminPanelEdition(payload).then((res: boolean) => {
				if (res) {
					isCreating
						? setTimeout(() => navigate(`../${settings.superAdminPanel.path}`), 2000)
						: setEdit(false);
				} else {
					showNotification(
						'',
						t(
							isCreating
								? 'An error occured creating device'
								: 'An error occured updating device',
						),
						'danger',
					);
				}
			});
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
					selectOptions={selectOptions}
					formik={formik}
					edit={edit}
					setEdit={setEdit}
					isEditable={!isCreating}
					// 	translation='superAdminPanel'
				/>
			</Page>
		</PageWrapper>
	);
};

export default CreateReadUpdateSuperPanelAdmin;
