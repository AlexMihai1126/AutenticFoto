"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { Formik, Form as FormikForm, Field } from "formik";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Spinner,
  ButtonGroup,
  Button,
  Form as BootstrapForm,
  Alert,
} from "react-bootstrap";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";

interface UserData {
  email: string;
  username: string;
  walletAddress?: string;
  attestationUID?: string;
  blockchainConfirmed: boolean;
  role: string;
  type: string;
}

interface FormData {
  email: string;
  username: string;
  walletAddress: string;
  attestationUID: string;
  accRole: string;
  accType: string;
}

const AccountPage: NextPage = () => {
  const [userProfileData, setUserProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setTimeout(() => {
        toast.info("Trebuie să vă autentificați pentru a continua.");
        router.replace("/login");
      }, 1000);
    }

    const fetchUser = async () => {
      try {
        const apiResponse = await axios.get<{ user: UserData }>("/user/data");
        setUserProfileData(apiResponse.data.user);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Eroare preluare date utilizator."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, user, userLoading]);

  if (loading) {
    return (
      <Container className="text-center py-4">
        <p>Se încarcă datele contului…</p>
        <Spinner
          animation="border"
          role="status"
          style={{ width: "2rem", height: "2rem" }}
        >
          <span className="visually-hidden">Se încarcă...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">Trebuie să fiți autentificat.</Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!userProfileData) {
    return null;
  }

  const formData: FormData = {
    email: userProfileData.email,
    username: userProfileData.username,
    walletAddress: userProfileData.walletAddress || "",
    attestationUID: userProfileData.attestationUID || "",
    accRole:
      userProfileData.role === "user" ? "utilizator" : userProfileData.role,
    accType:
      userProfileData.type === "buyer"
        ? "client"
        : userProfileData.type === "seller"
        ? "fotograf"
        : "proprietar",
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={3}>
          <ButtonGroup vertical className="w-100">
            {userProfileData.type === "seller" && (
              <>
                <Button
                  variant="outline-primary"
                  className="border-bottom-0"
                  onClick={() => router.push("/myaccount/photos")}
                >
                  Fotografiile mele
                </Button>
                <Button
                  variant="outline-primary"
                  className="border-bottom-0"
                  onClick={() => router.push(`/user/${userProfileData.username}`)}
                >
                  Vezi profil public
                </Button>
              </>
            )}

            {userProfileData.type === "owner" && (
              <Button
                variant="outline-primary"
                className="border-bottom-0"
                onClick={() => router.push("/owner")}
              >
                Retragere fonduri platformă
              </Button>
            )}

            {userProfileData.role === "admin" && (
              <Button
                variant="outline-primary"
                className="border-bottom-0"
                onClick={() => router.push("/admin")}
              >
                Admin platformă
              </Button>
            )}

            <Button
              variant="outline-primary"
              onClick={() => router.push("/myaccount/transactions")}
            >
              Tranzacțiile mele
            </Button>

            {!userProfileData.walletAddress && (
              <Button
                variant="outline-info"
                className="border-top-0"
                onClick={() => router.push("/myaccount/confirm-wallet")}
              >
                Confirmă wallet
              </Button>
            )}
          </ButtonGroup>
        </Col>

        <Col md={9}>
          <h2 className="mb-4">Contul meu</h2>

          <Formik initialValues={formData} onSubmit={() => {}}>
            <FormikForm>
              <BootstrapForm.Group className="mb-3" controlId="email">
                <BootstrapForm.Label>Email</BootstrapForm.Label>
                <Field
                  name="email"
                  type="email"
                  className="form-control"
                  disabled
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="username">
                <BootstrapForm.Label>Nume de utilizator</BootstrapForm.Label>
                <Field
                  name="username"
                  type="text"
                  className="form-control"
                  disabled
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="attestationUID">
                <BootstrapForm.Label>Rol</BootstrapForm.Label>
                <Field
                  name="accRole"
                  type="text"
                  className="form-control"
                  disabled
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="attestationUID">
                <BootstrapForm.Label>Tip cont</BootstrapForm.Label>
                <Field
                  name="accType"
                  type="text"
                  className="form-control"
                  disabled
                />
              </BootstrapForm.Group>

              {userProfileData.blockchainConfirmed && (
                <>
                  <BootstrapForm.Group
                    className="mb-3"
                    controlId="walletAddress"
                  >
                    <BootstrapForm.Label>
                      <Link
                        href={`https://sepolia.etherscan.io/address/${encodeURIComponent(
                          userProfileData.walletAddress!
                        )}`}
                        target="_blank"
                      >
                        Adresă wallet Blockchain
                      </Link>
                    </BootstrapForm.Label>
                    <Field
                      name="walletAddress"
                      type="text"
                      className="form-control"
                      disabled
                    />
                  </BootstrapForm.Group>

                  <BootstrapForm.Group
                    className="mb-3"
                    controlId="attestationUID"
                  >
                    <BootstrapForm.Label>
                      <Link
                        href={`https://sepolia.easscan.org/attestation/view/${encodeURIComponent(
                          userProfileData.attestationUID!
                        )}`}
                        target="_blank"
                      >
                        UID atestare EAS
                      </Link>
                    </BootstrapForm.Label>
                    <Field
                      name="attestationUID"
                      type="text"
                      className="form-control"
                      disabled
                    />
                  </BootstrapForm.Group>
                </>
              )}
            </FormikForm>
          </Formik>
        </Col>
      </Row>
    </Container>
  );
};

export default AccountPage;
