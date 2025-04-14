const { ethers } = require("hardhat");

async function main() {
    // Get accounts
    const [master, meter1, meter2, tenant1, tenant2] = await ethers.getSigners();

    // Deploy factory
    const SmartMeterCollection = await ethers.getContractFactory("SmartMeterCollection");
    const collection = await SmartMeterCollection.deploy(master.address);
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

    // Register additional meter
    tx = await collection.connect(master).registerSmartMeter(
        "Apartment 5A Meter",
        "Resident LLC",
        meter2.address,
        "SM-1002"
    );
    await tx.wait();
    console.log("Registered Smart Meter 2");

    // Whitelist tenant1
    tx = await collection.connect(master).addTenant(
        tenant1.address,
        "Peter Lustig",
        meter1.address
    );
    await tx.wait();
    console.log("Added Tenant 1");

    // Whitelist tenant2
    tx = await collection.connect(master).addTenant(
        tenant2.address,
        "Stefan Witzig",
        meter2.address
    );
    await tx.wait();
    console.log("Added Tenant 2");

    // Submit test data (impersonate meter1)
    tx = await collection.connect(meter1).recordData(
        1500,
        "kWh"
    );
    await tx.wait();
    console.log("Recorded Meter 1 Data 1");

    tx = await collection.connect(meter1).recordData(
        1520,
        "kWh"
    );
    await tx.wait();
    console.log("Recorded Meter 1 Data 2");

    // Submit test data (impersonate meter2)
    tx = await collection.connect(meter2).recordData(
        800,
        "kWh"
    );
    await tx.wait();
    console.log("Recorded Meter 2 Data 1");

    tx = await collection.connect(meter2).recordData(
        850,
        "kWh"
    );
    await tx.wait();
    console.log("Recorded Meter 2 Data 2");

    tx = await collection.connect(master).createBill(
        tenant1,
        10,
        "First bill",
        "1234"
    )
    await tx.wait();

    tx = await collection.connect(master).createBill(
        tenant1,
        10,
        "Second bill",
        "1235"
    )
    await tx.wait();

    tx = await collection.connect(tenant1).payBill("1234", 10);
    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });