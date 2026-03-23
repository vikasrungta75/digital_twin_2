import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { getData } from '../services/commonService';
import {
	IDeviceVehicleStatus,
	IFuelEfficiency,
	IFleetHealth,
	IFleetUsage,
	ITemperatureData,
	IOverviewVehicleAlerts,
	initialValues,
	ITotalAlerts,
	IOverviewVehicleUsage,
} from '../type/overview-types';

export const overview = createModel<RootModel>()({
	state: {
		...initialValues,
	},
	reducers: {
		setDateRangeFilter(state, res) {
			return {
				...state,
				dateRangeFilterFromStore: res,
			};
		},
		setDateRangeFilterPrev(state, res) {
			return {
				...state,
				dateRangeFilterFromStorePrev: res,
			};
		},

		setDeviceVehicleStatus(state, res) {
			return {
				...state,
				deviceVehicleStatus: res[0],
			};
		},
		setFuelEfficiency(state, res) {
			return {
				...state,
				fuelEfficiency: res,
			};
		},
		setVehicleUsage(state, res) {
			return {
				...state,
				vehicleUsage: res,
			};
		},
		setMetricsPerPeriod(state, res) {
			return {
				...state,
				metricsPerPeriod: res,
			};
		},
		setOverviewVehicleAlerts(state, res) {
			return {
				...state,
				overviewVehicleAlerts: res,
			};
		},
		setTotalOpenAlerts(state, res) {
			return {
				...state,
				totalOpenAlerts: res[0],
			};
		},
		setDrainage(state, res) {
			return {
				...state,
				drainage: res,
			};
		},
		setTotalDrainage(state, res) {
			return {
				...state,
				totalDrainage: res,
			};
		},
		setTotalFuel(state, res) {
			return {
				...state,
				totalFuel: res,
			};
		},
		setTotalFilling(state, res) {
			return {
				...state,
				totalFilling: res,
			};
		},
		setAvgFuel(state, res) {
			return {
				...state,
				avgFuel: res,
			};
		},
		setTemperature(state, res) {
			return {
				...state,
				temperature: res,
			};
		},
		setTotalRefuel(state, res) {
			return {
				...state,
				totalRefuel: res,
			};
		},
		setEcoDriverTotalScore(state, res) {
			return {
				...state,
				ecoDriverTotalScore: res,
			};
		},
		setMileageDriven(state, res) {
			return {
				...state,
				mileageDriven: res,
			};
		},
		setNbTrips(state, res) {
			return {
				...state,
				nbTrips: res,
			};
		},
		setTotalIdlingTime(state, res) {
			return {
				...state,
				totalIdlingTime: res,
			};
		},
		setAvgIdlingTime(state, res) {
			return {
				...state,
				avgIdlingTime: res,
			};
		},
		setFuelAvgEfficiency(state, res) {
			return {
				...state,
				fuelAvgEfficiency: res,
			};
		},
		setFuelAvgConsumption(state, res) {
			return {
				...state,
				fuelAvgConsumption: res,
			};
		},

		setVehicleUtilization(state, res) {
			return {
				...state,
				vehicleUtilization: res,
			};
		},
		setMaintenanceStatus(state, res) {
			return {
				...state,
				maintenanceStatus: [
					{
						name: 'Maintenance Status',
						data: [
							{
								series: res.map(({ count }: any) => count),
								labels: res.map(({ status }: any) => status),
							},
						],
					},
				],
			};
		},
		setDriverPerformance(state, res) {
			return {
				...state,
				driverPerformance: [
					{
						name: 'Driver Performance',
						data: [
							{
								series: res.map(
									({ driver_performance_score }: any) => driver_performance_score,
								),
								labels: ['Driver Performance'],
							},
						],
					},
				],
			};
		},
		setTcoAdmangCost(state, res) {
			return {
				...state,
				tcoAdmangCost: res,
			};
		},
		setFpOverviewTcoOperationalCos(state, res) {
			return {
				...state,
				fpOverviewTcoOperationalCost: res,
			};
		},
		setFpOverviewTcoInsuranceCost(state, res) {
			return {
				...state,
				fpOverviewTcoInsuranceCost: res,
			};
		},

		setFpOverviewTcoMaintenanceCost(state, res) {
			return {
				...state,
				fpOverviewTcoMaintenanceCost: res,
			};
		},
		setFpOverviewTcoVehAcquisitionCost(state, res) {
			return {
				...state,
				fpOverviewTcoVehAcquisitionCost: res,
			};
		},
		setFpOverviewTcoFuelCost(state, res) {
			return {
				...state,
				fpOverviewTcoFuelCost: res,
			};
		},
		setFpOverviewTcoFuelConsumed(state, res) {
			return {
				...state,
				fpOverviewTcoFuelConsumed: res,
			};
		},
		setFpOverviewTcoVehicleLeasingCost(state, res) {
			return {
				...state,
				fpOverviewTcoVehicleLeasingCost: res,
			};
		},

		clearStore() {
			return initialValues;
		},
	},
	
	effects: (dispatch) => ({
		async getListFleetByVin(payload, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;
 
			const credentials = generateRestAPI(
				[
					{ fleet_id: customProperties.fleetId },
					{ user_id: id },
					{ vin:   'All Vins' },
					 
				],
				process.env.REACT_APP_FP_VIN_FLEET_FILTER,
			);
		 
			const getTasksResponse: any = await getData(credentials, 'tasks');

			if (Array.isArray(getTasksResponse)) {
// Add null/undefined checks
				this.setListFleetVins(getTasksResponse?.[0]?.data ?? []); // Using nullish coalescing				this.setListFleetVins([]); 
			}
			return getTasksResponse;
		},
		
		async getTotalAlerts(_: void, rootState) {
			const payloadGetTotalAlerts = generateRestAPI(
				[{ sortorder: '1', alert_type: 'All Alerts' }],
				process.env.REACT_APP_TOTAL_ALERTS,
			);
			const getTotalAlertsResponse: ITotalAlerts[] = await getData(
				payloadGetTotalAlerts,
				'total alerts',
			);

			if (Array.isArray(getTotalAlertsResponse) && getTotalAlertsResponse.length > 0) {
				this.setTotalOpenAlerts(getTotalAlertsResponse);
			} else {
				this.setTotalOpenAlerts(initialValues.totalOpenAlerts);
			}
			return getTotalAlertsResponse;
		},
		async getDeviceVehicleStatus(_: void, rootState) {
			const payloadGetDeviceVehicleStatusResponse = generateRestAPI(
				[],
				process.env.REACT_APP_DEVICE_VEHICLE_STATUS,
			);
			const getDeviceVehicleStatusResponse: IDeviceVehicleStatus[] = await getData(
				payloadGetDeviceVehicleStatusResponse,
				'device vehicle status',
			);
			if (Array.isArray(getDeviceVehicleStatusResponse)) {
				this.setDeviceVehicleStatus(getDeviceVehicleStatusResponse);
			} else {
				this.setDeviceVehicleStatus({});
			}
			return getDeviceVehicleStatusResponse;
		},
		// async getListofdeviceModel(_: void, rootState) {
		// 	const { token } = rootState.auth;
		// 	const { urlEndPoint } = rootState.vehicles;

		// 	const payloadGetListofdeviceModel = {
		// 		url: urlEndPoint,
		// 		wsdl: generateWSDL(token, [], process.env.REACT_APP_LIST_VEHICLE_MODELS),
		// 		isCached: 'false',
		// 		docId: '',
		// 	};
		// 	const getListofdeviceModelResponse: IModelDevice[] = await getRecords(
		// 		payloadGetListofdeviceModel,
		// 		'list of device model',
		// 	);
		// 	if (Array.isArray(getListofdeviceModelResponse)) {
		// 		this.setListofdeviceModel(getListofdeviceModelResponse);
		// 	} else {
		// 		this.setListofdeviceModel([]);
		// 	}
		// 	return getListofdeviceModelResponse;
		// },

		async getFuelEfficiency(data: any) {
			const { startDate, endDate } = data.date;
			const payload = generateRestAPI(
				[
					{ sortorder: data.sortorder, sortfield: 'efficiency' },
					{ startdate: startDate },
					{ enddate: endDate },
				],

				process.env.REACT_APP_FUEL_EFFICIENCY,
			);

			const getFuelEfficiencyResponse: IFuelEfficiency[] = await getData(
				payload,
				'fuel efficiency',
			);

			if (Array.isArray(getFuelEfficiencyResponse)) {
				this.setFuelEfficiency(getFuelEfficiencyResponse);
			} else {
				this.setFuelEfficiency([]);
			}
			return getFuelEfficiencyResponse;
		},
		//
		async getFleetHealth(data: any) {
			const { startDate, endDate } = data.date;
			const payload = generateRestAPI(
				[
					{ sortorder: data.sortorder, sortfield: 'health' },
					{ startdate: startDate },
					{ enddate: endDate },
				],

				process.env.REACT_APP_FLEET_HEALTH,
			);
			const getFleetHealthResponse: IFleetHealth[] = await getData(payload, 'fleet health');
			if (Array.isArray(getFleetHealthResponse)) {
				this.set(getFleetHealthResponse);
			} else {
				this.setFleetHealth([]);
			}
			return getFleetHealthResponse;
		},
		//
		async getFleetUsage(data: any) {
			const { startDate, endDate } = data.date;
			const payload = generateRestAPI(
				[
					{ sortorder: data.sortorder, sortfield: 'usage' },
					{ startdate: startDate },
					{ enddate: endDate },
				],

				process.env.REACT_APP_FLEET_USAGE,
			);
			const getFleetUsageResponse: IFleetUsage[] = await getData(payload, 'fleet health');
			if (Array.isArray(getFleetUsageResponse)) {
				this.set(getFleetUsageResponse);
			} else {
				this.setFleetUsage([]);
			}
			return getFleetUsageResponse;
		},
		//
		async getTemperatureData(data: any) {
			const { startDate, endDate } = data.date;
			const payload = generateRestAPI(
				[
					{ sortorder: data.sortorder, sortfield: 'temperature' },
					{ startdate: startDate },
					{ enddate: endDate },
				],

				process.env.REACT_APP_TEMPERATURE_DATA,
			);
			const getTemperatureDataResponse: ITemperatureData[] = await getData(
				payload,
				'Temperature Data',
			);
			if (Array.isArray(getTemperatureDataResponse)) {
				this.set(getTemperatureDataResponse);
			} else {
				this.setTemperatureData([]);
			}
			return getTemperatureDataResponse;
		},
		//

		async getVehicleUsage(data: any) {
			const { startDate, endDate } = data.date;

			const payload = generateRestAPI(
				[{ sortorder: data.sortorder }, { startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_VEHICLE_USAGE,
			);
			const getVehicleUsageResponse: IOverviewVehicleUsage[] = await getData(
				payload,
				'vehicle usage',
			);
			if (Array.isArray(getVehicleUsageResponse)) {
				this.setVehicleUsage(getVehicleUsageResponse);
			} else {
				this.setVehicleUsage([]);
			}
			return getVehicleUsageResponse;
		},
		async getOverviewVehiclesAlerts(payload) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { alert_type, sortorder } = payload;
			const { startDate, endDate } = payload.date;
			const payloadAlerts = generateRestAPI(
				[{ alert_type, sortorder }, { startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_VEHICLE_ALERTS,
			);
			const getOverviewVehiclesAlertsResponse: IOverviewVehicleAlerts[] = await getData(
				payloadAlerts,
				'overview vehicles alerts',
			);
			if (Array.isArray(getOverviewVehiclesAlertsResponse)) {
				this.setOverviewVehicleAlerts(getOverviewVehiclesAlertsResponse);
			} else {
				this.setOverviewVehicleAlerts([]);
			}
			return getOverviewVehiclesAlertsResponse;
		},
		async getDrainage(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_DRAINAGE,
			);

			const getDrainageResponse: any[] = await getData(payload, 'drainage');

			if (Array.isArray(getDrainageResponse) && getDrainageResponse.length > 0) {
				this.setDrainage(getDrainageResponse);
			} else {
				this.setDrainage(initialValues.drainage);
			}
			return getDrainageResponse;
		},
		async getTotalDrainage(date) {
			const { startDate, endDate } = date;
			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TOTAL_DRAINAGE,
			);

			const getTotalDrainageResponse: any[] = await getData(payload, 'total drainage');
			if (Array.isArray(getTotalDrainageResponse) && getTotalDrainageResponse.length > 0) {
				this.setTotalDrainage(getTotalDrainageResponse);
			} else {
				this.setTotalDrainage(initialValues.totalDrainage);
			}
			return getTotalDrainageResponse;
		},
		async getTotalFuel(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TOTAL_FUEL,
			);
			const getTotalFuelResponse: any[] = await getData(payload, 'total fuel');
			if (Array.isArray(getTotalFuelResponse) && getTotalFuelResponse.length > 0) {
				this.setTotalFuel(getTotalFuelResponse);
			} else {
				this.setTotalFuel(initialValues.totalFuel);
			}
			return getTotalFuelResponse;
		},
		async getTotalFilling(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TOTAL_FILLING,
			);
			const getTotalFillingResponse: any[] = await getData(payload, 'total filling');
			if (Array.isArray(getTotalFillingResponse) && getTotalFillingResponse.length > 0) {
				this.setTotalFilling(getTotalFillingResponse);
			} else {
				this.setTotalFilling(initialValues.totalFilling);
			}
			return getTotalFillingResponse;
		},
		async getAvgFuel(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_AVG_FUEL,
			);
		
			const getAvgFuelResponse: any[] = await getData(payload, 'average fuel');
			if (Array.isArray(getAvgFuelResponse) && getAvgFuelResponse.length > 0) {
				this.setAvgFuel(getAvgFuelResponse);
			} else {
				this.setAvgFuel(initialValues.avgFuel);
			}
			return getAvgFuelResponse;
		},
		async getTemperature(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TEMPERATURE,
			);
			const getTemperatureResponse: any[] = await getData(payload, 'temperature');
			if (Array.isArray(getTemperatureResponse) && getTemperatureResponse.length > 0) {
				this.setTemperature(getTemperatureResponse);
			} else {
				this.setTemperature(initialValues.temperature);
			}
			return getTemperatureResponse;
		},
		async getTotalRefuel(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TOTAL_REFUEL,
			);
			const getTotalRefuelResponse: any[] = await getData(payload, 'total refuel');
			if (Array.isArray(getTotalRefuelResponse) && getTotalRefuelResponse.length > 0) {
				this.setTotalRefuel(getTotalRefuelResponse);
			} else {
				this.setTotalRefuel(initialValues.totalRefuel);
			}
			return getTotalRefuelResponse;
		},
		async getEcoDriverTotalScore(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_ECO_DRIVER_TOTAL_SCORE,
			);
			const getEcoDriverTotalScoreResponse: any[] = await getData(
				payload,
				'Eco Driver Total Score',
			);
			if (
				Array.isArray(getEcoDriverTotalScoreResponse) &&
				getEcoDriverTotalScoreResponse.length > 0
			) {
				this.setEcoDriverTotalScore(getEcoDriverTotalScoreResponse);
			} else {
				this.setEcoDriverTotalScore(initialValues.ecoDriverTotalScore);
			}
			return getEcoDriverTotalScoreResponse;
		},
		async getMileageDriven(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_MILEAGE_DRIVEN,
			);
			const getMileageDrivenResponse: any[] = await getData(payload, 'set mileage driven');
			if (Array.isArray(getMileageDrivenResponse) && getMileageDrivenResponse.length > 0) {
				this.setMileageDriven(getMileageDrivenResponse);
			} else {
				this.setMileageDriven(initialValues.mileageDriven);
			}
			return getMileageDrivenResponse;
		},
		async getNbTrips(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_NB_TRIPS,
			);
			const getNbTripsResponse: any[] = await getData(payload, 'Nb of Trips');
			if (Array.isArray(getNbTripsResponse) && getNbTripsResponse.length > 0) {
				this.setNbTrips(getNbTripsResponse);
			} else {
				this.setNbTrips(initialValues.nbTrips);
			}
		},
		async getTotalIdlingTime(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_TOTAL_IDLING_TIME,
			);
			const getTotalIdlingTimeResponse: any[] = await getData(payload, 'Total Idling Time');
			if (
				Array.isArray(getTotalIdlingTimeResponse) &&
				getTotalIdlingTimeResponse.length > 0
			) {
				this.setTotalIdlingTime(getTotalIdlingTimeResponse);
			} else {
				this.setTotalIdlingTime(initialValues.totalIdlingTime);
			}
			return getTotalIdlingTimeResponse;
		},
		async getAvgIdlingTime(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_AVG_IDLING_TIME,
			);
			const getAvgIdlingTimeResponse: any[] = await getData(payload, 'Avg Idling Time');
			if (Array.isArray(getAvgIdlingTimeResponse) && getAvgIdlingTimeResponse.length > 0) {
				this.setAvgIdlingTime(getAvgIdlingTimeResponse);
			} else {
				this.setAvgIdlingTime(initialValues.avgIdlingTime);
			}
			return getAvgIdlingTimeResponse;
		},
		async getFuelAvgEfficiency(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_FUEL_AVG_EFFICIENCY,
			);
			const getFuelAvgEfficiencyResponse: any[] = await getData(
				payload,
				'Fuel Avg Efficiency',
			);
			if (
				Array.isArray(getFuelAvgEfficiencyResponse) &&
				getFuelAvgEfficiencyResponse.length > 0
			) {
				this.setFuelAvgEfficiency(getFuelAvgEfficiencyResponse);
			} else {
				this.setFuelAvgEfficiency(initialValues.fuelAvgEfficiency);
			}
			return getFuelAvgEfficiencyResponse;
		},
		async getFuelAvgConsumption(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_FUEL_AVG_CONSUMPTION,
			);
			const getFuelAvgConsumptionResponse: any[] = await getData(
				payload,
				'Fuel Avg Consumption',
			);
			if (
				Array.isArray(getFuelAvgConsumptionResponse) &&
				getFuelAvgConsumptionResponse.length > 0
			) {
				this.setFuelAvgConsumption(getFuelAvgConsumptionResponse);
			} else {
				this.setFuelAvgConsumption(initialValues.fuelAvgConsumption);
			}
			return getFuelAvgConsumptionResponse;
		},
		async getVehicleUtilization(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_VEHICLE_UTILIZATION,
			);
			const getVehicleUtilizationResponse: any[] = await getData(
				payload,
				'Vehicle utilization',
			);
			if (
				Array.isArray(getVehicleUtilizationResponse) &&
				getVehicleUtilizationResponse.length > 0
			) {
				this.setVehicleUtilization(getVehicleUtilizationResponse);
			} else {
				this.setVehicleUtilization(initialValues.vehicleUtilization);
			}
			return getVehicleUtilizationResponse;
		},
		async getMaintenanceStatus(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_MAINTENANCE_STATUS,
			);
			const getMaintenanceStatusResponse: any[] = await getData(
				payload,
				'Maintenance Status',
			);
			if (
				Array.isArray(getMaintenanceStatusResponse) &&
				getMaintenanceStatusResponse.length > 0
			) {
				this.setMaintenanceStatus(getMaintenanceStatusResponse);
			} else {
				this.setMaintenanceStatus(initialValues.maintenanceStatus);
			}
			return getMaintenanceStatusResponse;
		},
		async getDriverPerformance(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }],
				process.env.REACT_APP_OVERVIEW_DRIVER_PERFORMANCE,
			);
			const getDriverPerformanceResponse: any[] = await getData(
				payload,
				'Driver Performance',
			);
			if (
				Array.isArray(getDriverPerformanceResponse) &&
				getDriverPerformanceResponse.length > 0
			) {
				this.setDriverPerformance(getDriverPerformanceResponse);
			} else {
				this.setDriverPerformance(initialValues.driverPerformance);
			}
			return getDriverPerformanceResponse;
		},
		async getTcoAdmangCost(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: ['All Fleets'] },
				],
				process.env.REACT_APP_OVERVIEW_TCO_ADMANG_COST,
			);
			let getTcoAdmangCostResponse: any[] = await getData(
				payload,
				'Administrative Management Cost',
			);
			if (Array.isArray(getTcoAdmangCostResponse) && getTcoAdmangCostResponse.length > 0) {
				getTcoAdmangCostResponse[0].data = getTcoAdmangCostResponse[0].data.map(
					(entry: any) => ({
						x: entry[0], // Second element
						y: entry[1], // First element
					}),
				);

				this.setTcoAdmangCost(getTcoAdmangCostResponse);
			} else {
				this.setTcoAdmangCost(initialValues.tcoAdmangCost);
			}
			return getTcoAdmangCostResponse;
		},

		async getFpOverviewTcoOperationalCos(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: ['All Fleets'] },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_OPERATIONAL_COS,
			);
			let getFpOverviewTcoOperationalCosResponse: any[] = await getData(
				payload,
				'Operational Cost',
			);
			if (
				Array.isArray(getFpOverviewTcoOperationalCosResponse) &&
				getFpOverviewTcoOperationalCosResponse.length > 0
			) {
				getFpOverviewTcoOperationalCosResponse[0].data =
					getFpOverviewTcoOperationalCosResponse[0].data.map((entry: any) => ({
						x: entry[0], // Second element
						y: entry[1], // First element
					}));

				this.setFpOverviewTcoOperationalCos(getFpOverviewTcoOperationalCosResponse);
			} else {
				this.setFpOverviewTcoOperationalCos(initialValues.fpOverviewTcoOperationalCost);
			}
			return getFpOverviewTcoOperationalCosResponse;
		},

		async getFpOverviewTcoInsuranceCost(date) {
			const { startDate, endDate } = date;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },
					{ fleet_id: ['All Fleets'] },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_INSURANCE_COST,
			);

			let getFpOverviewTcoInsuranceCostResponse: any[] = await getData(
				payload,
				'Insurance Cost',
			);
			// getFpOverviewTcoInsuranceCostResponse[0].data=   getFpOverviewTcoInsuranceCostResponse[0].data.map((entry:any) => ({
			// 	x: entry[0], // Second element
			// 	y: entry[1] // First element
			// }))
			// getFpOverviewTcoInsuranceCostResponse.map((obj) => (
			// 	obj.data.map((entry:any) => (
			// 		[

			// 			entry[0] ,entry[1]
			// 		]
			// 	))
			// ))
			for (let i = 0; i < getFpOverviewTcoInsuranceCostResponse.length; i++) {
				const responseData = getFpOverviewTcoInsuranceCostResponse[i].data;
				getFpOverviewTcoInsuranceCostResponse[i].data = responseData.map((entry: any) => [
					entry[0],
					entry[1],
				]);
			}

			if (
				Array.isArray(getFpOverviewTcoInsuranceCostResponse) &&
				getFpOverviewTcoInsuranceCostResponse.length > 0
			) {
				this.setFpOverviewTcoInsuranceCost(getFpOverviewTcoInsuranceCostResponse);
			} else {
				this.setFpOverviewTcoInsuranceCost(initialValues.fpOverviewTcoInsuranceCost);
			}
			return getFpOverviewTcoInsuranceCostResponse;
		},

		async getFpOverviewTcoMaintenanceCost(date, rootState) {
			const { startDate, endDate } = date;

			const { customProperties } = rootState.auth;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: customProperties.fleetId },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_MAINTENANCE_COST,
			);
			let getFpOverviewTcoMaintenanceCostResponse: any[] = await getData(
				payload,
				'Maintenance Cost',
			);
			if (
				Array.isArray(getFpOverviewTcoMaintenanceCostResponse) &&
				getFpOverviewTcoMaintenanceCostResponse.length > 0
			) {
				getFpOverviewTcoMaintenanceCostResponse[0].data =
					getFpOverviewTcoMaintenanceCostResponse[0].data.map((entry: any) => ({
						x: entry[0], // Second element
						y: entry[1], // First element
					}));

				this.setFpOverviewTcoMaintenanceCost(getFpOverviewTcoMaintenanceCostResponse);
			} else {
				this.setFpOverviewTcoMaintenanceCost(initialValues.fpOverviewTcoMaintenanceCost);
			}
			return getFpOverviewTcoMaintenanceCostResponse;
		},

		async getFpOverviewTcoVehAcquisitionCost(date, rootState) {
			const { startDate, endDate } = date;

			const { customProperties } = rootState.auth;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: customProperties.fleetId },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_VEH_ACQUISITION_COST,
			);
			let getFpOverviewTcoVehAcquisitionCostResponse: any[] = await getData(
				payload,
				'Vehicle Acquisition Cost',
			);
			if (
				Array.isArray(getFpOverviewTcoVehAcquisitionCostResponse) &&
				getFpOverviewTcoVehAcquisitionCostResponse.length > 0
			) {
				// getFpOverviewTcoVehAcquisitionCostResponse[0].data=   getFpOverviewTcoVehAcquisitionCostResponse[0].data.map((entry:any) => ([

				// 	entry[0] ,entry[1]
				// ]))
				// getFpOverviewTcoVehAcquisitionCostResponse.map((obj) => (

				// 	obj.data.map((entry:any) => (
				// 		[
				// 			entry[0] ,entry[1]
				// 		]
				// 	))
				// ))
				for (let i = 0; i < getFpOverviewTcoVehAcquisitionCostResponse.length; i++) {
					const responseData = getFpOverviewTcoVehAcquisitionCostResponse[i].data;
					getFpOverviewTcoVehAcquisitionCostResponse[i].data = responseData.map(
						(entry: any) => [entry[0], entry[1]],
					);
				}
				this.setFpOverviewTcoVehAcquisitionCost(getFpOverviewTcoVehAcquisitionCostResponse);
			} else {
				this.setFpOverviewTcoVehAcquisitionCost(
					initialValues.fpOverviewTcoVehAcquisitionCost,
				);
			}
			return getFpOverviewTcoVehAcquisitionCostResponse;
		},
		async getFpOverviewTcoFuelCost(date, rootState) {
			const { startDate, endDate } = date;

			const { customProperties } = rootState.auth;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: customProperties.fleetId },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_FUEL_COST,
			);
			let getFpOverviewTcoFuelCostResponse: any[] = await getData(payload, 'Fuel CoST');
			if (
				Array.isArray(getFpOverviewTcoFuelCostResponse) &&
				getFpOverviewTcoFuelCostResponse.length > 0
			) {
				getFpOverviewTcoFuelCostResponse[0].data =
					getFpOverviewTcoFuelCostResponse[0].data.map((entry: any, i: any) => ({
						x: i, // Second element
						y: entry[1], // First element
					}));
				this.setFpOverviewTcoFuelCost(getFpOverviewTcoFuelCostResponse);
			} else {
				this.setFpOverviewTcoFuelCost(initialValues.fpOverviewTcoFuelCost);
			}
			return getFpOverviewTcoFuelCostResponse;
		},
		async getFpOverviewTcoFuelConsumed(date, rootState) {
			const { startDate, endDate } = date;

			const { customProperties } = rootState.auth;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: customProperties.fleetId },
				],
				process.env.REACT_APP_VC_OVERVIEW_TCO_FUEL_CONSUMED,
			);
			let getFpOverviewTcoFuelConsumedResponse: any[] = await getData(
				payload,
				'Fuel Consumed',
			);
			if (
				Array.isArray(getFpOverviewTcoFuelConsumedResponse) &&
				getFpOverviewTcoFuelConsumedResponse.length > 0
			) {
				getFpOverviewTcoFuelConsumedResponse[0].data =
					getFpOverviewTcoFuelConsumedResponse[0].data.map((entry: any, i: any) => ({
						x: i, // Second element
						y: entry[1], // First element
					}));
				this.setFpOverviewTcoFuelConsumed(getFpOverviewTcoFuelConsumedResponse);
			} else {
				this.setFpOverviewTcoFuelConsumed(initialValues.fpOverviewTcoFuelConsumed);
			}
			return getFpOverviewTcoFuelConsumedResponse;
		},

		async getFpOverviewTcoVehicleLeasingCost(date, rootState) {
			const { startDate, endDate } = date;

			const { customProperties } = rootState.auth;

			const payload = generateRestAPI(
				[
					{ startdate: startDate },
					{ enddate: endDate },
					{ vin: 'All Vins' },

					{ fleet_id: customProperties.fleetId },
				],
				process.env.REACT_APP_VC_VC_OVERVIEW_TCO_VEHICLE_LEASING_COST,
			);
			let getFpOverviewTcoVehicleLeasingCostResponse: any[] = await getData(
				payload,
				'Vehicle Leasing Cost',
			);
			if (
				Array.isArray(getFpOverviewTcoVehicleLeasingCostResponse) &&
				getFpOverviewTcoVehicleLeasingCostResponse.length > 0
			) {
				// getFpOverviewTcoVehicleLeasingCostResponse[0].data=   getFpOverviewTcoVehicleLeasingCostResponse[0].data.map((entry:any,i:any) => ([

				// 	entry[0] ,entry[1]
				// ]))

				// getFpOverviewTcoVehicleLeasingCostResponse.map((obj) => (
				// obj.data.map((entry:any) => (
				// [ entry[0] ,entry[1]   	]
				// 	))
				// ))
				for (let i = 0; i < getFpOverviewTcoVehicleLeasingCostResponse.length; i++) {
					const responseData = getFpOverviewTcoVehicleLeasingCostResponse[i].data;
					getFpOverviewTcoVehicleLeasingCostResponse[i].data = responseData.map(
						(entry: any) => [entry[0], entry[1]],
					);
				}
				this.setFpOverviewTcoVehicleLeasingCost(getFpOverviewTcoVehicleLeasingCostResponse);
			} else {
				this.setFpOverviewTcoVehicleLeasingCost(
					initialValues.fpOverviewTcoVehicleLeasingCost,
				);
			}
			return getFpOverviewTcoVehicleLeasingCostResponse;
		},

		async getOverviewData() {
			this.getTotalAlerts();
			this.getDeviceVehicleStatus();
		},
		async getEfficiencyMain(date) {
			this.getTotalRefuel(date);
			this.getTotalFuel(date);
			this.getDrainage(date);
			this.getAvgFuel(date);
			this.getTotalFilling(date);
			this.getTotalDrainage(date);
			this.getFuelAvgEfficiency(date);
			this.getFuelAvgConsumption(date);
		},
		async getHealthMain(date) {
			this.getMaintenanceStatus(date);
			this.getEcoDriverTotalScore(date);
		},
		async getUsageMain(date) {
			this.getVehicleUtilization(date);
			this.getDriverPerformance(date);
			this.getNbTrips(date);
			this.getMileageDriven(date);
			this.getTotalIdlingTime(date);
			this.getAvgIdlingTime(date);
		},
		async getCostMain(date) {
			this.getTcoAdmangCost(date);
			this.getFpOverviewTcoOperationalCos(date);
			this.getFpOverviewTcoInsuranceCost(date);
			this.getFpOverviewTcoMaintenanceCost(date);
			this.getFpOverviewTcoVehAcquisitionCost(date);
			this.getFpOverviewTcoFuelCost(date);
			this.getFpOverviewTcoFuelConsumed(date);
			this.getFpOverviewTcoVehicleLeasingCost(date);
		},
		async getTemperatureMain(date) {
			this.getTemperature(date);
		},
	}),
});
