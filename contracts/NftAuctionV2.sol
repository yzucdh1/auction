// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import {NftAuction} from "./NftAuction.sol";

contract NftAuctionV2 is NftAuction {

    constructor(address _platformFeeRecipient) NftAuction(_platformFeeRecipient) {}

    function getVersion() public override pure returns (string memory) {
        return "2.0.0";
    }
}