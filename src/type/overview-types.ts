export const overviewType = {
	_id: '',
	total_device: '',
	device_with_issue: '',
	out_of_order_vehicle: '',
	total_vehicle: '',
};
export const IDateRangeFilter ={
	startDate: '',
	endDate: '',
	startTime: '',
	endTime: '',
};

export const initialValues = {
	deviceVehicleStatus: overviewType,
	fuelEfficiency: [],
	vehicleUsage: [],
	overviewVehicleAlerts: [{ name: 'Vehicle Alerts', data: [] }],
	metricsPerPeriod: {},
	totalOpenAlerts: { _id: '', open_alert_count: '', Total_Alerts: '' },
	drainage: [{ name: 'Total Drainge (L)', data: [] }],
	totalDrainage: [{ name: 'Total Drainge Count(L)', data: [] }],
	totalFuel: [{ name: 'Total Fuel Consumed', data: [] }],
	totalFilling: [{ name: 'Total Fillings count', data: [] }],
	avgFuel: [{ name: 'Average Fuel Level', data: [] }],
	temperature: [{ name: 'Temperature Data', data: [] }],
	totalRefuel: [{ name: 'Total Refuel', data: [] }],
	ecoDriverTotalScore: [{ name: 'Eco Driver Average Score', data: [] }],
	mileageDriven: [{ name: 'Mileage Driven (km)', data: [] }],
	nbTrips: [{ name: 'No Of Trips', data: [] }],
	totalIdlingTime: [{ name: 'Total Idling Time (Min)', data: [] }],
	avgIdlingTime: [{ name: 'Average Idling Time (Min)', data: [] }],
	fuelAvgEfficiency: [{ name: 'Fuel Average Efficiency', data: [] }],
	fuelAvgConsumption: [{ name: 'Average Consumption (L)', data: [] }],
	vehicleUtilization: [{ name: 'Vehicle Utilization', data: [] }],
	dateRangeFilterFromStore: {
		startDate: '',
		endDate: '',
		startTime: '',
		endTime: '',
	},
	dateRangeFilterFromStorePrev: {
		startDate: '',
		endDate: '',
		startTime: '',
		endTime: '',
	},
	maintenanceStatus: [
		{
			name: 'Maintenance Status',
			data: [
				{
					series: [] as any,
					labels: [] as any,
				},
			],
		},
	],
	driverPerformance: [
		{
			name: 'Driver Performance',
			data: [
				{
					series: [] as any,
					labels: [] as any,
				},
			],
		},
	],
	routeOptimization: [{ name: 'Route Optimization', data: [] }],
	environmentalImpact: [{ name: 'Environmental Impact', data: [] }],
	downtimeAnalysis: [{ name: 'Downtime Analysis', data: [] }],
	tcoAdmangCost: [{ name: 'Administrative Management Cost', data: [] }],
	fpOverviewTcoOperationalCost: [{ name: 'Operational Cost', data: [] }],
	fpOverviewTcoInsuranceCost: [{ name: 'Insurance Cost', data: [] }],
	fpOverviewTcoMaintenanceCost: [{ name: 'Maintenance Cost', data: [] }],
	fpOverviewTcoVehAcquisitionCost: [{ name: 'Vehicle Acquisition Cost', data: [] }],
	fpOverviewTcoFuelCost: [{ name: 'Fuel Cost', data: [] }],
	fpOverviewTcoFuelConsumed: [{ name: 'Fuel Consumed', data: [] }],
	fpOverviewTcoVehicleLeasingCost: [{ name: 'Vehicle Leasing Cost', data: [] }],


};

export interface ITotalAlerts {
	total_alerts: string;
}

export interface IDeviceVehicleStatus {
	_id: string;
	total_device: string;
	device_with_issue: string;
	out_of_order_vehicle: string;
	total_vehicle: string;
}
export interface IFuelEfficiency {
	_id: string;
	efficiency: string;
}

export interface IFleetHealth {
	_id: string;
	health: string;
}

export interface IFleetUsage {
	_id: string;
	health: string;
}

export interface ITemperatureData {
	_id: string;
	health: string;
}


export interface IOverviewVehicleAlerts {
	_id: string;
	count: string;
}
export interface IOverviewVehicleUsage {
	_id: string;
	mileage: string;
}

export interface IStatistics {
	header: string;
	data: IDataStatistics[];
}

export interface IDataStatistics {
	name: string;
	value: string;
}
