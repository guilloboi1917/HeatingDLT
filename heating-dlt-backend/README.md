# Local hardhat network with Smart Meter Contracts

This project demonstrates a basic Hardhat use case with Smart Meter contracts. 

To run the network

```shell
npx hardhat node
```

which will create 20 test accounts.

To kickstart and deploy one master owner (landlord), 2 tenants with one smart meter connected to each, run the hardhat script

```shell
npx hardhat run ./scripts/SmartMeterCollection.js --network localhost
```

**DEPRECATED**

To kickstart and deploy one master owner (landlord), 2 tenants with one smart meter connected to each, run the ignition module

```shell
npx hardhat ignition deploy ./ignition/modules/SmartMeterSystem.js
```


Additional helpful commands

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/"WhateverModule.js"
```

