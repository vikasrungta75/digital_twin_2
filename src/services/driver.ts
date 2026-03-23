import { generateRestAPI } from '../helpers/helpers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { dataIngestion, getData } from './commonService';
import { store } from '../store/store';
import { IDriver } from '../type/auth-type';

export interface IDriverProfileDataObject {
	dob: string;
	driver_name: string;
	emergency_name: string;
	emergency_number: string;
	experience: string;
	gender: string;
	health_issues: string;
	license_expire_date: string;
	license_issue_date: string;
	license_issuing_authority: string;
	license_no: string;
	license_type: string;
	mobile_no: string;
	pob: string;
	residential_address: string;
	vin: string;
}

// export interface IDriverProfileData {
// 	IDriverProfileDataObject[]
// }

export const useGetDriversList = (filter: string) => {
	const payload = generateRestAPI([{ driver_id: filter }], process.env.REACT_APP_ALL_DRIVERS);
	return useQuery({
		queryKey: ['getDriversList', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'all drivers'),
	});
};

export const useGetDriverProfile = (driverName: string) => {
	const payload = generateRestAPI(
		[{ driver_name: driverName }],
		process.env.REACT_APP_DRIVER_PROFILE,
	);
	return useQuery({
		queryKey: ['useGetDriverProfile', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'driver profile'),
	});
};

export const useCUDDriver = () => {
	const {
		user: {
			user: { id, emailID, userName },
		},
	} = store.getState().auth;

	return useMutation((payload: { driver: IDriver; action: string }) =>
		dataIngestion(
			 { 
				...payload.driver,
				user_id: id,
				user_email: emailID,
				user_name: userName,
				action: payload.action,
			} 
		 
		),
	);
};

export const useGetREGNO = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_DRIVER_FORM_REGNO_CHECK);

	return useQuery({
		queryKey: ['getREGNO', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'all drivers'),
	});
};

export const useGetDriverDetail = (driver_name: string) => {
	const payload = generateRestAPI([{ driver_name }], process.env.REACT_APP_DRIVER_PROFILE);

	return useQuery<IDriverProfileDataObject[]>({
		queryKey: ['getDriverDetail', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'drivers Porfil'),
	});
};
