import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./exports/abi",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    testnet: {
      url: process.env["APPCHAIN_RPC_TESTNET"] ?? "https://rpc-testnet.vnkr.vn",
      accounts: process.env["DEPLOYER_PRIVATE_KEY"]
        ? [process.env["DEPLOYER_PRIVATE_KEY"]]
        : [],
    },
    mainnet: {
      url: process.env["APPCHAIN_RPC_MAINNET"] ?? "https://rpc.vnkr.vn",
      accounts: process.env["DEPLOYER_PRIVATE_KEY"]
        ? [process.env["DEPLOYER_PRIVATE_KEY"]]
        : [],
    },
  },
};

export default config;
