export interface ITripHistoryOfFleet {
	distance: string;
	duration: string;
	end_time: string;
	enddate: string;
	fuel_consumed: string;
	lastlocation: string;
	mileage: string;
	start_time: string;
	startlocation: string;
	vin: string;
	co2_emission: string;
	_id: string;
}

export interface IDateRangeFilter {
	startDate: string;
	endDate: string;
	startTime: string;
	endTime: string;
}
