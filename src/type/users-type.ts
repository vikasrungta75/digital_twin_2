export interface IApiResult {
	users: { success: boolean; message: string };
}

export interface IUserAssignedToRole {
	user_id: string;
	user_name: string;
	user_email: string;
}
