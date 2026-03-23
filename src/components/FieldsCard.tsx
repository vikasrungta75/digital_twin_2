import React, { FC, useContext } from 'react';
import Card, { CardBody, CardHeader } from './bootstrap/Card';
import { capitalizeFirstLetter } from '../helpers/helpers';
import { IFieldsCard, IFields } from '../type/vehicles-type';
import FormGroup from './bootstrap/forms/FormGroup';
import Select from './bootstrap/forms/Select';
import Input from './bootstrap/forms/Input';
import Option from './bootstrap/Option';
import Textarea from './bootstrap/forms/Textarea';
import ThemeContext from '../contexts/themeContext';
import { useTranslation } from 'react-i18next';
import EditableSelect from 'react-select';
import { FormikValues } from 'formik';
import Icon from './icon/Icon';
import Button from './bootstrap/Button';
import { useNavigate } from 'react-router-dom';

interface IFieldsCardComponent {
	data: IFieldsCard[];
	formik: FormikValues;
	selectOptions?: any;
	isLoading?: { [key: string]: boolean };
	isEditable?: boolean;
	edit?: boolean;
	setEdit?: (e: boolean) => void;
	translation?: string;
}
const FieldsCard: FC<IFieldsCardComponent> = ({
	data,
	formik,
	selectOptions,
	isLoading,
	isEditable = false,
	edit,
	setEdit,
	translation = 'vehicles',
}): JSX.Element => {
	const { mobileDesign } = useContext(ThemeContext);
	const { t } = useTranslation(translation);
	const navigate = useNavigate();

	return (
		<>
			{data.map(({ category, fields }, index) => {
				const hasRequiredField = fields.some((field) => field.mandatory === true);
				return (
					<Card key={index} style={{borderRadius:"8px"}}>
						<CardHeader className='fw-semibold fs-4 pb-0'>
							{t(category)}
							{hasRequiredField && (
								<span style={{ fontSize: 12 }} className='float-end text-dark'>
									<span className='text-danger'>*</span>{' '}
									{capitalizeFirstLetter(t('mandatory fields'))}
								</span>
							)}
							{isEditable && (
								<Icon
									onClick={() => setEdit && setEdit(!edit)}
									className='me-3 cursor-pointer'
									color={edit ? 'secondary' : 'dark'}
									icon='Edit'
								/>
							)}
						</CardHeader>
						<CardBody className='row field-card'>
							{fields.map(
								({
									label,
									id,
									input,
									placeholder,
									options = '',
									col,
									mandatory,
									dependentId,
									multiSelect,
								}: IFields) => {
									return (
										<React.Fragment key={id}>
											{input === 'input' && (
												<FormGroup
													className={`mb-3 ${
														mobileDesign ? 'col-12' : `col-${col}`
													}`}
													label={t(label)}
													id={id}
													labelClassName={
														mandatory ? 'label-required' : ''
													}>
													<Input
														placeholder={placeholder}
														// disabled={!edit || dotted}
														style={{ backgroundColor: 'transparent' }} 
														// className={dotted ? 'dotted' : ''}
														onBlur={formik.handleBlur}
														onChange={formik.handleChange}
														value={formik.values[
															id as keyof typeof formik.values
														]?.toString()}
														invalidFeedback={
															formik.errors[
																id as keyof typeof formik.errors
															]
														}
														isTouched={
															formik.touched[
																id as keyof typeof formik.touched
															]
														}
														isValid={formik.isValid}
													/>
												</FormGroup>
											)}
											{input === 'select' && (
												<FormGroup
													className={`mb-3 ${
														mobileDesign ? 'col-12' : `col-${col}`
													}`}
													label={t(label)}
													id={id}
													labelClassName={
														mandatory ? 'label-required' : ''
													}>
													<Select
														isLoading={
															isLoading?.[id] &&
															selectOptions[options]?.length === 0
														}
														disabled={
															(dependentId !== undefined &&
																formik.values[
																	dependentId as keyof typeof formik.values
																]?.length === 0) ||
															selectOptions[options]?.length === 0 ||
															!edit
														}
														ariaLabel={id}
														id={id}
														name={id}
														placeholder={t(
															placeholder ? t(placeholder) : 'Select',
														)}
														size='lg'
														onChange={(
															e: React.ChangeEvent<HTMLInputElement>,
														) => {
															formik.setFieldValue(
																id,
																e.target.value,
															);
														}}
														value={
															id === 'reg_no'
																? formik.values.reg_no
																		.toUpperCase()
																		.replace(
																			/[^a-zA-Z0-9]/g,
																			'',
																		)
																: formik.values[
																		id as keyof typeof formik.values
																  ]
														}
														invalidFeedback={
															formik.errors[
																id as keyof typeof formik.errors
															]
														}
														isTouched={
															formik.touched[
																id as keyof typeof formik.touched
															]
														}
														isValid={formik.isValid}
														style={{ border: '1px solid #E0E6ED' }} >
														{isLoading?.[id] && (
															<Option value='' disabled>
																Loading...
															</Option>
														)}
														{selectOptions[options]?.map(
															(option: any) => {
																return (
																	<Option
																		key={
																			id === 'fleetName'
																				? option.fleet_name
																				: option
																		}
																		value={
																			id === 'fleetName'
																				? option.fleet_name
																				: option
																		}>
																		{id === 'fleetName'
																			? option.fleet_name
																			: option}
																	</Option>
																);
															},
														)}
													</Select>
												</FormGroup>
											)}
											{input === 'editable-select' && (
												<FormGroup
													className={`mb-3 ${
														mobileDesign ? 'col-12' : `col-${col}`
													}`}
													label={t(label)}
													id={id}
													labelClassName={
														mandatory ? 'label-required' : ''
													}>
													<EditableSelect
														id={id}
														placeholder={t(
															placeholder ? placeholder : 'Select',
														)}
														isClearable
														isSearchable
														className='usr-select-btn'
														options={selectOptions[options]}
														onChange={(e: any) => {
															formik.setFieldValue(
																id,
																multiSelect
																	? e.map((el: any) => el.value)
																	: e.value,
															);
														}}
														closeMenuOnSelect={true}
														controlShouldRenderValue={true}
														openMenuOnFocus={true}
														hideSelectedOptions={false}
														value={
															multiSelect
																? selectOptions[options].filter(
																		(option: any) =>
																			formik.values[
																				id as keyof typeof formik.values
																			].indexOf(
																				option.value,
																			) >= 0,
																  )
																: selectOptions[options].find(
																		(option: any) =>
																			option.label ===
																			formik.values[
																				id as keyof typeof formik.values
																			],
																  )
														}
													/>
												</FormGroup>
											)}
											{input === 'textarea' && (
												<FormGroup
													className={`mb-3 ${
														mobileDesign ? 'col-12' : `col-${col}`
													}`}
													label={t(label)}
													id={id}
													labelClassName={
														mandatory ? 'label-required' : ''
													}>
													<Textarea
														onBlur={formik.handleBlur}
														onChange={formik.handleChange}
														value={formik.values[
															id as keyof typeof formik.values
														]
															?.toUpperCase()
															?.replace(/[^a-zA-Z0-9]/g, '')}
														invalidFeedback={
															formik.errors[
																id as keyof typeof formik.errors
															]
														}
														isTouched={
															formik.touched[
																id as keyof typeof formik.touched
															]
														}
														isValid={formik.isValid}
														className='bg-transparent'
													/>
												</FormGroup>
											)}
										</React.Fragment>
									);
								},
							)}
						</CardBody>
					</Card>
				);
			})}
			{edit && (
				<div
					className={`d-flex w-100 mb-3 ${
						mobileDesign ? 'flex-column ' : 'flex-row-reverse '
					}`}>
					<Button
						isDisable={!formik.isValid}
						color='dark'
						className={`py-3 save-text ${mobileDesign ? 'w-100' : 'w-25 ms-3'}`}
						onClick={formik.handleSubmit}>
						{isEditable ? t('Save') : t('Create')}
					</Button>
					<Button
						color='dark'
						isOutline={true}
						className={`py-3 cancel-text ${mobileDesign ? 'w-100 my-3' : 'w-25'}`}
						onClick={(e) => {
							// formik.handleReset(e);
							navigate(-1);
						}}>
						{t('Cancel')}
					</Button>
				</div>
			)}
		</>
	);
};

export default FieldsCard;
