import { delegatedAttestPhotoBuyRequest, delegatedAttestPhotoRegistrationRequest, delegatedRevokeRequest } from "../EAS/easUtils/easDelegated";
import * as helpers from "../EAS/easUtils/easHelpers";
import * as utils from "../EAS/easUtils/easUtils";
import * as factories from "../EAS/easUtils/easInterfaceDefaultFactories";
import { ethers } from "ethers";

jest.mock("../EAS/easUtils/easHelpers");
jest.mock("../EAS/easUtils/easUtils");
jest.mock("../EAS/easUtils/easInterfaceDefaultFactories");

describe("delegatedAttestPhotoRegistrationRequest", () => {
  const validWallet = "0x1234567890123456789012345678901234567890";
  const validRefUid = "0x" + "a".repeat(64);
  const validDbId = "my-db-id";
  const validSha256 = "0x" + "b".repeat(64);
  const ethValue = "0.1";

  beforeEach(() => {
    (
      factories.createDefaultDelegatedAttestRequestResult as jest.Mock
    ).mockReturnValue({
      success: false,
      message: "",
      payload: null,
    });

    (utils.getRegisteredSchema as jest.Mock).mockResolvedValue({
      schemaUID: "0xschemaUID",
      schemaStr:
        "bytes32 resourceIdHash, bytes32 contentHash, bool isIpfs, uint256 ethTotalValue",
      resolver: "0xresolver",
    });

    (helpers.getPhotoRegisterSchemaName as jest.Mock).mockReturnValue(
      "photo-schema"
    );

    jest.spyOn(ethers, "keccak256").mockImplementation(() => "0xhash123");
    jest
      .spyOn(ethers, "toUtf8Bytes")
      .mockImplementation((str) => Buffer.from(str));
    jest
      .spyOn(ethers, "parseEther")
      .mockImplementation((value) => BigInt(Number(value) * 1e18));
  });

  it("eroare la adresa wallet invalida", async () => {
    const result = await delegatedAttestPhotoRegistrationRequest(
      "invalid_address",
      validDbId,
      validSha256,
      true,
      ethValue,
      validRefUid
    );
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/nu este validă/i);
  });

  it("eroare la ref UID invalid", async () => {
    const result = await delegatedAttestPhotoRegistrationRequest(
      validWallet,
      validDbId,
      validSha256,
      true,
      ethValue,
      "baduid"
    );
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/referențiate nu este valid/i);
  });

  it("returnează eroare pentru valoarea ETH <= 0", async () => {
    jest.spyOn(ethers, "parseEther").mockReturnValue(BigInt(0));
    const result = await delegatedAttestPhotoRegistrationRequest(
      validWallet,
      validDbId,
      validSha256,
      true,
      "0.0",
      validRefUid
    );
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Valoarea.*mai mare/i);
  });
});

describe("delegatedAttestPhotoBuyRequest", () => {
  const validWallet   = "0x1234567890123456789012345678901234567890";
  const invalidWallet = "not_a_wallet";
  const validRefUid   = "0x" + "a".repeat(64);
  const badRefUid     = "0x123";
  const validDbId     = "0x" + "b".repeat(64);
  const validSha256   = "0x" + "c".repeat(64);
  const ethValue      = "0.1";

  beforeEach(() => {
    (factories.createDefaultDelegatedAttestRequestResult as jest.Mock).mockReturnValue({
      success: false,
      message: "",
      payload: null,
    });

    (utils.getRegisteredSchema as jest.Mock).mockResolvedValue({
      schemaUID: "0xschemaUID",
      schemaStr:  "bytes32 resourceIdHash, bytes32 contentHash, bool isIpfs, bytes32 customData",
      resolver:   "0xresolver",
    });

    (helpers.getPhotoPurchaseSchemaName as jest.Mock).mockReturnValue("photo-purchase-schema");

    jest.spyOn(ethers, "parseEther").mockImplementation(v => BigInt(Number(v) * 1e18));
    jest.spyOn(ethers, "encodeBytes32String").mockImplementation(() => "0xencoded");
  });

  it("eroare la adresa wallet gresita", async () => {
    const res = await delegatedAttestPhotoBuyRequest(
      invalidWallet, validDbId, validSha256, true,
      ethValue, validRefUid, "test"
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Adresa destinatarului nu este validă/i);
  });

  it("eroare invalid refUid", async () => {
    const res = await delegatedAttestPhotoBuyRequest(
      validWallet, validDbId, validSha256, true,
      ethValue, badRefUid, "test"
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/UID-ul atesării referențiate nu este valid/i);
  });

  it("eroare la eth value ≤ 0", async () => {
    (ethers.parseEther as jest.Mock).mockReturnValue(BigInt(0));
    const res = await delegatedAttestPhotoBuyRequest(
      validWallet, validDbId, validSha256, true,
      "0.0", validRefUid, "test"
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Valoarea în ETH trebuie să fie mai mare decât 0/i);
  });

  it("eroare customData (>31 caractere)", async () => {
    const res = await delegatedAttestPhotoBuyRequest(
      validWallet, validDbId, validSha256, true,
      ethValue, validRefUid, "x".repeat(32)
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Custom data trebuie să conțină maxim 31 de caractere/i);
  });
});

describe("delegatedRevokeRequest", () => {
  const validUid     = "0x" + "f".repeat(64);
  const schemaName   = "test-schema";
  const validWallet  = "0x1234567890123456789012345678901234567890";

  beforeEach(() => {
    (factories.createDefaultDelegatedRevocationRequestResult as jest.Mock).mockReturnValue({
      success: false,
      message: "",
    });

    (helpers.getEASInstance as jest.Mock).mockReturnValue({
      signer: {
        address: validWallet,
        getAddress: async () => validWallet,
      },
      eas: {
        isAttestationValid:  jest.fn(),
        getAttestation:       jest.fn(),
        isAttestationRevoked: jest.fn(),
        getDelegated:         jest.fn().mockResolvedValue({
          signDelegatedRevocation: jest.fn().mockResolvedValue({
            signature: "0xrevokesignature",
          }),
        }),
      },
    });

    (utils.getRegisteredSchema as jest.Mock).mockResolvedValue({
      schemaUID: "0xschemauid",
    });

    jest.spyOn(helpers, "makeDeadline").mockReturnValue(BigInt(1234567890));
  });

  it("returneaza eroare daca UID-ul atestarii este invalid", async () => {
    const easStub = (helpers.getEASInstance as jest.Mock)().eas;
    easStub.isAttestationValid.mockResolvedValue(false);

    const res = await delegatedRevokeRequest(validUid, schemaName);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(
      new RegExp(`Atestarea cu UID \\[${validUid}\\] nu este validă`, "i")
    );
  });

  it("returneaza eroare daca atestarea nu este revocabila", async () => {
    const easStub = (helpers.getEASInstance as jest.Mock)().eas;
    easStub.isAttestationValid.mockResolvedValue(true);
    easStub.getAttestation.mockResolvedValue({ revocable: false });

    const res = await delegatedRevokeRequest(validUid, schemaName);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/nu este revocabilă/i);
  });

  it("returneaza eroare daca atestarea a fost revocata anterior", async () => {
    const easStub = (helpers.getEASInstance as jest.Mock)().eas;
    easStub.isAttestationValid.mockResolvedValue(true);
    easStub.getAttestation.mockResolvedValue({ revocable: true });
    easStub.isAttestationRevoked.mockResolvedValue(true);

    const res = await delegatedRevokeRequest(validUid, schemaName);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/a fost deja revocată/i);
  });

  it("succes daca toate conditiile sunt indeplinite", async () => {
    const easStub = (helpers.getEASInstance as jest.Mock)().eas;
    easStub.isAttestationValid.mockResolvedValue(true);
    easStub.getAttestation.mockResolvedValue({ revocable: true });
    easStub.isAttestationRevoked.mockResolvedValue(false);

    const res = await delegatedRevokeRequest(validUid, schemaName);
    expect(res.success).toBe(true);
    expect(res.backendSignature).toBe("0xrevokesignature");
    expect(res.revokedUid).toBe(validUid);
    expect(res.revokerWallet).toBe(validWallet);
    expect(res.schemaUid).toBe("0xschemauid");
    expect(res.deadlineTimestampString).toBe("1234567890");
    expect(res.message).toMatch(/generată cu succes/i);
  });
});
