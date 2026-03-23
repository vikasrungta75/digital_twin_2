export interface IGeofence {
	geofence_id: string;
	lat: string;
	lng: string;
	value: string;
	fleet_id: string;
	fleet_name: string;
	alarm: string;
	vin: string;
	type: string;
	geofence_name: string;
	gtype:string;
}

export interface IAddGeofencePayload {
	alarm: string;
	imei: number;
	vin: string;
	geofence: IGeofence[];
	notify: string;
	fleet_id: number;
	user_id: number;
	user_email: string;
	user_name: string;
	limit: string;
	role: string;
	notify_driver: string;
	email: string[];
	action: 'Add geofence';
}

export interface ICoordinates {
	lat: number;
	lng: number;
}

export interface IPayloadEditingGeofence {
	geofence_name: string;
  fleet_name: string;
  vin: string;
  geofence_id: number;
  lat: number;
  lng: number;
  value: number;
  type: string;
  action: string;
}
