"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useWallet } from "@/contexts/WalletContext";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";
import { UserProfileData } from "@/lib/commonInterfaces";
import { useUser } from "@/contexts/UserContext";

export default function VerifyWalletPage() {
  const { account, signer, connect } = useWallet();
  const { refreshUser } = useUser();
  const router = useRouter();
  const isWalletChecked = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setinfoMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const checkWalletConnected = useCallback(async () => {
    if (!account) {
      await connect();
    }
  }, [account, connect]);

  useEffect(() => {
    const init = async () => {
      if (isWalletChecked.current) return;
      isWalletChecked.current = true;

      try {
        const apiRequest = await axios.get<UserProfileData>(
          "/user/light-profile-data"
        );
        if (apiRequest.data.walletAddress) {
          setinfoMsg("Contul are deja o adresă wallet asociată.");
          setTimeout(() => {
            toast.info("Contul are deja o adresă wallet asociată.");
            router.replace("/myaccount");
          }, 1000);

          return;
        }

        await checkWalletConnected();
      } catch (err: any) {
        isWalletChecked.current = false;
        setError(
          err?.response?.data?.error || "Verificare wallet existent a eșuat."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, checkWalletConnected]);

  useEffect(() => {
    if (signer && account) {
      setIsReady(true);
    }
  }, [signer, account]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    setIsReady(false);
    try {
      await checkWalletConnected();
    } catch (err: any) {
      setError(getMetamaskErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyWallet = async () => {
    try {
      await checkWalletConnected();
    } catch (err: any) {
      setError(err.message);
    }
    if (!signer) return;

    const address = await signer.getAddress();
    const message = `Link this wallet to your account: ${new Date().toISOString()}`;
    const signature = await signer.signMessage(message);

    await axios.post("/user/verify-wallet", {
      wAddress: address,
      message,
      signature,
    });

    setSuccess(true);
    await refreshUser();
    setTimeout(() => {
      toast.success("Wallet verificat cu succes!");
      router.push("/myaccount");
    }, 500);
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      await verifyWallet();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          getMetamaskErrorMsg(err) ||
          "Eroare la verificare."
      );
    } finally {
      setLoading(false);
    }
  };

  if (infoMsg) {
    return (
      <Container className="py-4 w-50">
        <Alert variant="info" className="mb-3">
          {infoMsg}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4 w-50">
      <h2 className="mb-4">Asociere wallet</h2>

      {!loading && !isReady && !success && (
        <>
          <Alert variant={error ? "danger" : "warning"} className="mb-3">
            {error ||
              "Conectarea la MetaMask a fost anulată sau a eșuat. Te rugăm să încerci din nou."}
          </Alert>
          <Button variant="secondary" className="w-100" onClick={handleRetry}>
            Reîncearcă conectarea
          </Button>
        </>
      )}

      {loading && (
        <div className="text-center mb-3">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Se conectează wallet-ul…</p>
        </div>
      )}

      {!loading && isReady && (
        <>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form className="mb-3">
            <Form.Group controlId="accountAddress">
              <Form.Label>Contul care va fi asociat</Form.Label>
              <Form.Control type="text" value={account ?? ""} disabled />
            </Form.Group>
          </Form>

          {success && (
            <Alert variant="success" className="mb-3">
              Wallet verificat cu succes!
            </Alert>
          )}

          {!success && (
            <div className="d-flex gap-2">
              <ButtonGroup className="w-100">
                <Button
                  variant="primary"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  Verifică Wallet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/myaccount")}
                  disabled={loading}
                >
                  Anulează
                </Button>
              </ButtonGroup>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
