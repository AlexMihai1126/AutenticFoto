/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  ButtonGroup,
  Form,
  Row,
  Col,
  Container,
  Alert,
  Spinner,
} from "react-bootstrap";
import axios from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import EditableTable from "./components/table";
import { AdminEditableTableEntry } from "@/lib/commonInterfaces";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type EntryType = "tags" | "categories";

export default function TagCategoryManager() {
  const router = useRouter();
  const [view, setView] = useState<EntryType>("tags");
  const [entries, setEntries] = useState<AdminEditableTableEntry[]>([]);
  const [form, setForm] = useState<Partial<AdminEditableTableEntry>>({});
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading, isAdmin } = useUser();

  const fetchEntries = useCallback(async () => {
    try {
      const res = await axios.get(`/admin/${view}`);
      setEntries(res.data[view]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError("Eroare încărcare date.");
    }
  }, [view]);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      toast.error("Trebuie să vă autentificați pentru a continua.");
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      toast.error("Nu aveți acces.");
      router.replace("/");
      return;
    }

    fetchEntries();
    setForm({});
    setError(null);
  }, [user, isAdmin, userLoading, fetchEntries, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.slug) {
      setError("Slug URL și titlul sunt necesare.");
      return;
    }

    try {
      await axios.post(`/admin/${view}`, form);
      setForm({});
      await fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare creare obiect nou.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/admin/${view}/${id}`);
      await fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare ștergere obiect.");
    }
  };

  const handleUpdate = async (
    id: string,
    updatedFields: Partial<AdminEditableTableEntry>
  ) => {
    try {
      await axios.put(`/admin/${view}/${id}`, updatedFields);
      await fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare actualizare obiect.");
    }
  };

  if (userLoading) {
    return (
      <Container className="py-4 w-50 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!user) return;

  if (!isAdmin) return;

  return (
    <Container className="py-4">
      <h2 className="mb-4">
        Panou admin | {view === "tags" ? "Tag-uri" : "Categorii"}
      </h2>

      <ButtonGroup className="mb-3">
        <Button
          variant={view === "tags" ? "primary" : "outline-primary"}
          onClick={() => setView("tags")}
        >
          Vezi tag-uri
        </Button>
        <Button
          variant={view === "categories" ? "primary" : "outline-primary"}
          onClick={() => setView("categories")}
        >
          Vezi categorii
        </Button>
      </ButtonGroup>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <EditableTable
        entries={entries}
        type={view}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />

      <h4 className="mt-5">Adaugă {view === "tags" ? "tag" : "categorie"}</h4>
      <Form className="mt-3">
        <Row className="mb-2">
          <Col md={4}>
            <Form.Control
              name="title"
              placeholder="Titlu"
              value={form.title || ""}
              onChange={handleInputChange}
            />
          </Col>
          <Col md={4}>
            <Form.Control
              name="slug"
              placeholder="URL-Slug"
              value={form.slug || ""}
              onChange={handleInputChange}
            />
          </Col>
          {view === "categories" && (
            <Col md={2}>
              <Form.Control
                name="order"
                type="number"
                placeholder="Ordine afișare"
                value={form.order ?? ""}
                onChange={handleInputChange}
              />
            </Col>
          )}
        </Row>
        <Row className="mb-3">
          <Col md={8}>
            <Form.Control
              name="description"
              as="textarea"
              rows={2}
              placeholder="Descriere"
              value={form.description || ""}
              onChange={handleInputChange}
            />
          </Col>
        </Row>
        <Button variant="success" onClick={handleCreate}>
          Creează {view === "tags" ? "tag" : "categorie"}
        </Button>
      </Form>
    </Container>
  );
}
