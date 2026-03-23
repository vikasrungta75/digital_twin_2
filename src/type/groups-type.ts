export interface Iusers {
	id: number;
	userName: string;
	emailID: string;
	userType: number;
	uniqueId: string;
	fullName: string;
	description: string;
	status: number;
	spaceKey: string;
	customproperties: [];
	thirdPartyUser: string;
	passwordUpdatedDate: number;
	lite: boolean;
}

/* export interface INewGroups {
	groupName: string;
	description: string;
	addedPermissions: number[];
	menuPermissions: number[];
	userIDs: number[];
	spacekey: number;
	id: number;
} */

export interface IGroup {
	id: number;
	name: string;
	status: number;
	type: number;
	createDate: Date;
	lastUpdateDate: Date;
}
export interface IGroupAssignedToRole {
	group_id: string;
	group_name: string;
}

export interface IUserGroup {
	id: number;
	name: string;
	status: number;
	type: number;
	spaceKey: number;
}
