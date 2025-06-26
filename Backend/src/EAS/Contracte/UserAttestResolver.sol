// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UserAttestResolver is SchemaResolver, Ownable {
    constructor(IEAS eas, address initialOwner) SchemaResolver(eas) Ownable(initialOwner){}

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal view override returns (bool) {
        require(attestation.attester == owner(), "Only platform owner can attest new users.");
        require(attestation.recipient != address(0), "Recipient address must be set.");
        return true;
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
        return true;
    }

    function isPayable() public pure override returns (bool) {
        return false;
    }
}