require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition-ethers");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  settings: { optimizer: { enabled: true, runs: 200 } },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
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
