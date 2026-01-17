import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NftTokenModule", (m) => {
  const nftToken = m.contract("NftToken");
  return { nftToken };
});
