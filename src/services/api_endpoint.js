export const API_ATH = {
	LOGIN: '/auth/authenticateuser',
	GET_USER_INFO_BY_TOKEN: 'auth/getUserInfoByToken',
	LOGOUT: '/auth/logout',
	GET_CUSTOMER_SPACES: '/auth/getCustomerSpaces',
	GET_CUSTOMER_SPACES_FOR_FORGET_PASSWORD: '/auth/getCustomerSpacesForForgetPassword',
	FORGET_PASSWORD: '/user/forgetpasswordresetlink',
	UPDATE_FORGOT_PASSWORD: '/auth/updateforgotpassword',
};

export const API_PROFILE = {
	UPDATE_PROFILE: '/user/updateprofile',
	GET_PROFILE_USER_DETAILS: '/user/getProfileUserDetails',
	CHANGE_PASSWORD: '/user/changepassword',
};
export const API_GROUPS_USERS = {
	GET_USERS_LISTS: '/user/getallusers',
	GET_GROUPS_USER: '/user/getallusers',
	GET_USERS_IN_GROUP: '/user/getUserGroupDetails',
	SET_NEW_GROUPS_USER: '/user/createusergroup',
	GET_GROUPS_LISTS: '/user/getUserGroupsList',
	GET_LIST_USERS_GROUP: '/user/getUserGroupDetails',
	CREATE_USER: '/user/createuser',
	USER_GROUP_OPERATIONS: '/user/usergroupoperations',
	GET_PERMISSION_LIST: '/permission/getallchildpermissions',
	UPDATE_GROUP: 'user/updateusergroupdetails',
	REMOVE_USER_OPERATIONS: '/user/removeUserOperations',
	GET_USER_DETAILS: '/user/getuserdetails',
};

export const API_GET_VEHICLES = {
	GET_URL_END_POINT: '/datamanagement/getEndpointUrl',
	GET_RECORDS: '/proxy/getRecords',
	DATA_INGESTION: '/ingestion/dataIngestion',
};
