require("@nomicfoundation/hardhat-toolbox");

const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
    networks: {
      localhost: {
        url: "http://127.0.0.1:8545",
        chainId: 31337,
      },
      sepolia: {
        chainId: 11155111,
        url: "https://rpc2.sepolia.org",
        accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2]
      }
    }
};
