"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import {
  Spinner,
  Alert,
  Button,
  Container,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";

export default function DeletePage() {
  const router = useRouter();
  const { user, isPhotographer, loading: userLoading } = useUser();
  const { id } = useParams() as { id: string };

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isDeleteTriggered = useRef(false);

  const deletePhoto = async () => {
    if (isDeleteTriggered.current) return;
    isDeleteTriggered.current = true;

    setError(null);

    if (!id) {
      setError("ID fotografie lipsă în URL.");
      return;
    }

    setLoading(true);

    try {
      await axios.delete(`/user/photographer/photo/${id}`);

      toast.success("Fotografia a fost ștearsă.");
      router.push("/myaccount/photos");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      isDeleteTriggered.current = false;
      setError(err?.response?.data?.error || "Eroare la ștergere.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (userLoading) return;

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
      setLoading(false);
    };

    init();
  }, [user, userLoading, isPhotographer, router]);

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
          Trebuie să vă autentificați pentru a șterge fotografii.
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

  return (
    <Container className="py-4 w-50">
      <h2 className="mb-4">Ștergere fotografie</h2>

      <Alert variant="danger">
        <strong>Atenție:</strong> Această fotografie nu este atestată și va fi
        ștearsă complet din platformă. O poți încărca din nou dacă te răzgândești.
      </Alert>

      <Form className="mb-4">
        <Form.Group controlId="photoId">
          <Form.Label>ID Fotografie</Form.Label>
          <Form.Control type="text" value={id} disabled />
        </Form.Group>
      </Form>

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

      {!loading && (
        <div className="d-flex gap-2">
          <ButtonGroup className="w-100">
            <Button variant="danger" onClick={deletePhoto} disabled={loading}>
              Confirmă ștergerea
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
