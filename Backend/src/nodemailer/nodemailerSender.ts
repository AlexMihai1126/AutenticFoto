import logger from "../helpers/logger/loggerConfig";
import transporter from "./nodemailerConfig";
import dotenv from "dotenv";

dotenv.config();

const modulePrefix = "[EmailSender]";

/**
 * Trimite link de confirmare al contului.
 *
 * @param userEmail  Adresa de email la care se trimite
 * @param confirmationToken  Token de confirmare
 */
export async function sendConfirmationEmail(
  userEmail: string,
  confirmationToken: string
): Promise<void> {
  const {
    EMAIL,
    APP_HOST = "localhost",
    APP_PORT = "3000",
  } = process.env as {
    EMAIL: string;
    APP_PORT: string;
    APP_HOST?: string;
  };

  const confirmationLink = `https://${APP_HOST}:${APP_PORT}/confirm/${confirmationToken}`;

  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject: "Bine ai venit! Confirmă-ți contul",
      text: `Salut! Mulțumim că te-ai înregistrat. Pentru a activa contul tău, te rugăm să accesezi link-ul de mai jos:\n\n${confirmationLink}`,
      html: `
        <p>Salut!</p>
        <p>Mulțumim că te-ai înregistrat pe platformă. Pentru a finaliza înregistrarea și a începe să o folosești, te rugăm să apeși pe butonul de mai jos:</p>
        <p><a href="${confirmationLink}" style="display:inline-block;padding:10px 20px;background-color:#28a745;color:#fff;text-decoration:none;border-radius:4px;">
          Confirmă contul
        </a></p>
        <p>Dacă nu ai cerut această confirmare, poți ignora acest mesaj.</p>
      `,
    });

    logger.info(`${modulePrefix} Mail de confirmare trimis către ${userEmail}`);
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail de confirmare către ${userEmail}:`,
      error
    );
    throw new Error(`Eroare trimitere mail de confirmare.`);
  }
}

/**
 * Trimitere mail de bun venit utilizatorului odată ce se finalizează procesul de înregistrare.
 *
 * @param userEmail Adresa de email la care se trimite
 * @param username Numele de utilizator
 * @param type Tipul de cont din baza de date "buyer" sau "seller"
 * @param walletAddress Adresa wallet folosită
 * @param attestationUid UID-ul atestării EAS on-chain
 */
export async function sendWelcomeEmail(
  userEmail: string,
  username: string,
  type: "buyer" | "seller",
  walletAddress: string,
  attestationUid: string
): Promise<void> {
  const {
    EMAIL,
    APP_HOST = "localhost",
    APP_PORT = "3000",
  } = process.env as Record<string, string>;
  const myAccountLink = `https://${APP_HOST}:${APP_PORT}/myaccount`;

  const roleLabel = type === "seller" ? "Fotograf" : "Cumpărător";
  const subject = `Bine ai venit pe platformă, ${roleLabel} ${username}!`;

  const intro =
    type === "seller"
      ? `<p>Contul tău de <em>fotograf</em> este acum verificat.</p>
       <p>Poți începe să îți înregistrezi fotografiile.</p>`
      : `<p>Contul tău de <em>cumpărător</em> este gata de utilizare!</p>
       <p>Poți vizualiza fotografiile disponibile și achiziționa.</p>`;

  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject,
      text: `Felicitări, <strong>${username}</strong>! Contul tău este acum verificat.`,
      html: `
          <h1>Salut, ${username}!</h1>
          ${intro}
          <p><strong>Wallet-ul tău:</strong> <code>${walletAddress}</code></p>
          <p><strong>UID atestare EAS:</strong> <code>${attestationUid}</code></p>
          <p>Accesează-ți profilul aici:<br>
            <a href="${myAccountLink}">${myAccountLink}</a>
          </p>
        `,
    });
    logger.info(
      `${modulePrefix} Email de bun venit trimis către ${userEmail} (rol=${type})`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail de bun venit către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail de bun venit.");
  }
}

/**
 * Trimitere mail de confirmare înregistrare fotografie.
 *
 * @param userEmail Adresa de email la care se trimite
 * @param photoTitle Titlul fotografiei
 * @param attestationUid UID-ul atestării EAS on-chain
 */
export async function sendPhotoRegistrationEmail(
  userEmail: string,
  photoTitle: string,
  attestationUID: string
): Promise<void> {
  const {
    EMAIL,
    APP_HOST = "localhost",
    APP_PORT = "3000",
  } = process.env as {
    EMAIL: string;
    APP_PORT: string;
    APP_HOST?: string;
  };
  const viewPhotoLink = `https://${APP_HOST}:${APP_PORT}/photos/${attestationUID}`;
  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject: `Fotografia „${photoTitle}” a fost înregistrată`,
      text: `Fotografia "${photoTitle}" a fost înregistrată pe blockchain. UID: ${attestationUID}`,
      html: `
        <p>Fotografia <strong>${photoTitle}</strong> a fost înregistrată cu succes pe blockchain!</p>
        <p>UID de înregistrare: <code>${attestationUID}</code></p>
        <p>Puteți vedea fotografia aici:<br>
           <a href="${viewPhotoLink}">${viewPhotoLink}</a>
        </p>
      `,
    });
    logger.info(
      `${modulePrefix} Email înregistrare fotografie trimis către ${userEmail}`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail înregistrare fotografie către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail de înregistrare fotografie.");
  }
}

/**
 * Trimitere mail de confirmare cumpărare fotografie.
 *
 * @param userEmail Adresa de email la care se trimite
 * @param photoTitle Titlul fotografiei
 * @param attestationUid UID-ul atestării EAS on-chain
 * @param transactionId ID-ul tranzacției
 */
export async function sendPurchaseConfirmationEmail(
  userEmail: string,
  photoTitle: string,
  attestationUID: string,
  transactionId: string
): Promise<void> {
  const {
    EMAIL,
    APP_HOST = "localhost",
    APP_PORT = "3000",
  } = process.env as {
    EMAIL: string;
    APP_PORT: string;
    APP_HOST?: string;
  };
  const transactionLink = `https://${APP_HOST}:${APP_PORT}/myaccount/transactions/${transactionId}`;
  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject: `Achiziție confirmată pentru „${photoTitle}”`,
      text: `Achiziția pentru fotografia "${photoTitle}" a fost confirmată. Vezi detalii la ${transactionLink}`,
      html: `
        <p>Achiziția pentru fotografia <strong>${photoTitle}</strong> a fost confirmată pe blockchain!</p>
        <p>UID cumpărare: <code>${attestationUID}</code></p>
        <p>Puteți vedea tranzacția aici:<br>
           <a href="${transactionLink}">${transactionLink}</a>
        </p>
      `,
    });
    logger.info(
      `${modulePrefix} Email cumpărare fotografie trimis către ${userEmail}`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail cumpărare fotografie către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail de cumpărare fotografie.");
  }
}

/**
 * Trimitere mail de confirmare înregistrare fotografie.
 *
 * @param userEmail Adresa de email la care se trimite
 * @param photoTitle Titlul fotografiei
 * @param downloadLink Link-ul de descărcare
 */
export async function sendDownloadLinkEmail(
  userEmail: string,
  photoTitle: string,
  downloadLink: string,
  maxAllowedDownloads: number,
  expiresAt: Date
): Promise<void> {
  const { EMAIL } = process.env as {
    EMAIL: string;
  };

  const countText =
    maxAllowedDownloads === 1
      ? "o singură descărcare"
      : `${maxAllowedDownloads} descărcări`;
  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject: `Link de descărcare pentru „${photoTitle}”`,
      text: `Folosește link-ul ${downloadLink} pentru a-ți descărca fotografia. Expiră la ${expiresAt.toLocaleString()} și este valabil pentru ${countText}.`,
      html: `
        <p>Salut!</p>
        <p>Iată link-ul tău unic pentru descărcarea fotografiei <strong>${photoTitle}</strong>:</p>
        <p><a href="${downloadLink}">${downloadLink}</a></p>
        <p>Acest link va expira la <strong>${expiresAt.toLocaleString()}</strong> și va fi valabil pentru ${countText}.</p>
      `,
    });
    logger.info(
      `${modulePrefix} Email descărcare fotografie trimis către ${userEmail}`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail descărcare fotografie către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail descărcare fotografie");
  }
}

/**
 * Trimitere mail link IPFS cumpărare fotografie.
 *
 * @param userEmail Adresa de email la care se trimite
 * @param photoTitle Titlul fotografiei
 * @param ipfsLink Link-ul IPFS pentru descărcare
 */
export async function sendIPFSLinkEmail(
  userEmail: string,
  photoTitle: string,
  ipfsLink: string
): Promise<void> {
  const { EMAIL } = process.env as {
    EMAIL: string;
  };
  try {
    await transporter.sendMail({
      from: EMAIL,
      to: userEmail,
      subject: `Link de IPFS pentru „${photoTitle}”`,
      text: `Folosește link-ul ${ipfsLink} pentru a-ți descărca fotografia.`,
      html: `
        <p>Salut!</p>
        <p>Iată link-ul tău unic pentru descărcarea fotografiei <strong>${photoTitle}</strong>:</p>
        <p><a href="${ipfsLink}">${ipfsLink}</a></p>
        <p>Acest link nu va expira și poate fi folosit de un număr nelimitat de ori.</p>
      `,
    });
    logger.info(
      `${modulePrefix} Email descărcare IPFS fotografie trimis către ${userEmail}`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail descărcare IPFS fotografie către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail descărcare IPFS fotografie");
  }
}

export async function sendRegeneratedDownloadLink(
  userEmail: string,
  transactionId: string,
  downloadLink: string,
  expirationTime?: Date,
  maxUses?: number
): Promise<void> {
  const expiryText = expirationTime ? `va expira la ${expirationTime.toLocaleString()}` : "nu va expira";

  let usesText: string;
  if (maxUses) {
    usesText =
      maxUses === 1
        ? "va fi valabil pentru o singură descărcare"
        : `va fi valabil pentru ${maxUses} descărcări`;
  } else {
    usesText = "poate fi folosit de un număr nelimitat de ori";
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL as string,
      to: userEmail,
      subject: `Link nou descărcare fotografie din tranzacția „${transactionId}”`,
      text: `Salut! Iată noul link unic pentru descărcarea fotografiei din tranzacția ${transactionId}: ${downloadLink}. Acest link ${expiryText} și ${usesText}.`,
      html: `
        <p>Salut!</p>
        <p>Iată noul link unic pentru descărcarea fotografiei din tranzacția <strong>${transactionId}</strong>:</p>
        <p><a href="${downloadLink}">${downloadLink}</a></p>
        <p>Acest link <strong>${expiryText}</strong> și <strong>${usesText}</strong>.</p>
      `,
    });

    logger.info(
      `${modulePrefix} Email link nou pentru tranzacția ${transactionId} trimis către ${userEmail}`
    );
  } catch (error) {
    logger.error(
      `${modulePrefix} Eroare trimitere mail link nou pentru tranzacția ${transactionId} către ${userEmail}:`,
      error
    );
    throw new Error("Eroare trimitere mail link nou pentru fotografie.");
  }
}
