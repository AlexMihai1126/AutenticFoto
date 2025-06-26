"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import axios from "@/lib/axios";
import qs from "qs";
import Select, { MultiValue, SingleValue, Options } from "react-select";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Pagination,
  Placeholder,
  Accordion,
  Alert,
} from "react-bootstrap";
import styles from "./gallery.module.css";
import PhotoCard from "@/components/GalleryPhotoCard";
import {
  PhotoData,
  FilterTag,
  FilterCategory,
  PhotoPageData,
  FilterCategoryOption,
  FilterTagOption,
  PhotosPerPageLimitOption,
} from "@/lib/commonInterfaces";
import SearchBar from "@/components/SearchBar";

export default function PhotosPage() {
  const [isClientReady, setIsClientReady] = useState(false);

  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [tags, setTags] = useState<FilterTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchAllTags, setMatchAllTags] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [sortByLatest, setSortByLatest] = useState<boolean>(true);
  const [sortByCheapestFirst, setSortByCheapestFirst] =
    useState<boolean>(false);

  const [limit, setLimit] = useState<number>(16);
  const [page, setPage] = useState<number>(1);

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [pageData, setPageData] = useState<PhotoPageData | null>(null);

  const [filtersLoading, setFiltersLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const isLoadedFirstTime = useRef<boolean>(false);

  const categoryOptions: Options<FilterCategoryOption> = categories.map(
    (c) => ({
      value: c._id,
      label: c.title,
    })
  );
  const tagOptions: Options<FilterTagOption> = tags.map((t) => ({
    value: t._id,
    label: t.title,
  }));
  const aspectOptions: Options<{ value: string; label: string }> = [
    { value: "landscape", label: "Landscape" },
    { value: "portrait", label: "Portret" },
    { value: "square", label: "Pătrat" },
  ];
  const limitOptions: Options<PhotosPerPageLimitOption> = [8, 16, 24].map(
    (n) => ({
      value: n,
      label: n.toString(),
    })
  );

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (!isClientReady) return;

    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          axios.get<{ categories: FilterCategory[] }>(`/main/all-categories`),
          axios.get<{ tags: FilterTag[] }>(`/main/all-tags`),
        ]);
        setCategories(catRes.data.categories);
        setTags(tagRes.data.tags);
      } catch (err) {
        console.error(err);
        setError("Eroare încărcare filtre.");
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, [isClientReady]);

  useEffect(() => {
    if (!isClientReady || filtersLoading) return;

    const fetchPhotos = async () => {
      setError("");

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = { page, limit };
        if (selectedCategory) params.category = selectedCategory;
        if (selectedTags.length) {
          params.tags = selectedTags;
          params.matchAllTags = matchAllTags;
        }
        if (sortByLatest == false) params.sortByLatest = false;
        if (sortByCheapestFirst == true) params.sortByCheapestFirst = true;
        if (aspectRatio) params.aspectRatio = aspectRatio;

        const photosRes = await axios.get<{
          photodata: PhotoData[];
          pagedata: PhotoPageData;
        }>(`/main/all-photos`, {
          params,
          paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
        });

        setPhotos(photosRes.data.photodata);
        setPageData(photosRes.data.pagedata);
      } catch (err) {
        console.error(err);
        setError("Eroare încărcare imagini.");
      } finally {
        if (initialLoading && !isLoadedFirstTime.current) {
          isLoadedFirstTime.current = true;
          setInitialLoading(false);
        }
      }
    };

    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isClientReady,
    filtersLoading,
    selectedCategory,
    selectedTags,
    matchAllTags,
    aspectRatio,
    sortByLatest,
    sortByCheapestFirst,
    limit,
    page,
  ]);

  const onCategoryChange = (opt: SingleValue<FilterCategoryOption>) => {
    setSelectedCategory(opt ? opt.value : "");
    setPage(1);
  };
  const onTagsChange = (opts: MultiValue<FilterTagOption>) => {
    setSelectedTags(opts.map((o) => o.value));
    setPage(1);
  };
  const onMatchAllToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setMatchAllTags(e.target.checked);
    setPage(1);
  };
  const onAspectRatioChange = (
    opt: SingleValue<{ value: string; label: string }>
  ) => {
    setAspectRatio(opt?.value || "");
    setPage(1);
  };
  const onSortByLatestToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setSortByLatest(e.target.checked);
    setPage(1);
  };
  const onSortByCheapestToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setSortByCheapestFirst(e.target.checked);
    setPage(1);
  };
  const onLimitChange = (opt: SingleValue<PhotosPerPageLimitOption>) => {
    setLimit(opt ? opt.value : 16);
    setPage(1);
  };
  const goToPage = (num: number) => setPage(num);

  if (!isClientReady || initialLoading) {
    return (
      <Container className="py-4">
        <h1 className="mb-4">Fotografii</h1>

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
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <h1 className="mb-0">Fotografii</h1>

        <div style={{ minWidth: "250px", maxWidth: "75%", flexGrow: 1 }}>
          <SearchBar />
        </div>
      </div>
      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Filtre</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Row className="gx-3 align-items-center">
                <Col md={3}>
                  <Form.Group controlId="filterCategory">
                    <Form.Label>Categorii</Form.Label>
                    <Select
                      options={categoryOptions}
                      placeholder="Toate..."
                      value={
                        selectedCategory
                          ? categoryOptions.find(
                              (opt) => opt.value === selectedCategory
                            ) || null
                          : null
                      }
                      onChange={onCategoryChange}
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="filterTags">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label className="mb-0">Tag-uri</Form.Label>
                      <div className="d-flex align-items-center gap-1">
                        <Form.Label className="mb-0">
                          Potrivire toate?
                        </Form.Label>
                        <Form.Check
                          type="switch"
                          id="matchAllTags"
                          checked={matchAllTags}
                          onChange={onMatchAllToggle}
                          className="mb-0"
                        />
                      </div>
                    </div>
                    <Select
                      isMulti
                      options={tagOptions}
                      placeholder="Selectează tag-uri..."
                      value={tagOptions.filter((opt) =>
                        selectedTags.includes(opt.value)
                      )}
                      onChange={onTagsChange}
                      className="react-select-container mt-1"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group controlId="filterAspectRatio">
                    <Form.Label>Aspect</Form.Label>
                    <Select
                      options={aspectOptions}
                      placeholder="Toate..."
                      value={
                        aspectOptions.find((o) => o.value === aspectRatio) ||
                        null
                      }
                      onChange={onAspectRatioChange}
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={2} className="d-flex flex-column align-items-start">
                  <Form.Check
                    type="switch"
                    id="sortByCheapestFirst"
                    label="Cele mai ieftine primele"
                    checked={sortByCheapestFirst}
                    onChange={onSortByCheapestToggle}
                  />
                  <Form.Check
                    type="switch"
                    id="sortByLatest"
                    label="Ultimele poze adăugate"
                    checked={sortByLatest}
                    onChange={onSortByLatestToggle}
                  />
                </Col>

                <Col md={1}>
                  <Form.Group controlId="filterLimit">
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
        <Alert variant="danger">{error}</Alert>
      ) : photos.length === 0 ? (
        <Alert variant="info">
          Nu sunt fotografii care se potrivesc filtrelor.
        </Alert>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {photos.map((photo, idx) => (
              <Col key={photo._id}>
                <PhotoCard photo={photo} priority={idx === 0} />
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
        </>
      )}
    </Container>
  );
}
