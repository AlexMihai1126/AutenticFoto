"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Button,
  Form as BootstrapForm,
  Card,
} from "react-bootstrap";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { toast } from "react-toastify";
import { useUser } from "@/contexts/UserContext";

interface TransactionData {
  transaction: {
    _id: string;
    txHash: string;
    attestationUID: string;
    createdAt: string;
    generatedFileId: {
      originalPhotoId: string;
    };
  };
  downloadLink?: string;
}

interface PhotoData {
  title: string;
  ethPriceStr: string;
  previewUrl: string;
  blurhashStr: string;
}

export default function TransactionDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [transactionData, setTransactionData] =
    useState<TransactionData | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingNewLink, setGeneratingNewLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const transactionApiResponse = await axios.get(
        `/user/my-transactions/${id}`
      );
      const transactionData: TransactionData = transactionApiResponse.data;
      setTransactionData(transactionData);

      const photoId =
        transactionData.transaction.generatedFileId.originalPhotoId;
      const photoRes = await axios.get(`/main/photo-details/${photoId}`);
      setPhotoData({
        title: photoRes.data.title,
        ethPriceStr: photoRes.data.ethPriceStr,
        previewUrl: photoRes.data.previewUrl,
        blurhashStr: photoRes.data.blurhashStr,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Eroare la încărcarea detaliilor tranzacției."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setTimeout(() => {
        toast.info("Trebuie să vă autentificați pentru a continua.");
        router.replace("/login");
      }, 1000);
    }
    loadData();
  }, [router, user, userLoading, loadData]);

  const handleGenerateLink = async () => {
    setGeneratingNewLink(true);
    try {
      await axios.post("/user/generate-new-link", { txId: id });
      toast.success("Link nou generat! Acesta a fost trimis și prin email")
      await loadData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare la generarea linkului.");
    } finally {
      setGeneratingNewLink(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Se încarcă detaliile tranzacției...</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">
          Trebuie să fiți autentificat pentru a vedea tranzacția.
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <BackButton />
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!transactionData || !photoData) {
    return (
      <Container className="py-4">
        <BackButton />
        <Alert variant="error">Datele nu au putut fi încărcate.</Alert>
      </Container>
    );
  }

  const { transaction, downloadLink } = transactionData;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Detalii tranzacție</h2>

      <BackButton />

      <Card className="mb-4">
        <Card.Body>
          <Row className="gx-4 align-items-center">
            <Col
              md={6}
              className="d-flex justify-content-center align-items-center mb-4 mb-md-0"
              style={{ position: "relative", minHeight: "300px" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3/2",
                  overflow: "hidden",
                  borderRadius: ".375rem",
                  maxWidth: "100%",
                }}
              >
                {photoData.blurhashStr && (
                  <Blurhash
                    hash={photoData.blurhashStr}
                    width="100%"
                    height="100%"
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      filter: "brightness(75%)",
                      zIndex: 1,
                    }}
                  />
                )}

                <Image
                  src={photoData.previewUrl}
                  alt={photoData.title}
                  fill
                  sizes="(max-width:576px)100vw,50vw"
                  onLoad={() => setImgLoaded(true)}
                  style={{
                    objectFit: "contain",
                    zIndex: 2,
                    opacity: imgLoaded ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                  }}
                />
              </div>
            </Col>

            <Col md={6}>
              <h4 className="mb-2">
                <Link
                  href={`/photos/${transaction.generatedFileId.originalPhotoId}`}
                  className="text-decoration-none"
                >
                  {photoData.title}
                </Link>
              </h4>
              <p className="text-muted mb-4">Fotografie achiziționată</p>

              <BootstrapForm>
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>
                    <Link
                      href={`https://sepolia.easscan.org/attestation/view/${transaction.attestationUID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-underline"
                    >
                      UID atestare
                    </Link>
                  </BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="text"
                    value={transaction.attestationUID}
                    disabled
                  />
                </BootstrapForm.Group>

                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>
                    <Link
                      href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-underline"
                    >
                      Hash tranzacție
                    </Link>
                  </BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="text"
                    value={transaction.txHash}
                    disabled
                  />
                </BootstrapForm.Group>

                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>Data achiziției</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="text"
                    value={new Date(transaction.createdAt).toLocaleString(
                      "ro-RO"
                    )}
                    disabled
                  />
                </BootstrapForm.Group>

                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label>Preț</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="text"
                    value={`${photoData.ethPriceStr} ETH`}
                    disabled
                  />
                </BootstrapForm.Group>

                <div className="d-flex flex-column gap-2">
                  {downloadLink ? (
                    <Button
                      variant="success"
                      href={downloadLink}
                      target="_blank"
                      className="w-100"
                    >
                      Descarcă fișierul
                    </Button>
                  ) : (
                    <>
                      <Alert variant="warning" className="p-2">
                        Link-ul de descărcare nu mai este valabil.
                      </Alert>
                      <Button
                        variant="info"
                        onClick={handleGenerateLink}
                        disabled={generatingNewLink}
                        className="w-100"
                      >
                        {generatingNewLink
                          ? "Se generează..."
                          : "Generează link nou de descărcare"}
                      </Button>
                    </>
                  )}
                </div>
              </BootstrapForm>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
