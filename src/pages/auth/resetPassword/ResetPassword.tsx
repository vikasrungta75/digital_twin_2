import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import Logo from '../../../components/Logo';
import { useFormik } from 'formik';
import classNames from 'classnames';
import { checkLowercase, checkUppercase } from '../../../helpers/helpers';
import { useDispatch, useSelector } from 'react-redux';
import PasswordCriteria from './PasswordCriteria';
import { RootState, store } from '../../../store/store';
import ConfirmPage from '../ConfirmPage';
import { authPages } from '../../../menu';
import { useTranslation } from 'react-i18next';
import LogoKeeplin from '../../../components/LogoKeeplin';

const ResetPassword: FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { auth } = useSelector((state: RootState) => state);

	const [successChangePass, setSuccessChangePass] = useState(false);

	var myUrl = new URL(window.location.href.replace('#/reset-password', ''));
	const token = myUrl.searchParams.get('token'); // "get token from URL"

	// Password validation criterias hooks
	const [lengthError, setLengthError] = useState<boolean>();
	const [specialCharacterMissing, setSpecialCharacterMissing] = useState<boolean>();
	const [uppercaseMissing, setUppercaseMissing] = useState<boolean>();
	const [lowercaseMissing, setLowercaseMissing] = useState<boolean>();
	const [numberMissing, setNumberMissing] = useState<boolean>();
	const { t } = useTranslation(['authPage']);

	const formik = useFormik({
		initialValues: {
			password: '',
			confirmPassword: '',
		},

		validate: (values) => {
			// const format = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;
			const format = /[@#$%]+/;
			const errors: { password?: string; confirmPassword?: string } = {};

			values.password.length <= 15 && values.password.length >= 8
				? setLengthError(false)
				: setLengthError(true);
			/\d/.test(values.password) ? setNumberMissing(false) : setNumberMissing(true);
			checkUppercase(values.password)
				? setUppercaseMissing(false)
				: setUppercaseMissing(true);
			checkLowercase(values.password)
				? setLowercaseMissing(false)
				: setLowercaseMissing(true);
			format.test(values.password)
				? setSpecialCharacterMissing(false)
				: setSpecialCharacterMissing(true);

			if (!values.password) {
				errors.password = `${t('Required')}`;
			}
			if (!values.confirmPassword) {
				errors.confirmPassword = `${t('Required')}`;
			} else if (values.password !== values.confirmPassword) {
				errors.confirmPassword = `${t("Passwords don't match!")}`;
			}

			return errors;
		},
		validateOnChange: true,

		onSubmit: (values) => {
			const credentials = { token, newpassword: values.confirmPassword };
			dispatch.auth.getResetPassword(credentials).then(() => {
				const authStore = store.getState().auth;
				if (authStore.success) {
					setSuccessChangePass(true);
				} else {
					formik.setFieldError('confirmPassword', auth?.message);
					formik.setFieldError('password', ' ');
				}
			});
		},
	});

	const LogoComponent = process.env.REACT_APP_LOGO === 'Keeplin' ? LogoKeeplin : Logo;

	return !successChangePass ? (
		<PageWrapper
			isProtected={false}
			title='Reset Password'
			className={classNames('page-wrapper-login')}>
			<Page>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-light h-100' data-tour='login-page'>
							<CardBody className='d-flex flex-column justify-content-start'>
								<div className='text-center position-absolute top-0 start-0 end-0'>
									<LogoComponent width={381} height={90} />
								</div>
								<form className='row g-4 m-auto'>
									<div className='text-center h1 fw-bold mt-5 text-secondary reset-form'>
										{t('New Password')}
									</div>
									<div className='text-center text-dark mb-2'>
										{t('Create and confim it !')}
									</div>

									<PasswordCriteria
										lengthError={lengthError}
										specialCharacterMissing={specialCharacterMissing}
										uppercaseMissing={uppercaseMissing}
										lowercaseMissing={lowercaseMissing}
										numberMissing={numberMissing}
									/>

									<div className='col-12 mt-1'>
										<FormGroup
											id='password'
											isFloating
											label={t('Create password')}>
											<Input
												type='password'
												autoComplete='password'
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												value={formik.values.password}
												invalidFeedback={formik.errors.password}
												isTouched={formik.touched.password}
												isValid={formik.isValid}
												showPasswordOption
											/>
										</FormGroup>
									</div>

									<div className='col-12'>
										<FormGroup
											id='confirmPassword'
											isFloating
											label={t('Confirm password')}>
											<Input
												type='password'
												autoComplete='confirmPassword'
												onChange={formik.handleChange}
												value={formik.values.confirmPassword}
												invalidFeedback={formik.errors.confirmPassword}
												isTouched={formik.touched.confirmPassword}
												isValid={formik.isValid}
												showPasswordOption
												onBlur={formik.handleBlur}
											/>
										</FormGroup>
									</div>

									<div className='col-12'>
										<Button
											color='secondary'
											className='w-100 py-3 mb-0 mt-0'
											onClick={formik.handleSubmit}>
											{t('Continue')}
										</Button>
									</div>
									<div className='col-12'>
										<Button
											color='secondary'
											isOutline={true}
											className='w-100 py-3'
											onClick={() => {
												navigate(`../${authPages.login.path}`);
											}}>
											{t('Return to login')}
										</Button>
									</div>
								</form>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	) : (
		<ConfirmPage
			title='Congratulations'
			withRedirectButton
			textButton='Login'
			redirectTo={`../${authPages.login.path}`}
		/>
	);
};

export default ResetPassword;
