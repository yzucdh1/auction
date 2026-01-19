import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const nftTokenModule = buildModule("NftTokenModule", (m) => {
  const nftToken = m.contract("NftToken");
  return { nftToken };
});

export default nftTokenModule;