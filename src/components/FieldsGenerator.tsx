import React, { FC, useContext } from 'react';
import { IFields } from '../type/vehicles-type';
import FormGroup from './bootstrap/forms/FormGroup';
import Select from './bootstrap/forms/Select';
import Input from './bootstrap/forms/Input';
import Option from './bootstrap/Option';
import Textarea from './bootstrap/forms/Textarea';
import ThemeContext from '../contexts/themeContext';
import { useTranslation } from 'react-i18next';
import EditableSelect from 'react-select';
import { FormikValues } from 'formik';
import VinSelect from '../pages/common/filters/VinSelect';

interface IFieldsGeneratorComponent {
	data: IFields[];
	formik: FormikValues;
	selectOptions?: any;
	isLoading?: { [key: string]: boolean };
	isEditable?: boolean;
	edit?: boolean;
	setEdit?: (e: boolean) => void;
	translation?: string;
	children?: JSX.Element;
}
const FieldsGenerator: FC<IFieldsGeneratorComponent> = ({
	data,
	formik,
	selectOptions,
	isLoading,
	translation = 'vehicles',
	children,
}): JSX.Element => {
	const { mobileDesign } = useContext(ThemeContext);
	const { t } = useTranslation(translation);

	const style = {
		control: (base: any) => ({
			...base,
			fontSize: '12px',
			color: '#888EA8!important',
			fontWeight: '500',
			borderRadius: '6px!important',
			border: '1px solid #E0E6ED',
			backgroundColor: '#FFFFFF',
			boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.075)',
			fontfamily: 'Open Sans',
			'&:hover': {
				border: '1px solid #E0E6ED',
				boxShadow:
					'inset 0 1px 2px rgba(0, 0, 0, 0.075), 0 0 0 0.25rem rgba(108, 93, 211, 0.25)',
			},
		}),
	};

	return (
		<>
			{data.map(
				({
					label,
					id,
					input,
					placeholder,
					options = '',
					dotted,
					col,
					mandatory,
					dependentId,
					multiSelect = false,
				}: IFields) => {
					return (
						<React.Fragment key={id}>
							{input === 'input' && (
								<FormGroup
									className={`mb-3 ${mobileDesign ? 'col-12' : `col-${col}`}`}
									label={t(label)}
									id={id}
									labelClassName={mandatory ? 'label-required' : ''}>
									<Input
										placeholder={placeholder}
										disabled={dotted}
										className={dotted ? 'dotted' : ''}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}
										value={formik.values[
											id as keyof typeof formik.values
										]?.toString()}
										invalidFeedback={
											formik.errors[id as keyof typeof formik.errors]
										}
										isTouched={
											formik.touched[id as keyof typeof formik.touched]
										}
										isValid={formik.isValid}
									/>
								</FormGroup>
							)}
							{input === 'select' && (
								<FormGroup
									className={`field-card mb-3 ${mobileDesign ? 'col-12' : `col-${col}`
										}`}
									label={t(label)}
									id={id}
									labelClassName={mandatory ? 'label-required' : ''}>
									<Select
										isLoading={
											isLoading?.[id] && selectOptions[options]?.length === 0
										}
										disabled={
											(dependentId !== undefined &&
												formik.values[
													dependentId as keyof typeof formik.values
												]?.length === 0) ||
											selectOptions[options]?.length === 0
										}
										ariaLabel={id}
										id={id}
										name={id}
										placeholder={t(placeholder ? placeholder : 'Select')}
										size='lg'
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											formik.setFieldValue(id, e.target.value);
										}}
										value={
											id === 'reg_no'
												? formik.values.reg_no
													.toUpperCase()
													.replace(/[^a-zA-Z0-9]/g, '')
												: formik.values[id as keyof typeof formik.values]
										}
										invalidFeedback={
											formik.errors[id as keyof typeof formik.errors]
										}
										isTouched={
											formik.touched[id as keyof typeof formik.touched]
										}
										isValid={formik.isValid}>
										{isLoading?.[id] && (
											<Option value='' disabled>
												Loading...
											</Option>
										)}
										{selectOptions[options]?.map((option: any) => {
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
													{t(
														id === 'fleetName'
															? option.fleet_name
															: option,
													)}
												</Option>
											);
										})}
									</Select>
								</FormGroup>
							)}
							{input === 'editable-select' && (
								<FormGroup
									className={`mb-3 field-card ${mobileDesign ? 'col-12' : `col-${col}`
										}`}
									label={t(label)}
									id={id}
									labelClassName={mandatory ? 'label-required' : ''}>
									<EditableSelect
										isMulti={multiSelect}
										id={id}
										placeholder={
											<div className='field-card-select'>
												{t(placeholder ? placeholder : 'Select')}
											</div>
										}
										styles={style}
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
										closeMenuOnSelect={!multiSelect}
										controlShouldRenderValue={true}
										openMenuOnFocus={true}
										hideSelectedOptions={multiSelect}
										value={
											multiSelect
												? selectOptions[options]?.filter(
													(option: any) =>
														formik.values[
															id as keyof typeof formik.values
														]?.indexOf(option.value) >= 0,
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
									className={`mb-3 ${mobileDesign ? 'col-12' : `col-${col}`}`}
									label={t(label)}
									id={id}
									labelClassName={mandatory ? 'label-required' : ''}>
									<Textarea
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}
										value={formik.values[id as keyof typeof formik.values]
											?.toUpperCase()
											?.replace(/[^a-zA-Z0-9]/g, '')}
										invalidFeedback={
											formik.errors[id as keyof typeof formik.errors]
										}
										isTouched={
											formik.touched[id as keyof typeof formik.touched]
										}
										isValid={formik.isValid}
									/>
								</FormGroup>
							)}
							{input === 'vin' && (
								<FormGroup
									className={`mb-3 field-card ${mobileDesign ? 'col-12' : `col-${col}`
										}`}
									label={t(label)}
									id={id}
									labelClassName={mandatory ? 'label-required' : ''}>
									<VinSelect
										vinFilter={formik.values[id as keyof typeof formik.values]}
										setVinFilter={formik.handleChange}
										formik={formik}
										className='mb-3'
										invalidFeedback={
											formik.errors[id as keyof typeof formik.errors]
										}
										isTouched={
											formik.touched[id as keyof typeof formik.touched]
										}
										isValid={formik.isValid}
									/>
								</FormGroup>
							)}

							{input === 'custom' && children}
						</React.Fragment>
					);
				},
			)}
		</>
	);
};

export default FieldsGenerator;
