export default function getMetamaskErrorMsg(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;

  const code =
    anyErr?.code ??
    anyErr?.error?.code ??
    anyErr?.info?.error?.code ??
    anyErr?.data?.code;

  const message =
    anyErr?.message ??
    anyErr?.error?.message ??
    anyErr?.info?.error?.message ??
    anyErr?.data?.message ??
    "Eroare necunoscută";

  const reason =
    anyErr?.reason ?? anyErr?.error?.reason ?? anyErr?.info?.error?.reason;

  const fullText = JSON.stringify(err).toLowerCase();

  if (code === 4001 || message.toLowerCase().includes("user denied")) {
    return "Tranzacția a fost anulată de utilizator.";
  }

  if (
    code === "INSUFFICIENT_FUNDS" ||
    message.toLowerCase().includes("insufficient funds") ||
    fullText.includes("insufficient funds")
  ) {
    return "Nu ai suficiente fonduri în portofel pentru a acoperi costul tranzacției.";
  }

  if (
    message.toLowerCase().includes("execution reverted") ||
    code === "CALL_EXCEPTION" ||
    reason
  ) {
    const cleanReason =
      reason?.replace(/^"|"$/g, "") ||
      message.match(/execution reverted(?:\: )?(.*)/i)?.[1]?.trim();

    return cleanReason
      ? `Tranzacția a fost respinsă : ${cleanReason}.`
      : "Tranzacția a fost respinsă.";
  }

  if (message.includes("Withdrawal failed")) {
    return "Retragerea a eșuat. Fondurile nu sunt disponibile.";
  }

  return message;
}
