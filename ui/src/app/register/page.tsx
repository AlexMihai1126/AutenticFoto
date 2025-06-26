/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
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
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { useState } from "react";

interface RegisterData {
  email: string;
  username: string;
  password: string;
  registerAsPhotographer: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Adresa de email nu este validă")
      .required("Adresa de email este necesară"),
    username: Yup.string()
      .min(4, "Numele de utilizator trebuie să conțină între 4 și 20 de caractere.")
      .max(20, "Numele de utilizator trebuie să conțină între 4 și 20 de caractere.")
      .required("Numele de utilizator este necesar"),
    password: Yup.string()
      .min(8, "Parola trebuie să conțină cel puțin 8 caractere")
      .required("Parola este necesară"),
    registerAsPhotographer: Yup.boolean(),
  });

  const initialValues: RegisterData = {
    email: "",
    username: "",
    password: "",
    registerAsPhotographer: false,
  };

  const handleSubmit = async (
    values: RegisterData,
    formikHelpers: FormikHelpers<RegisterData>
  ) => {
    setLoading(true);
    setGlobalError(null);

    try {
      await axios.post(
        "/auth/register",
        {
          email: values.email,
          username: values.username,
          password: values.password,
          registerAsPhotographer: values.registerAsPhotographer,
        }
      );

      router.push("/login");
    } catch (err: any) {
      const response = err.response;

      if (response?.data?.errors && Array.isArray(response.data.errors)) {
        const fieldErrors: Array<{ path: string; msg: string }> =
          response.data.errors;

        fieldErrors.forEach(({ path, msg }) => {
          if (
            path === "email" ||
            path === "username" ||
            path === "password"
          ) {
            formikHelpers.setFieldError(path as keyof RegisterData, msg);
          }
        });
      } else {
        setGlobalError(response?.data?.error || "Eroare la înregistrare.");
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
          <h2 className="mb-4 text-center">Înregistrare</h2>

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
            validationSchema={validationSchema}
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

                <Form.Group controlId="username" className="mb-3">
                  <Form.Label>Nume de utilizator</Form.Label>
                  <Field
                    name="username"
                    type="text"
                    as={Form.Control}
                    placeholder="numeutilizator"
                    isInvalid={touched.username && !!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    <ErrorMessage name="username" />
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

                <Form.Group controlId="registerAsPhotographer" className="mb-3">
                  <Field name="registerAsPhotographer">
                    {({ field }: { field: any }) => (
                      <Form.Check
                        type="switch"
                        id="registerAsPhotographer"
                        label="Înregistrare ca fotograf?"
                        checked={field.value}
                        onChange={field.onChange}
                        name={field.name}
                      />
                    )}
                  </Field>
                </Form.Group>

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
                        Se înregistrează…
                      </>
                    ) : (
                      "Înregistrare"
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
