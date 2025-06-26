// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PhotoPurchaseResolver is SchemaResolver, Ownable {
    uint256 constant BPS_DENOMINATOR = 10_000;
    uint256 constant FEE_BPS = 1_500;
    uint256 private collectedFees;

    constructor(IEAS eas, address initialOwner)
        SchemaResolver(eas)
        Ownable(initialOwner)
    {}

    event PhotoPurchased(address indexed buyer, bytes32 indexed photoRefUID, bytes32 purchaseAttUID, bytes32 resourceIdHash, bytes32 contentHash, bool isIpfs);

    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 value)internal override returns (bool){
        require(attestation.attester == owner(), "Only platform can attest new purchases.");
        require(value > 0, "ETH payment required.");
        require(_eas.isAttestationValid(attestation.refUID), "Invalid photo.");
        Attestation memory photoAttestation = _eas.getAttestation(attestation.refUID);
        require(photoAttestation.revocationTime == 0, "Photo is no longer on sale.");
        bytes memory rawPhotoAttData = photoAttestation.data;
        (, , , uint256 totalPrice) = abi.decode(rawPhotoAttData, (bytes32, bytes32, bool, uint256));
        require(value == totalPrice,"Value sent is not the same price as requested by the photographer plus fees.");
        (bytes32 newResourceIdHash, bytes32 newContentHash, bool isNewPhotoIpfs, ) = abi.decode(attestation.data, (bytes32, bytes32, bool, bytes32));
        address photographer = photoAttestation.recipient;

        uint256 netPrice = (totalPrice * BPS_DENOMINATOR) / (BPS_DENOMINATOR + FEE_BPS);
        uint256 feeAmount = totalPrice - netPrice;

        collectedFees += feeAmount;

        (bool sent, ) = photographer.call{value: netPrice}("");
        require(sent, "Photographer payment failed");

        emit PhotoPurchased(attestation.recipient, attestation.refUID, attestation.uid, newResourceIdHash, newContentHash, isNewPhotoIpfs);

        return true;
    }

    function onRevoke(Attestation calldata, uint256)internal pure override returns (bool) {
        return true;
    }

    function getFeePercent() external pure returns (uint256) {
        return (FEE_BPS * 100) / BPS_DENOMINATOR;
    }

    function getCollectedFeeValue() external view onlyOwner returns (uint256) {
        return collectedFees;
    }

    function withdrawFees() external onlyOwner {
        require(collectedFees > 0, "No fees to withdraw");

        uint256 amount = collectedFees;
        collectedFees = 0;

        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Withdrawal failed");
    }

    receive() external payable override {}
}
