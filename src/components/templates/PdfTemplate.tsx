import React, { FC, ReactNode } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { text } from 'stream/consumers';
interface IPdfTemplateProps {
    data: Object[];
    ref?: any;
}
 
const PdfTemplate: FC<IPdfTemplateProps> = ({ data, ref }) => {
    const styles = StyleSheet.create({
        page: {
            fontFamily: 'Open Sans',
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
                    <Text style={styles.header}>Maintenance</Text>
                    {data?.map((item: any, index) => (
                        <View key={index} style={styles.item}>
                            <Text>Vehicle: {item?.vin}</Text>
                            <Text>Maintenance Work: {item?.description}</Text>
                            <Text>Date: {item?.date}</Text>
                            <Text>Status: {item?.status}</Text>
                            {item?.target.map((targetItem: any, targetIndex: any) => (
                                <Text key={targetIndex}>
                                    Target Date: {targetItem?.date} - Target Engine Hours:{' '}
                                    {targetItem?.engine_hours} - Target Mileage:{' '}
                                    {targetItem?.mileage}
                                </Text>
                            ))}
                            {item?.finished &&
                                item?.finished.length &&
                                item?.finished[0]?.date.length > 0 &&
                                item?.finished.map((targetItem: any, targetIndex: any) => (
                                    <Text key={targetIndex}>
                                        Finished Date: {targetItem?.date} - Finished Engine Hours:{' '}
                                        {targetItem?.engine_hours} - Finished Mileage:{' '}
                                        {targetItem?.mileage}
                                    </Text>
                                ))}
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};
 
export default PdfTemplate;
 
 