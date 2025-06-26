/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { Container, Spinner, Alert, Row, Col } from "react-bootstrap";
import BackButton from "@/components/BackButton";
import { UserPageDetails } from "@/lib/commonInterfaces";
import PhotoCard from "../components/PhotoCard";
import Link from "next/link";

export default function UserProfilePage() {
  const { username } = useParams();
  const [user, setUser] = useState<UserPageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;

      try {
        const res = await axios.get<UserPageDetails>(
          `/main/user-profile/${username}`
        );
        setUser(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Eroare la încărcarea profilului."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <h2 className="mt-3">Se încarcă profilul...</h2>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <BackButton />
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user) return null;

  const formattedDate = new Date(user.userData.createdAt).toLocaleDateString(
    "ro-RO",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <Container className="py-4">
      <BackButton />
      <h1 className="mb-1">@{user.userData.username}</h1>
      <p className="mb-2 text-muted">
        Înregistrat pe platformă: {formattedDate}
        <br />
        UID atestare:{" "}
        <Link
          href={`https://sepolia.easscan.org/attestation/view/${encodeURIComponent(
            user.userData.attestationUID
          )}`}
          target="_blank"
        >
          <code>{user.userData.attestationUID}</code>
        </Link>
      </p>

      {user.userPhotos && user.userPhotos.length > 0 ? (
        <>
          <h2 className="mt-4 mb-3">Fotografii publicate</h2>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {user.userPhotos.map((photo, idx) => (
              <Col key={idx}>
                <PhotoCard photo={photo} priority={idx === 0} />
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <Alert variant="info" className="mt-4">
          Acest utilizator nu are fotografii publicate.
        </Alert>
      )}
    </Container>
  );
}
