import React, { FC, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import GoBack from '../../../components/GoBack';
import Loader from '../../../components/Loader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import ThemeContext from '../../../contexts/themeContext';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
// import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import { settings } from '../../../menu';
import { useGetActivityLogs } from '../../../services/activityLog';
import DatatableActivityLogs from './DatatableActivityLogs';

interface ActivityLogsProps {}

const ActivityLogs: FC<ActivityLogsProps> = () => {
	const { t } = useTranslation(['activityLogs']);
	const { mobileDesign } = useContext(ThemeContext);

	const { data: activityData, isLoading } = useGetActivityLogs();

	return (
		<>
			<PageWrapper isProtected={true}>
				{/* <SubHeader>
					<SubHeaderLeft>
						<Breadcrumb
							list={[
								{
									title: t(`${settings.activityLog.text}`),
									to: `../${settings.activityLog.path}`,
								},
							]}
						/>
					</SubHeaderLeft>
				</SubHeader> */}
				<Page className='mw-100 px-3'>
					<div className='d-flex pb-3 mb-4 border-bottom border-secondary w-100'>
						<GoBack />
						<h1 className='fs-2 ms-4 fw-semibold text-secondary'>
							{t(`${settings.activityLog.text}`)}
						</h1>
					</div>
					<Card>
						<CardBody className={`${mobileDesign ? '' : 'row'}`}>
							{isLoading ? (
								<>
									<Loader />
								</>
							) : (
								<>
									{activityData && (
										<DatatableActivityLogs activityData={activityData} />
									)}
								</>
							)}
						</CardBody>
					</Card>
				</Page>
			</PageWrapper>
		</>
	);
};

export default ActivityLogs;
