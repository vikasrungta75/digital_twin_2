import { useFormik } from 'formik';
import React, { FC, useContext } from 'react';
import { useDispatch } from 'react-redux';
import ThemeContext from '../contexts/themeContext';
import Button from './bootstrap/Button';
import Card, { CardBody } from './bootstrap/Card';
import FormGroup from './bootstrap/forms/FormGroup';
import Input from './bootstrap/forms/Input';
import showNotification from './extras/showNotification';
import { useTranslation } from 'react-i18next';
import { QueryObserverResult, RefetchOptions, RefetchQueryFilters } from '@tanstack/react-query';

interface IConfirmDeletionProps {
	data: { id: number | string; name: string; vin?: string; gtype?: string };
	type: string;
	showDeleteConfirmation: { [key: string]: boolean };
	setShowDeleteConfirmation: React.Dispatch<
		React.SetStateAction<{
			[key: string]: boolean;
		}>
	>;
	refetch?: <TPageData>(
		options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
	) => Promise<QueryObserverResult<any, unknown>>;
}

const ConfirmDeletion: FC<IConfirmDeletionProps> = ({
	data,
	type,
	showDeleteConfirmation,
	setShowDeleteConfirmation,
	refetch,
}) => {
	const { mobileDesign } = useContext(ThemeContext);
	const dispatch = useDispatch();
	const { t } = useTranslation(['groupsPages']);

	const displayConfirmation = () => {
		showNotification(
			'',
			`Great ! ${type.charAt(0).toUpperCase() + type.slice(1)} successfully ${
				type === 'group' ? 'blocked' : 'deleted'
			}`,
			'success',
		);
		setShowDeleteConfirmation({
			[data.name]: !showDeleteConfirmation[data.name],
		});
	};

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			deleteConfirmation: '',
		},
		validate: (values) => {
			const errors: {
				deleteConfirmation?: string;
			} = {};

			if (values.deleteConfirmation !== data.name) {
				errors.deleteConfirmation = t(`The name of the ${type} is not correct`);
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async () => {
			if (type === 'group') {
				await dispatch.usersGroups.blockGroupOperations(data.id).then((res: boolean) => {
					if (res) displayConfirmation();
					setTimeout(() => {
						dispatch.usersGroups.getGroupsListAsync();
						dispatch.usersGroups.getGroupsListAssignedToRoleAsync();
						dispatch.auth.getProfileUserDetailsAsync();
					}, 2000);
				});
			}

			if (type === 'geofence') {
				const payload = { vin: data.vin, geofenceId: data.id, gtype: data.gtype };
				await dispatch.geofences
					.deleteGeofenceAsync(payload)
					.then((res: boolean) => {
						if (res) displayConfirmation();
					})
					.finally(() => {
						if (refetch) {
							setTimeout(() => {
								refetch();
							}, 2000);
						}
					});
			}
		},
	});

	return (
		<Card className={`${mobileDesign ? 'w-100' : type === 'geofence' ? 'mb-0' : 'w-50 mb-0'}`}>
			<CardBody className='p-3'>
				<p className='w-100 fw-semibold d-flex flex-row align-items-center'>
					{t(
						`Type the name of the ${type} for ${
							type === 'group' ? 'block' : 'delete'
						} confirmation :`,
					)}{' '}
				</p>
				<form className='col-12 d-flex'>
					<FormGroup id='deleteConfirmation' className='w-100 me-4'>
						<Input
							autoComplete='deleteConfirmation'
							value={formik.values.deleteConfirmation}
							isValid={formik.isValid}
							isTouched={formik.touched.deleteConfirmation}
							invalidFeedback={formik.errors.deleteConfirmation}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							onFocus={() => {
								formik.setErrors({});
							}}
						/>
					</FormGroup>
					<div
						className={`d-flex ${
							formik.errors.deleteConfirmation ? 'mt-2' : 'align-items-center'
						} `}>
						<Button
							aria-label='Toggle Go Back'
							className='mobile-header-toggle me-2'
							size='sm'
							color='dark'
							isLight
							icon='Close'
							onClick={() =>
								setShowDeleteConfirmation({
									[data.name]: !showDeleteConfirmation[data.name],
								})
							}
						/>
						<Button
							aria-label='Toggle Go Back'
							className='mobile-header-toggle'
							size='sm'
							color='success'
							isLight
							icon='Check'
							onClick={formik.handleSubmit}
						/>
					</div>
				</form>
			</CardBody>
		</Card>
	);
};

export default ConfirmDeletion;
