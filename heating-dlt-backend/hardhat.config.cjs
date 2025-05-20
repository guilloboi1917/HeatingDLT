require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  settings: { optimizer: { enabled: true, runs: 100 }, viaIR: true },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      blockGasLimit: 10000000
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
