import { IFieldsCard } from '../../../../type/vehicles-type';

export const columnsSuperAdminPanel = [
	{ name: 'VIN', key: 'vin', sortable: false, width: '' },
	{ name: 'Registration number', key: 'reg_no', sortable: false, width: '' },
	{ name: 'Last connection', key: 'last_connection', sortable: false, width: '' },
	{ name: 'Sim No', key: 'sim_no', sortable: false, width: '' },
	{ name: 'Firmware', key: 'firmware', sortable: false, width: '' },
	{ name: 'Last Firmware update', key: 'last_fm_update', sortable: false, width: '' },
	{ name: 'Plan', key: 'plan', sortable: false, width: '' },
	{ name: 'Comment', key: 'comment', sortable: false, width: '' },
	{ name: 'Customer', key: 'customer', sortable: false, width: '' },
];

export const superAdminPanelFieldsForCreation: IFieldsCard[] = [
	{
		category: 'Detailed informations',
		fields: [
			{
				label: 'Vin',
				id: 'vin',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Reg No',
				id: 'reg_no',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Device IMEI',
				id: 'device_imei',
				input: 'input',
				col: '3',
				mandatory: false,
			},

			{
				label: 'Sim number',
				id: 'sim_no',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Plan',
				id: 'plan',
				input: 'select',
				placeholder: 'Select a plan',
				options: 'plans',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Comment',
				id: 'comment',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Customer',
				id: 'customer',
				input: 'input',
				col: '3',
				mandatory: false,
			},
		],
	},
];
export const superAdminPanelFieldsForEdition: IFieldsCard[] = [
	{
		category: 'Detailed informations',
		fields: [
			{
				label: 'Vin',
				id: 'vin',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Reg No',
				id: 'reg_no',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Device IMEI',
				id: 'device_imei',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Last connection',
				id: 'last_connection',
				dotted: true,
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Creation time',
				id: 'creation_time',
				input: 'input',
				dotted: true,
				col: '3',
				mandatory: false,
			},
			{
				label: 'Sim number',
				id: 'sim_no',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Firmware',
				id: 'firmware',
				input: 'input',
				dotted: true,
				col: '3',
				mandatory: false,
			},
			{
				label: 'Last Firmware update',
				id: 'last_fm_update',
				input: 'input',
				dotted: true,
				col: '3',
				mandatory: false,
			},
			{
				label: 'Plan',
				id: 'plan',
				input: 'select',
				placeholder: 'Select a plan',
				options: 'plans',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Comment',
				id: 'comment',
				input: 'input',
				col: '3',
				mandatory: false,
			},
			{
				label: 'Customer',
				id: 'customer',
				input: 'input',
				col: '3',
				mandatory: false,
			},
		],
	},
];
