import hre from "hardhat";

const { ethers } = await hre.network.connect({
    network: "sepolia",
    chainType: "l1",
});

const proxyContractAddress = "0xf1717512f66a36C4d841D510D6fB17506fAb0605"; // Replace with your contract address
// 0x1c4a7FF3636998739A3745aa552EFe8642D4f15c V1
// 0x1EeB5c9D7cc46b90e5F232e84DC49593860638e5 V2

async function mainV1() {
    console.log("Connecting to proxy contract at address:", proxyContractAddress);
    const proxyContract = await ethers.getContractAt("NftAuction", proxyContractAddress);

    // call methods to interact with the proxy
    const version = await proxyContract.getVersion();
    console.log("Proxy contract version:", version);
}

async function mainV2() {
    console.log("Connecting to proxy contract at address:", proxyContractAddress);
    const proxyContract = await ethers.getContractAt("NftAuctionV2", proxyContractAddress);

    // call methods to interact with the proxy
    const version = await proxyContract.getVersion();
    console.log("Proxy contract version:", version);
}

// mainV1()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error("TS脚本执行出错:", error);
//     process.exit(1);
//   });

mainV2()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("TS脚本执行出错:", error);
        process.exit(1);
    });