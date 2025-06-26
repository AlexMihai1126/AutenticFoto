"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import superjson from "superjson";
import {
  AttestationRequestData,
  EAS,
  NO_EXPIRATION,
  Signature,
} from "@ethereum-attestation-service/eas-sdk";
import { useWallet } from "@/contexts/WalletContext";
import {
  Spinner,
  Alert,
  Button,
  Container,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import { DelegatedResultPayload } from "@/lib/commonInterfaces";
import { toast } from "react-toastify";
import { useUser } from "@/contexts/UserContext";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";

const EAS_ADDRESS = process.env.NEXT_PUBLIC_EAS_ADDRESS!;

export default function AttestPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { account, signer, connect } = useWallet();
  const { user, isPhotographer, loading: userLoading } = useUser();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const isAttestTriggered = useRef(false);
  const isWalletChecked = useRef(false);

  const checkWalletConnected = useCallback(async () => {
      if (!account) {
        await connect();
      }
    }, [account, connect]);

  const attestPhoto = async () => {
    if (isAttestTriggered.current) return;
    isAttestTriggered.current = true;
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
      const resp = await axios.post(
        `/blockchain/photo-registration`,
        { uploadId: id, currentWallet: account },
        { withCredentials: true }
      );

      const deserializedResult = superjson.deserialize(
        resp.data
      ) as DelegatedResultPayload;

      const signature: Signature = {
        r: deserializedResult.backendSignatureR,
        s: deserializedResult.backendSignatureS,
        v: deserializedResult.backendSignatureV,
      };

      const myWalletAddress = await signer.getAddress();
      const eas = new EAS(EAS_ADDRESS).connect(signer);
      const deadlineBigInt = BigInt(deserializedResult.deadline);

      const attestationData: AttestationRequestData = {
        recipient: myWalletAddress,
        data: deserializedResult.encData,
        revocable: true,
        refUID: deserializedResult.refUid,
        expirationTime: NO_EXPIRATION,
      };

      const tx = await eas.attestByDelegation({
        schema: deserializedResult.schemaUid,
        data: attestationData,
        attester: deserializedResult.attesterWallet,
        signature,
        deadline: deadlineBigInt,
      });

      await tx.wait();
      setSuccess(true);

      setTimeout(() => {
        toast.success("Fotografia a fost atestată.");
        router.push("/myaccount/photos");
      }, 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      isAttestTriggered.current = false;
      setError(
        err?.response?.data?.error || getMetamaskErrorMsg(err) || "Eroare la atestare."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    await checkWalletConnected();
    if (account) {
      attestPhoto();
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
            Trebuie să vă autentificați pentru a atesta fotografii.
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
      <h2 className="mb-4">Atestare fotografie pe Blockchain</h2>

      <Form className="mb-3">
        <Form.Group controlId="photoId">
          <Form.Label>ID Fotografie</Form.Label>
          <Form.Control type="text" value={id} disabled />
        </Form.Group>
      </Form>

      {loading && (
        <div className="text-center mb-3">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Se procesează atestarea…</p>
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
          Atestare finalizată cu succes!
        </Alert>
      )}

      {!loading && !success && (
        <div className="d-flex gap-2">
          <ButtonGroup className="w-100">
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={loading}
            >
              Confirmă atestarea
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                router.push("/myaccount/photos");
              }}
              disabled={loading}
            >
              Anulează
            </Button>
          </ButtonGroup>
        </div>
      )}
    </Container>
  );
}
