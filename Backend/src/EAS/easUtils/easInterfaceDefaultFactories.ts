import {
  AttestationOpResult,
  AttestationDecoded,
  AttestationDecodedOptions,
  EASSchema,
  DelegatedAtttestationRequestResult,
  DelegatedRevocationRequestResult,
} from "./easInterfaces";

/** @internal */
export function createDefaultAttestationOpResult(): AttestationOpResult {
  return {
    success: false,
    message: "",
    error: undefined,
    data: undefined,
  };
}

/** @internal */
export function createDefaultAttestationDecoded(): AttestationDecoded {
  return {
    attesterAddr: undefined,
    resolverAddr: undefined,
    schemaUID: undefined,
    recipientAddr: undefined,
    attestTime: undefined,
    isRevoked: false,
    revocationTime: undefined,
    expirationTime: undefined,
    referencedAttestationUid: undefined,
    decodedData: {},
    success: false,
    message: "",
  };
}

/** @internal */
export function createDefaultAttestationDecodedOptions(): AttestationDecodedOptions {
  return {
    includeResolver: false,
    includeRefUid: false,
    includeTimestamps: false,
    includeSchemaUID: false,
    includeAttester: false,
  };
}

/** @internal */
export function createDefaultEASSchema(): EASSchema {
  return {
    schemaStr: "",
    schemaUID: "",
    resolver: "",
  };
}

/** @internal */
export function createDefaultDelegatedAttestRequestResult(): DelegatedAtttestationRequestResult {
  return {
    schemaStr: undefined,
    schemaUid: undefined,
    attestationDataString: undefined,
    attesterWallet: undefined,
    backendSignature: undefined,
    deadlineTimestampString: undefined,
    success: false,
    message: "",
  };
}

/** @internal */
export function createDefaultDelegatedRevocationRequestResult(): DelegatedRevocationRequestResult {
  return {
    schemaUid: undefined,
    revokedUid: undefined,
    backendSignature: undefined,
    deadlineTimestampString: undefined,
    revokerWallet: undefined,
    success: false,
    message: "",
  };
}
