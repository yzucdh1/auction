import { expect } from "chai";
import { network } from "hardhat";

// 连接网络
const { ethers, networkHelpers } = await network.connect();

const _tokenURI = "https://example.com/nft/1";
const _mintPrice = ethers.parseEther("0.01");

async function deployNftAuctionFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const nftToken = await ethers.deployContract("NftToken");
  const nftAuction = await ethers.deployContract("NftAuction", [owner.address]);
  return { nftToken, nftAuction, owner, addr1, addr2 };
}

describe("NftAuction", function () {
  describe("Deployment", function () {
    it("Should deploy the contract successfully", async function () {
      const { nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      expect(nftAuction.target).to.properAddress;
    });
  });

  describe("CreateAuction", function () {
    it("Should create an auction successfully", async function () {
      const { nftToken, nftAuction, owner } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();

      expect(createAuctionTx).to.exist;
      const auctionId = await nftAuction.auctionCount();
      expect(auctionId).to.equal(1);

      const auction = await nftAuction.auctions(auctionId);
      await expect(createAuctionTx).to.emit(nftAuction, "AuctionCreated").withArgs(
        auctionId,
        owner.address,
        nftToken.target,
        tokenId,
        auction.startPrice,
        auction.endTime,
        0
      );
    });

    it("Should revert if nftContract is zero address", async function () {
      const { nftToken, nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      const tokenId = await nftToken._tokenIdCount();
      await expect(nftAuction.createAuction(ethers.ZeroAddress, tokenId, ethers.parseEther("0.1"), 86400))
        .to.be.revertedWith("Invalid NFT contract address");
    });

    it("Should revert if startPrice is zero", async function () {
      const { nftToken, nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      const tokenId = await nftToken._tokenIdCount();
      await expect(nftAuction.createAuction(nftToken.target, tokenId, 0, 86400))
        .to.be.revertedWith("Start price must be greater than 0");
    });

    it("Should revert if duration is zero", async function () {
      const { nftToken, nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      const tokenId = await nftToken._tokenIdCount();
      await expect(nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 0))
        .to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert if sender is not owner of this NFT", async function () {
      const { nftToken, nftAuction, addr1 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Connect as addr1 who is not the owner
      await expect(nftAuction.connect(addr1).createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400))
        .to.be.revertedWith("Caller is not the owner of the NFT");
    });

    it("Should revert if not approved to transfer this NFT", async function () {
      const { nftToken, nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();

      const tokenId = await nftToken._tokenIdCount();
      // Create an auction without approving
      await expect(nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400))
        .to.be.revertedWith("Contract is not approved to transfer this NFT");
    });
  });

  describe("PlaceBid", function () {
    it("Should place a bid successfully", async function () {
      const { nftToken, nftAuction, addr1 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      const auction = await nftAuction.auctions(auctionId);
      expect(auction.highestBid).to.equal(bidAmount);
      expect(auction.highestBidder).to.equal(addr1.address);

      await expect(placeBidTx).to.emit(nftAuction, "BidPlaced").withArgs(
        auctionId,
        addr1.address,
        bidAmount,
        0
      );
    });

    it("Should revert if sender is owner", async function () {
      const { nftToken, nftAuction } = await networkHelpers.loadFixture(deployNftAuctionFixture);

      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      await expect(nftAuction.placeBid(auctionId, { value: bidAmount }))
        .to.be.revertedWith("Seller cannot bid on own auction");
    });

    it("Should revert if auction is ended", async function () {
      const { nftToken, nftAuction, addr1 } = await networkHelpers.loadFixture(deployNftAuctionFixture);

      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Increase time to after auction end
      const auction = await nftAuction.auctions(auctionId);
      await networkHelpers.time.increaseTo(auction.endTime + 1n);

      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      await expect(nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount }))
        .to.be.revertedWith("Auction has ended");
    });
  });

  describe("FinalizeAuction", function () {
    it("Should finalize an auction successfully", async function () {
      const { nftToken, nftAuction, addr1, addr2 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      // Place another bid
      const higherBidAmount = ethers.parseEther("0.03");
      const placeHigherBidTx = await nftAuction.connect(addr2).placeBid(auctionId, { value: higherBidAmount });
      await placeHigherBidTx.wait();

      const auction = await nftAuction.auctions(auctionId);
      // Increase time to after auction end
      await networkHelpers.time.increaseTo(auction.endTime + 1n);

      // Finalize the auction
      const finalizeAuctionTx = await nftAuction.finalizeAuction(auctionId);
      await finalizeAuctionTx.wait();

      const finalizedAuction = await nftAuction.auctions(auctionId);
      expect(finalizedAuction.active).to.equal(false);

      await expect(finalizeAuctionTx).to.emit(nftAuction, "AuctionFinalized").withArgs(
        auctionId,
        addr2.address,
        higherBidAmount,
        0
      );

      // check auction is not active anymore
      await expect(nftAuction.finalizeAuction(auctionId)).to.be.revertedWith("Auction is not active");
    });

    it("Should revert if finalize not by owner", async function () {
      const { nftToken, nftAuction, addr1, addr2 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      // Place another bid
      const higherBidAmount = ethers.parseEther("0.03");
      const placeHigherBidTx = await nftAuction.connect(addr2).placeBid(auctionId, { value: higherBidAmount });
      await placeHigherBidTx.wait();

      const auction = await nftAuction.auctions(auctionId);
      // Increase time to after auction end
      await networkHelpers.time.increaseTo(auction.endTime + 1n);

      // Finalize the auction by non-owner
      await expect(nftAuction.connect(addr1).finalizeAuction(auctionId))
        .to.be.revertedWith("Only seller can finalize the auction");
    });

    it("Should revert if auction has not ended yet", async function () {
      const { nftToken, nftAuction, addr1, addr2 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      // Place another bid
      const higherBidAmount = ethers.parseEther("0.03");
      const placeHigherBidTx = await nftAuction.connect(addr2).placeBid(auctionId, { value: higherBidAmount });
      await placeHigherBidTx.wait();

      // Attempt to finalize the auction before it ends
      await expect(nftAuction.finalizeAuction(auctionId))
        .to.be.revertedWith("Auction has not ended yet");
    });
  });

  describe("WithdrawRefund", function () {
    it("Should withdraw refund successfully", async function () {
      const { nftToken, nftAuction, addr1, addr2 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      // Place another bid
      const higherBidAmount = ethers.parseEther("0.03");
      const placeHigherBidTx = await nftAuction.connect(addr2).placeBid(auctionId, { value: higherBidAmount });
      await placeHigherBidTx.wait();

      const auction = await nftAuction.auctions(auctionId);
      // Increase time to after auction end
      await networkHelpers.time.increaseTo(auction.endTime + 1n);

      // Finalize the auction
      const finalizeAuctionTx = await nftAuction.finalizeAuction(auctionId);
      await finalizeAuctionTx.wait();

      const finalizedAuction = await nftAuction.auctions(auctionId);
      expect(finalizedAuction.active).to.equal(false);

      // Withdraw refund for addr1
      const withdrawRefundTx = await nftAuction.connect(addr1).withdrawRefund(auctionId);
      await withdrawRefundTx.wait();
      const refundBalance = await nftAuction.refunds(auctionId, addr1.address);
      expect(refundBalance).to.equal(0);

      await expect(withdrawRefundTx).to.emit(nftAuction, "RefundWithdrawn").withArgs(
        auctionId,
        addr1.address,
        bidAmount
      );
    });

    it("Should revert if auction is still active", async function () {
      const { nftToken, nftAuction, addr1, addr2 } = await networkHelpers.loadFixture(deployNftAuctionFixture);
      // Mint an NFT
      const mintTx = await nftToken.mint(_tokenURI, { value: _mintPrice });
      await mintTx.wait();
      // Approve the auction contract to transfer the NFT
      const tokenId = await nftToken._tokenIdCount();
      await nftToken.approve(nftAuction.target, tokenId);
      // Create an auction
      const createAuctionTx = await nftAuction.createAuction(nftToken.target, tokenId, ethers.parseEther("0.01"), 86400);
      await createAuctionTx.wait();
      expect(createAuctionTx).to.exist;

      const auctionId = await nftAuction.auctionCount();
      // Place a bid
      const bidAmount = ethers.parseEther("0.02");
      const placeBidTx = await nftAuction.connect(addr1).placeBid(auctionId, { value: bidAmount });
      await placeBidTx.wait();

      // Place another bid
      const higherBidAmount = ethers.parseEther("0.03");
      const placeHigherBidTx = await nftAuction.connect(addr2).placeBid(auctionId, { value: higherBidAmount });
      await placeHigherBidTx.wait();

      // Attempt to withdraw refund while auction is still active
      await expect(nftAuction.connect(addr1).withdrawRefund(auctionId))
        .to.be.revertedWith("Auction is still active");
    });
  });
});