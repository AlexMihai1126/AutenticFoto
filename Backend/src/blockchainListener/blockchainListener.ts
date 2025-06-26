/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import logger from "../helpers/logger/loggerConfig";
const modulePrefix = "[BlockchainListener]";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import axios from "axios";
import removeBlockchainPrefix from "../helpers/removeBlockchainPrefix";
dotenv.config();

let provider: ethers.WebSocketProvider;
let photoAttestContract: ethers.Contract;
let photoPurchaseContract: ethers.Contract;
let reconnecting: boolean = false;
const retryDelay = 5000;

function loadAbi(name: "photoAttestResolver" | "photoBuyResolver") {
  const abiPath = path.resolve(__dirname, "./abi", `${name}.json`);
  const raw = fs.readFileSync(abiPath, "utf8");
  return JSON.parse(raw);
}

const photoAttestResolverAddr = process.env.PHOTO_ATTEST_RESOLVER_ADDR!;
const photoBuyResolverAddr = process.env.PHOTO_PURCHASE_RESOLVER_ADDR!;
const photoAttestResolverAbi = loadAbi("photoAttestResolver");
const photoBuyResolverAbi = loadAbi("photoBuyResolver");

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function listenForEvents() {
  try {
    logger.info(`${modulePrefix} Se conectează la WebSocket...`);

    provider = new ethers.WebSocketProvider(process.env.RPC_WEBSOCKET_URL!);

    photoAttestContract = new ethers.Contract(
      photoAttestResolverAddr,
      photoAttestResolverAbi,
      provider
    );

    photoPurchaseContract = new ethers.Contract(
      photoBuyResolverAddr,
      photoBuyResolverAbi,
      provider
    );

    logger.info(`${modulePrefix} În așteptare evenimente...`);
    console.log(`${modulePrefix} În așteptare evenimente...`);

    photoAttestContract.on(
      "PhotoRegistered",
      async (photographer, attestationUid, contentHash) => {
        contentHash = removeBlockchainPrefix(contentHash).toLowerCase();
        logger.info(
          `${modulePrefix} Fotografie înregistrată: Fotograf: ${photographer} UID atestare: ${attestationUid} Hash conținut: ${contentHash}`
        );
        try {
          await axios.post(
            "https://localhost/api/blockchain-secure/validate-photo-registration",
            {
              photographerWallet: photographer,
              photoAttUid: attestationUid,
              sha256: contentHash,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.INTERNAL_TOKEN_AUTH}`,
              },
            }
          );
        } catch (error: any) {
          logger.error(
            `${modulePrefix} Eroare trimitere informații către backend din PhotoRegistered: `,
            error
          );
        }
      }
    );

    photoAttestContract.on(
      "PhotoRemovedFromSale",
      async (photographer, attestationUid) => {
        logger.info(
          `${modulePrefix} Fotografie retrasă de la vânzare: Fotograf: ${photographer}, UID atestare: ${attestationUid}`
        );
        try {
          await axios.post(
            "https://localhost/api/blockchain-secure/photo-revoke-confirm",
            {
              photographerWallet: photographer,
              photoAttUid: attestationUid,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.INTERNAL_TOKEN_AUTH}`,
              },
            }
          );
        } catch (error: any) {
          logger.error(
            `${modulePrefix} Eroare trimitere informații către backend din PhotoRevoke: `,
            error
          );
        }
      }
    );

    photoPurchaseContract.on(
      "PhotoPurchased",
      async (
        buyer,
        photoRefUID,
        purchaseAttUID,
        resourceIdHash,
        contentHash,
        isIpfs,
        event
      ) => {
        logger.info(
          `${modulePrefix} Fotografie cumpărată: Cumpărător: ${buyer} UID atestare: ${purchaseAttUID} Hash ID: ${resourceIdHash} Hash conținut: ${contentHash}`
        );

        contentHash = removeBlockchainPrefix(contentHash).toLowerCase();

        const rec = await event.getTransactionReceipt();
        const gasPaid = ethers.formatEther(rec.gasUsed * rec.gasPrice);
        const txHash = rec.hash;
        const blockNo = rec.blockNumber;
        const blockHash = rec.blockHash;

        try {
          await axios.post(
            "https://localhost/api/blockchain-secure/validate-purchase",
            {
              purchaseAttUID,
              wAddress: buyer,
              sha256: contentHash,
              resourceIdHash,
              isIpfs,
              gasPaid,
              txHash,
              blockHash,
              blockNo,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.INTERNAL_TOKEN_AUTH}`,
              },
            }
          );
        } catch (error: any) {
          logger.error(
            `${modulePrefix} Eroare trimitere informații către backend din PhotoPurchased: `,
            error
          );
        }
      }
    );

    (provider.websocket as WebSocket).onclose = async (event: CloseEvent) => {
      logger.warn(
        `${modulePrefix} WebSocket închis. Cod eroare: ${event.code}, Motiv: ${event.reason}`
      );
      await restartListener();
    };

    (provider.websocket as WebSocket).onerror = async (err: any) => {
      logger.error(`${modulePrefix} Eroare WebSocket:`, err);
      await restartListener();
    };
  } catch (err: any) {
    logger.error(`${modulePrefix} Eroare conexiune la WebSocket:`, err.message);
    process.exit(1);
  }
}

async function restartListener() {
  if (reconnecting) {
    return;
  }
  reconnecting = true;
  await cleanupListeners();
  logger.info(
    `${modulePrefix} Reconectare la WebSocket - reîncercare în ${retryDelay} ms...`
  );
  await delay(retryDelay);
  reconnecting = false;
  await listenForEvents();
}

async function cleanupListeners() {
  if (photoAttestContract) {
    logger.info(`${modulePrefix} Se oprește ascultarea pentru evenimente...`);
    photoAttestContract.removeAllListeners();
  }

  if (provider) {
    try {
      logger.info(`${modulePrefix} Se închide provider-ul RPC...`);
      await provider.destroy();
    } catch (err: any) {
      logger.error(
        `${modulePrefix} Eroare la închidere provider RPC...`,
        err.message || err
      );
    }
  }
  photoAttestContract = undefined as any;
  provider = undefined as any;
}

process.on("SIGINT", async () => {
  logger.info(`${modulePrefix} Închidere la semnalul SIGINT.`);
  await cleanupListeners();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info(`${modulePrefix} Închidere la semnalul SIGTERM.`);
  await cleanupListeners();
  process.exit(0);
});

listenForEvents();
