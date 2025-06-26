"use client";

import { useEffect, useState, useRef } from "react";
import axios from "@/lib/axios";
import Select, { SingleValue, Options } from "react-select";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Pagination,
  Spinner,
  Accordion,
  Placeholder,
  Button,
  Alert,
} from "react-bootstrap";
import styles from "./gallery.module.css";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";
import {
  PhotoPageData,
  PhotosPerPageLimitOption,
  UserPagePhotoData,
} from "@/lib/commonInterfaces";
import UserPhotoCard from "../components/UserPhotoCard";
import BackButton from "@/components/BackButton";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const photosFilterStatus = ["attested", "notAttested", "revoked"] as const;
type PhotoFilters = (typeof photosFilterStatus)[number];

interface StatusOption {
  value: PhotoFilters | "";
  label: string;
}

export default function MyPhotosPage() {
  const router = useRouter();
  const { user, isPhotographer, loading: userLoading } = useUser();

  const [isClient, setIsClient] = useState(false);
  const [statusOptions] = useState<Options<StatusOption>>([
    { value: "", label: "Toate" },
    { value: "attested", label: "Atestate" },
    { value: "notAttested", label: "Neatestate" },
    { value: "revoked", label: "Revocate" },
  ]);
  const [selectedStatus, setSelectedStatus] = useState<PhotoFilters | "">("");
  const [limit, setLimit] = useState<number>(16);
  const [page, setPage] = useState<number>(1);

  const [photos, setPhotos] = useState<UserPagePhotoData[]>([]);
  const [pageData, setPageData] = useState<PhotoPageData | null>(null);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const firstFetchRef = useRef<boolean>(false);

  const fetchPhotos = async () => {
    if (!isClient) return;
    setError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { page, limit };
      if (selectedStatus) params.status = selectedStatus;
      const res = await axios.get<{
        photodata: UserPagePhotoData[];
        pagedata: PhotoPageData;
      }>("/user/photographer/my-photos", { params });

      setPhotos(res.data.photodata);
      setPageData(res.data.pagedata);
    } catch (err) {
      console.error(err);
      setError("Eroare încărcare fotografii.");
    } finally {
      if (initialLoading && !firstFetchRef.current) {
        firstFetchRef.current = true;
        setInitialLoading(false);
      }
    }
  };

  const limitOptions: Options<PhotosPerPageLimitOption> = [8, 16, 24].map(
    (n) => ({
      value: n,
      label: n.toString(),
    })
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

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

    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    router,
    isClient,
    selectedStatus,
    limit,
    page,
    user,
    isPhotographer,
    userLoading,
  ]);

  const onStatusChange = (opt: SingleValue<StatusOption>) => {
    setSelectedStatus(opt?.value || "");
    setPage(1);
  };

  const onLimitChange = (opt: SingleValue<PhotosPerPageLimitOption>) => {
    setLimit(opt ? opt.value : 16);
    setPage(1);
  };

  const goToPage = (num: number) => setPage(num);

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
          Trebuie să vă autentificați pentru a vizualiza fotografiile dvs.
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

  if (!isClient || initialLoading) {
    return (
      <Container className="py-4">
        <h1 className="mb-4">Fotografiile mele</h1>

        <Accordion className="mb-4">
          <Accordion.Item eventKey="0">
            <Accordion.Header className={styles.skeletonAccordionHeader}>
              <Placeholder as="span" animation="glow" className="w-25">
                <Placeholder xs={8} />
              </Placeholder>
            </Accordion.Header>
            <Accordion.Body
              className={styles.skeletonAccordionBody}
            ></Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Col key={idx}>
              <Card className="h-100">
                <div className={styles.skeletonImg} />
                <Card.Body>
                  <Placeholder as={Card.Title} animation="glow">
                    <Placeholder xs={10} />
                  </Placeholder>
                  <Placeholder as={Card.Text} animation="glow">
                    <Placeholder xs={7} /> <Placeholder xs={4} />
                  </Placeholder>
                  <Placeholder as="div" animation="glow" className="mt-auto">
                    <Placeholder xs={6} /> <Placeholder xs={5} />
                  </Placeholder>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4 position-relative">
      <h1 className="mb-4">Fotografiile mele</h1>

      <BackButton />

      <Button
        variant="outline-primary"
        className="w-100 mb-4"
        onClick={() => {
          router.push("/myaccount/photos/upload");
        }}
      >
        Încarcă fotografie nouă
      </Button>

      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Filtre</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Row className="gx-3">
                <Col md={6}>
                  <Form.Group controlId="statusFoto">
                    <Form.Label>Status fotografie</Form.Label>
                    <Select
                      options={statusOptions}
                      value={
                        statusOptions.find(
                          (opt) => opt.value === selectedStatus
                        ) || null
                      }
                      onChange={onStatusChange}
                      isClearable={true}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="perPage">
                    <Form.Label>Per pagină</Form.Label>
                    <Select
                      options={limitOptions}
                      placeholder="16"
                      value={
                        limitOptions.find((opt) => opt.value === limit) || null
                      }
                      onChange={onLimitChange}
                      isClearable={false}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : photos.length === 0 ? (
        <div className="text-center">Nu există fotografii.</div>
      ) : (
        <Container>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {photos.map((photo, idx) => (
              <Col key={photo._id}>
                <UserPhotoCard photo={photo} priority={idx === 0} />
              </Col>
            ))}
          </Row>
          {pageData && pageData.totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              <Pagination.First
                onClick={() => goToPage(1)}
                disabled={page === 1}
              />
              <Pagination.Prev
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              />
              {Array.from({ length: pageData.totalPages }, (_, i) => i + 1).map(
                (num) => (
                  <Pagination.Item
                    key={num}
                    active={num === page}
                    onClick={() => goToPage(num)}
                  >
                    {num}
                  </Pagination.Item>
                )
              )}
              <Pagination.Next
                onClick={() => goToPage(page + 1)}
                disabled={page === pageData.totalPages}
              />
              <Pagination.Last
                onClick={() => goToPage(pageData.totalPages)}
                disabled={page === pageData.totalPages}
              />
            </Pagination>
          )}
        </Container>
      )}
    </Container>
  );
}
