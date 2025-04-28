const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SmartMeterSystem", (m) => {

    // Correct way to get accounts
    const master = m.getAccount(0);
    const meter1 = m.getAccount(1);
    const meter2 = m.getAccount(2);
    const tenant1 = m.getAccount(3);
    const tenant2 = m.getAccount(4);


    // Deploy factory
    const collection = m.contract("SmartMeterCollection", [master], {
        from: master,
        id: "collectionImpl"
    });

    // Create collection with initial meter
    const registerFuture_Meter1 = m.call(collection, "registerSmartMeter", [
        "Main Building Meter",
        "Property Management Inc.",
        meter1,
        "SM-1001"
    ], {
        from: master,
        id: "registerSmartMeter1" // unique id for this call
    });

    // Register additional meter
    const registerFuture_Meter2 = m.call(collection, "registerSmartMeter", [
        "Apartment 5A Meter",
        "Resident LLC",
        meter2,
        "SM-1002"
    ], {
        from: master,
        id: "registerSmartMeter2" // unique id for this call
    });

    // Whitelist tenant1
    m.call(collection, "addTenant", [tenant1, "Peter Lustig", meter1], {
        from: master,
        id: "addTenant1"
    });

    // Whitelist tenant2
    m.call(collection, "addTenant", [tenant2, "Stefan Witzig", meter2], {
        from: master,
        id: "addTenant2"
    });

    // Submit test data (impersonate meter1)
    m.call(collection, "recordData", [1500, "kWh"], {
        from: meter1,
        id: "meter1_data1",
        after: [registerFuture_Meter1]
    });

    m.call(collection, "recordData", [1520, "kWh"], {
        from: meter1,
        id: "meter1_data2",
        after: [registerFuture_Meter1]
    });

    // Submit test data (impersonate meter1)
    m.call(collection, "recordData", [800, "kWh"], {
        from: meter2,
        id: "meter2_data1",
        after: [registerFuture_Meter2]
    });

    m.call(collection, "recordData", [850, "kWh"], {
        from: meter2,
        id: "meter2_data2",
        after: [registerFuture_Meter2]
    });

    return { collection };

});