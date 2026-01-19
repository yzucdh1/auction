import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import nftAuctionModule from "./ProxyModule.js";

const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(nftAuctionModule);

  const nftAuctionV2 = m.contract("NftAuctionV2", [proxyAdminOwner]);

  m.call(proxyAdmin, "upgradeAndCall", [proxy, nftAuctionV2, "0x"], {
    from: proxyAdminOwner,
  });

  return { proxyAdmin, proxy };
});

const nftAuctionV2Module = buildModule("NftAuctionV2Module", (m) => {
  const { proxy } = m.useModule(upgradeModule);

  const nftAuctionV2 = m.contractAt("NftAuctionV2", proxy);

  return { nftAuctionV2 };
});

export default nftAuctionV2Module;