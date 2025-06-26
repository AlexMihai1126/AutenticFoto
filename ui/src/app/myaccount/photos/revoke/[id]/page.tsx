"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import superjson from "superjson";
import { EAS, Signature } from "@ethereum-attestation-service/eas-sdk";
import { useWallet } from "@/contexts/WalletContext";
import { useUser } from "@/contexts/UserContext";
import {
  Spinner,
  Alert,
  Button,
  Container,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import { DelegatedRevocationPayload } from "@/lib/commonInterfaces";
import { toast } from "react-toastify";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";

const EAS_ADDRESS = process.env.NEXT_PUBLIC_EAS_ADDRESS!;

export default function RevokePage() {
  const router = useRouter();
  const { user, isPhotographer, loading: userLoading } = useUser();
  const { id } = useParams() as { id: string };
  const { account, signer, connect } = useWallet();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const isRevokeTriggered = useRef(false);
  const isWalletChecked = useRef(false);

  const checkWalletConnected = useCallback(async () => {
      if (!account) {
        await connect();
      }
    }, [account, connect]);

  const revokePhoto = async () => {
    if (isRevokeTriggered.current) return;
    isRevokeTriggered.current = true;

    setError(null);

    if (!id) {
      setError("ID fotografie lipsă în URL.");
      return;
    }

    if (!signer) {
      setError("Metamask nu este conectat.");
      return;
    }

    setLoading(true);

    try {
      const resp = await axios.post(`/blockchain/photo-revoke`, {
        revocationUid: id,
        currentWallet: account,
      });

      const deserializedResult = superjson.deserialize(
        resp.data
      ) as DelegatedRevocationPayload;

      const signature: Signature = {
        r: deserializedResult.backendSignatureR,
        s: deserializedResult.backendSignatureS,
        v: deserializedResult.backendSignatureV,
      };

      const deadlineBigInt = BigInt(deserializedResult.deadline);
      const eas = new EAS(EAS_ADDRESS).connect(signer);
      const tx = await eas.revokeByDelegation({
        schema: deserializedResult.schemaUid,
        data: { uid: id },
        revoker: deserializedResult.attesterWallet,
        signature,
        deadline: deadlineBigInt,
      });

      await tx.wait();
      setSuccess(true);

      setTimeout(() => {
        toast.success("Fotografia a fost revocată.");
        router.push("/myaccount/photos");
      }, 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      isRevokeTriggered.current = false;
      setError(
        err?.response?.data?.error ||
          getMetamaskErrorMsg(err) ||
          "Eroare la revocare."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    await checkWalletConnected();
    if (account) {
      revokePhoto();
    }
  };

  useEffect(() => {
    const init = async () => {
      if (userLoading) return;

      if (isWalletChecked.current) return;
      isWalletChecked.current = true;


      if (!user) {
        setTimeout(() => {
          toast.info("Trebuie să vă autentificați pentru a continua.");
          router.replace("/login");
        }, 1000);
        return;
      }

      if (!isPhotographer) {
        setTimeout(() => {
          toast.error("Nu aveți acces.");
          router.replace("/myaccount");
        }, 1000);
        return;
      }

      if (!user.walletAddress) {
        setTimeout(() => {
          toast.warning("Contul nu are o adresă wallet asociată.");
          router.replace("/myaccount/confirm-wallet");
        }, 1000);
        return;
      }

      try {
        await checkWalletConnected();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [user, userLoading, isPhotographer, router, checkWalletConnected]);

  if (userLoading) {
    return (
      <Container className="py-4 w-50 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-4 w-50">
        <Alert variant="danger">
          Trebuie să vă autentificați pentru a revoca fotografii.
        </Alert>
      </Container>
    );
  }

  if (!isPhotographer) {
    return (
      <Container className="py-4 w-50">
        <Alert variant="warning">Nu aveți acces.</Alert>
      </Container>
    );
  }

  if (!user.walletAddress) {
    return (
      <Container className="py-4 w-50">
        <Alert variant="warning">Contul nu are o adresă wallet asociată.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4 w-50">
      <h2 className="mb-4">Revocare fotografie</h2>
      <Alert variant="danger">
        <strong>Atenție:</strong> Odată ce fotografia este eliminată de la
        vânzare, nu va mai fi disponibilă pentru achiziție. Licențele deja emise
        rămân valabile. Fotografia nu poate fi reîncărcată și atestată din nou.
      </Alert>

      <Form className="mb-4">
        <Form.Group controlId="photoId">
          <Form.Label>ID Fotografie</Form.Label>
          <Form.Control type="text" value={id} disabled />
        </Form.Group>
      </Form>

      {loading && (
        <div className="text-center mb-3">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Se procesează revocarea…</p>
        </div>
      )}

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="mb-3"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-3">
          Revocare finalizată cu succes!
        </Alert>
      )}

      {!loading && !success && (
        <div className="d-flex gap-2">
          <ButtonGroup className="w-100">
            <Button variant="danger" onClick={handleConfirm} disabled={loading}>
              Confirmă revocarea
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/myaccount/photos")}
              disabled={loading}
            >
              Înapoi
            </Button>
          </ButtonGroup>
        </div>
      )}
    </Container>
  );
}
