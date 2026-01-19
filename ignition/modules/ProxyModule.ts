import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const proxyModule = buildModule("ProxyModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const nftAuction = m.contract("NftAuction", [proxyAdminOwner]);

  const proxy = m.contract("TransparentUpgradeableProxy", [nftAuction, proxyAdminOwner, "0x"]);

  const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxyAdmin, proxy };
});

const nftAuctionModule = buildModule("NftAuctionModule", (m) => {
  const { proxyAdmin, proxy } = m.useModule(proxyModule);

  const nftAuction = m.contractAt("NftAuction", proxy);

  return { nftAuction, proxyAdmin, proxy };
});

export default nftAuctionModule;