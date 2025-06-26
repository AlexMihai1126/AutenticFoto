import {
  Card,
  Button,
  Badge,
  OverlayTrigger,
  Popover,
  ListGroup,
  ListGroupItem,
  ButtonGroup,
} from "react-bootstrap";
import { Blurhash } from "react-blurhash";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPagePhotoData } from "@/lib/commonInterfaces";

interface Props {
  photo: UserPagePhotoData;
  priority?: boolean;
}

export default function UserPhotoCard({ photo }: Props) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const maxVisibleTags = 2;
  const tags = photo.tags ?? [];

  const visibleTags = tags.slice(0, maxVisibleTags);
  const hiddenTags = tags.slice(maxVisibleTags);
  const formattedDateTime = new Date(photo.createdAt).toLocaleString("ro-RO", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

  return (
    <Card className="h-100 card-hover">
      <div
        style={{
          position: "relative",
          aspectRatio: "3 / 2",
          overflow: "hidden",
          borderTopLeftRadius: "0.375rem",
          borderTopRightRadius: "0.375rem",
        }}
      >
        {photo.blurhashStr && (
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
          src={photo.previewUrl}
          alt={photo.title}
          fill
          priority
          sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw"
          onLoad={() => setLoaded(true)}
          style={{
            objectFit: "contain",
            zIndex: 2,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2">{photo.title}</Card.Title>
        <Card.Text className="text-truncate mb-2">
          {photo.description}
        </Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroupItem className="text-center">
          {photo.category && (
            <Badge bg="primary" className="mb-2 text-white w-100">
              {photo.category.title}
            </Badge>
          )}

          {photo.tags && photo.tags.length > 0 && (
            <div
              className="d-flex justify-content-center gap-1 mb-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {visibleTags.map((tag) => (
                <Badge
                  key={tag._id}
                  bg="secondary"
                  className="rounded-pill text-nowrap"
                >
                  {tag.title}
                </Badge>
              ))}

              {hiddenTags.length > 0 && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Popover id={`popover-tags-${photo._id}`}>
                      <Popover.Header as="h6">Mai multe tag-uri</Popover.Header>
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
            </div>
          )}
        </ListGroupItem>
        <ListGroupItem className="text-center">
          <div className="mt-auto">
            <div className="mb-1">
              Preț:{" "}
              <Badge bg="secondary" className="rounded-pill">
                {photo.ethPriceStr} ETH
              </Badge>
            </div>
          </div>
        </ListGroupItem>
        <ListGroupItem className="text-center">
          <div className="mt-auto">
            <div className="mb-1">
              Status:{" "}
              <Badge
                bg={
                  photo.isRevoked
                    ? "secondary"
                    : photo.attestationUID
                    ? "success"
                    : "primary"
                }
                className="rounded-pill"
              >
                {photo.isRevoked
                  ? "Revocată"
                  : photo.attestationUID
                  ? "Atestată"
                  : "Neatestată"}
              </Badge>
            </div>
          </div>
        </ListGroupItem>
        <ListGroupItem className="text-center">
          <div className="mt-auto">
            <div className="mb-1">
              Încărcat pe:{" "}
              <Badge bg="secondary" className="rounded-pill">
                {formattedDateTime}
              </Badge>
            </div>
          </div>
        </ListGroupItem>
      </ListGroup>

      <Card.Footer>
        <ButtonGroup className="w-100">
          <Button
            variant="outline-primary"
            onClick={() =>
              router.push(`/myaccount/photos/${encodeURIComponent(photo._id!)}`)
            }
          >
            Vezi detalii
          </Button>

          {!photo.attestationUID && (
            <>
              <Button
                variant="outline-info border-start-0 border-end-0"
                onClick={() =>
                  router.push(
                    `/myaccount/photos/attest/${encodeURIComponent(photo._id)}`
                  )
                }
              >
                Atestă
              </Button>
              <Button
                variant="outline-danger"
                onClick={() =>
                  router.push(
                    `/myaccount/photos/delete/${encodeURIComponent(photo._id)}`
                  )
                }
              >
                Șterge
              </Button>
            </>
          )}

          {photo.attestationUID && !photo.isRevoked && (
            <Button
              variant="outline-danger border-start-0"
              onClick={() =>
                router.push(
                  `/myaccount/photos/revoke/${encodeURIComponent(
                    photo.attestationUID!
                  )}`
                )
              }
            >
              Revocă
            </Button>
          )}
        </ButtonGroup>
      </Card.Footer>
    </Card>
  );
}
