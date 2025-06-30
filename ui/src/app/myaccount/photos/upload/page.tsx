"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import photoPricePreview from "@/lib/photoPricePreview";

import {
  Container,
  Spinner,
  Alert,
  Button,
  Form as BootstrapForm,
  ButtonGroup,
  InputGroup,
} from "react-bootstrap";
import { Formik, Form as FormikForm, Field, FormikHelpers } from "formik";
import * as Yup from "yup";

import Select from "react-select";
import { ethers } from "ethers";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";

interface Category {
  _id: string;
  title: string;
}

interface Tag {
  _id: string;
  title: string;
}

interface Option {
  value: string;
  label: string;
}

interface UploadFormValues {
  file: File | null;
  title: string;
  description: string;
  location?: string;
  category: Option | null;
  tags: Option[];
  ethPriceStr: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, isPhotographer, loading: userLoading } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
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

      setLoadingOptions(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          axios.get<{ categories: Category[] }>("/main/all-categories"),
          axios.get<{ tags: Tag[] }>("/main/all-tags"),
        ]);
        setCategories(catRes.data.categories);
        setTags(tagRes.data.tags);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(err);
        setFetchError("Eroare la încărcarea categoriilor și tag-urilor.");
      } finally {
        setLoadingOptions(false);
      }
    };
    init();
  }, [router, user, isPhotographer, userLoading]);

  const categoryOptions: Option[] = categories.map((c) => ({
    value: c._id,
    label: c.title,
  }));
  const tagOptions: Option[] = tags.map((t) => ({
    value: t._id,
    label: t.title,
  }));

  const UploadSchema = Yup.object().shape({
    file: Yup.mixed<File>()
      .required("Fișierul este obligatoriu.")
      .test("fileFormat", "Doar JPG, JPEG sau PNG sunt acceptate.", (value) => {
        if (!value) return false;
        return ["image/jpeg", "image/jpg", "image/png"].includes(value.type);
      }),
    title: Yup.string().required("Titlul este obligatoriu."),
    description: Yup.string().max(
      500,
      "Descrierea nu poate depăși 500 caractere."
    ),
    category: Yup.object<Option>()
      .nullable()
      .required("Categoria este obligatorie."),
    tags: Yup.array().of(Yup.object<Option>()),
    location: Yup.string().max(
      128,
      "Locația poate avea maxim 128 de caractere."
    ),
    ethPriceStr: Yup.string()
      .required("Prețul este obligatoriu.")
      .test("isDecimal", "Introduceți un număr valid (ex: 0.05).", (value) => {
        if (!value) return false;
        return /^\d+(\.\d+)?$/.test(value);
      })
      .test(
        "isMinPrice",
        "Prețul minim trebuie să fie 0.00001 ETH.",
        (value) => {
          if (!value) return false;
          try {
            return (
              ethers.parseEther(value).valueOf() >=
              ethers.parseEther("0.00001").valueOf()
            );
          } catch {
            return false;
          }
        }
      ),
  });

  const initialValues: UploadFormValues = {
    file: null,
    title: "",
    description: "",
    category: null,
    tags: [],
    location: "",
    ethPriceStr: "",
  };

  const handleSubmit = async (
    values: UploadFormValues,
    formikHelpers: FormikHelpers<UploadFormValues>
  ) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!values.file) {
      setSubmitError("Fișierul este obligatoriu.");
      return;
    }

    let totalPriceEthString = values.ethPriceStr;
    try {
      const netWei: bigint = ethers.parseEther(values.ethPriceStr.trim());
      const { totalPriceWei } = photoPricePreview(netWei);
      totalPriceEthString = ethers.formatEther(totalPriceWei);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setSubmitError("Preț net invalid.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", values.file);
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("category", values.category!.value);

      values.tags.forEach((tag) => {
        formData.append("tags", tag.value);
      });

      if (values.location) {
        formData.append("location", values.location);
      }

      formData.append("ethPriceStr", totalPriceEthString);

      const res = await axios.post("/files/upload", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitSuccess(res.data?.message || "Fișier încărcat.");
      formikHelpers.resetForm();
      toast.success("Fotografia a fost încărcată.");
      router.push("/myaccount/photos");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.error || "Eroare la încărcare. Încercați din nou."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Trebuie să vă autentificați pentru a încărca fotografii.
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

  if (loadingOptions) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Se încarcă...</p>
      </Container>
    );
  }

  if (fetchError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{fetchError}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Încarcă o fotografie nouă</h2>

      {submitSuccess && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSubmitSuccess(null)}
        >
          {submitSuccess}
        </Alert>
      )}
      {submitError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setSubmitError(null)}
        >
          {submitError}
        </Alert>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={UploadSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          setFieldValue,
          setFieldTouched,
          isValid,
          dirty,
        }) => {
          let feeEthStr = "";
          let totalPriceEthStr = "";
          const rawEthPriceStr = values.ethPriceStr.trim();
          if (rawEthPriceStr !== "" && /^\d+(\.\d+)?$/.test(rawEthPriceStr)) {
            try {
              const rawWeiPrice: bigint = ethers.parseEther(rawEthPriceStr);
              const { feeWei, totalPriceWei } = photoPricePreview(rawWeiPrice);
              feeEthStr = ethers.formatEther(feeWei);
              totalPriceEthStr = ethers.formatEther(totalPriceWei);
            } catch {}
          }
          return (
            <FormikForm>
              <BootstrapForm.Group className="mb-3">
                <BootstrapForm.Label>Fișier (JPG/JPEG/PNG)</BootstrapForm.Label>
                <input
                  name="file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  disabled={submitting}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSubmitError(null);
                    setFieldTouched("file", true);
                    const file = e.currentTarget.files?.[0] || null;
                    setFieldValue("file", file);
                  }}
                  className={`form-control ${
                    errors.file && touched.file ? "is-invalid" : ""
                  }`}
                />
                {errors.file && touched.file && (
                  <div className="invalid-feedback">{errors.file}</div>
                )}
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="title">
                <BootstrapForm.Label>Titlul fotografiei</BootstrapForm.Label>
                <Field
                  name="title"
                  type="text"
                  className={`form-control ${
                    errors.title && touched.title ? "is-invalid" : ""
                  }`}
                  disabled={submitting}
                />
                {errors.title && touched.title && (
                  <div className="invalid-feedback">{errors.title}</div>
                )}
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="description">
                <BootstrapForm.Label>Descriere (opțional)</BootstrapForm.Label>
                <Field
                  name="description"
                  as="textarea"
                  rows={3}
                  className={`form-control ${
                    errors.description && touched.description
                      ? "is-invalid"
                      : ""
                  }`}
                  disabled={submitting}
                />
                {errors.description && touched.description && (
                  <div className="invalid-feedback">{errors.description}</div>
                )}
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3">
                <BootstrapForm.Label>Categorie</BootstrapForm.Label>
                <Select
                  options={categoryOptions}
                  value={values.category}
                  isClearable={false}
                  isDisabled={submitting}
                  onChange={(opt) => {
                    setSubmitError(null);
                    setFieldValue("category", opt);
                  }}
                  className={
                    errors.category && touched.category ? "is-invalid" : ""
                  }
                />
                {errors.category && touched.category && (
                  <div className="invalid-feedback d-block">
                    {errors.category as string}
                  </div>
                )}
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3">
                <BootstrapForm.Label>Tag-uri (opțional)</BootstrapForm.Label>
                <Select
                  options={tagOptions}
                  isMulti
                  value={values.tags}
                  isDisabled={submitting}
                  onChange={(opts) => {
                    setFieldValue("tags", opts || []);
                  }}
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="location">
                <BootstrapForm.Label>Locație (opțional)</BootstrapForm.Label>
                <Field
                  name="location"
                  type="text"
                  className={`form-control ${
                    errors.location && touched.location ? "is-invalid" : ""
                  }`}
                  disabled={submitting}
                />
                {errors.location && touched.location && (
                  <div className="invalid-feedback">{errors.location}</div>
                )}
              </BootstrapForm.Group>

              <BootstrapForm.Group className="mb-3" controlId="ethPriceStr">
                <BootstrapForm.Label>Preț fotografie (ETH)</BootstrapForm.Label>
                <Field
                  name="ethPriceStr"
                  type="text"
                  className={`form-control ${
                    errors.ethPriceStr && touched.ethPriceStr
                      ? "is-invalid"
                      : ""
                  }`}
                  disabled={submitting}
                />
                {errors.ethPriceStr && touched.ethPriceStr && (
                  <div className="invalid-feedback">{errors.ethPriceStr}</div>
                )}
              </BootstrapForm.Group>

              {feeEthStr && totalPriceEthStr && (
                <InputGroup className="mb-3">
                  <InputGroup.Text>Taxă platformă (15%)</InputGroup.Text>
                  <BootstrapForm.Control disabled value={feeEthStr + " ETH"} />
                  <InputGroup.Text>Preț total</InputGroup.Text>
                  <BootstrapForm.Control
                    disabled
                    value={totalPriceEthStr + " ETH"}
                  />
                </InputGroup>
              )}

              <div className="d-flex justify-content-center">
                <ButtonGroup className="w-100">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || !(isValid && dirty)}
                  >
                    {submitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Se încarcă fișierul...
                      </>
                    ) : (
                      "Încarcă fotografia"
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/myaccount/photos")}
                    disabled={submitting}
                  >
                    Înapoi
                  </Button>
                </ButtonGroup>
              </div>
            </FormikForm>
          );
        }}
      </Formik>
    </Container>
  );
}
