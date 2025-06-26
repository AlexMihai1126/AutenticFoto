"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { Blurhash } from "react-blurhash";
import Image from "next/image";
import {
  Container,
  Card,
  Spinner,
  Badge,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Alert,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface PhotoDetails {
  _id: string;
  title: string;
  description: string;
  originalName: string;
  location?: string;
  aspectRatioType: string;
  ethPriceStr: string;
  attestationUID?: string | null;
  isRevoked: boolean;
  blurhashStr?: string;
  previewUrl: string;
  highResPreviewUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: { _id: string; title: string } | null;
  tags?: { _id: string; title: string }[] | null;
}

export default function ViewPhotoDashboardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { user, isPhotographer, loading: userLoading } = useUser();

  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState("");

  const maxVisibleTags = 4;

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      toast.info("Trebuie să vă autentificați.");
      router.replace("/login");
      return;
    }

    if (!isPhotographer) {
      toast.error("Nu aveți acces.");
      router.replace("/myaccount");
      return;
    }

    const fetchPhoto = async () => {
      try {
        const response = await axios.get<PhotoDetails>(
          `/user/photographer/photo/${id}`
        );
        setPhoto(response.data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Eroare la încărcarea fotografiei."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [user, userLoading, isPhotographer, id, router]);

  const formattedCreationDate = photo
    ? new Date(photo.createdAt).toLocaleString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const formattedUpdateDate = photo
    ? new Date(photo.updatedAt).toLocaleString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <h2 className="mt-3">Se încarcă fotografia…</h2>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4 text-center text-danger">
        <BackButton />
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const visibleTags = photo?.tags?.slice(0, maxVisibleTags) || [];
  const hiddenTags = photo?.tags?.slice(maxVisibleTags) || [];

  if (!photo) {
    <Container className="py-4">
      <Alert variant="danger">Nu s-a încărcat fotografia.</Alert>
    </Container>;
    return;
  }

  const imageSrc = photo.highResPreviewUrl
    ? photo.highResPreviewUrl
    : photo.previewUrl;

  return (
    <Container className="py-4">
      <BackButton />
      <Card>
        <Card.Body>
          <Row className="gx-4">
            <Col md={6} className="mb-4 mb-md-0">
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3/2",
                  overflow: "hidden",
                  borderRadius: ".375rem",
                }}
              >
                {photo!.blurhashStr && (
                  <Blurhash
                    hash={photo.blurhashStr}
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
                  src={imageSrc}
                  alt={photo.title || ""}
                  fill
                  sizes="(max-width:576px)100vw,50vw"
                  style={{
                    objectFit: "contain",
                    zIndex: 2,
                    opacity: imgLoaded ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                  }}
                  onLoad={() => setImgLoaded(true)}
                />
              </div>
            </Col>

            <Col md={6}>
              <h2>{photo.title}</h2>
              <p className="mb-3 text-muted">{photo.description}</p>

              <ListGroup variant="flush" className="mt-3">
                <ListGroupItem>
                  <strong>Nume fișier original:</strong> {photo.originalName}
                </ListGroupItem>
                <ListGroupItem>
                  <Row>
                    <Col>
                      <strong>Categorie:</strong>{" "}
                      {photo.category && (
                        <Badge bg="primary" className="mb-2 text-white">
                          {photo.category.title}
                        </Badge>
                      )}
                    </Col>
                    <Col>
                      <strong>Tag-uri:</strong>{" "}
                      {visibleTags.map((tag) => (
                        <Badge
                          key={tag._id}
                          bg="secondary"
                          className="rounded-pill me-1"
                        >
                          {tag.title}
                        </Badge>
                      ))}
                      {hiddenTags.length > 0 && (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover id={`popover-tags-${photo._id}`}>
                              <Popover.Header as="h6">
                                Mai multe tag-uri
                              </Popover.Header>
                              <Popover.Body className="d-flex flex-wrap gap-1">
                                {hiddenTags.map((tag) => (
                                  <Badge
                                    key={tag._id}
                                    bg="secondary"
                                    className="rounded-pill"
                                  >
                                    {tag.title}
                                  </Badge>
                                ))}
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <Badge
                            bg="dark"
                            className="rounded-pill text-nowrap"
                            style={{ cursor: "pointer" }}
                          >
                            +{hiddenTags.length}
                          </Badge>
                        </OverlayTrigger>
                      )}
                    </Col>
                  </Row>
                </ListGroupItem>

                <ListGroupItem>
                  <Row>
                    <Col>
                      <strong>Aspect:</strong> {photo.aspectRatioType || "—"}
                    </Col>
                    <Col>
                      <strong>Locație:</strong> {photo.location || "—"}
                    </Col>
                  </Row>
                </ListGroupItem>

                <ListGroupItem>
                  <strong>Preț:</strong> {photo.ethPriceStr} ETH
                </ListGroupItem>

                <ListGroupItem>
                  <strong>Data încărcării:</strong> {formattedCreationDate}
                </ListGroupItem>

                <ListGroupItem>
                  <strong>Data actualizării:</strong> {formattedUpdateDate}
                </ListGroupItem>

                <ListGroupItem>
                  <strong>Stare atestare:</strong>{" "}
                  {photo.attestationUID ? (
                    photo.isRevoked ? (
                      <Badge bg="secondary" className="ms-2">
                        Revocată
                      </Badge>
                    ) : (
                      <Badge bg="success" className="ms-2">
                        Atestată
                      </Badge>
                    )
                  ) : (
                    <Badge bg="secondary" className="ms-2">
                      Neatestată
                    </Badge>
                  )}
                </ListGroupItem>

                {photo.attestationUID && (
                  <ListGroupItem>
                    <strong>UID atestare:</strong>{" "}
                    <Link
                      href={`https://sepolia.easscan.org/attestation/view/${photo.attestationUID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-underline ms-2"
                    >
                      {photo.attestationUID.slice(0, 6)}...
                      {photo.attestationUID.slice(-4)}
                    </Link>
                  </ListGroupItem>
                )}
              </ListGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
