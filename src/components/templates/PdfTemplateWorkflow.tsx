import React, { FC, ReactNode } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { text } from 'stream/consumers';
interface IPdfTemplateProps {
	data: Object[];
	ref?: any;
}

const PdfTemplateWorkflow: FC<IPdfTemplateProps> = ({ data, ref }) => {
	const styles = StyleSheet.create({
		page: {
			fontFamily: 'Helvetica',
			fontSize: 12,
			padding: 40,
		},
		section: {
			marginBottom: 20,
		},
		header: {
			margin: 'auto',
		},
		item: {
			marginBottom: 10,
		},
	});
	
	return (
		<Document>
			<Page style={styles.page}>
				<View style={styles.section}>
					<Text style={styles.header}>Workflow</Text>
					{data?.map((item: any, index) => (
						<View key={index} style={styles.item}>
							<Text>Assignable To: {item?.assignable_to}</Text>
							<Text>Creation Time: {item?.creation_time}</Text>
							<Text>Address: {item?.address}</Text>
							<Text>Unique ID: {item?.unique_id}</Text>
							<Text>Minimum Visit Duration: {item?.minimum_of_visit_duration}</Text>
							<Text>
								Time of Preset Completion: {item?.time_of_preset_completion}
							</Text>
							<Text>
								Coordinates:{' '}
								{`Lat: ${item?.coordinates[0]?.lat}, Lng: ${item?.coordinates[0]?.lng}`}
							</Text>
							<Text>Description: {item?.description}</Text>
							<Text>
								Time of Actual Completion: {item?.time_of_actual_completion}
							</Text>
							<Text>Fleet Name: {item?.fleet_name}</Text>
							<Text>POI Name: {item?.poi_name}</Text>
							<Text>Admissible Delay: {item?.admissible_delay}</Text>
							<Text>Name: {item?.name}</Text>
							<Text>VIN: {item?.vin}</Text>
							<Text>POI ID: {item?.poi_id}</Text>
							<Text>Value: {item?.value}</Text>
							<Text>Status: {item?.status}</Text>
							{/* <Text>Vehicle: {item?.vin}</Text>
							<Text>Maintenance Work: {item?.description}</Text>
							<Text>Date: {item?.date}</Text>
							<Text>Status: {item?.status}</Text> */}
						</View>
					))}
				</View>
			</Page>
		</Document>
	);
};

export default PdfTemplateWorkflow;
