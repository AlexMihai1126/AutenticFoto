"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";

export default function DownloadPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setTimeout(() => {
        toast.info("Trebuie să vă autentificați pentru a continua.");
        router.replace("/login");
      }, 1000);
    }
  }, [router, user, userLoading]);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiResponse = await axios.get(`/files/download-stream/${token}`, {
        responseType: "blob",
      });

      const blob = new Blob([apiResponse.data], {
        type: apiResponse.headers["content-type"],
      });
      const contentDisposition = apiResponse.headers["content-disposition"];
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "fisier-descarcat";
      toast.info("A început descărcarea fișierului.")
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decodeURIComponent(filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (
        err.response &&
        err.response.data instanceof Blob &&
        err.response.data.type === "application/json"
      ) {
        const errText = await err.response.data.text();
        try {
          const json = JSON.parse(errText);
          setError(json?.error || "Eroare necunoscută la descărcare.");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          setError("Eroare la interpretarea răspunsului de eroare.");
        }
      } else {
        setError("Eroare la descărcare.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">
          Trebuie să fiți autentificat pentru a descărca fișierul.
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <h2 className="mb-4 text-center">Descărcare fișier</h2>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          <Form>
            <Form.Group controlId="downloadToken" className="mb-3">
              <Form.Label>Token descărcare</Form.Label>
              <Form.Control type="text" value={token} disabled />
            </Form.Group>
          </Form>

          <div className="text-center">
            <Button
              variant="primary"
              className="w-100"
              onClick={handleDownload}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Se descarcă…
                </>
              ) : (
                "Descarcă fișierul"
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
