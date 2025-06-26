"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import axios from "@/lib/axios";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Formik, Form as FormikForm, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useState } from "react";


interface LoginData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { refreshUser } = useUser();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formValidation = Yup.object().shape({
    email: Yup.string()
      .email("Adresa de email nu este validă")
      .required("Adresa de email este necesară"),
    password: Yup.string()
      .min(8, "Parola trebuie să conțină cel puțin 8 caractere")
      .required("Parola este necesară"),
  });

  const initialValues: LoginData = {
    email: "",
    password: "",
  };

  const handleSubmit = async (
    values: LoginData,
    formikHelpers: FormikHelpers<LoginData>
  ) => {
    setLoading(true);
    setGlobalError(null);

    try {
      await axios.post(
        "/auth/login",
        { email: values.email, password: values.password },
      );

      await refreshUser();

      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const response = err.response;

      if (response?.data?.errors && Array.isArray(response.data.errors)) {
        const fieldErrors: Array<{ path: string; msg: string }> =
          response.data.errors;

        fieldErrors.forEach(({ path, msg }) => {
          if (path === "email" || path === "password") {
            formikHelpers.setFieldError(path as keyof LoginData, msg);
          }
        });
      } else {
        setGlobalError(response?.data?.error || "Eroare la conectare.");
      }
    } finally {
      setLoading(false);
      formikHelpers.setSubmitting(false);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <h2 className="mb-4 text-center">Conectare</h2>

          {globalError && (
            <Alert
              variant="danger"
              onClose={() => setGlobalError(null)}
              dismissible
            >
              {globalError}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={formValidation}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, touched, errors }) => (
              <FormikForm noValidate>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Adresă de email</Form.Label>
                  <Field
                    name="email"
                    type="email"
                    as={Form.Control}
                    placeholder="email@exemplu.ro"
                    isInvalid={touched.email && !!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    <ErrorMessage name="email" />
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Parolă</Form.Label>
                  <Field
                    name="password"
                    type="password"
                    as={Form.Control}
                    placeholder="parolă"
                    isInvalid={touched.password && !!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    <ErrorMessage name="password" />
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Submit Button */}
                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting || loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Se autentifică…
                      </>
                    ) : (
                      "Autentificare"
                    )}
                  </Button>
                </div>
              </FormikForm>
            )}
          </Formik>
        </Col>
      </Row>
    </Container>
  );
}
