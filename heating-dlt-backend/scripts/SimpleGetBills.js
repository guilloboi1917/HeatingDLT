const { ethers } = require("hardhat");

async function main() {
    // Get accounts
    const [master, meter1, meter2, tenant1, tenant2] = await ethers.getSigners();
    const SmartMeterCollection = await ethers.getContractFactory("SmartMeterCollection");
    const collection = SmartMeterCollection.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")

    const billTx = await collection.connect(tenant1).getBills(tenant1);

    console.log(tenant1);

    console.log(billTx);



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });