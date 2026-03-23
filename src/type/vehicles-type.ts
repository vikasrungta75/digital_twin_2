export const initialValuesVehicleDetails = {
	vin: '',
	reg_no: '',
	make: '',
	manufacturer: '',
	series: [],
	body_type: '',
	color: '',
	engine_type: '',
	engine_capacity: '',
	transmission_type: '',
	drive_type: '',
	fuel_type: '',
	miliage: '',
	tank_capacity: '',
	emission_norm: '',
	seating_capacity: '',
	no_doors: '',
	serial: '',
	imei: '',
	current_firmware: '',
	current_configuration: '',
	mobile_no: '',
	sim_no: '',
	imsi: '',
	carrier: '',
	type: '',
	status: '',
	// temperature:''
};

export const initialVehicleLocation = [
	{
		fuel: '',
		group_name: '',
		last_seen_location: '',
		lat: '',
		lng: '',
		make: '',
		model: '',
		odometer: '',
		oem: '',
		registration_no: '',
		speed: '',
		status: '',
		vin: '',
		heading: '',
		temperature: '',
	},
];

export const intialVehicleStatus = {
	active_vehicles: '',
	disconnected_vehicles: '',
	idle_vehicles: '',
	parked_vehicles: '',
	stopped_vehicles: '',
	total_vehicles: '',
	trouble_vehicles: '',
	_id: '',
};

export const initialVehicleDetailsLocation = {
	fuel: '',
	group_name: '',
	last_seen_location: '',
	lat: '',
	lng: '',
	make: '',
	model: '',
	odometer: '',
	oem: '',
	registration_no: '',
	speed: '',
	status: '',
	trouble: '',
	vin: '',
	heading: '',
};
export const initialKpiOverview = {
	total_cars: '-',
	trip_count: '-',
	behavior_violations: '-',
	_id: '',
	total_distance: '-',
	co2_emission: '-',
	engine_hours: '-',
	fuel_cost: '-',
	utilization: '-',
};

export interface IKpiOverview
	extends ITripOverviewOfTotalCountBVDistance,
		ITripOverviewOfTotalFuelEngine,
		ITripOverviewOfFleetUtilisation {}

export interface ITripOverviewOfTotalCountBVDistance {
	behavior_violations: string;
	total_cars: string;
	total_distance: string;
	trip_count: string;
	_id: string;
}
export interface ITripOverviewOfTotalFuelEngine {
	co2_emission: string;
	engine_hours: string;
	fuel_cost: string;
}

export interface ITripOverviewOfFleetUtilisation {
	utilization: string;
}

export interface IvehicleLocation {
	fuel: string;
	fuel_liters?: string;
	temperature?: string;
	group_name: string;
	last_seen_location: string;
	lat: string;
	lng: string;
	make: string;
	model: string;
	odometer: string;
	oem: string;
	registration_no: string;
	speed: string;
	status: string;
	vin: string;
	heading: string;
	trouble?: string;
	last_updated?: string;
	driver_name?:string;
	driver_id?:string;
}

export interface IVehicle {
	vin_no: string;
	fuel_type: string;
	make: string;
	manufacturer: string;
	serial_no: string;
	current_firmware: string;
	sim_no: string;
	sim_imsi: string;
	type: string;
	mileage: string;
	reg_no: string;
}

export interface IvehicleStatus {
	active_vehicles: string;
	disconnected_vehicles: string;
	idle_vehicles: string;
	parked_vehicles: string;
	stopped_vehicles: string;
	total_vehicles: string;
	troubles_vehicles: string;
	_id: string;
}

export interface IGroupNameFilter {
	_id: string;
	fleet_id?: string;
}

export interface ITtripInfoData {
	SpeedFuelDistance: ITripInfoObj[];
	Diagnostics: ITripInfoObj[];
}

export interface ITripInfoObj {
	label: string;
	value: string;
	icon: string;
}

export interface IVinByFleet {
	vin_no: string;
}

export interface IDailyDriveUsage {
	distance: string;
	drive_score: string;
	harsh_acc: string;
	harsh_dec: string;
	overspeeding: string;
	poi_violations: string;
	time: string;
	_id: string;
}
export interface IFuelPerformances {
	vin: string;
	fuel_usage: string;
	avg_fuel_usage: string;
	mileage: string;
}

export interface IDailyVehicleUsage {
	average_speed: string;
	distance: string;
	end_address: string;
	idle_time: string;
	maximum_speed: string;
	running_time: string;
	start_address: string;
	total_alarm: string;
	_id: string;
}

export interface IVehicleRecord {
	vin: string;
	odometer: string;
	fuel: string;
}

export interface IVehicleStopped {
	start_time_of_stop: string;
	stop_time_of_stop: string;
	stop_address: string;
	stop_duration: string;
	stop_lat_cordinate: string;
	stop_long_cordinate: string;
	stop_idle_hours: string;
}

export interface IDataTripReports {
	avg_speed: string;
	distance: string;
	duration: string;
	end_address: string;
	fuel_consumption_can: string;
	fuel_consumption_theory: string;
	inactivity_time: string;
	max_speed: string;
	start_address: string;
	vin: string;
	_id: string;
}

export interface ISortVehicles {
	vinSort: number;
	fleetNameSort: number;
	statusSort: number;
}

interface IService {
	service: string;
	target: string;
	remind_before: string;
}
export interface IRevision {
	vin: string;
	task_name: string;
	parameters: Array<IService>;
	description: string;
	notify_me: boolean;
	notify_sms: boolean;
	notify_email: boolean;
	notify_web_push: boolean;
	users: Array<{
		user_email: string;
		notify_me: boolean;
		notify_sms: boolean;
		notify_email: boolean;
	}>;
	date: string;
}

export interface IFieldsCard {
	category: string;
	fields: IFields[];
}
export interface IFields {
	label: string;
	id: string;
	input: string;
	options?: string;
	placeholder?: string;
	col: string;
	mandatory: boolean;
	dotted?: boolean;
	dependentId?: string;
	multiSelect?: boolean
}

export interface IFilterOptions {
	[key: string]: string;
}
