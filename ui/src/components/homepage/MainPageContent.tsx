"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Carousel, Modal, Button } from "react-bootstrap";
import styles from "./MainPageContent.module.css";
import type { CarouselPhotoData } from "@/lib/commonInterfaces";
import { Blurhash } from "react-blurhash";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";

export default function HeroSection() {
  const { user, isPhotographer } = useUser();
  const [photos, setPhotos] = useState<CarouselPhotoData[]>([]);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const handleShow = (content: { title: string; text: string }) => {
    setModalContent(content);
    setShowModal(true);
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const body = document.body;
      if (body.classList.contains("modal-open") && body.style.paddingRight) {
        body.style.paddingRight = "0px";
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    axios
      .get("/main/all-photos", {
        params: {
          limit: 6,
          sortByLatest: true,
          getHiResPreview: true,
          aspectRatio: "landscape",
        },
      })
      .then((res) => {
        const mapped: CarouselPhotoData[] = res.data.photodata.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (photo: any) => ({
            ...photo,
            username: photo.userId?.username || "necunoscut",
          })
        );
        setPhotos(mapped);
        setImageLoaded(new Array(mapped.length).fill(false));
      });
  }, []);

  return (
    <div className={styles.heroWrapper}>
      <Carousel
        fade
        controls={false}
        indicators={false}
        interval={4500}
        className={styles.backgroundCarousel}
      >
        {photos.map((photo, index) => (
          <Carousel.Item key={photo._id} className={styles.carouselItem}>
            <div className="position-relative w-100 h-100">
              {photo.blurhashStr && (
                <Blurhash
                  hash={photo.blurhashStr}
                  width="100%"
                  height="100%"
                  resolutionX={32}
                  resolutionY={32}
                  punch={1}
                  className={styles.blurhashOverlay}
                />
              )}

              <Image
                key={photo.highResPreviewUrl || photo.previewUrl}
                src={photo.highResPreviewUrl || photo.previewUrl}
                alt={photo.title}
                fill
                priority={index === 0}
                sizes="100vw"
                ref={(img) => {
                  if (img?.complete && !imageLoaded[index]) {
                    const updated = [...imageLoaded];
                    updated[index] = true;
                    setImageLoaded(updated);
                  }
                }}
                onLoadingComplete={() => {
                  const updated = [...imageLoaded];
                  updated[index] = true;
                  setImageLoaded(updated);
                }}
                className={`${styles.backgroundImage} ${
                  imageLoaded[index] ? styles.imageVisible : styles.imageHidden
                }`}
              />
            </div>

            <div className={styles.slideCaptionBox}>
              <div className={styles.captionContent}>
                <h5 className="mb-1 fw-bold">{photo.title}</h5>
                <p className="mb-2">
                  Fotografie realizată de{" "}
                  <Link
                    className="text-light text-decoration-underline"
                    href={`/user/${photo.username}`}
                  >
                    {photo.username}
                  </Link>
                </p>
                <Link
                  href={`/photos/${photo._id}`}
                  className="btn btn-sm btn-outline-light w-100 border-0"
                >
                  Detalii
                </Link>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>

      <div className={styles.overlayContent}>
        <div className={styles.mainText}>
          <h1 className="display-4 fw-bold text-white text-center">
            AutenticFoto
          </h1>
          <p className="lead text-white text-center mt-3">
            Platformă blockchain pentru fotografii autentice și licențiate.
          </p>
        </div>

        <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
          <Link href="/photos" className="btn btn-outline-light btn-lg">
            Explorează fotografii
          </Link>
          {!user && (
            <Link href="/register" className="btn btn-outline-light btn-lg">
              Alătură-te
            </Link>
          )}
          {isPhotographer && (
            <Link href="/myaccount/photos/upload" className="btn btn-outline-light btn-lg">
              Creează
            </Link>
          )}
        </div>

        <div className="container mt-5 text-white">
          <div className="row g-4">
            {[
              {
                title: "Origine dovedită",
                text: "Autorul fiecărei fotografii este verificat. Originea este publică și imutabilă.",
                modalText:
                  "Fiecare fotografie este înregistrată pe blockchain cu semnătură digitală. Originea este dovedită și autorul este verificat, cu ajutorul atestărilor EAS.",
              },
              {
                title: "Venituri directe",
                text: "Fără comisioane. Fotografii sunt plătiți direct și instant.",
                modalText:
                  "Tehnologia blockchain permite ca banii să ajungă direct la fotografi, fără platforme intermediare sau comisioane ascunse.",
              },
              {
                title: "Licențiere sigură",
                text: "Fiecare copie este unică, semnată digital și ușor de verificat.",
                modalText:
                  "Cumpărătorii primesc fișiere de calitate înaltă, fiecare având o semnătură digitală unică ce conține detalii despre licență și cumpărător.",
              },
            ].map((item, i) => (
              <div className="col-md-4" key={i}>
                <div
                  className={`p-3 rounded h-100 text-center ${styles.valueBox}`}
                >
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                  <Button
                    variant="link"
                    className="text-light p-0 border-0 link-offset-2 link-underline link-underline-opacity-0"
                    onClick={() =>
                      handleShow({ title: item.title, text: item.modalText })
                    }
                  >
                    Află mai mult
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            centered
            contentClassName={styles.customModalContent}
          >
            <Modal.Header className={styles.customModalHeader}>
              <Modal.Title>{modalContent?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{modalContent?.text}</Modal.Body>
            <Modal.Footer className={styles.customModalFooter}>
              <Button
                variant="outline-light"
                onClick={() => setShowModal(false)}
              >
                Închide
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}
