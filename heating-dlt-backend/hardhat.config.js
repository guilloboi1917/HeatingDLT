require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  settings: { optimizer: { enabled: true, runs: 200 } },
  networks: {
    // hardhat: {
    //   mining: {
    //     auto: true, // Disable automining
    //     interval: 125 // Mine every 1s instead
    //   },
    //   chainId: 31337
    // },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  ignition: {
    strategyConfig: {
      create2: {
        salt: "smart-meter-dlt-salt" // For deterministic deployment
      }
    }
  }
};
