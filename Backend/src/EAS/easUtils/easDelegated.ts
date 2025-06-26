import { ethers } from "ethers";
import {
  SchemaEncoder,
  NO_EXPIRATION,
  EIP712AttestationParams,
  EIP712RevocationParams,
} from "@ethereum-attestation-service/eas-sdk";
import * as helpers from "./easHelpers";
import { EASSchema } from "./easInterfaces";
import * as factories from "./easInterfaceDefaultFactories";
import * as utils from "./easUtils";
import {
  DelegatedAtttestationRequestResult,
  DelegatedRevocationRequestResult,
} from "./easInterfaces";
import logger from "../../helpers/logger/loggerConfig";
const modulePrefix = "[EASDelegated]";

export async function delegatedAttestPhotoRegistrationRequest(
  recipientWallet: string,
  dbId: string,
  contentSha256Hash: string,
  isIpfs: boolean,
  ethValueStr: string,
  refUid: string,
): Promise<DelegatedAtttestationRequestResult> {
  const output =
    factories.createDefaultDelegatedAttestRequestResult();
  if (!ethers.isAddress(recipientWallet)) {
    output.success = false;
    output.message = "Adresa destinatarului nu este validă";
    return output;
  }
  if (!ethers.isHexString(refUid, 32) || !refUid.startsWith("0x")) {
    output.success = false;
    output.message = "UID-ul atestării referențiate nu este valid";
    return output;
  }
  if (ethers.parseEther(ethValueStr) <= 0) {
    output.success = false;
    output.message = "Valoarea în ETH trebuie să fie mai mare decât 0";
    return output;
  }
  try {
    const { signer, eas } = helpers.getEASInstance();
    const schema: EASSchema = await utils.getRegisteredSchema(
      helpers.getPhotoRegisterSchemaName()
    );
    const schemaEncoder = new SchemaEncoder(schema.schemaStr);
    const dbIdHashEnc = ethers.keccak256(ethers.toUtf8Bytes(dbId));
    const ethValue = ethers.parseEther(ethValueStr);
    const encodedData = schemaEncoder.encodeData([
      { name: "resourceIdHash", type: "bytes32", value: dbIdHashEnc },
      { name: "contentHash", type: "bytes32", value: contentSha256Hash },
      { name: "isIpfs", type: "bool", value: isIpfs },
      { name: "ethTotalValue", type: "uint256", value: ethValue },
    ]);

    const signatureDeadline = helpers.makeDeadline();
    const eip712Request: EIP712AttestationParams = {
      schema: schema.schemaUID,
      recipient: recipientWallet,
      expirationTime: NO_EXPIRATION,
      revocable: true,
      refUID: refUid,
      data: encodedData,
      value: 0n,
      deadline: signatureDeadline,
    };
    const delegatedEAS = await eas.getDelegated();
    const responseDelegatedAtt = await delegatedEAS.signDelegatedAttestation(
      eip712Request,
      signer
    );
    const delegatedSignature = responseDelegatedAtt.signature;

    output.schemaStr = schema.schemaStr;
    output.schemaUid = schema.schemaUID;
    output.attestationDataString = encodedData;
    output.attesterWallet = signer.address;
    output.backendSignature = delegatedSignature;
    output.deadlineTimestampString = signatureDeadline.toString();
    output.success = true;
    output.message =
      "Semnătura pentru atestarea delegată a fost generată cu succes";
    return output;
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la crearea semnăturii pentru atestarea delegată, înregistrare fotografie ${contentSha256Hash}:`, error);
    throw new Error(`Eroare la crearea semnăturii pentru atestarea delegată, înregistrare fotografie ${contentSha256Hash}`);
  }
}

export async function delegatedAttestPhotoBuyRequest(
  recipientWallet: string,
  dbIdHash: string,
  contentSha256Hash: string,
  isIpfs: boolean,
  ethValueStr: string,
  refUid: string,
  customData: string = ""
): Promise<DelegatedAtttestationRequestResult> {
  const output =
    factories.createDefaultDelegatedAttestRequestResult();
  if (!ethers.isAddress(recipientWallet)) {
    output.success = false;
    output.message = "Adresa destinatarului nu este validă";
    return output;
  }
  if (!ethers.isHexString(refUid, 32) || !refUid.startsWith("0x")) {
    output.success = false;
    output.message = "UID-ul atesării referențiate nu este valid";
    return output;
  }
  if (ethers.parseEther(ethValueStr) <= 0) {
    output.success = false;
    output.message = "Valoarea în ETH trebuie să fie mai mare decât 0";
    return output;
  }
  if(customData.length > 31) {
    output.success = false;
    output.message = "Custom data trebuie să conțină maxim 31 de caractere";
    return output;
  }
  try {
    const { signer, eas } = helpers.getEASInstance();
    const schema: EASSchema = await utils.getRegisteredSchema(
      helpers.getPhotoPurchaseSchemaName()
    );
    const schemaEncoder = new SchemaEncoder(schema.schemaStr);
    // MUTAT IN AFARA FUNCTIEI - const dbIdHashEnc = ethers.keccak256(ethers.toUtf8Bytes(dbIdHash));
    const customDataEnc = ethers.encodeBytes32String(customData);
    const ethValue = ethers.parseEther(ethValueStr);

    const encodedData = schemaEncoder.encodeData([
      { name: "resourceIdHash", type: "bytes32", value: dbIdHash },
      { name: "contentHash", type: "bytes32", value: contentSha256Hash },
      { name: "isIpfs", type: "bool", value: isIpfs },
      { name: "customData", type: "bytes32", value: customDataEnc },
    ]);

    const signatureDeadline = helpers.makeDeadline();
    const eip712Request: EIP712AttestationParams = {
      schema: schema.schemaUID,
      recipient: recipientWallet,
      expirationTime: NO_EXPIRATION,
      revocable: true,
      refUID: refUid,
      data: encodedData,
      value: ethValue,
      deadline: signatureDeadline,
    };
    const delegatedEAS = await eas.getDelegated();
    const responseDelegatedAtt = await delegatedEAS.signDelegatedAttestation(
      eip712Request,
      signer
    );
    const delegatedSignature = responseDelegatedAtt.signature;

    output.schemaStr = schema.schemaStr;
    output.schemaUid = schema.schemaUID;
    output.attestationDataString = encodedData;
    output.attesterWallet = signer.address;
    output.backendSignature = delegatedSignature;
    output.deadlineTimestampString = signatureDeadline.toString();
    output.success = true;
    output.message =
      "Semnătura pentru atestarea delegată a fost generată cu succes";
    return output;
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la crearea semnăturii pentru atestarea delegată, achiziționare fotografie ${contentSha256Hash}:`, error);
    throw new Error(`Eroare la crearea semnăturii pentru atestarea delegată, achiziționare fotografie ${contentSha256Hash}`);
  }
}

export async function delegatedRevokeRequest(
  revocationUid: string,
  schemaName: string
): Promise<DelegatedRevocationRequestResult> {
  const output =
    factories.createDefaultDelegatedRevocationRequestResult();
  try {
    const { signer, eas } = helpers.getEASInstance();

    const isValidUid = await eas.isAttestationValid(revocationUid);
    if (!isValidUid) {
      output.success = false;
      output.message = `Atestarea cu UID [${revocationUid}] nu este validă.`;
      return output;
    }

    const attestationData = await eas.getAttestation(revocationUid);
    if (!attestationData.revocable) {
      output.success = false;
      output.message = `Atestarea cu UID [${revocationUid}] nu este revocabilă.`;
      return output;
    }

    const isRevoked = await eas.isAttestationRevoked(revocationUid);
    if (isRevoked) {
      output.success = false;
      output.message = `Atestarea cu UID [${revocationUid}] a fost deja revocată.`;
      return output;
    }

    const schema: EASSchema = await utils.getRegisteredSchema(schemaName);

    const signatureDeadline = helpers.makeDeadline();
    const eip712Request: EIP712RevocationParams = {
      schema: schema.schemaUID,
      uid: revocationUid,
      value: 0n,
      deadline: signatureDeadline,
    };
    const delegatedEAS = await eas.getDelegated();
    const responseDelegatedAtt = await delegatedEAS.signDelegatedRevocation(
      eip712Request,
      signer
    );
    const delegatedSignature = responseDelegatedAtt.signature;
    const revokerWallet = await signer.getAddress();

    output.schemaUid = schema.schemaUID;
    output.revokedUid = revocationUid;
    output.revokerWallet = revokerWallet;
    output.backendSignature = delegatedSignature;
    output.deadlineTimestampString = signatureDeadline.toString();
    output.success = true;
    output.message =
      "Semnătura pentru revocarea delegată a fost generată cu succes";
    return output;
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la crearea semnăturii pentru revocare delegată a fotografiei cu UID ${revocationUid}:`, error);
    throw new Error(`Eroare la crearea semnăturii pentru revocare delegată a fotografiei cu UID ${revocationUid}.`);
  }
}
