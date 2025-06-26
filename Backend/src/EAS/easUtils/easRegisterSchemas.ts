import { ethers } from "ethers";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import * as fs from "node:fs";
import { SchemaInput, SchemaRegistrationResult } from "./easInterfaces";
import * as helpers from "./easHelpers";

/**
 * Funcție helper pentru înregistrarea mai multor scheme EAS.
 *
 * Funcția parcurge un vector de obiecte de tip `SchemaInput`, pentru fiecare obiect:
 * - Înregistrează schema pe blockchain
 * - Păstrează UID-ul atestării înregistrate
 * UID-urile, împreună cu schema folosită (`schemaStr`) și adresa contractului resolver, sunt salvate într-un fișier JSON
 *
 * @async
 * @function registerSchemas
 * @param {SchemaInput[]} schemas - Vectorul de obiecte schema. Fiecare obiect conține:
 *   - `name` {string} – Nume, folosit doar pentru identificare (nu apare în EAS).
 *   - `schema` {string} – Schema de înregistrat, de exemplu: "bool boolValue, uint256 value".
 *   - `revocable` {boolean} – Indică dacă atestările emise folosind această schemă sunt revocabile.
 *   - `resolverAddress` {string} [opțional] – Adresa contractului resolver; dacă nu este validă, se folosește `ethers.ZeroAddress`.
 * @param {string} [outputFile="schemaUIDs.json"] - Numele fișierului în care vor fi salvate datele.
 * @returns {Promise<void>} Un obiect de tip Promise.
 *
 * @example
 * (async () => {
 *   const schemas: SchemaInput[] = [
 *     { name: "Your_schema_1", schema: "bool boolValue, uint256 uintValue", revocable: true, resolverAddress: "0xRESOLVER_CONTRACT_ADDR" },
 *     { name: "Your_schema_2", schema: "bytes32 bytes32Value, uint256 uintValue", revocable: false }
 *   ];
 *   const result = await registerSchemas(schemas, "uid_output.json");
 * })();
 */
export async function registerSchemas(
  schemas: SchemaInput[],
  outputFile: string = "schemaUIDs.json"
): Promise<void> {
  try {
    const signer = helpers.getSigner(helpers.getOwnerPrivateKey(), helpers.getProvider(helpers.getRpcURL()));
    const schemaRegistry = new SchemaRegistry(helpers.getSchemaRegistryContractAddress());
    schemaRegistry.connect(signer);
    console.log("Contul care va inregistra schemele: ", signer.address);
    const results: Record<string, SchemaRegistrationResult> = {};

    for (const schemaObj of schemas) {
      try {
        console.log(`Inregistrare schema "${schemaObj.name}"...`);
        const resolverAddr =
          schemaObj.resolverAddress && ethers.isAddress(schemaObj.resolverAddress)
            ? schemaObj.resolverAddress
            : ethers.ZeroAddress;
        const transaction = await schemaRegistry.register({
          schema: schemaObj.schema,
          revocable: schemaObj.revocable,
          resolverAddress: resolverAddr,
        });
        const receipt = await transaction.wait();
        console.log(`Schema "${schemaObj.name}" s-a inregistrat. UID: ${receipt}`);
        results[schemaObj.name] = {
          schemaUID: receipt,
          schemaStr: schemaObj.schema,
          resolver: resolverAddr,
        };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(`Eroare la inregistrarea schemei "${schemaObj.name}":`, error);
        results[schemaObj.name] = {
          error: error.message,
          schemaStr: schemaObj.schema,
          resolver:
            schemaObj.resolverAddress && ethers.isAddress(schemaObj.resolverAddress)
              ? schemaObj.resolverAddress
              : ethers.ZeroAddress,
        };
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`UID salvate în ${outputFile}`);
  } catch (error) {
    console.error("Eroare in functia de inregistrare scheme:", error);
  }
}
