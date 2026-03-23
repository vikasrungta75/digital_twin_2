const stylesDisableCountryFrontline = [
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [
            {
                visibility: 'off', // Hide the country borders
            },
        ],
    },
    {
        featureType: 'administrative.country',
        elementType: 'labels',
        stylers: [
            {
                visibility: 'off', // Hide the country borders
            },
        ],
    },
];

export default stylesDisableCountryFrontline;