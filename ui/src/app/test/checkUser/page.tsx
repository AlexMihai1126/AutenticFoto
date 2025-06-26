"use client";

import { useUser } from "@/contexts/UserContext";
import { Container, Spinner, Alert, Badge } from "react-bootstrap";

export default function CheckUserPage() {
  const { user, loading, isAdmin, isOwner, isPhotographer } = useUser();

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Se verifică sesiunea utilizatorului...</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Niciun utilizator autentificat.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5 text-center">
      <h2>Informații utilizator</h2>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Wallet:</strong> {user.walletAddress || "Nedefinit"}</p>

      <div className="mt-4">
        <Badge bg={isAdmin ? "success" : "secondary"} className="mx-2">
          Admin
        </Badge>
        <Badge bg={isOwner ? "success" : "secondary"} className="mx-2">
          Owner
        </Badge>
        <Badge bg={isPhotographer ? "success" : "secondary"} className="mx-2">
          Fotograf (Seller)
        </Badge>
      </div>
    </Container>
  );
}
