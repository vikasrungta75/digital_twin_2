import { useFormik } from 'formik';
import React, { useContext, FC, useState, Dispatch, SetStateAction } from 'react';
import Button from '../../../components/bootstrap/Button';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import data from '../profile/updateProfileFields.json';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import Card, {
	CardBody,
	CardFooter,
	CardHeader,
	CardTitle,
} from '../../../components/bootstrap/Card';
import { useNavigate } from 'react-router-dom';
import Alert from '../../../components/bootstrap/Alert';
import Icon from '../../../components/icon/Icon';
import '../../../styles/components/layout/_profile-page.scss';
import Badge from '../../../components/bootstrap/Badge';
import { UserGroupsInterface } from '../../../type/auth-type';
import showNotification from '../../../components/extras/showNotification';
import ThemeContext from '../../../contexts/themeContext';
import { ModalFooter } from '../../../components/bootstrap/Modal';
import ChangePassword from './components/ChangePassword';
import { checkLowercase, checkUppercase } from '../../../helpers/helpers';
import { authPages } from '../../../menu';
import GoBack from '../../../components/GoBack';
import { IChangePasswordUsersResponse } from '../../../type/profile-type';
import { IGroup } from '../../../type/groups-type';
import { IApiResult } from '../../../type/users-type';
import { useTranslation } from 'react-i18next';
import PasswordCriteria from '../../auth/resetPassword/PasswordCriteria';

interface EditProfileModalPropsInterface {
	isOpen?: boolean;
	setIsOpen?: Dispatch<SetStateAction<boolean>> | undefined;
}

const EditProfile: FC<EditProfileModalPropsInterface> = ({ isOpen, setIsOpen }): JSX.Element => {
	const dispatch = useDispatch();
	const { mobileDesign } = useContext(ThemeContext);
	const { t } = useTranslation(['profilePage']);

	const {
		user: { user, assignedUserGroups },
		permissions,
	} = useSelector((state: RootState) => state?.auth);
	const [showResetPassword, setShowResetPassword] = useState<boolean>(false);

	// Password validation criterias hooks
	const [lengthError, setLengthError] = useState<boolean>();
	const [specialCharacterMissing, setSpecialCharacterMissing] = useState<boolean>();
	const [uppercaseMissing, setUppercaseMissing] = useState<boolean>();
	const [lowercaseMissing, setLowercaseMissing] = useState<boolean>();
	const [numberMissing, setNumberMissing] = useState<boolean>();

	const navigate = useNavigate();

	const handleNavigate = () => {
		if (mobileDesign) {
			navigate(-1);
		} else {
			if (setIsOpen) {
				setIsOpen(!isOpen);
			}
		}
	};

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			address: user?.address,
			uniqueId: user?.emailID,
			emailID: user?.emailID,
			userName: user?.userName,
			fullName: user?.fullName,
			description: user?.description,
			mobileNumber: user?.mobileNumber,
			landNumber: user?.landNumber,
			city: user?.city,
			pincode: user?.pincode,
			state: user?.state,
			country: user?.country,
			thirdPartyUser: user?.thirdPartyUser,
			customproperties: user?.customproperties,
			projectPath: 'https://platform.ravity.io/home/',
			oldPassword: '',
			newPassword: '',
			confirmedPassword: '',
		},
		validate: (values) => {
			// const format = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;
			const format = /[@#$%]+/;

			const errors: {
				address?: string;
				userName?: string;
				fullName?: string;
				description?: string;
				mobileNumber?: string;
				landNumber?: string;
				city?: string;
				pincode?: string;
				state?: string;
				country?: string;
				oldPassword?: string;
				newPassword?: string;
				confirmedPassword?: string;
			} = {};

			values.newPassword.length <= 15 && values.newPassword.length >= 8
				? setLengthError(false)
				: setLengthError(true);
			/\d/.test(values.newPassword) ? setNumberMissing(false) : setNumberMissing(true);
			checkUppercase(values.newPassword)
				? setUppercaseMissing(false)
				: setUppercaseMissing(true);
			checkLowercase(values.newPassword)
				? setLowercaseMissing(false)
				: setLowercaseMissing(true);
			format.test(values.newPassword)
				? setSpecialCharacterMissing(false)
				: setSpecialCharacterMissing(true);

			if (!values.oldPassword && showResetPassword) {
				errors.oldPassword = t('Required');
			}
			if (!values.newPassword && showResetPassword) {
				errors.newPassword = t('Required');
			}
			if (
				(lengthError ||
					specialCharacterMissing ||
					uppercaseMissing ||
					lowercaseMissing ||
					numberMissing) &&
				showResetPassword
			) {
				errors.newPassword = t('Password criterias');
			}
			if (!values.confirmedPassword && showResetPassword) {
				errors.confirmedPassword = t('Required');
			} else if (values.newPassword !== values.confirmedPassword && showResetPassword) {
				errors.confirmedPassword = t("Passwords don't match!");
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			const { oldPassword, newPassword } = values;
			const { id, spaceKey } = user;
			const assignedUserGroupsIds = assignedUserGroups.map((group: IGroup) => group.id);
			const payload = {
				changePasswordPayload: {
					spaceKey,
					userId: id,
					oldPassword,
					newPassword,
					projectPath: 'https://platform.ravity.io/home/',
				},
				updateProfilePayload: {
					spacekey: spaceKey,
					userID: id,
					selectedUserGroups: assignedUserGroupsIds,
					...values,
				},
			};

			if (showResetPassword) {
				await dispatch.auth
					.changePasswordAsync(payload)
					.then((changePasswordRes: IChangePasswordUsersResponse) => {
						if (
							!changePasswordRes.success &&
							changePasswordRes.message === 'Failed to Change Password'
						) {
							formik.setFieldError('oldPassword', ' ');
							formik.setFieldError('newPassword', ' ');
							formik.setFieldError('confirmedPassword', changePasswordRes.message);
						}
						if (
							!changePasswordRes.success &&
							changePasswordRes.message !== 'Failed to Change Password'
						) {
							formik.setFieldError('oldPassword', changePasswordRes.message);
						}
						if (
							changePasswordRes.success &&
							changePasswordRes.message ===
								'Last 3 consecutive password not allowed, please enter different one!'
						) {
							formik.setFieldError('confirmedPassword', changePasswordRes.message);
							formik.setFieldError('newPassword', ' ');
						}
						if (
							changePasswordRes.success &&
							changePasswordRes.message === 'Updated new password successfully!'
						) {
							dispatch.auth
								.updateProfileAsync(payload.updateProfilePayload)
								.then((res: IApiResult) => {
									if (!res.users.success) {
										showNotification(
											t('Server Error'),
											res.users.message,
											'danger',
										);
									}
								});
							navigate(`../${authPages.login.path}`, {
								state: { from: 'editProfile', message: changePasswordRes.message },
							});
						}
					});
			} else {
				await dispatch.auth
					.updateProfileAsync(payload.updateProfilePayload)
					.then((res: IApiResult) => {
						if (res.users.success) {
							showNotification('', t('Great ! Profile updated'), 'success');
							handleNavigate();
						} else {
							showNotification(t('Server Error'), res.users.message, 'danger');
						}
					});
			}
		},
	});

	return (
		<PageWrapper>
			<Page>
				<div
					className={`d-flex pb-3 mb-4 border-bottom border-secondary ${mobileDesign} ? 'w-100' : 'w-50'`}>
					<GoBack handleClick={handleNavigate} />
					<h1 className='fs-2 ms-4 fw-semibold' style={{color:"#F00D69"}}>{t('Edit Profile')}</h1>
				</div>

				<form className='row'>
					<div className='col-lg-8'>
						<Card className='shadow-3d-info'>
							<CardHeader className='pb-2'>
								<CardTitle className='fs-4 pb-0 mt-4 fw-semibold' style={{color:"#F00D69"}}>
									{t('Personal informations')}
								</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='row g-4'>
									{data.updateProfileFields.map(({ name, label }) => {
										return (
											<div
												className={mobileDesign ? 'col-12' : 'col-6'}
												key={name}>
												<FormGroup id={name} label={t(`${label}`)}>
													<Input
														autoComplete={name}
														value={
															formik.values[
																name as keyof typeof formik.values
															]
														}
														isValid={formik.isValid}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
														onFocus={() => {
															formik.setErrors({});
														}}
													/>
												</FormGroup>
											</div>
										);
									})}
								</div>
							</CardBody>
						</Card>
						<Card className='shadow-3d-info'>
							<CardHeader className='pb-2'>
								<CardTitle className='fs-4 pb-0 mt-4 fw-semibold' style={{color:"#F00D69"}}>
									{t('Groups')}
								</CardTitle>
							</CardHeader>
							<CardBody>
								{assignedUserGroups ? (
									<div className='row g-2'>
										{assignedUserGroups
											?.filter(
												(group: UserGroupsInterface) => group.status !== 2,
											)
											?.map((group: UserGroupsInterface, index: number) => (
												<div key={index} className='col-auto'>
													<Badge isLight className='fs-6 px-3 py-2'>
														{group.name}
													</Badge>
												</div>
											))}
									</div>
								) : (
									<div className='row'>
										<div className='col'>
											<Alert
												color='warning'
												isLight
												icon='Report'
												className='mb-0'>
												{t('groupsPages:NoGroups')}
											</Alert>
										</div>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
					{permissions.edit_password && (
						<div className='col-lg-4'>
							<Card className='shadow-3d-info rst-pwd-card'>
								<CardHeader className='pb-2'>
									<CardTitle className='fs-3 pb-0 mt-4 fw-semibold' style={{color:"#F00D69"}}>
										{t('change password')}
									</CardTitle>
								</CardHeader>
								{showResetPassword && (
									<CardBody className='pb-0'>
										<PasswordCriteria
											lengthError={lengthError}
											specialCharacterMissing={specialCharacterMissing}
											uppercaseMissing={uppercaseMissing}
											lowercaseMissing={lowercaseMissing}
											numberMissing={numberMissing}
										/>
										<ChangePassword formik={formik} />
									</CardBody>
								)}
								<CardFooter>
									<Alert
										color='info'
										className='flex-column w-100 align-items-start'>
										<p className='w-100 fw-semibold d-flex flex-row align-items-center'>
											<Icon icon='Info' size='2x' className='me-2' />{' '}
											{t('Information')}:
										</p>
										{t('info password')} :
										<ul>
											<li>{t('redirect')}</li>
											<li>{t('log again')}</li>
										</ul>
										{!showResetPassword && (
											<div className='w-100 d-flex justify-content-end'>
												<Button
													className='primary-btn'
													color='secondary'
													isLight
													onClick={() =>
														setShowResetPassword(!showResetPassword)
													}>
													{t('Continue')}
												</Button>
											</div>
										)}
									</Alert>
								</CardFooter>
							</Card>
						</div>
					)}

					<ModalFooter
						className={`bg-transparent ${
							mobileDesign && 'd-flex flex-column-reverse mb-3 px-3'
						}`}>
						<Button
							// color='secondary'
							isOutline={true}
							className={`py-3 light-btn ${!mobileDesign ? 'w-25' : 'w-100 my-3'}`}
							onClick={() => {
								handleNavigate();
							}}>
							{t('Cancel')}
						</Button>
						<Button
							// color='secondary'
							className={`py-3 ${!mobileDesign ? 'w-25 ms-3' : 'w-100'}`}
							onClick={formik.handleSubmit}>
							{t('Save')}
						</Button>
					</ModalFooter>
				</form>
			</Page>
		</PageWrapper>
	);
};

export default EditProfile;
