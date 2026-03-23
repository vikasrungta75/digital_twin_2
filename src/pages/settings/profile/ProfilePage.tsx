import React, { useContext, useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Button from '../../../components/bootstrap/Button';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Avatar from '../../../components/Avatar';
import Icon from '../../../components/icon/Icon';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import UserImage from '../../../assets/img/wanna/wanna1.png';
import UserImageWebp from '../../../assets/img/wanna/wanna1.webp';
import { NavigationLine } from '../../../layout/Navigation/Navigation';
import '../../../styles/components/layout/_profile-page.scss';
import { settings } from '../../../menu';
import ThemeContext from '../../../contexts/themeContext';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';
import Badge from '../../../components/bootstrap/Badge';
import { UserGroupsInterface } from '../../../type/auth-type';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
	const { mobileDesign } = useContext(ThemeContext);
	const navigate = useNavigate();
	const { user, assignedUserGroups } = useSelector((state: RootState) => state.auth.user);
	const { permissions } = useSelector((state: RootState) => state.auth);
	const { t } = useTranslation(['profilePage', 'groupsPages']);

	const [showModal, setShowModal] = useState(false);

	return (
		<PageWrapper>
			<Page>
				{showModal && <EditProfileModal isOpen={showModal} setIsOpen={setShowModal} />}
				<div className='pt-3 pb-5 d-flex align-items-center'>
					<span className='display-4 fw-bold me-3'>{user?.fullName}</span>
					<span className='border border-success border-2 text-success fw-bold px-3 py-2 rounded text-center'>
						{user?.description}
					</span>
				</div>
				<div className='row'>
					<div className='col-lg-6'>
						<Card className='shadow-3d-info'>
							<CardBody>
								<div className='d-flex justify-content-end'>
									{permissions?.edit_profile && (
										<Button
											icon='Edit'
											style={{ color: '#0B1143' }}
											isLight
											onClick={() =>
												mobileDesign
													? navigate(`/${settings.profile.path}/edit`)
													: setShowModal(true)
											}>
											{t('profilePage:Edit')}
										</Button>
									)}
								</div>
								<div className='row g-5'>
									<div className='col-12 d-flex justify-content-center'>
										<Avatar
											src={UserImage}
											srcSet={UserImageWebp}
											color='primary'
											isOnline={true}
										/>
									</div>
									<div className='col-12'>
										<div className='row g-2'>
											<div className='col-12'>
												<div className='d-flex align-items-center'>
													<div className='flex-shrink-0'>
														<Icon
															icon='MailOutline'
															size='3x'
															color='success'
														/>
													</div>
													<div className='flex-grow-1 ms-3'>
														<div className='fw-bold fs-5 mb-0'>
															{user?.emailID}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<NavigationLine className='mt-3 mb-3' />

									<div className='col-12 mt-0'>
										<div className='d-flex align-items-center'>
											<div className='flex-shrink-0'>
												<Icon icon='PeopleAlt' size='3x' color='success' />
											</div>
											<div className='d-flex justify-content-between ms-3 w-100'>
												<div className='fw-bold fs-5 mb-0'>
													{t('groupsPages:Groups')}
												</div>
											</div>
										</div>
										<div className='row g-2 mt-4'>
											{assignedUserGroups
												?.map(
													(group: UserGroupsInterface, index: number) => (
														<div key={index} className='col-auto'>
															<Badge
																isLight
																className='fs-6 px-3 py-2'>
																{group.name}
															</Badge>
														</div>
													),
												)}
										</div>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ProfilePage;
