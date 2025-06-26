"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "@/lib/axios";
import { Container, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";

export default function ConfirmPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post("/user/confirm", { token });
      router.push("/login");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare confirmare cont.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <h2 className="mb-4 text-center">Confirmare cont</h2>

          {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

          <Form>
            <Form.Group controlId="token" className="mb-3">
              <Form.Label>Token de confirmare</Form.Label>
              <Form.Control type="text" value={token} disabled />
            </Form.Group>
          </Form>

          <div className="text-center">
            <Button variant="primary" className="w-100" onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Se confirmă…
                </>
              ) : (
                "Confirmă cont"
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
