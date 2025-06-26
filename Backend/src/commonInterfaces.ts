export interface delegatedResultPayload {
    schemaUid: string;
    recipientWallet: string;
    attesterWallet: string;
    encData: string;
    refUid: string;
    backendSignatureR: string;
    backendSignatureS: string;
    backendSignatureV: number;
    deadline: string;
}

export interface delegatedBuyResultPayload extends delegatedResultPayload {
    ethValue: string;
}

export interface DelegatedRevocationPayload extends Omit<delegatedResultPayload, 'encData' | 'refUid'> {
  revokeUid: string;
}
