import React, { FC, useContext } from 'react';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../components/bootstrap/forms/Input';
import data from '../updateProfileFields.json';
import ThemeContext from '../../../../contexts/themeContext';
import { useTranslation } from 'react-i18next';

interface ChangePasswordProps {
	formik: any;
}

const ChangePassword: FC<ChangePasswordProps> = ({ formik }): JSX.Element => {
	const { mobileDesign } = useContext(ThemeContext);
	const { t } = useTranslation(['profilePage']);

	return (
		<div className='row g-4'>
			{data.updatePasswordFields.map(({ name, label }) => {
				return (
					<div className={mobileDesign ? 'col-12' : 'col-12'} key={name}>
						<FormGroup id={name} label={t(`${label}`)}>
							<Input
								type='password'
								autoComplete={name}
								value={formik.values[name as keyof typeof formik.values]}
								invalidFeedback={formik.errors[name as keyof typeof formik.errors]}
								isTouched={formik.touched[name as keyof typeof formik.touched]}
								isValid={formik.isValid}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								onFocus={() => {
									formik.setErrors({});
								}}
								showPasswordOption
							/>
						</FormGroup>
					</div>
				);
			})}
		</div>
	);
};

export default ChangePassword;
