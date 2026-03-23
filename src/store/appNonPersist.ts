import { sales } from './../common/data/chartDummyData';
import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { ISortVehicles, IvehicleLocation } from '../type/vehicles-type';

export interface ISelectedTrajectHistory {
	// latitude: any;
	// longitude: any;
	markerPositionState: {
		Current: {
			lat: number;
			lng: number;
		};
		Departure: {
			lat: number;
			lng: number;
		};
	};
	_id:string;

	RoadTripReformed: any[];
	vin: string;
	index: number;
	type:string;
	parkedPosition: {
		lat:number;
		lng:number;
	},
	datetime:any[],
	temperature:any[],
	
	speed:any[],
	fuel_level:any[]
}

export interface IFilterTaskState {
	vin_filter: string;
	status_filter: string;
	sort: number;
	sortField: any;
}

const initialValue = {
	statusFilter: ['Stopped', 'Running', 'Disconnected', 'Idle', 'Parked', "Trouble"],
	isFilterLoading: false,
	sortFilter: { sort:1, sortfield:'vin' },
	selectedTrajectHistory: [] as ISelectedTrajectHistory[],
	searchInputGeneral: '' as String,
	fleetSearched: {} as IvehicleLocation,
	filterTaskState: {
		vin_filter: 'All',
		status_filter: 'All',
		sort: 1,
		sortField: 'vin',
	} as IFilterTaskState , 
	vehicleDetailSelected: [] as IvehicleLocation[],
	dataPOI: [],
	dataPOIStart: [],
	dataPOIEnd: [],
	geofencePointOfInterest: {
		lat:'',
		lng:'',		
		zoomMap:'',
		centerMap:''
	},
		startGeofencePointOfInterest: {
		lat: '',
		lng: '',
		zoomMap: '',
		centerMap: ''
	},
	endGeofencePointOfInterest: {
		lat: '',
		lng: '',
		zoomMap: '',
		centerMap: ''
	},
	startGeofencePointOfInterestIsOpen: false,
	endGeofencePointOfInterestIsOpen: false,
	raduisPointOfInterest: 500,
	geofencePointOfInterestIsOpen: false,
	geofencePointCenter: {
		lat:'',
		lng:''
	},
	accordianIndex:0
};

export const appStoreNoPersist = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		setStatusFilter(state, res) {
			return {
				...state,
				statusFilter: res,
			};
		},
			setDataPOI(state, res) {
			return {
				...state,
				dataPOI: res, 
			};
		},
		setSelectedTrajectHistory(state, res) {
			return {
				...state,
				selectedTrajectHistory: res,
			};
		},
		setInputSearchBar(state, res) {
			return {
				...state,
				searchInputGeneral: res,
			};
		},
		setFleetSearch(state, res) {
			return {
				...state,
				fleetSearched: res,
			};
		},

		setSortFilter(state, res) {
			return {
				...state,
				sortFilter: res
			}
		},
		setFilterMaintenance(state, res) {
			return {
				...state,
				filterTaskState: { ...state.filterTaskState, ...res }
			}
		},
		setVehicleSelectedToMap(state, res) {
			return {
				...state,
				vehicleDetailSelected: res
			}
		},
		setIsFilterLoading(state, res){
			return {
				...state,
				isFilterLoading: res
			}
		},
		setGeofencePointOfInterest(state, res){
		
			return {
				...state,
				geofencePointOfInterest: res
			}
		},
		setGeofencePointOfInterestIsOpen(state, res){
			return {
				...state,
				geofencePointOfInterestIsOpen: res
			}
		},
		setRaduisPointOfInterest(state, res){
			return {
				...state,
				raduisPointOfInterest: res
			}
		},
		setGeofencePointCenter(state, res){
			return {
				...state,
				geofencePointCenter: res
			}
		},
		setAccordianIndex(state, res){
			return {
				...state,
				accordianIndex: res
			}
		},
			setDataPOIStart(state, res) {
			return {
				...state,
				dataPOIStart: res, 
			};
		},
		setDataPOIEnd(state, res) {
			return {
				...state,
				dataPOIEnd: res, 
			};
		},setStartGeofencePointOfInterest(state, res) {
			return {
				...state,
				startGeofencePointOfInterest: res
			};
		},
		setEndGeofencePointOfInterest(state, res) {
			return {
				...state,
				endGeofencePointOfInterest: res
			};
		},
		setStartGeofencePointOfInterestIsOpen(state, res) {
			return {
				...state,
				startGeofencePointOfInterestIsOpen: res
			};
		},
		setEndGeofencePointOfInterestIsOpen(state, res) {
			return {
				...state,
				endGeofencePointOfInterestIsOpen: res
			};
		},
		clearStore() {
			return { ...initialValue };
		},

	},

	effects: (dispatch) => ({
		changeStatusFilter(payload: string[]) {
			this.setStatusFilter(payload);
		},
		changeSelectedTrajectHistory(payload: any[]) {
			this.setSelectedTrajectHistory(payload);
			
		},
		changeInputSearchBarMyFleet(payload: string) {
			this.setInputSearchBar(payload);
		},
		changeFleetDetailMap(payload) {
					
				this.setFleetSearch(payload);
		},
		changeSortFilter(payload) {
			this.setSortFilter(payload)
		},
		changeFilterMaintenance(payload: IFilterTaskState) {
			this.setFilterMaintenance(payload)
		},
		addVehicleSelectedToMap(payload) {
			this.setVehicleSelectedToMap(payload)
		},
		handleChangePointInterest(payload:any){		
			this.setGeofencePointOfInterest(
				payload
			)
		},
		handleStateMapPointInterest(payload:any, rootState){
			this.setGeofencePointOfInterestIsOpen(payload)
		},
		handleRaduisPointInterest(payload:any, rootState){
			this.setRaduisPointOfInterest(payload)
		},
		handleCenterPointInterest(payload:any, rootState){
			this.setGeofencePointCenter(payload)
		},	handleStartPointInterest(payload: any) {
			
			this.setStartGeofencePointOfInterest(payload);
		},
		handleEndPointInterest(payload: any) {
			this.setEndGeofencePointOfInterest(payload);
		},
		handleStartMapPointInterest(payload: boolean) {
			this.setStartGeofencePointOfInterestIsOpen(payload);
		},
		handleEndMapPointInterest(payload: boolean) {
			this.setEndGeofencePointOfInterestIsOpen(payload);
		},
	}),
});

