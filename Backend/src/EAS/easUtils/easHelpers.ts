import { ethers } from "ethers";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { EASInstance } from "./easInterfaces";
import { getAppConfig } from "./configLib"

/** @internal 
 * Preia cheia privată a contului Ethereum pentru aplicație din fișierul .env
*/
export function getOwnerPrivateKey(): string {
    return getAppConfig().ownerPrivateKey;
}

/** @internal 
 * Preia URL-ul RPC pentru rețeaua Ethereum din fișierul .env
*/
export function getRpcURL(): string {
    return getAppConfig().rpcUrlMain;
}

/** @internal 
 * Preia adresa contractului EAS (trebuie să corespundă rețelei din RPC) din fișierul .env
*/
export function getEASContractAddress(): string {
    return getAppConfig().easContractAddress;
}

/** @internal 
 * Preia adresa contractului Schema Registry (trebuie să corespundă rețelei din RPC) din fișierul .env
*/
export function getSchemaRegistryContractAddress(): string {
    return getAppConfig().schemaRegistryContractAddress;
}

/** @internal 
 * Creează un provider JSON-RPC pentru rețeaua Ethereum specificată în fișierul .env
 * @param rpcURL - URL-ul RPC pentru accesul rețelei Ethereum
*/
export function getProvider(rpcURL: string): ethers.JsonRpcProvider {
    const provider = new ethers.JsonRpcProvider(rpcURL);
    return provider;
}

/** @internal 
 * Preia numele fișierului care stochează detalii despre schemele EAS ale aplicației din fișierul .env
*/
export function getSchemaJSONFile(): string {
    return getAppConfig().schemaJSONFile;
}

/** @internal 
 * Preia numele schemei pentru achiziția de fotografii din fișierul .env
*/
export function getPhotoPurchaseSchemaName(): string {
    return getAppConfig().photoPurchaseSchema;
}

/** @internal 
 * Preia numele schemei pentru înregistrarea utilizatorilor din fișierul .env
*/
export function getUserRegSchemaName(): string {
    return getAppConfig().userRegSchema;
}

/** @internal 
 * Preia numele schemei pentru înregistrarea fotografiilor din fișierul .env
*/
export function getPhotoRegisterSchemaName(): string {
    return getAppConfig().photoRegSchema;
}

/** @internal 
 * Creează un signer Ethers.js folosind cheia privată a portofelului și providerul JSON-RPC date ca parametru
 * @param walletPrivateKey - Cheia privată a portofelului Ethereum
 * @param provider - Providerul JSON-RPC pentru rețeaua Ethereum
 * @returns Un obiect de tipul `ethers.Wallet` care poate semna tranzacții
*/
export function getSigner(walletPrivateKey: string, provider: ethers.JsonRpcProvider): ethers.Wallet {
    if (!walletPrivateKey || !ethers.isHexString(walletPrivateKey, 32) || !walletPrivateKey.startsWith("0x")) {
        throw new Error("Fara cheie privata!");
    }
    const signer = new ethers.Wallet(walletPrivateKey, provider);
    return signer;
}

/** @internal 
 * Creează o instanță EAS conectată la signer-ul dat ca parametru
 * @param signer - Un obiect de tipul `ethers.Wallet` care poate semna tranzacții
 * @return O instanță `EAS` care poate fi folosită pentru a interacționa cu Ethereum Attestation Service
*/
export function getEAS(signer: ethers.Wallet): EAS {
    const eas = new EAS(getEASContractAddress(), {});
    eas.connect(signer);
    return eas;
}

/** @internal 
 * Creează o instanță EAS completă, incluzând providerul și signer-ul folosite la creare ce poate fi folosită în cadrul aplicației
 * @returns Un obiect de tipul `EASInstance` care conține provider, signer și instanța EAS creată
*/
export function getEASInstance(): EASInstance {
    const provider = getProvider(getRpcURL());
    const signer = getSigner(getOwnerPrivateKey(), provider);
    const eas = getEAS(signer);
    return { provider, signer, eas };
}

/** @internal 
 * Convertește valorile de tip `bigint` în string-uri pentru a evita problemele de serializare JSON
 * @param value - Valoarea care poate fi de tip `bigint` sau orice alt tip
 * @return Valoarea convertită în string dacă este de tip `bigint`, altfel returnează valoarea originală
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertBigIntsToString(value: any): any {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

/** @internal
 * Creează un timp de expirare pentru semnăturile atestărilor delegate, adăugând un număr specificat de secunde la timpul curent
 * @param addedSec - Numărul de secunde de adăugat peste timpul curent până la expirare (default: 3600 secunde)
 * @return Un `bigint` reprezentând timestamp-ul corespunzător timpului de expirare al semnăturii generate
*/
export function makeDeadline(addedSec: number = 3600): bigint {
  const timeNow = Math.floor(Date.now() / 1000);
  return BigInt(timeNow + addedSec);
}