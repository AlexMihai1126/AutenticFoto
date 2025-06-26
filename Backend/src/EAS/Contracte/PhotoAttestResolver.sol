// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PhotoAttestResolver is SchemaResolver, Ownable {
    constructor(IEAS eas, address initialOwner)
        SchemaResolver(eas)
        Ownable(initialOwner)
    {}

    event PhotoRegistered(address indexed photographer, bytes32 attestationUid, bytes32 contentHash);
    event PhotoRemovedFromSale(address indexed photographer, bytes32 attestationUid);

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        require(attestation.attester == owner(), "Only platform can attest new photos.");
        require( attestation.refUID != bytes32(0), "Attestation for the photo must have a refUID to the photographer");
        require(_eas.isAttestationValid(attestation.refUID), "Referenced user attestation is invalid");
        Attestation memory userAttestation = _eas.getAttestation(attestation.refUID);
        require(userAttestation.recipient != address(0), "Invalid photographer address in refUID");
        bytes memory rawDataUser = userAttestation.data;
        bool isPhotographer = abi.decode(rawDataUser, (bool));
        require(isPhotographer, "User is not a photographer");

        bytes memory rawPhotoAttData = attestation.data;
        (, bytes32 contentHash, , ) = abi.decode(rawPhotoAttData, (bytes32, bytes32, bool, uint256));

        emit PhotoRegistered(attestation.recipient, attestation.uid, contentHash);
        return true;
    }

    function onRevoke(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        emit PhotoRemovedFromSale(attestation.recipient, attestation.uid);
        return true;
    }

    function isPayable() public pure override returns (bool) {
        return false;
    }
}
