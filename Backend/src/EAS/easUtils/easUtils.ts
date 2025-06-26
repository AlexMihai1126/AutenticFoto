import { ethers } from "ethers";
import { SchemaEncoder, SchemaRegistry, SchemaDecodedItem, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";
import * as helpers from "./easHelpers";
import { AttestationDecoded, AttestationDecodedOptions, AttestationOpResult, EASSchema, DecodedOutputItem } from "./easInterfaces";
import * as factories from "./easInterfaceDefaultFactories";
import { getAppConfig } from "./configLib";
import * as fs from "node:fs";
import logger from "../../helpers/logger/loggerConfig";
const modulePrefix = "[EAS/Utils]";

/**
 * Obținere schemă din fișierul JSON din config (formatat de funcția registerSchemas).
 *
 * Funcția citește un fișier JSON (default "schemaUIDs.json") ce conține schemele
 * înregistrate și caută schema cu numele specificat. Dacă schema este găsită, se returnează un obiect
 * de tipul `EASSchema` care include:
 *   - `schemaStr`: Schema înregistrată (string).
 *   - `schemaUID`: UID-ul schemei.
 *   - `resolver`: Adresa contractului resolver asociat.
 *
 * @async
 * @function getRegisteredSchema
 * @param {string} schemaName - Numele schemei de citit.
 * @param {string} [schemaFile] - Numele fișierului JSON (daca nu se specifica - se citeste din configuratia initiala).
 * @returns {Promise<EASSchema>} Un promise care se rezolvă cu un obiect de tip `EASSchema`.
 * @throws {Error} Dacă schema cu numele specificat nu există în fișier sau dacă apare o eroare la citirea fișierului.
 *
 */
export async function getRegisteredSchema(
  schemaName: string,
  schemaFile?: string
): Promise<EASSchema> {
  try {
    const schema: EASSchema = factories.createDefaultEASSchema();
    if (!schemaFile) {
      const config = getAppConfig();
      if (!config.schemas) {
        throw new Error("Configurația inițială nu a fost incărcată corect.");
      }

      const schemaObj = config.schemas[schemaName];
      if (!schemaObj) {
        throw new Error(`Schema "${schemaName}" nu există în ${config.schemaJSONFile}`);
      }
      schema.schemaStr = schemaObj.schemaStr;
      schema.schemaUID = schemaObj.schemaUID;
      schema.resolver = schemaObj.resolver;
    } else {
      const fileContent = await fs.promises.readFile(schemaFile, "utf-8");
      const schemas = JSON.parse(fileContent) as Record<string, EASSchema>;
      const schemaSearch = schemas[schemaName];
      if (!schemaSearch) {
        throw new Error(`Schema "${schemaName}" nu există în ${schemaFile}`);
      }
      schema.schemaStr = schemaSearch.schemaStr;
      schema.schemaUID = schemaSearch.schemaUID;
      schema.resolver = schemaSearch.resolver;
    }

    return schema;
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la citirea schemei ${schemaName}:`, error);
    throw new Error(`Eroare la citirea schemei ${schemaName}`);
  }
}

/**
 * Creează o atestare EAS pentru înregistrarea unui utilizator.
 *
 * @async
 * @function attestUser
 * @param {string} userWallet - adresa wallet.
 * @param {boolean} isPhotographer - indică dacă utilizatorul este fotograf (true) sau cumpărător (false).
 * @param {boolean} [permanent=true] - True pentru atestare non-revocabilă.
 * @param {string} [referencedUID=ethers.ZeroHash] - UID-ul atestării referențiate (opțional).
 * @returns {Promise<AttestationOpResult>} Un obiect ce conține:
 *   - `success`: Boolean ce indică succesul înregistrării.
 *   - `message`: Mesajul asociat dacă nu se validează datele sau confirmarea înregistrării.
 *   - `data`: UID-ul generat.
 *
 * @throws {Error} Dacă apare o eroare la creare.
 */
export async function attestUser(
  userWallet: string,
  isPhotographer: boolean,
  permanent: boolean = true,
  customData: string = "",
  referencedUID: string = ethers.ZeroHash
): Promise<AttestationOpResult> {
  const output = factories.createDefaultAttestationOpResult();
  if (!ethers.isAddress(userWallet)) {
    output.success = false;
    output.message = "Adresa wallet a utilizatorului nu este validă";
    return output;
  }
  if (!ethers.isHexString(referencedUID, 32) || !referencedUID.startsWith("0x")) {
    throw new Error("UID-ul atestării referențiate nu este valid");
  }
  if(customData.length > 31) {
    output.success = false;
    output.message = "Custom data trebuie să conțină maxim 31 de caractere";
    return output;
  }
  try {
    const { eas } = helpers.getEASInstance();
    const schema = await getRegisteredSchema(helpers.getUserRegSchemaName());
    const schemaEncoder = new SchemaEncoder(schema.schemaStr);
    const customDataEnc = ethers.encodeBytes32String(customData);
    const encodedData = schemaEncoder.encodeData([
      { name: "isPhotographer", value: isPhotographer, type: "bool" },
      { name: "customData", value: customDataEnc, type: "bytes32" },
    ]);

    const tx = await eas.attest({
      schema: schema.schemaUID,
      data: {
        recipient: userWallet,
        expirationTime: NO_EXPIRATION,
        revocable: !permanent,
        data: encodedData,
        refUID: referencedUID,
      },
    });

    const receipt = await tx.wait();
    output.success = true;
    output.message = "Atestarea a fost creată cu succes";
    output.data = receipt;
    return output;
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la crearea atestării pentru utilizatorul ${userWallet}:`, error);
    throw new Error(`Eroare la crearea atestării pentru utilizator.`);
  }
}

/**
 * Revocare atestare EAS pe baza UID.
 *
 * Această funcție efectuează următorii pași:
 * 1. Verifică dacă UID-ul atestării este valid
 * 2. Confirmă că atestarea există pe blockchain
 * 3. Verifică dacă atestarea este revocabilă
 * 4. Verifică dacă atestarea nu a fost deja revocată
 * 5. Dacă toate condițiile sunt îndeplinite, revocă atestarea
 *
 * @async
 * @param {string} attestationUID -  UID-ul atestării de revocat.
 * @returns {Promise<AttestationOpResult>} Un obiect ce conține:
 *   - `success`: Boolean ce indică succesul revocării.
 *   - `message`: Mesajul asociat dacă atestarea nu îndeplinește condițiile sau confirmarea revocării.
 *
 * @throws {Error} Dacă apare o eroare la revocare.
 */
export async function revokeAttestationWrapper(
  attestationUID: string
): Promise<AttestationOpResult> {
  if (!ethers.isHexString(attestationUID, 32) || !attestationUID.startsWith("0x")) {
    return {
      success: false,
      message: `UID-ul atestării [${attestationUID}] nu este valid.`,
    };
  }
  try {
    const { eas } = helpers.getEASInstance();
    const isValid = await eas.isAttestationValid(attestationUID);

    if (!isValid) {
      return {
        success: false,
        message: `Atestarea cu UID [${attestationUID}] nu există.`,
      };
    }

    const attestationData = await eas.getAttestation(attestationUID);
    if (!attestationData.revocable) {
      return {
        success: false,
        message: `Atestarea cu UID [${attestationUID}] nu este revocabilă.`,
      };
    }

    const isRevoked = await eas.isAttestationRevoked(attestationUID);
    if (isRevoked) {
      return {
        success: false,
        message: `Atestarea cu UID [${attestationUID}] a fost deja revocată.`,
      };
    }

    const schemaUID = attestationData.schema;
    const tx = await eas.revoke({ schema: schemaUID, data: { uid: attestationUID } });
    await tx.wait();

    return {
      success: true,
      message: `Atestarea cu UID [${attestationUID}] a fost revocată cu succes.`,
    };
  } catch (error) {
    logger.error(`${modulePrefix} Eroare la revocarea atestării cu UID [${attestationUID}]:`, error);
    throw new Error(`Eroare la revocarea atestării cu UID [${attestationUID}].`);
  }
}

/**
 * Recuperează și decodifică datele stocate într-o atestare EAS.
 *
 * Funcția preia detaliile unei atestări folosind UID-ul furnizat, extrage datele în format hexadecimal, după care o decodifică folosind schema de la înregistrare. În funcție de opțiunile specificate în `options`, se returnează următoarele date:
 *
 * - `attesterAddr`: [Opțional] Adresa celui care a semnat crearea atestării.
 * - `recipientAddr`: [Standard] Adresa celui care a primit atestarea.
 * - `isRevoked`: [Standard] Indică dacă atestarea a fost revocată (true/false).
 * - `attestTime`: [Opțional] Timpul la care s-a creat atestarea (format ISO - UTC).
 * - `revocationTime`: [Opțional] Data revocării (format ISO - UTC), dacă există.
 * - `expirationTime`: [Opțional] Data expirării (format ISO - UTC), dacă există.
 * - `referencedAttestationUid`: [Opțional] UID-ul atestării referențiate, dacă există.
 * - `schemaUID`: [Opțional] UID-ul schemei.
 * - `resolverAddr`: [Opțional] Adresa contractului resolver, dacă schema are resolver.
 * - `decodedData`: [Standard] Obiectul ce conține datele decodificate din atestare.
 *
 * În plus, obiectul rezultat include:
 *   - `success`: [Standard] Boolean ce indică succesul decodificării.
 *   - `message`: [Standard] Mesajul asociat dacă atestarea nu îndeplinește condițiile sau confirmarea decodificării.
 * 
 * @async
 * @param {string} uid - UID-ul atestării de decodificat.
 * @param {AttestationDecodedOptions} [options] - Opțiunile pentru informații suplimentare:
 *    - `includeResolver`: Dacă este true, include adresa contractului resolver din schema.
 *    - `includeRefUid`: Dacă este true, include UID-ul atestării referențiate.
 *    - `includeTimestamps`: Dacă este true, include momentele de timp (atestare, revocare, expirare) în format ISO.
 *    - `includeSchemaUID`: Dacă este true, include UID-ul schemei.
 *    - `includeAttester`: Dacă este true, include adresa atestatorului.
 * @returns {Promise<AttestationDecoded>} Un obiect ce conține datele atestării decodificate:
 *    - `attesterAddr`: Adresa creatorului atestării (opțional).
 *    - `recipientAddr`: Adresa destinatarului atestării (standard).
 *    - `isRevoked`: Indică revocarea atestării (standard).
 *    - `attestTime`: Timpul atestării (opțional).
 *    - `revocationTime`: Timpul revocării (opțional).
 *    - `expirationTime`: Timpul expirării (opțional).
 *    - `referencedAttestationUid`: UID-ul atestării referențiate (opțional).
 *    - `schemaUID`: UID-ul schemei (opțional).
 *    - `resolverAddr`: Adresa contractului resolver (opțional).
 *    - `decodedData`: Datele decodificate din atestare (standard).
 *    - `success`: Indică succesul decodificării (standard).
 *    - `message`: Mesajul asociat (standard).
 *
 * @throws {Error} Dacă apare o eroare la decodificarea atestării.
 */
export async function retrieveAttestationDecoded(uid: string, options: AttestationDecodedOptions): Promise<AttestationDecoded> {
  const output = factories.createDefaultAttestationDecoded();
  if (!ethers.isHexString(uid, 32) || !uid.startsWith("0x")) {
    output.message = `UID-ul atestarii [${uid}] nu este valid.`;
    return output;
  }
  try {
    const { provider, eas } = helpers.getEASInstance();

    const isValid = await eas.isAttestationValid(uid);
    if (!isValid) {
      output.message = `Atestarea cu UID [${uid}] nu a fost gasita.`;
      return output;
    }

    const rawAtttestation = await eas.getAttestation(uid);
    const rawData = rawAtttestation.data;

    const refUid = rawAtttestation.refUID;
    if (refUid !== ethers.ZeroHash && options?.includeRefUid) {
      output.referencedAttestationUid = refUid;
    }

    if (options.includeAttester) {
      output.attesterAddr = rawAtttestation.attester;
    }
    output.recipientAddr = rawAtttestation.recipient;

    output.isRevoked = await eas.isAttestationRevoked(uid);

    const attestTime = Number(rawAtttestation.time);
    const revTime = Number(rawAtttestation.revocationTime);
    const expTime = Number(rawAtttestation.expirationTime);

    if (options.includeTimestamps) {
      output.attestTime = new Date(attestTime * 1000).toISOString();
      if (revTime !== 0) {
        output.revocationTime = new Date(revTime * 1000).toISOString();
      }

      if (expTime !== 0) {
        output.expirationTime = new Date(expTime * 1000).toISOString();
      }
    }

    const schemaUID = rawAtttestation.schema;
    const schemaRegistry = new SchemaRegistry(helpers.getSchemaRegistryContractAddress());
    schemaRegistry.connect(provider);
    const schemaRecord = await schemaRegistry.getSchema({ uid: schemaUID });
    const schemaEncoder = new SchemaEncoder(schemaRecord.schema);
    if (options.includeSchemaUID) {
      output.schemaUID = schemaRecord.uid;
    }

    if (schemaRecord.resolver !== ethers.ZeroAddress && options.includeResolver) {
      output.resolverAddr = schemaRecord.resolver;
    }

    const data : SchemaDecodedItem[] = schemaEncoder.decodeData(rawData);
    output.decodedData = data.reduce((acc, item) => {
        const convertedValue = helpers.convertBigIntsToString(item.value);
        acc[item.name] = {
          type: item.type,
          value: convertedValue.value,
        };
        return acc;
      }, {} as Record<string, DecodedOutputItem>);

    output.success = true;
    output.message = "Atestare decodificata";

    return output;
  } catch (error) {
    console.error(`Eroare la citirea atestarii cu UID [${uid}]:`, error);
    throw new Error(`Eroare la citirea atestarii cu UID [${uid}].`);
  }
}
