import { expect } from "chai";
import hre from "hardhat";

import nftAuctionModel from "../ignition/modules/ProxyModule.js";
import nftAuctionV2Module from "../ignition/modules/UpgradeModule.js";

const { ethers, ignition } = await hre.network.connect();

describe("Proxy", function () {
    describe("Proxy interaction", function () {
        it("Should be usable via proxy", async function () {
            const [, otherAccount] = await ethers.getSigners();
            const { nftAuction } = await ignition.deploy(nftAuctionModel);

            const version = await nftAuction.getVersion({ account: otherAccount.address });
            expect(version).to.equal("1.0.0");
        });
    });

    describe("Upgrading", function () {
        it("Should have upgraded the proxy to NftAuctionV2", async function () {
            const [, otherAccount] = await ethers.getSigners();
            const { nftAuctionV2 } = await ignition.deploy(nftAuctionV2Module);

            const version = await nftAuctionV2.getVersion({ account: otherAccount.address });
            expect(version).to.equal("2.0.0");
        });
    });
});