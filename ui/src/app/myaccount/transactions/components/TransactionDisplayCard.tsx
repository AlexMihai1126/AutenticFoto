import {
  Card,
  ListGroup,
  ListGroupItem,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TransactionCardData } from "@/lib/commonInterfaces";

interface Props {
  data: TransactionCardData;
  priority: boolean;
}

export default function TransactionCard({ data }: Props) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const {
    id,
    title,
    previewUrl,
    blurhashStr,
    attestationUID,
    txHash,
    createdAt,
  } = data;

  const hashDisplay = (hash: string) =>
    `${hash.slice(0, 6)}...${hash.slice(-4)}`;

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
        {blurhashStr && (
          <Blurhash
            hash={blurhashStr}
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
          src={previewUrl}
          alt={title}
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
        <Card.Title className="mb-2">{title}</Card.Title>
      </Card.Body>

      <ListGroup variant="flush">
        <ListGroupItem>
          <div className="mb-2">
            <strong>EAS UID:</strong> {hashDisplay(attestationUID)}
          </div>
          <div className="mb-2">
            <strong>Tx Hash:</strong> {hashDisplay(txHash)}
          </div>
          <div>
            <strong>Achiziționat:</strong>{" "}
            {new Date(createdAt).toLocaleString("ro-RO")}
          </div>
        </ListGroupItem>
      </ListGroup>

      <Card.Footer>
        <ButtonGroup className="w-100">
          <Button
            variant="outline-primary"
            onClick={() => router.push(`/myaccount/transactions/${id}`)}
          >
            Vezi detalii
          </Button>
        </ButtonGroup>
      </Card.Footer>
    </Card>
  );
}
