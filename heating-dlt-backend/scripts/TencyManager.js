import hardhat from "hardhat";
const { ethers } = hardhat;
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { GenerateMeasurements } from "./MeasurementGeneration.js";
import { readFile } from 'fs/promises';

export async function putPDFToIPFS(file) {
    const formData = new FormData();
    formData.append("file", file);

    // Configure for CIDv1
    const params = new URLSearchParams();
    params.append("cid-version", "1"); // Force CIDv1
    params.append("hash", "sha2-256"); // Ensure SHA-256 hash

    try {
        const response = await fetch(
            `http://127.0.0.1:5001/api/v0/add?${params.toString()}`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`IPFS add failed: ${error}`);
        }

        const result = await response.json();
        return result.Hash; // This will now be a bafy... CID
    } catch (error) {
        console.error("IPFS put error:", error);
        throw error;
    }
}

async function addAndRecord(contract, meter, data) {
    // Convert the data object to a JSON string
    const jsonString = JSON.stringify(data);

    // Convert the JSON string to a Blob and then a File (mimicking file upload)
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], "data.json", { type: "application/json" });

    // Prepare form data
    const formData = new FormData();
    formData.append("data", file);

    // Optional: configure query parameters
    const params = new URLSearchParams();
    params.set("cid-codec", "dag-pb"); // or "raw" if you want a raw block
    params.set("mhtype", "sha2-256");
    params.set("pin", "true");

    // Send to IPFS via HTTP API
    let cidString;
    try {
        const response = await fetch(`http://127.0.0.1:5001/api/v0/block/put?${params.toString()}`, {
            method: "POST",
            body: formData,
            headers: {}, // Let browser set Content-Type automatically
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`IPFS block/put failed: ${error}`);
        }

        const result = await response.json();
        cidString = result.Key; // Typically the returned field for CID
        console.log("Successfully uploaded to IFPS: ", cidString);
    } catch (error) {
        console.error("Failed to upload data to IPFS:", error);
        throw error;
    }

    // Calculate total kWh
    const totalKWh = data.measurements.reduce((total, entry) => total + entry.value, 0);
    const totalKWhUsage = ethers.parseEther(totalKWh.toString()); // 18 decimals
    const timestamp = BigInt(Math.floor(new Date(data.measurements[0].timestamp).getTime() / 1000));

    // Call smart contract
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
    const [master, meter1, meter2, meter3, meter4, tenant1, tenant2, tenant3, tenant4] = await ethers.getSigners();

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
    console.log("Registered Smart Meter 2");

    // Whitelist tenant1
    tx = await manager.connect(master).addTenant(
        tenant1.address,
        "Peter Lustig"
    );
    await tx.wait();
    console.log("Added Tenant 1: ", tenant1.address);

    // Assign SmartMeter
    tx = await manager.connect(master).assignSmartMeter(
        tenant1.address,
        meter1.address
    );
    await tx.wait();
    console.log("Assigned smart meter to tenant 1");

    // Whitelist tenant 2
    tx = await manager.connect(master).addTenant(
        tenant2.address,
        "Stefan Sauber"
    );
    await tx.wait();
    console.log("Added Tenant 2: ", tenant2.address);

    // Assign SmartMeter
    tx = await manager.connect(master).assignSmartMeter(
        tenant2.address,
        meter2.address
    );
    await tx.wait();
    console.log("Assigned smart meter to tenant 2");

    // Whitelist tenant1
    tx = await manager.connect(master).addTenant(
        tenant3.address,
        "Noah Isaak"
    );
    await tx.wait();
    console.log("Only Added Tenant 3: ", tenant3.address);

    // Now let's mint some tokens and interact with the contract
    tx = await tncyContract.connect(master).mint(master, ethers.parseUnits("3000", 18));
    tx = await tncyContract.connect(master).mint(tenant1, ethers.parseUnits("10000", 18));
    tx = await tncyContract.connect(master).mint(tenant2, ethers.parseUnits("10000", 18));
    tx = await tncyContract.connect(master).mint(tenant3, ethers.parseUnits("10000", 18));

    tx = await manager.connect(master).getTokenBalance();
    console.log("Master token balance: ", tx);

    tx = await manager.connect(tenant1).getTokenBalance();
    console.log("Tenant 1 token balance: ", tx);

    tx = await manager.connect(tenant2).getTokenBalance();
    console.log("Tenant 2 token balance: ", tx);

    tx = await manager.connect(tenant3).getTokenBalance();
    console.log("Tenant 3 token balance: ", tx);

    // Create some measurements:
    // Meter1
    const startDate = new Date(2025, 0, 1, 1); // Jan 1, 2025, 01:00:00
    const endDate = new Date(2025, 1, 31, 1);   // Feb 31, 2025, 01:00:00
    const meter1Id = "SMTR-0001";
    const meter2Id = "SMTR-0002";
    const meter1Measurements = await GenerateMeasurements(startDate, endDate, meter1Id);
    const meter2Measurements = await GenerateMeasurements(startDate, endDate, meter2Id);


    let failedUploads = []

    for (let index = 0; index < meter1Measurements.length; index++) {

        try {
            const dayMeasurementMeter1 = meter1Measurements[index];
            await addAndRecord(manager, meter1, dayMeasurementMeter1);

        } catch (error) {
            console.log("Failed to upload: ", meter1Measurements[index].dataBlockID)
            console.log("Error: ", error)
            failedUploads.push(meter1Measurements[index]);
        }


    }

    for (let index = 0; index < meter2Measurements.length; index++) {

        try {
            const dayMeasurementMeter2 = meter2Measurements[index];
            await addAndRecord(manager, meter2, dayMeasurementMeter2);

        } catch (error) {
            console.log("Failed to upload: ", meter2Measurements[index].dataBlockID)
            failedUploads.push(meter2Measurements[index]);
        }
    }

    console.log("Failed Uploads: ", failedUploads.length);


    const amount = ethers.parseEther("150", 18);

    // Usage example:
    const pdfPath = new URL('../scripts/Fictional_Roof_Repair_Invoice.pdf', import.meta.url);
    let pdfIPFSCID = ""

    try {
        const pdfData = await readFile(pdfPath);
        console.log("FileSize: ", pdfData.length, " bytes")
        // Create a File object with proper metadata
        const pdfFile = new File([pdfData], 'invoice.pdf', { type: 'application/pdf' });
        console.log("FileSize: ", pdfFile.size, " bytes")
        pdfIPFSCID = await putPDFToIPFS(pdfFile);
        console.log("PDF uploaded to IPFS with CID:", pdfIPFSCID);
    } catch (err) {
        console.error('Error:', err);
    }



    // Now a landlord wants to create an expense
    tx = await manager.connect(master).recordUtilityExpense(
        amount,
        BigInt(Math.floor(new Date().getTime() / 1000)),
        "REPAIRS",
        "Roof needed some urgent repairs",
        pdfIPFSCID,
        [tenant1.address, tenant2.address]
    )

    console.log(
        amount,
        BigInt(Math.floor(new Date().getTime() / 1000)),
        "REPAIRS",
        "Roof needed some urgent repairs",
        pdfIPFSCID,
        [tenant1.address, tenant2.address])

    // tx = await manager.connect(tenant1).getTenantUtilityExpenses(tenant1);
    // console.log(tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
