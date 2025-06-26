/**
 * Funcție pentru a elimina prefixul de 0x aplicat în transmiterea de informații pe Blockchain
 * @param hexString String-ul ce trebuie modificat
 * @returns String-ul modificat
 */

export default function removeBlockchainPrefix(hexString: string): string {
  return hexString.replace(/^0x/, "");
}