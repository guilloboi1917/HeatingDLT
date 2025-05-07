import hardhat from "hardhat";
const { ethers } = hardhat;
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
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
    const cidString = cid.toString();


    const totalKWh = data.measurements.reduce((total, entry) => total + entry.value, 0);
    // Convert to TNCY (1:1 ratio) with proper BigInt handling
    const totalKWhUsage = ethers.parseEther(totalKWh.toString(), 18); // Convert to token units (18 decimals)
    // Get timestamp (first measurement)
    const timestamp = BigInt(Math.floor(new Date(data.measurements[0].timestamp).getTime() / 1000));

    // Send to smart contract
    await contract.connect(meter).recordDailyUsage(
        timestamp,
        totalKWhUsage,
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
    const TencyManager = await ethers.getContractFactory("TencyManager");
    const manager = await TencyManager.deploy(
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
    await manager.waitForDeployment();
    console.log("TencyManager deployed to:", manager.target);

    // 1. Get the TNCY address from manager
    const tncyAddress = await manager.connect(master).getTNCYAddress();
    console.log("TNCY Contract Address:", tncyAddress);

    // 2. Proper contract attachment
    const TNCY = await ethers.getContractFactory("TNCY");
    const tncyContract = TNCY.attach(tncyAddress);

    // Create collection with initial meter
    let tx = await manager.connect(master).registerSmartMeter(
        "Main Building 1 Meter",
        "Property Management Inc.",
        meter1.address,
        "SM-1001"
    );
    await tx.wait();
    console.log("Registered Smart Meter 1");

    tx = await manager.connect(master).registerSmartMeter(
        "Main Building 2 Meter",
        "Property Management Inc.",
        meter2.address,
        "SM-1002"
    );
    await tx.wait();
    console.log("Registered Smart Meter 1");

    // Whitelist tenant1
    tx = await manager.connect(master).addTenant(
        tenant1.address,
        "Peter Lustig",
        meter1.address
    );
    await tx.wait();
    console.log("Added Tenant 1");

    // Whitelist tenant1
    tx = await manager.connect(master).addTenant(
        tenant2.address,
        "Stefan Sauber",
        meter2.address
    );
    await tx.wait();
    console.log("Added Tenant 2");

    // Now let's mint some tokens and interact with the contract
    tx = await tncyContract.connect(master).mint(master, ethers.parseUnits("1000", 18));
    tx = await tncyContract.connect(master).mint(tenant1, ethers.parseUnits("500", 18));
    tx = await tncyContract.connect(master).mint(tenant2, ethers.parseUnits("500", 18));

    tx = await manager.connect(master).getTokenBalance();
    console.log("Master token balance: ", tx);

    tx = await manager.connect(tenant1).getTokenBalance();
    console.log("Tenant 1 token balance: ", tx);

    tx = await manager.connect(tenant2).getTokenBalance();
    console.log("Tenant 2 token balance: ", tx);

    await addAndRecord(manager, meter1, day1);
    await addAndRecord(manager, meter1, day2);
    await addAndRecord(manager, meter1, day3);

    await addAndRecord(manager, meter2, day1);
    await addAndRecord(manager, meter2, day2);
    await addAndRecord(manager, meter2, day3);


    let readTx = await manager.connect(tenant1).getDailyUsage(meter1);
    console.log("Daily Usage: ", readTx);

    tx = await manager.connect(master).getUtilityExpenses();
    console.log(tx);

    tx = await manager.connect(tenant1).getTenantUtilityExpenses(tenant1);
    console.log(tx);


    const amount = ethers.parseEther("150", 18);
    console.log(amount);

    // Now a landlord wants to create an expense
    tx = await manager.connect(master).recordUtilityExpense(
        amount,
        BigInt(Math.floor(new Date().getTime() / 1000)),
        "REPAIRS",
        "Roof needed some urgent repairs",
        "",
        [tenant1, tenant2]
    )

    tx = await manager.connect(tenant1).getTenantUtilityExpenses(tenant1);
    console.log(tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const day1 = {
    "meterID": "MTR-123456789",
    "dataBlockID": "BLK-2025-05-01",
    "measurements": [
        { "timestamp": "2025-05-01T00:00:00Z", "value": 1.2, "unit": "kWh" },
        { "timestamp": "2025-05-01T01:00:00Z", "value": 1.1, "unit": "kWh" },
        { "timestamp": "2025-05-01T02:00:00Z", "value": 1.0, "unit": "kWh" },
        { "timestamp": "2025-05-01T03:00:00Z", "value": 0.9, "unit": "kWh" },
        { "timestamp": "2025-05-01T04:00:00Z", "value": 1.0, "unit": "kWh" },
        { "timestamp": "2025-05-01T05:00:00Z", "value": 1.3, "unit": "kWh" },
        { "timestamp": "2025-05-01T06:00:00Z", "value": 1.8, "unit": "kWh" },
        { "timestamp": "2025-05-01T07:00:00Z", "value": 2.5, "unit": "kWh" },
        { "timestamp": "2025-05-01T08:00:00Z", "value": 3.0, "unit": "kWh" },
        { "timestamp": "2025-05-01T09:00:00Z", "value": 3.4, "unit": "kWh" },
        { "timestamp": "2025-05-01T10:00:00Z", "value": 3.5, "unit": "kWh" },
        { "timestamp": "2025-05-01T11:00:00Z", "value": 3.6, "unit": "kWh" },
        { "timestamp": "2025-05-01T12:00:00Z", "value": 3.2, "unit": "kWh" },
        { "timestamp": "2025-05-01T13:00:00Z", "value": 3.0, "unit": "kWh" },
        { "timestamp": "2025-05-01T14:00:00Z", "value": 2.8, "unit": "kWh" },
        { "timestamp": "2025-05-01T15:00:00Z", "value": 2.6, "unit": "kWh" },
        { "timestamp": "2025-05-01T16:00:00Z", "value": 2.5, "unit": "kWh" },
        { "timestamp": "2025-05-01T17:00:00Z", "value": 2.7, "unit": "kWh" },
        { "timestamp": "2025-05-01T18:00:00Z", "value": 2.9, "unit": "kWh" },
        { "timestamp": "2025-05-01T19:00:00Z", "value": 3.1, "unit": "kWh" },
        { "timestamp": "2025-05-01T20:00:00Z", "value": 3.3, "unit": "kWh" },
        { "timestamp": "2025-05-01T21:00:00Z", "value": 3.0, "unit": "kWh" },
        { "timestamp": "2025-05-01T22:00:00Z", "value": 2.6, "unit": "kWh" },
        { "timestamp": "2025-05-01T23:00:00Z", "value": 1.8, "unit": "kWh" }
    ]
};

const day2 = {
    "meterID": "MTR-123456789",
    "dataBlockID": "BLK-2025-05-02",
    "measurements": [
        { "timestamp": "2025-05-02T00:00:00Z", "value": 1.1, "unit": "kWh" },
        { "timestamp": "2025-05-02T01:00:00Z", "value": 1.0, "unit": "kWh" },
        { "timestamp": "2025-05-02T02:00:00Z", "value": 0.9, "unit": "kWh" },
        { "timestamp": "2025-05-02T03:00:00Z", "value": 0.8, "unit": "kWh" },
        { "timestamp": "2025-05-02T04:00:00Z", "value": 1.0, "unit": "kWh" },
        { "timestamp": "2025-05-02T05:00:00Z", "value": 1.2, "unit": "kWh" },
        { "timestamp": "2025-05-02T06:00:00Z", "value": 1.7, "unit": "kWh" },
        { "timestamp": "2025-05-02T07:00:00Z", "value": 2.3, "unit": "kWh" },
        { "timestamp": "2025-05-02T08:00:00Z", "value": 2.8, "unit": "kWh" },
        { "timestamp": "2025-05-02T09:00:00Z", "value": 3.2, "unit": "kWh" },
        { "timestamp": "2025-05-02T10:00:00Z", "value": 3.4, "unit": "kWh" },
        { "timestamp": "2025-05-02T11:00:00Z", "value": 3.5, "unit": "kWh" },
        { "timestamp": "2025-05-02T12:00:00Z", "value": 3.1, "unit": "kWh" },
        { "timestamp": "2025-05-02T13:00:00Z", "value": 2.9, "unit": "kWh" },
        { "timestamp": "2025-05-02T14:00:00Z", "value": 2.7, "unit": "kWh" },
        { "timestamp": "2025-05-02T15:00:00Z", "value": 2.5, "unit": "kWh" },
        { "timestamp": "2025-05-02T16:00:00Z", "value": 2.4, "unit": "kWh" },
        { "timestamp": "2025-05-02T17:00:00Z", "value": 2.6, "unit": "kWh" },
        { "timestamp": "2025-05-02T18:00:00Z", "value": 2.8, "unit": "kWh" },
        { "timestamp": "2025-05-02T19:00:00Z", "value": 3.0, "unit": "kWh" },
        { "timestamp": "2025-05-02T20:00:00Z", "value": 3.2, "unit": "kWh" },
        { "timestamp": "2025-05-02T21:00:00Z", "value": 2.9, "unit": "kWh" },
        { "timestamp": "2025-05-02T22:00:00Z", "value": 2.5, "unit": "kWh" },
        { "timestamp": "2025-05-02T23:00:00Z", "value": 1.7, "unit": "kWh" }
    ]
};

const day3 = {
    "meterID": "MTR-123456789",
    "dataBlockID": "BLK-2025-05-03",
    "measurements": [
        { "timestamp": "2025-05-03T00:00:00Z", "value": 1.3, "unit": "kWh" },
        { "timestamp": "2025-05-03T01:00:00Z", "value": 1.2, "unit": "kWh" },
        { "timestamp": "2025-05-03T02:00:00Z", "value": 1.1, "unit": "kWh" },
        { "timestamp": "2025-05-03T03:00:00Z", "value": 1.0, "unit": "kWh" },
        { "timestamp": "2025-05-03T04:00:00Z", "value": 1.1, "unit": "kWh" },
        { "timestamp": "2025-05-03T05:00:00Z", "value": 1.4, "unit": "kWh" },
        { "timestamp": "2025-05-03T06:00:00Z", "value": 1.9, "unit": "kWh" },
        { "timestamp": "2025-05-03T07:00:00Z", "value": 2.6, "unit": "kWh" },
        { "timestamp": "2025-05-03T08:00:00Z", "value": 3.2, "unit": "kWh" },
        { "timestamp": "2025-05-03T09:00:00Z", "value": 3.5, "unit": "kWh" },
        { "timestamp": "2025-05-03T10:00:00Z", "value": 3.6, "unit": "kWh" },
        { "timestamp": "2025-05-03T11:00:00Z", "value": 3.7, "unit": "kWh" },
        { "timestamp": "2025-05-03T12:00:00Z", "value": 3.3, "unit": "kWh" },
        { "timestamp": "2025-05-03T13:00:00Z", "value": 3.0, "unit": "kWh" },
        { "timestamp": "2025-05-03T14:00:00Z", "value": 2.8, "unit": "kWh" },
        { "timestamp": "2025-05-03T15:00:00Z", "value": 2.7, "unit": "kWh" },
        { "timestamp": "2025-05-03T16:00:00Z", "value": 2.5, "unit": "kWh" },
        { "timestamp": "2025-05-03T17:00:00Z", "value": 2.6, "unit": "kWh" },
        { "timestamp": "2025-05-03T18:00:00Z", "value": 2.9, "unit": "kWh" },
        { "timestamp": "2025-05-03T19:00:00Z", "value": 3.2, "unit": "kWh" },
        { "timestamp": "2025-05-03T20:00:00Z", "value": 3.4, "unit": "kWh" },
        { "timestamp": "2025-05-03T21:00:00Z", "value": 3.1, "unit": "kWh" },
        { "timestamp": "2025-05-03T22:00:00Z", "value": 2.7, "unit": "kWh" },
        { "timestamp": "2025-05-03T23:00:00Z", "value": 1.9, "unit": "kWh" }
    ]
};


// These are all the total daily usages
const sumDay1 = BigInt(day1.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);
const sumDay2 = BigInt(day2.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);
const sumDay3 = BigInt(day3.measurements.reduce((total, entry) => total + entry.value, 0) * 1e18);