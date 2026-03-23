export interface ILeastFiveDriver {
	driver_name: string;
	score: string;
	vin: string;
}

export interface IOtherDriverScore extends ILeastFiveDriver {
	Gender: string; 
	Contact_no: string; 
	acceleration_score:string;
	braking_score:string;
	speeding_score:string;
	vin: string;
	driver_name: string;
	// score: number | string;
}

// export interface IOtherDriverScore extends ILeastFiveDriver {
// 	contactNo: string; // Assuming it's a string; adjust if necessary
// 	gender: string;    // Assuming it's a string; adjust if necessary
// 	acceleration_score: string;
// 	braking_score: string;
// 	speeding_score: string;
// 	score: number;
// 	driver_name: string;
// 	vin: string;
//   }
  

export interface ISummaryDriver {
	distance:string;
	driver_score:string;
	engine_hours:string;
	fuel_used:string;
	idle_time:string;
	trip_count: string;
}

export interface IBehaviourScore {
	acceleration_score: string;
	braking_score:string;
	crash_count:string;
	overspeed_score:string;
	poi: string;
}

export interface IDriverBehaviourSummary {
	recommendation: string;
	poi_type:string;
}