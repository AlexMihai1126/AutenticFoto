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
import { useUser } from "@/contexts/UserContext";
import {
  Spinner,
  Alert,
  Button,
  Container,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import { DelegatedBuyResultPayload } from "@/lib/commonInterfaces";
import { ethers } from "ethers";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";
import { toast } from "react-toastify";

const EAS_ADDRESS = process.env.NEXT_PUBLIC_EAS_ADDRESS!;

export default function BuyPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { account, signer, connect } = useWallet();
  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [ipfsCopy, setIpfsCopy] = useState(false);
  const isPurchaseTriggered = useRef(false);
  const isWalletChecked = useRef(false);

  const checkWalletConnected = useCallback(async () => {
    if (!account) {
      await connect();
    }
  }, [account, connect]);

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
  }, [user, userLoading, router, checkWalletConnected]);

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
          Trebuie să vă autentificați pentru a achiziționa fotografii.
        </Alert>
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

  const purchasePhoto = async () => {
    if (isPurchaseTriggered.current) return;
    isPurchaseTriggered.current = true;
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
      const resp = await axios.post(`/blockchain/photo-buy`, {
        photoId: id,
        currentWallet: account,
        ipfsCopy,
      });

      const deserializedResult = superjson.deserialize(
        resp.data
      ) as DelegatedBuyResultPayload;

      console.log(deserializedResult);

      const signature: Signature = {
        r: deserializedResult.backendSignatureR,
        s: deserializedResult.backendSignatureS,
        v: deserializedResult.backendSignatureV,
      };

      const myWalletAddress = await signer.getAddress();
      const eas = new EAS(EAS_ADDRESS).connect(signer);
      const deadlineBigInt = BigInt(deserializedResult.deadline);
      const value = ethers.parseEther(deserializedResult.ethValue);

      const attestationData: AttestationRequestData = {
        recipient: myWalletAddress,
        data: deserializedResult.encData,
        revocable: true,
        refUID: deserializedResult.refUid,
        expirationTime: NO_EXPIRATION,
        value,
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
        toast.success("Fotografie achiziționată.");
        router.push("/photos");
      }, 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      isPurchaseTriggered.current = false;
      setError(
        err?.response?.data?.error ||
          getMetamaskErrorMsg(err) ||
          "Eroare la achiziție."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    await checkWalletConnected();
    if (account) {
      purchasePhoto();
    }
  };

  return (
    <Container className="py-4 w-50">
      <h2 className="mb-4">Achiziționare fotografie</h2>

      <Form className="mb-3">
        <Form.Group controlId="photoId">
          <Form.Label>ID Fotografie</Form.Label>
          <Form.Control type="text" value={id} disabled />
        </Form.Group>
        <br />
        <Form.Group controlId="ipfsCopy" className="mb-3">
          <Form.Check
            type="switch"
            label="Livrare prin IPFS?"
            checked={ipfsCopy}
            onChange={(e) => setIpfsCopy(e.currentTarget.checked)}
          />
        </Form.Group>
      </Form>

      {loading && (
        <div className="text-center mb-3">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Se procesează achiziția...</p>
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
          Achiziție finalizată cu succes!
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
              Confirmă achiziția
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast.info("Achiziție anulată.");
                router.push("/photos");
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
