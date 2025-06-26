// app/photos/[identifier]/page.tsx
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
  Button,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface PhotoDetails {
  _id: string;
  userId: { username: string };
  title: string;
  description: string;
  category?: { title: string } | null;
  tags?: { title: string }[] | null;
  createdAt: string;
  blurhashStr?: string | null;
  location?: string;
  aspectRatioType?: string;
  ethPriceStr: string;
  attestationUID?: string | null;
  isRevoked: boolean;
  previewUrl: string;
}

export default function PhotoDetailPage() {
  const { identifier } = useParams();
  const router = useRouter();

  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState("");

  const maxVisibleTags = 4;
  let tags: { title: string }[] = [];
  let visibleTags: { title: string }[] = [];
  let hiddenTags: { title: string }[] = [];

  useEffect(() => {
    const init = async () => {
      if (!identifier) return;
      setLoading(true);
      try {
        const apiResponse = await axios.get<PhotoDetails>(
          `/main/photo-details/${identifier}`
        );
        setPhoto(apiResponse.data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.response?.data?.error || "A apărut o eroare.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [identifier]);

  if (photo) {
    tags = photo!.tags ?? [];
    visibleTags = tags.slice(0, maxVisibleTags);
    hiddenTags = tags.slice(maxVisibleTags);
  }

  const formattedDate = photo
    ? new Date(photo.createdAt).toLocaleDateString("ro-RO", {
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
        <Alert variant="danger">{error} </Alert>
      </Container>
    );
  }

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
                    hash={photo!.blurhashStr}
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
                  src={photo!.previewUrl}
                  alt={photo!.title}
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
              <h2>{photo!.title}</h2>
              <p className="mb-3">
                <span className="text-muted">realizată de </span>
                <Link
                  href={`/user/${photo!.userId.username}`}
                  className="text-dark text-decoration-underline"
                >
                  {photo!.userId.username}
                </Link>
              </p>

              <p>{photo!.description}</p>

              <ListGroup variant="flush" className="mt-3">
                <ListGroupItem>
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <strong>Categorie:</strong>
                    </Col>
                    <Col>
                      {photo!.category ? (
                        <Badge bg="primary" className="text-white w-100">
                          {photo!.category.title}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </Col>
                  </Row>
                </ListGroupItem>

                <ListGroupItem>
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <strong>Tag-uri:</strong>
                    </Col>
                    <Col>
                      {visibleTags.map((t) => (
                        <Badge
                          bg="secondary"
                          className="me-1 mb-1 rounded-pill"
                          key={t.title}
                        >
                          {t.title}
                        </Badge>
                      ))}
                      {hiddenTags.length > 0 && (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover id={`popover-tags-${photo!._id}`}>
                              <Popover.Header as="h6">
                                Mai multe tag-uri
                              </Popover.Header>
                              <Popover.Body className="d-flex flex-wrap gap-1">
                                {hiddenTags.map((tag) => (
                                  <Badge
                                    key={tag.title}
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
                            className="rounded-pill text-nowrap me-1 mb-1"
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
                      <strong>Aspect:</strong> {photo!.aspectRatioType || "—"}
                    </Col>
                    <Col>
                      <strong>Locație:</strong> {photo!.location || "—"}
                    </Col>
                  </Row>
                </ListGroupItem>

                <ListGroupItem>
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <strong>Preț:</strong>
                    </Col>
                    <Col>{photo!.ethPriceStr} ETH</Col>
                  </Row>
                </ListGroupItem>

                <ListGroupItem>
                  <strong>Încărcat pe:</strong> {formattedDate}
                </ListGroupItem>
                {photo!.attestationUID && (
                  <ListGroupItem>
                    <strong>UID atestare:</strong>{" "}
                    <span className="ms-2">
                      <Link
                        href={`https://sepolia.easscan.org/attestation/view/${
                          photo!.attestationUID
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dark text-decoration-underline"
                      >
                        {photo!.attestationUID.slice(0, 6)}...
                        {photo!.attestationUID.slice(-4)}
                      </Link>
                    </span>
                  </ListGroupItem>
                )}

                <ListGroupItem>
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() =>
                      router.push(
                        `/photos/purchase/${encodeURIComponent(photo!._id!)}`
                      )
                    }
                  >
                    Achiziționează
                  </Button>
                </ListGroupItem>
              </ListGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
