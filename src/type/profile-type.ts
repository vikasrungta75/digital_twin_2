import { IUserGroup } from './groups-type';

export interface IChangePasswordUsersResponse {
	message: string;
	success: boolean;
	messageCode: string;
	status: number;
	licenceCount: number;
	plugins: [];
	users: [];
	permissions: [];
	spaces: [];
	allUserGroups: [];
	assignedUserGroups: [];
	allThemes: [];
	trees: [];
	removedUserGroups: IUserGroup[];
	existingUserGroups: [];
	bulkUsersHistories: [];
	apiToken: boolean;
}
