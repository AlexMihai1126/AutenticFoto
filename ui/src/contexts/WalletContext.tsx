/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";

interface WalletContextValue {
  account: string | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(
  undefined
);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  async function connect() {
    if (!(window as any).ethereum) {
      alert("Metamask trebuie instalat în browser.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setSigner(signer);
    } catch (err: any) {
      alert("Conexiune la Metamask eșuată: " + (getMetamaskErrorMsg(err)));
    }
  }

  useEffect(() => {
    (async () => {
      if (!(window as any).ethereum) {
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(
          (window as any).ethereum
        );
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const account = await signer.getAddress()
          setAccount(account);
          setSigner(signer);
        }
      } catch {
      }
    })();
  }, []);

  useEffect(() => {
    if (!(window as any).ethereum) return;
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else {
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(
          (window as any).ethereum
        );
        provider.getSigner().then((s) => setSigner(s));
      }
    };
    (window as any).ethereum.on("accountsChanged", handler);
    return () => {
      (window as any).ethereum.removeListener("accountsChanged", handler);
    };
  }, []);

  return (
    <WalletContext.Provider value={{ account, signer, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet trebuie să fie folosit într-un context WalletProvider");
  }
  return ctx;
}
