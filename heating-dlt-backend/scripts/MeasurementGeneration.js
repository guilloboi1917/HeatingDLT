import fs from "fs";


export async function GenerateMeasurements(startDate, endDate, meterID) {
    let currentDate = new Date(startDate);
    let allMeasurements = [];

    while (currentDate < endDate) {
        // Format dataBlockID as "BLK-YYYY-MM-DD"
        const dateStr = currentDate.toISOString().split('T')[0];
        const dataBlockID = `BLK-${dateStr}`;

        let dayMeasurement = {
            meterID,
            dataBlockID,
            measurements: []
        };

        // Generate hourly measurements for the current day
        const dayEnd = new Date(currentDate);
        dayEnd.setDate(dayEnd.getDate() + 1); // Move to next day

        while (currentDate < dayEnd && currentDate < endDate) {
            const value = (Math.random() * 3.0).toFixed(1);
            dayMeasurement.measurements.push({
                "timestamp": new Date(currentDate), // Clone to avoid reference issues
                "value": Number(value),
                "unit": "kWh"
            });
            currentDate.setHours(currentDate.getHours() + 1); // Increment hour
        }

        allMeasurements.push(dayMeasurement);
    }

    await fs.promises.writeFile(`./measurements_${meterID}.json`, JSON.stringify(allMeasurements, null, 2), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });

    return allMeasurements;
}

// async function main() {
//     const startDate = new Date(2025, 0, 1, 1); // Jan 1, 2025, 01:00:00
//     const endDate = new Date(2025, 0, 7, 1);   // Jan 7, 2025, 01:00:00
//     const meter1Id = "MTR-1";
//     const meter1Measurements = await GenerateMeasurements(startDate, endDate, meter1Id);
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });