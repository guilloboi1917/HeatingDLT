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
        ethers.parseUnits("10", 18),
        "First bill",
        "1234"
    )
    await tx.wait();

    tx = await collection.connect(master).createBill(
        tenant1,
        ethers.parseUnits("10", 18),
        "Second bill",
        "1235"
    )
    await tx.wait();

    tx = await collection.connect(master).createBill(
        tenant1,
        ethers.parseUnits("15", 18),
        "Third bill",
        "1236"
    )
    await tx.wait();

    tx = await collection.connect(master).mintHEAT(master, ethers.parseUnits("1000", 18));
    console.log(tx);

    tx = await collection.connect(master).getTokenBalance();
    console.log(tx);

    // Now let's say tenant pay a landlord money for pellets and also gets some HEAT minted
    tx = await collection.connect(master).mintHEAT(tenant1, ethers.parseUnits("500", 18));

    // they check their token balance
    tx = await collection.connect(tenant1).getTokenBalance();
    console.log(tx);

    // Get the HEAT token address
    const heatTokenAddress = await collection.connect(tenant1).getHEATAddress();
    console.log("HEAT Token Address:", heatTokenAddress);

    // Create a contract instance for the HEAT token
    const HeatToken = await ethers.getContractFactory("HEAT");
    const heatToken = HeatToken.attach(heatTokenAddress);

    // 1. Get BillingManager address from SmartMeterCollection
    const billingManagerAddress = await collection.billingManager();
    console.log("BillingManager Address:", billingManagerAddress);

    // 2. Approve BillingManager (not SmartMeterCollection) to spend HEAT
    const approveTx = await heatToken.connect(tenant1).approve(
        billingManagerAddress, // Approve BillingManager, not SmartMeterCollection
        ethers.parseUnits("1000", 18)
    );
    await approveTx.wait();
    console.log("Approved BillingManager to spend HEAT");

    // 3. Now pay the bill
    const payBillTx = await collection.connect(tenant1).payBillOnBehalf("1234", tenant1.address);
    await payBillTx.wait();
    console.log("Bill paid successfully");



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });