export interface CredentialsInterface {
	authType: string;
	customerKey?: string;
	password?: string;
	userid: string;
}

export interface SpacesSpacesInterface {
	customerKey: string;
	spaceKey: number;
	spaceName: string;
	userId: number;
}

interface SpacesInterface {
	success: boolean;
	spaces: SpacesSpacesInterface[];
	errorMessage?: string;
	messageCode?: string;
}
export interface CustomerSpacesResponseInterface {
	spaces: SpacesInterface;
}

export interface UserInterface {
	address?: string;
	city: string;
	confirmPassword?: string;
	country: string;
	createdDate: number;
	customproperties: string;
	description: string;
	emailID: string;
	fullName: string;
	id: number;
	landNumber: string;
	lastLoginDate?: number;
	lastUpdatedDat?: number;
	lite: boolean;
	mobileNumber: string;
	password?: string;
	passwordUpdatedDate?: number;
	pincode: string;
	spaceKey: string;
	state: string;
	status: number;
	uniqueId: string;
	userName: string;
	userType: number;
}

export interface PermissionsInterface {
	createdDate: number;
	description: string;
	icon: number;
	id: number;
	menuDisplayType: number;
	menuName: string;
	name: string;
	nameId: string;
	pKey: number;
	parentId: number;
	permissionCategory: string;
	remarks: string;
	spaceKey: string;
	status: number;
	subMenu: string;
	url: string;
}
export interface UsersInterface {
	apiToken: boolean;
	authToken?: string;
	authType: string;
	errorMessage: string;
	id: number;
	licenceCount: number;
	message?: string;
	messageCode: string;
	permissions?: PermissionsInterface[];
	preference?: any;
	spaceKey?: string;
	status: number;
	success: boolean;
	trees?: any;
	user?: UserInterface;
	userName?: string;
}
export interface LoginAndUserInfoByTokenResponseInterface {
	users: UsersInterface;
}

export interface UserGroupsInterface {
	id: number;
	name: string;
	descritpion: string;
	status: number;
	spaceKey: string;
	type: number;
}

export interface UpdateProfileInterface {
	id: string;
	city: string;
	country: string;
	customproperties: string;
	description: string;
	emailID: string;
	fullName: string;
	landNumber: string;
	mobileNumber: string;
	password?: string;
	passwordUpdatedDate?: number;
	pincode: string;
	state: string;
	userName: string;
}
export interface IspacesModel {
	spaceName: string;
	spaceKey: number;
	customerKey: string;
	userId: string;
}

export interface ISpace {
	token: string | undefined;
	user: {};
	success: Boolean | null;
	message: string;
	errorMessage: string;
	messageCode: string;
	spaces: IspacesModel[];
}

// Group Interface
export interface UserGroups {
	success: boolean;
	assignedUsers: any[];
	removedUsers: any[];
	existingUsers: any[];
	excludeUsers: any[];
	userGroupsList: UserGroupsList[];
	users: UsersInterface[];
	privilege: any[];
	listObjectUtils: any[];
	assignedUserGroups: any[];
	addPermissionsToGroupUtils: AddPermissionsToGroupUtil[];
	addedMenuPermission: any[];
	winADInfos: any[];
	existingUserGroups: any[];
	fileMenuContexts: any[];
	folderMenuContexts: any[];
}

export interface AddPermissionsToGroupUtil {
	permissionCategory: string;
	permissions: UsedPermission[];
}

export interface UsedPermission {
	id: number;
	name: string;
	description: string;
	remarks: string;
	permissionCategory: string;
	nameId: string;
	parentId: number;
	url: string;
	spaceKey: string;
	menuName: string;
	subMenu: string;
	menuDisplayType: number;
	icon: number;
	pKey: number;
	status: number;
	permissionUrl: string;
}
export interface UserGroupsList {
	id: number;
	name: string;
	status: number;
	createDate: Date;
	lastUpdateDate: Date;
	type: number;
}
export interface Iusers {
	id: string;
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

export interface IDriver {
	_id?: { [key: string]: string };
	did?: string;
	driver_name?: string;
	dob?: string;
	gender?: 'male' | 'female';
	mobile_no?: string;
	residential_address?: string;
	pob?: string;
	experience?: number;
	health_issues?: 'yes' | 'no';
	emergency_name?: string;
	emergency_number?: string;
	reg_no?: string;
	license_no?: string;
	license_issue_date?: string;
	license_expire_date?: string;
	license_type?: string;
	license_issuing_authority?: string;
}

export interface ColourOption {
	readonly value: string;
	readonly label: string;
	readonly color: string;
	readonly isFixed?: boolean;
	readonly isDisabled?: boolean;
}

export interface IAuthPermissions {
	[key: string]: boolean;
}
export interface IAuthPermissionsCategories {
	permissions: IAuthPermissions[];
	category: string;
}
