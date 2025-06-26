"use client";

import { useEffect, useState } from "react";
import { Spinner, Container, Alert, Col, Row } from "react-bootstrap";
import axios from "@/lib/axios";
import BackButton from "@/components/BackButton";
import TransactionCard from "./components/TransactionDisplayCard";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";

interface TransactionData {
  _id: string;
  attestationUID: string;
  txHash: string;
  createdAt: string;
  generatedFileId: {
    originalPhotoId: string;
  };
}

interface PreviewImgMap {
  [photoId: string]: {
    url: string;
    title: string;
    blurhashStr: string;
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [previews, setPreviews] = useState<PreviewImgMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (userLoading) return;

      if (!user) {
        setTimeout(() => {
          toast.info("Trebuie să vă autentificați pentru a continua.");
          router.replace("/login");
        }, 1000);
      }

      try {
        const apiResponse = await axios.get("/user/my-transactions");
        const transactions = apiResponse.data.transactions;
        setTransactions(transactions);

        const photoIds = transactions.map(
          (t: TransactionData) => t.generatedFileId.originalPhotoId
        );
        const previewMap: PreviewImgMap = {};

        await Promise.all(
          photoIds.map(async (id: string) => {
            try {
              const photoRes = await axios.get(`/main/photo-details/${id}`);
              previewMap[id] = {
                url: photoRes.data.previewUrl,
                title: photoRes.data.title,
                blurhashStr: photoRes.data.blurhashStr,
              };
            } catch {
              previewMap[id] = { url: "", title: "", blurhashStr: "" };
            }
          })
        );

        setPreviews(previewMap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.response?.data?.error || "Eroare încărcare tranzacții");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [router, user, userLoading]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <p className="mb-2">Se încarcă tranzacțiile...</p>
        <Spinner
          animation="border"
          role="status"
          style={{ width: "2rem", height: "2rem" }}
        >
          <span className="visually-hidden">Se încarcă...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">
          Trebuie să fiți autentificat pentru a vedea tranzacțiile.
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <BackButton />
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      </Container>
    );
  }

  if (transactions.length === 0) {
    return (
      <Container className="py-4">
        <BackButton />
        <Alert variant="info">Nu există tranzacții înregistrate.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4 mx-auto">
      <h2 className="mb-4">Tranzacțiile mele</h2>
      <BackButton />
      <Row className="g-4">
        {transactions.map((tx, idx) => {
          const photoId = tx.generatedFileId.originalPhotoId;
          const preview = previews[photoId];
          return (
            <Col key={tx._id} md={6} lg={4}>
              <TransactionCard
                key={tx._id}
                data={{
                  id: tx._id,
                  title: preview?.title || "Fotografie",
                  previewUrl: preview?.url || "",
                  blurhashStr: preview?.blurhashStr,
                  attestationUID: tx.attestationUID,
                  txHash: tx.txHash,
                  createdAt: tx.createdAt,
                }}
                priority={idx === 0}
              />
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}
