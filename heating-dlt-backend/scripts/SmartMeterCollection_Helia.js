import hardhat from "hardhat";
const { ethers } = hardhat;
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { base58btc } from 'multiformats/bases/base58';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';


const helia = await createHelia();
const fs = unixfs(helia);

async function addAndRecord(contract, meter, data) {
    // Helia setup (ideally move this outside if reused)
    const helia = await createHelia();
    const fs = unixfs(helia);

    // Convert data to bytes and add to IPFS using CIDv1
    const bytes = uint8ArrayFromString(JSON.stringify(data));
    const cid = await fs.addBytes(bytes);
    console.log(cid.toString());
    const cidString = cid.toString();


    // Send to smart contract
    await contract.connect(meter).recordDailyUsage(
        BigInt(Math.floor(new Date(data.measurements[0].timestamp).getTime() / 1000)),
        BigInt(data.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18),
        "kWh",
        cidString
    );

    console.log("Recorded Meter Data", cidString);

    await contract.connect(meter).storeDetailedUsage(cidString);
    console.log("Added to detailed usage: ", cidString);

    return cidString;
}

async function main() {
    // Get accounts
    const [master, meter1, meter2, tenant1, tenant2] = await ethers.getSigners();

    // Deploy factory
    const SmartMeterCollection = await ethers.getContractFactory("SmartMeterCollection");
    const collection = await SmartMeterCollection.deploy(
        master.address,
        {
            ownerName: "Heating Company",
            streetName: "Binzmühlstrasse 19",
            cityCode: "8045",
            cityName: "Zürich",
            country: "Switzerland",
            email: "zh.heating@hc.com",
            phone: "+41795338161"
        }
    );
    await collection.waitForDeployment();
    console.log("SmartMeterCollection deployed to:", collection.target);

    // Create collection with initial meter
    let tx = await collection.connect(master).registerSmartMeter(
        "Main Building Meter",
        "Property Management Inc.",
        meter1.address,
        "SM-1001"
    );
    await tx.wait();
    console.log("Registered Smart Meter 1");

    // Whitelist tenant1
    tx = await collection.connect(master).addTenant(
        tenant1.address,
        "Peter Lustig",
        meter1.address
    );
    await tx.wait();
    console.log("Added Tenant 1");

    await addAndRecord(collection, meter1, day1);
    await addAndRecord(collection, meter1, day2);
    await addAndRecord(collection, meter1, day3);

    
    let readTx = await collection.connect(tenant1).getDailyUsage(meter1);
    console.log("Daily Usage: ", readTx);

    // Now let's mint some tokens and interact with the contract
    tx = await collection.connect(master).mintTNCY(master, ethers.parseUnits("1000", 18));
    console.log(tx);

    tx = await collection.connect(master).getTokenBalance();
    console.log(tx);

    // Now let's say tenant pays a landlord money for pellets and also gets some TNCY minted
    tx = await collection.connect(master).mintTNCY(tenant1, ethers.parseUnits("500", 18));

    // they check their token balance
    tx = await collection.connect(tenant1).getTokenBalance();
    console.log(tx);

    // Get the TNCY token address
    const heatTokenAddress = await collection.connect(tenant1).getTNCYAddress();
    console.log("TNCY Token Address:", heatTokenAddress);

    // Create a contract instance for the TNCY token
    const HeatToken = await ethers.getContractFactory("TNCY");
    const heatToken = HeatToken.attach(heatTokenAddress);


    // tx = await collection.connect(master).createBill(
    //     tenant1,
    //     ethers.parseUnits("10", 18),
    //     "First bill",
    //     "1234"
    // )
    // await tx.wait();

    // tx = await collection.connect(master).createBill(
    //     tenant1,
    //     ethers.parseUnits("10", 18),
    //     "Second bill",
    //     "1235"
    // )
    // await tx.wait();

    // tx = await collection.connect(master).createBill(
    //     tenant1,
    //     ethers.parseUnits("15", 18),
    //     "Third bill",
    //     "1236"
    // )
    // await tx.wait();

    // // 1. Get BillingManager address from SmartMeterCollection
    // const billingManagerAddress = await collection.billingManager();
    // console.log("BillingManager Address:", billingManagerAddress);

    // // 2. Approve BillingManager (not SmartMeterCollection) to spend TNCY
    // const approveTx = await heatToken.connect(tenant1).approve(
    //     billingManagerAddress, // Approve BillingManager, not SmartMeterCollection
    //     ethers.parseUnits("1000", 18)
    // );
    // await approveTx.wait();
    // console.log("Approved BillingManager to spend TNCY");

    // // 3. Now pay the bill
    // const payBillTx = await collection.connect(tenant1).payBillOnBehalf("1234", tenant1.address);
    // await payBillTx.wait();
    // console.log("Bill paid successfully");
}







main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const day1 = {
    "meterID": "MTR-123456",
    "dataBlockID": "BLK-2023-11-15",
    "measurements": [
        { "timestamp": "2023-11-15T00:00:00Z", "value": 8.2, "unit": "kWh" },
        { "timestamp": "2023-11-15T01:00:00Z", "value": 7.9, "unit": "kWh" },
        { "timestamp": "2023-11-15T02:00:00Z", "value": 7.5, "unit": "kWh" },
        { "timestamp": "2023-11-15T03:00:00Z", "value": 7.3, "unit": "kWh" },
        { "timestamp": "2023-11-15T04:00:00Z", "value": 7.8, "unit": "kWh" },
        { "timestamp": "2023-11-15T05:00:00Z", "value": 8.5, "unit": "kWh" },
        { "timestamp": "2023-11-15T06:00:00Z", "value": 10.1, "unit": "kWh" },
        { "timestamp": "2023-11-15T07:00:00Z", "value": 12.3, "unit": "kWh" },
        { "timestamp": "2023-11-15T08:00:00Z", "value": 14.0, "unit": "kWh" },
        { "timestamp": "2023-11-15T09:00:00Z", "value": 15.2, "unit": "kWh" },
        { "timestamp": "2023-11-15T10:00:00Z", "value": 15.8, "unit": "kWh" },
        { "timestamp": "2023-11-15T11:00:00Z", "value": 16.0, "unit": "kWh" },
        { "timestamp": "2023-11-15T12:00:00Z", "value": 15.5, "unit": "kWh" },
        { "timestamp": "2023-11-15T13:00:00Z", "value": 14.9, "unit": "kWh" },
        { "timestamp": "2023-11-15T14:00:00Z", "value": 14.3, "unit": "kWh" },
        { "timestamp": "2023-11-15T15:00:00Z", "value": 13.8, "unit": "kWh" },
        { "timestamp": "2023-11-15T16:00:00Z", "value": 13.5, "unit": "kWh" },
        { "timestamp": "2023-11-15T17:00:00Z", "value": 14.2, "unit": "kWh" },
        { "timestamp": "2023-11-15T18:00:00Z", "value": 15.0, "unit": "kWh" },
        { "timestamp": "2023-11-15T19:00:00Z", "value": 16.5, "unit": "kWh" },
        { "timestamp": "2023-11-15T20:00:00Z", "value": 17.0, "unit": "kWh" },
        { "timestamp": "2023-11-15T21:00:00Z", "value": 16.2, "unit": "kWh" },
        { "timestamp": "2023-11-15T22:00:00Z", "value": 14.8, "unit": "kWh" },
        { "timestamp": "2023-11-15T23:00:00Z", "value": 11.5, "unit": "kWh" }
    ]
}

const day2 = {
    "meterID": "MTR-123456",
    "dataBlockID": "BLK-2023-11-16",
    "measurements": [
        { "timestamp": "2023-11-16T00:00:00Z", "value": 8.0, "unit": "kWh" },
        { "timestamp": "2023-11-16T01:00:00Z", "value": 7.7, "unit": "kWh" },
        { "timestamp": "2023-11-16T02:00:00Z", "value": 7.4, "unit": "kWh" },
        { "timestamp": "2023-11-16T03:00:00Z", "value": 7.2, "unit": "kWh" },
        { "timestamp": "2023-11-16T04:00:00Z", "value": 7.6, "unit": "kWh" },
        { "timestamp": "2023-11-16T05:00:00Z", "value": 8.3, "unit": "kWh" },
        { "timestamp": "2023-11-16T06:00:00Z", "value": 10.0, "unit": "kWh" },
        { "timestamp": "2023-11-16T07:00:00Z", "value": 12.1, "unit": "kWh" },
        { "timestamp": "2023-11-16T08:00:00Z", "value": 13.8, "unit": "kWh" },
        { "timestamp": "2023-11-16T09:00:00Z", "value": 15.0, "unit": "kWh" },
        { "timestamp": "2023-11-16T10:00:00Z", "value": 15.6, "unit": "kWh" },
        { "timestamp": "2023-11-16T11:00:00Z", "value": 15.9, "unit": "kWh" },
        { "timestamp": "2023-11-16T12:00:00Z", "value": 15.4, "unit": "kWh" },
        { "timestamp": "2023-11-16T13:00:00Z", "value": 14.8, "unit": "kWh" },
        { "timestamp": "2023-11-16T14:00:00Z", "value": 14.2, "unit": "kWh" },
        { "timestamp": "2023-11-16T15:00:00Z", "value": 13.7, "unit": "kWh" },
        { "timestamp": "2023-11-16T16:00:00Z", "value": 13.4, "unit": "kWh" },
        { "timestamp": "2023-11-16T17:00:00Z", "value": 14.0, "unit": "kWh" },
        { "timestamp": "2023-11-16T18:00:00Z", "value": 14.8, "unit": "kWh" },
        { "timestamp": "2023-11-16T19:00:00Z", "value": 16.3, "unit": "kWh" },
        { "timestamp": "2023-11-16T20:00:00Z", "value": 16.8, "unit": "kWh" },
        { "timestamp": "2023-11-16T21:00:00Z", "value": 16.0, "unit": "kWh" },
        { "timestamp": "2023-11-16T22:00:00Z", "value": 14.6, "unit": "kWh" },
        { "timestamp": "2023-11-16T23:00:00Z", "value": 11.3, "unit": "kWh" }
    ]
}

const day3 = {
    "meterID": "MTR-123456",
    "dataBlockID": "BLK-2023-11-17",
    "measurements": [
        { "timestamp": "2023-11-17T00:00:00Z", "value": 8.1, "unit": "kWh" },
        { "timestamp": "2023-11-17T01:00:00Z", "value": 7.8, "unit": "kWh" },
        { "timestamp": "2023-11-17T02:00:00Z", "value": 7.6, "unit": "kWh" },
        { "timestamp": "2023-11-17T03:00:00Z", "value": 7.4, "unit": "kWh" },
        { "timestamp": "2023-11-17T04:00:00Z", "value": 7.9, "unit": "kWh" },
        { "timestamp": "2023-11-17T05:00:00Z", "value": 8.6, "unit": "kWh" },
        { "timestamp": "2023-11-17T06:00:00Z", "value": 10.2, "unit": "kWh" },
        { "timestamp": "2023-11-17T07:00:00Z", "value": 12.4, "unit": "kWh" },
        { "timestamp": "2023-11-17T08:00:00Z", "value": 14.1, "unit": "kWh" },
        { "timestamp": "2023-11-17T09:00:00Z", "value": 15.3, "unit": "kWh" },
        { "timestamp": "2023-11-17T10:00:00Z", "value": 15.9, "unit": "kWh" },
        { "timestamp": "2023-11-17T11:00:00Z", "value": 16.1, "unit": "kWh" },
        { "timestamp": "2023-11-17T12:00:00Z", "value": 15.6, "unit": "kWh" },
        { "timestamp": "2023-11-17T13:00:00Z", "value": 15.0, "unit": "kWh" },
        { "timestamp": "2023-11-17T14:00:00Z", "value": 14.4, "unit": "kWh" },
        { "timestamp": "2023-11-17T15:00:00Z", "value": 13.9, "unit": "kWh" },
        { "timestamp": "2023-11-17T16:00:00Z", "value": 13.6, "unit": "kWh" },
        { "timestamp": "2023-11-17T17:00:00Z", "value": 14.3, "unit": "kWh" },
        { "timestamp": "2023-11-17T18:00:00Z", "value": 15.1, "unit": "kWh" },
        { "timestamp": "2023-11-17T19:00:00Z", "value": 16.6, "unit": "kWh" },
        { "timestamp": "2023-11-17T20:00:00Z", "value": 17.1, "unit": "kWh" },
        { "timestamp": "2023-11-17T21:00:00Z", "value": 16.3, "unit": "kWh" },
        { "timestamp": "2023-11-17T22:00:00Z", "value": 14.9, "unit": "kWh" },
        { "timestamp": "2023-11-17T23:00:00Z", "value": 11.6, "unit": "kWh" }
    ]
}

// These are all the total daily usages
const sumDay1 = BigInt(day1.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);
const sumDay2 = BigInt(day2.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);
const sumDay3 = BigInt(day3.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);