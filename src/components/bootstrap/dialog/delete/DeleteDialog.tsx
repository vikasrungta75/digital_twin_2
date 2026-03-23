import React, { FC, useEffect } from 'react';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../components/bootstrap/OffCanvas';
import Card, { CardBody } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Input from '../../../../components/bootstrap/forms/Input';
import FormGroup from '../../../../components/bootstrap/forms/FormGroup';
import Icon from '../../../../components/icon/Icon';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import Label from '../../../../components/bootstrap/forms/Label';

interface IDeleteDialog {
	setShowDelete: (val: boolean) => void;
	refetch : any
	showDelete: boolean;
	handleDelete: any;
	verificationKey?: string,
    title: string
}

const DeleteDialog: FC<IDeleteDialog> = ({
	setShowDelete,
	showDelete,
	handleDelete,
	verificationKey,
	refetch,
    title
}) => {
	const { t } = useTranslation(['dialog']);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(verificationKey as string);
	};

	// handle form
	const formik = useFormik({
		initialValues: {
			verification_key: '',
		},

		validate: (values) => {
			const errors: {
				verification_key?: string;
			} = {};

			// validate of VIN

			if (!values.verification_key) {
				errors.verification_key = t(`You must confirm verification key to delete`) +" " + t(title);
			} else if (values.verification_key !== verificationKey) {
				errors.verification_key = t("verification Key  don't match!");
			}

			return errors;
		},
		validateOnChange: true,

		onSubmit: async (values) => {
			handleDelete()
            setTimeout(() => {
                setShowDelete(false)
            }, 2000);
		},
		onReset: () => { },
	});

	useEffect(() => {

		return ()=>refetch();

	})

	return (
		<div>
			<OffCanvas
				id='delete-item'
				titleId='delete-item'
				placement='end'
				isOpen={showDelete}
				setOpen={setShowDelete}>
				<OffCanvasHeader className='p-4' setOpen={setShowDelete}>
					<OffCanvasTitle
						id='offcanvasExampleLabel'
						tag={'h3'}
						className='task-heading border-2 w-100'>
						{t(`Delete`)} {t(`${title}`)}
					</OffCanvasTitle>
				</OffCanvasHeader>
				<OffCanvasBody className='px-4'>
					<Label className='mb-0'>{t(`verification key`)}</Label>
					<div className='d-flex '>
						<FormGroup className='w-100 me-4 my-3'>
							<Input value={verificationKey} readOnly />
						</FormGroup>

						<Button onClick={copyToClipboard} size={'lg'}>
							<Icon
								icon='ContentCopy'
								size='lg'
								color='dark'
								forceFamily={'material'}
							/>
						</Button>
					</div>
					<Card>
						<CardBody className='p-3'>
							<p className='w-100 fw-semibold d-flex flex-row align-items-center'>
								{t(`Type the verification key for delete confirmation`)}
							</p>
							<div className='col-12 d-flex'>
								<FormGroup id='deleteConfirmation' className='w-100 me-4'>
									<Input
										name='verification_key'
										id='verification_key'
										onChange={formik.handleChange}
										value={formik.values.verification_key}
										invalidFeedback={formik.errors.verification_key}
										isTouched={formik.touched.verification_key}
										isValid={formik.isValid}
									/>
								</FormGroup>
								<div className={`d-flex`}>
									<Button
										aria-label='Toggle Go Back'
										className='mobile-header-toggle me-2'
										size='sm'
										color='dark'
										isLight
										icon='Close'
										onClick={formik.handleReset}
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
							</div>
						</CardBody>
					</Card>
				</OffCanvasBody>
			</OffCanvas>
		</div>
	);
};

export default DeleteDialog;
