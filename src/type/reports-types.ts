export interface Report {
	name: string;
	description: string;
	id: string;
}

export interface ReportCategory {
	reportNames: any;
	reports: Report[];
	catergory: string;
}

export interface ReportData {
	reportNames: any;
	_id: number;
	repports: ReportCategory[];
}

export interface IScheduledReports {
	user_email: string;
	sr_id: string;
	enddate: string;
	vin: string;
	report_type: string;
	scheduled_date: string;
	startdate: string;
	status: string;
}
