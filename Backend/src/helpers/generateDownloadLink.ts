import {
  DownloadLinkModel,
  IDownloadLink,
  IPFS_LINK,
  LinkType,
  SIGNED_URL_LINK,
} from "../models/downloadLinksModel";
import GeneratedFileModel from "../models/generatedFilesModel";
import TransactionModel from "../models/transactionModel";
import { Types } from "mongoose";
import dotenv from "dotenv";
import logger from "./logger/loggerConfig";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
const modulePrefix = "[DownloadLinkGenerator]";

interface GenerateDownloadLinkOptions {
  validForHours?: number;
  maxDownloads?: number;
}

interface DownloadLink {
  downloadLink: string;
  expirationTime?: Date;
  maxAllowedDownloads?: number;
}

/**
 * Generează un link nou pentru descărcarea fotografiei achiziționate din tranzacție.
 *
 * @param transactionId ID-ul tranzacției pentru care se generează link-ul
 * @param options.validForHours Durata de valabilitate a link-ului în ore, implicit 24h
 * @param options.maxDownloads Numărul maxim de descărcări permise (opțional)
 * @returns { DownloadLink } Un obiect ce conține link-ul și timpul de expirare (dacă există)
 * @throws { Error }
 */
export default async function generateNewDownloadLink(
  transactionId: Types.ObjectId,
  { validForHours = 24, maxDownloads = 1 }: GenerateDownloadLinkOptions = {}
): Promise<DownloadLink> {
  try {
    const tx = await TransactionModel.findById(transactionId);
    if (!tx) {
      throw new Error("Tranzacția nu există.");
    }

    const generatedPhoto = await GeneratedFileModel.findById(
      tx.generatedFileId
    );

    if (!generatedPhoto) {
      throw new Error("Fișierul generat nu există.");
    }

    const existingLink = await DownloadLinkModel.findOne({
      generatedFileId: tx.generatedFileId,
    });

    if (
      existingLink &&
      existingLink.maxDownloads !== undefined &&
      existingLink.downloadCount >= existingLink.maxDownloads
    ) {
      await existingLink.deleteOne();
    }

    let linkUrl: string;
    let linkType: LinkType;
    let downloadToken: string;
    let expirationTime: Date | undefined;

    const isIpfs = generatedPhoto.storageProvider === "ipfs";

    if (isIpfs) {
      linkType = IPFS_LINK;
      downloadToken = generatedPhoto.fullPath;
      linkUrl = `https://gateway.pinata.cloud/ipfs/${downloadToken}`;
    } else {
      linkType = SIGNED_URL_LINK;
      downloadToken = uuidv4();
      expirationTime = new Date(Date.now() + validForHours * 60 * 60 * 1000);
      const APP_HOST = process.env.APP_HOST || "localhost";
      const APP_PORT = process.env.APP_PORT || "3000";
      linkUrl = `https://${APP_HOST}:${APP_PORT}/download/${downloadToken}`;
    }

    const newLink: Partial<IDownloadLink> = {
      generatedFileId: tx.generatedFileId,
      userId: tx.userId,
      linkType,
      linkUrl,
      downloadToken,
      downloadCount: 0,
      ...(linkType === SIGNED_URL_LINK && {
        expiresAt: expirationTime,
        maxDownloads,
      }),
    };

    await DownloadLinkModel.create(newLink);

    return {
      downloadLink: linkUrl,
      ...(linkType === SIGNED_URL_LINK && {
        expirationTime,
        maxAllowedDownloads: maxDownloads,
      }),
    };
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare generare link pentru tranzacția ${transactionId}`,
      error
    );
    throw new Error("Eroare generare link descărcare.");
  }
}

export async function getExistingLink(
  transactionId: Types.ObjectId
): Promise<DownloadLink | undefined> {
  try {
    const tx = await TransactionModel.findById(transactionId);
    if (!tx) {
      return;
    }

    const existingLink = await DownloadLinkModel.findOne({
      generatedFileId: tx.generatedFileId,
    });
    if (!existingLink) {
      return;
    }

    if (
      existingLink.maxDownloads === undefined ||
      existingLink.downloadCount < existingLink.maxDownloads
    ) {
      return {
        downloadLink: existingLink.linkUrl,
        ...(existingLink.expiresAt && {
          expirationTime: existingLink.expiresAt,
        }),
        ...(existingLink.maxDownloads && {
          maxAllowedDownloads: existingLink.maxDownloads,
        }),
      };
    }
    return;
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare preluare link pentru tranzacția ${transactionId}`,
      error
    );
    throw new Error("Eroare generare link descărcare.");
  }
}
