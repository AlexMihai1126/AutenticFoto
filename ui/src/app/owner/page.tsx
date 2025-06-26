"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  ButtonGroup,
} from "react-bootstrap";
import { ethers } from "ethers";
import resolverAbi from "@/smartContracts/abi/photoBuyResolver.json";
import getMetamaskErrorMsg from "@/lib/metamaskErrorHandler";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

const RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_BUY_RESOLVER_ADDRESS!;

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner } = useUser();
  const { account, signer } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectedFees, setCollectedFees] = useState<string>("0");

  const fetchFees = useCallback(async () => {
    if (!signer) {
      return;
    }
    setError(null);
    try {
      const contract = new ethers.Contract(
        RESOLVER_ADDRESS,
        resolverAbi,
        signer
      );
      const result = await contract.getCollectedFeeValue();
      setCollectedFees(ethers.formatEther(result));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError("Eroare la citirea fondurilor.");
    }
  }, [signer]);

  const withdrawFunds = async () => {
    if (!signer) return;
    setLoading(true);
    setError(null);
    try {
      const contract = new ethers.Contract(
        RESOLVER_ADDRESS,
        resolverAbi,
        signer
      );
      const tx = await contract.withdrawFees();
      await tx.wait();
      setTimeout(() => {
        toast.success("Fonduri retrase cu succes!");
        router.push("/myaccount");
      }, 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errMessage = getMetamaskErrorMsg(err);
      setError("Retragerea a eșuat: " + errMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (userLoading) return;

      if (!user) {
        toast.error("Trebuie să vă autentificați pentru a continua.");
        router.replace("/login");
        return;
      }

      if (!isOwner) {
        toast.error("Nu aveți acces.");
        router.replace("/");
        return;
      }

      if (account) {
        fetchFees();
      } else {
        setError("Metamask neconectat!");
      }
    };
    init();
  }, [router, user, isOwner, userLoading, account, fetchFees]);

  if (userLoading) {
    return (
      <Container className="py-4 w-50 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!user) return;

  if (!isOwner) return;

  return (
    <Container className="py-4 w-50">
      <h2 className="mb-4">Proprietar - fonduri platformă</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form className="mb-3">
        <Form.Group controlId="collectedFees">
          <Form.Label>Fonduri colectate (ETH)</Form.Label>
          <Form.Control type="text" value={collectedFees} disabled />
        </Form.Group>
      </Form>

      {loading && (
        <div className="text-center mb-3">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Retragere în curs...</p>
        </div>
      )}

      <div className="d-flex gap-2">
        <ButtonGroup className="w-100">
          <Button
            variant="primary"
            onClick={withdrawFunds}
            disabled={loading || collectedFees === "0"}
          >
            Retrage fonduri
          </Button>
          <Button variant="info" onClick={fetchFees} disabled={loading}>
            Reîncarcă
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              router.push("/myaccount");
            }}
            disabled={loading}
          >
            Înapoi
          </Button>
        </ButtonGroup>
      </div>
    </Container>
  );
}
