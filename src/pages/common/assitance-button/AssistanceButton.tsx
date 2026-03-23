import React, { useEffect, useState } from 'react';
import Button from '../../../components/bootstrap/Button';
import OffCanvas, { OffCanvasBody, OffCanvasHeader } from '../../../components/bootstrap/OffCanvas';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '../../../components/icon/Icon';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store/store';
import Spinner from '../../../components/bootstrap/Spinner';
import Alert from '../../../components/bootstrap/Alert';
import useLanguage from '../../../hooks/useLanguage';

interface IAssistanceProps {
	locationPathname: string;
}

const AssistanceButton: React.FC<IAssistanceProps> = ({ locationPathname }) => {
	const { t } = useTranslation(['assistance']);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [helpArticle, setHelpArticle] = useState<any>();
	const isLoading = useSelector((state: RootState) => state.loading.models.help);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const languageISOCode = useLanguage();

	useEffect(() => {
		const payload = {
			payloadQuery: locationPathname,
			languageISOCode,
		};
		if (dispatch.help) {
			dispatch.help.getAllArticlesAsync(payload).then((res: any) => {
				setHelpArticle(res);
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch.help, locationPathname]);

	return (
		<>
			{helpArticle && helpArticle.length > 0 && (
				<Button
					color='info'
					isOutline
					icon='Help'
					onClick={() => setIsModalOpen(true)}
					className='btn-only-icon'
				/>
			)}

			{isModalOpen && (
				<OffCanvas
					id='assistance-offcanvas'
					isOpen={isModalOpen}
					setOpen={setIsModalOpen}
					placement='end'>
					<OffCanvasHeader setOpen={setIsModalOpen}>
						<span className='fw-bold fs-5'>{t('Help')}</span>
					</OffCanvasHeader>
					<OffCanvasBody>
						{isLoading ? (
							<div className='d-flex justify-content-center'>
								<Spinner color='primary' />
							</div>
						) : helpArticle && helpArticle.length > 0 ? (
							<div>
								{helpArticle.map((datum: any, index: number) => {
									return (
										<div key={index}>
											<ReactMarkdown className='help-description'>
												{datum?.attributes?.content}
											</ReactMarkdown>
											<Button
												color='primary'
												isLink
												onClick={() => {
													navigate('/dt/about', {
														state: {
															category: datum?.attributes?.catgory?.data,
														},
													});
													setIsModalOpen(false);
												}}>
												{t('See more')}
											</Button>
										</div>
									);
								})}
							</div>
						) : (
							<Alert color='info'>
								{t('No help section to display')}
							</Alert>
						)}
					</OffCanvasBody>
				</OffCanvas>
			)}
		</>
	);
};

export default AssistanceButton;
