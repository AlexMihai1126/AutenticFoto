import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useUser } from "@/contexts/UserContext";

export function useWalletMismatch() {
  const { account } = useWallet();
  const { user } = useUser();

  const [walletMismatchError, setWalletMismatchError] = useState<string | null>(null);

 const checkMismatch = useCallback(() => {
  if (!user || !account || !user.walletAddress) {
    setWalletMismatchError(null);
    return;
  }

  const matches = account.toLowerCase() === user.walletAddress.toLowerCase();
  setWalletMismatchError(matches ? null : "EROARE: Portofelul Metamask conectat NU coincide cu cel asociat contului!");
}, [account, user]);


  useEffect(() => {
    checkMismatch();
  }, [checkMismatch]);

  return {
    walletMismatchError,
    isMismatch: !!walletMismatchError,
    checkMismatch,
  };
}
