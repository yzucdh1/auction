import hre from "hardhat";

const { ethers } = await hre.network.connect({
  network: "sepolia",
  chainType: "l1",
});

const nftTokenContractAddress = "0x4AF12344c14F901EC3486c40Da93Fd537bd8EEEd"; // Replace with your contract address
const auctionContractAddress = "";

async function mintNft() {
  console.log("Connecting to nft token contract at address:", nftTokenContractAddress);
  const nftContract = await ethers.getContractAt("NftToken", nftTokenContractAddress);
  const [owner] = await ethers.getSigners();
  // call contract methods to mint an NFT
  const mintPrice = await nftContract.MINT_PRICE();
  console.log("Mint price:", ethers.formatEther(mintPrice), "ETH");

  const tokenURI = "https://example.com/metadata/1";
  const tx = await nftContract.connect(owner).mint(tokenURI, {
    value: mintPrice,
  });

  console.log("Minting NFT, transaction hash:", tx.hash);
  const receipt = await tx.wait();
  if (receipt === null || receipt === undefined) {
    console.log("Transaction receipt is null or undefined");
    return;
  }
  console.log("Transaction confirmed in block:", receipt.blockNumber);
}

mintNft()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("TS脚本执行出错:", error);
    process.exit(1);
  });