import { ethers } from "ethers";
import { EAS, Signature } from "@ethereum-attestation-service/eas-sdk";
import { SchemaValue } from "@ethereum-attestation-service/eas-sdk";

export interface EASLibConfig {
  ownerPrivateKey: string;
  rpcUrlMain: string;
  rpcUrlBackup?: string;
  easContractAddress: string;
  schemaRegistryContractAddress: string;
  schemaRegisterMode: boolean;
  schemaJSONFile: string;
  photoPurchaseSchema: string;
  userRegSchema: string;
  photoRegSchema: string;
  schemas?: Record<string, EASSchema>;
}

export interface EASInstance {
  provider: ethers.JsonRpcProvider;
  signer: ethers.Wallet;
  eas: EAS;
}

export interface EASSchema {
  schemaStr: string;
  schemaUID: string;
  resolver: string;
}

export interface SchemaInput {
  name: string;
  schema: string;
  revocable: boolean;
  resolverAddress?: string;
}

export interface SchemaRegistrationResult {
  schemaUID?: string;
  schemaStr: string;
  resolver: string;
  error?: string;
}

export interface AttestationOpResult {
  success: boolean;
  message: string;
  error?: string;
  data?: string;
}

export interface DecodedOutputItem {
  type: string;
  value: SchemaValue;
}

export interface AttestationDecoded {
  attesterAddr?: string;
  resolverAddr?: string;
  schemaUID?: string;
  recipientAddr?: string;
  attestTime?: string;
  isRevoked?: boolean;
  revocationTime?: string;
  expirationTime?: string;
  referencedAttestationUid?: string;
  decodedData?: Record<string, DecodedOutputItem>;
  success: boolean;
  message: string;
}

export interface AttestationDecodedOptions {
  includeResolver?: boolean;
  includeRefUid?: boolean;
  includeTimestamps?: boolean;
  includeSchemaUID?: boolean;
  includeAttester?: boolean;
}

export interface DelegatedAtttestationRequestResult {
  schemaStr?: string;
  schemaUid?: string;
  attestationDataString?: string;
  attesterWallet?: string;
  backendSignature?: Signature;
  deadlineTimestampString?: string;
  success: boolean;
  message: string;
}

export interface DelegatedRevocationRequestResult {
    schemaUid?: string,
    revokedUid?: string,
    backendSignature?: Signature,
    deadlineTimestampString?: string,
    revokerWallet?: string,
    success: boolean;
    message: string;
}