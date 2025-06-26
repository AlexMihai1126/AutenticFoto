'use client';

import { AdminEditableTableEntry } from '@/lib/commonInterfaces';
import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

interface EditableTableProps {
  entries: AdminEditableTableEntry[];
  type: 'tags' | 'categories';
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFields: Partial<AdminEditableTableEntry>) => void;
}

export default function EditableTable({
  entries,
  type,
  onDelete,
  onUpdate,
}: EditableTableProps) {
  const [editedValues, setEditedValues] = useState<Record<string, Partial<AdminEditableTableEntry>>>({});

  const handleFieldChange = (
    id: string,
    field: keyof AdminEditableTableEntry,
    value: string | number
  ) => {
    setEditedValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'order' ? Number(value) : value,
      },
    }));
  };

  const handleUpdate = (id: string) => {
    const updated = editedValues[id];
    if (updated && Object.keys(updated).length > 0) {
      onUpdate(id, updated);
    }
  };

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Titlu</th>
          <th>Slug URL</th>
          {type === 'categories' && <th>Ordine</th>}
          <th>Descriere</th>
          <th>Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry._id}>
            <td>{entry.title}</td>
            <td>
              <Form.Control
                type="text"
                value={editedValues[entry._id]?.slug ?? entry.slug ?? ''}
                onChange={(e) =>
                  handleFieldChange(entry._id, 'slug', e.target.value)
                }
              />
            </td>
            {type === 'categories' && (
              <td>
                <Form.Control
                  type="number"
                  value={
                    editedValues[entry._id]?.order ?? entry.order?.toString() ?? ''
                  }
                  onChange={(e) =>
                    handleFieldChange(entry._id, 'order', e.target.value)
                  }
                />
              </td>
            )}
            <td>
              <Form.Control
                as="textarea"
                rows={2}
                value={
                  editedValues[entry._id]?.description ?? entry.description ?? ''
                }
                onChange={(e) =>
                  handleFieldChange(entry._id, 'description', e.target.value)
                }
              />
            </td>
            <td className="d-flex gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdate(entry._id)}
              >
                Actualizează
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(entry._id)}
              >
                Șterge
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
