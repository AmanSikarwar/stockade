import { useState } from "react";

import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../api/customers";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyCustomers } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { PersonCell } from "../components/ui/EntityCell";
import { FormField } from "../components/ui/FormField";
import { IconButton } from "../components/ui/IconButton";
import { ConfirmModal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchField } from "../components/ui/SearchField";
import { TableSkeleton } from "../components/ui/Skeleton";

const PAGE_SIZE = 10;

const emptyCustomerForm = {
  email: "",
  full_name: "",
  phone_number: "",
};

export default function CustomersPage() {
  const { notify } = useNotifications();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ limit: PAGE_SIZE, offset: 0, q: "", sort_dir: "desc" });
  const [formCustomer, setFormCustomer] = useState(null);
  const customersQuery = useCustomers(filters);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const rows = customersQuery.data?.items ?? [];
  const total = customersQuery.data?.total ?? 0;

  const columns = [
    {
      header: "Customer",
      key: "full_name",
      sortable: true,
      render: (customer) => <PersonCell name={customer.full_name} sub={customer.email} />,
    },
    {
      header: "Phone",
      key: "phone_number",
      render: (customer) =>
        customer.phone_number ? (
          <span className="t-num">{customer.phone_number}</span>
        ) : (
          <span className="muted">Not set</span>
        ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (customer) => (
        <div className="row-actions">
          <IconButton
            icon="edit"
            label={`Edit ${customer.full_name}`}
            variant="secondary"
            size="sm"
            onClick={() => openForm(customer)}
          />
          <IconButton
            icon="trash"
            label={`Delete ${customer.full_name}`}
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(customer)}
          />
        </div>
      ),
    },
  ];

  function openForm(customer) {
    createCustomer.reset();
    updateCustomer.reset();
    setFormCustomer(customer ?? emptyCustomerForm);
  }

  function updateSearch(value) {
    setFilters((current) => ({ ...current, offset: 0, q: value }));
  }

  function changePage(offset) {
    setFilters((current) => ({ ...current, offset }));
  }

  function handleSort(key) {
    setFilters((current) => ({
      ...current,
      offset: 0,
      sort_by: key,
      sort_dir: current.sort_by === key && current.sort_dir === "asc" ? "desc" : "asc",
    }));
  }

  async function handleSubmit(payload) {
    if (formCustomer?.id) {
      const customer = await updateCustomer.mutateAsync({
        customerId: formCustomer.id,
        payload,
      });
      notify({
        message: `${customer.full_name} was updated.`,
        tone: "success",
        title: "Customer saved",
      });
      setFormCustomer(null);
      return;
    }

    const customer = await createCustomer.mutateAsync(payload);
    notify({
      message: `${customer.full_name} was created.`,
      tone: "success",
      title: "Customer added",
    });
    setFormCustomer(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      notify({ message: `${deleteTarget.full_name} was deleted.`, tone: "success" });
      setDeleteTarget(null);
    } catch (error) {
      notify({
        message: error.message || "Unable to delete customer.",
        title: "Delete failed",
        tone: "danger",
      });
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Customers"
        subtitle={`${total} ${total === 1 ? "customer" : "customers"}`}
        actions={
          <Button icon="plus" onClick={() => openForm()}>
            New customer
          </Button>
        }
      />

      {formCustomer ? (
        <CustomerFormCard
          key={formCustomer.id ?? "new"}
          customer={formCustomer}
          error={(createCustomer.error || updateCustomer.error)?.message}
          isSaving={createCustomer.isPending || updateCustomer.isPending}
          onCancel={() => setFormCustomer(null)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <Card
        title="All customers"
        count={total}
        toolbar={
          <>
            <SearchField
              label="Search customers"
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search customers…"
              value={filters.q}
            />
            <IconButton
              icon="refresh"
              label="Refresh customers"
              variant="secondary"
              onClick={() => customersQuery.refetch()}
            />
          </>
        }
        footer={
          total > 0 ? (
            <Pagination
              total={total}
              limit={filters.limit}
              offset={filters.offset}
              onChange={changePage}
            />
          ) : null
        }
      >
        {customersQuery.isPending ? (
          <TableSkeleton columns={columns} />
        ) : customersQuery.isError ? (
          <div className="card-pad">
            <Alert tone="danger" title="Customers unavailable">
              {customersQuery.error.message || "Unable to load customers."}
            </Alert>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            sort={{ by: filters.sort_by, dir: filters.sort_dir }}
            onSort={handleSort}
            empty={
              <div className="empty-state">
                <EmptyCustomers />
                <h3>No customers yet</h3>
                <p>Add a customer to start creating orders against their account.</p>
                <Button icon="plus" onClick={() => openForm()}>
                  New customer
                </Button>
              </div>
            }
          />
        )}
      </Card>

      {deleteTarget ? (
        <ConfirmModal
          title="Delete this customer?"
          message={`“${deleteTarget.full_name}” will be deleted. Past orders keep their captured details.`}
          confirmLabel="Delete customer"
          isLoading={deleteCustomer.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}

function CustomerFormCard({ customer, error, isSaving, onCancel, onSubmit }) {
  const isEditing = Boolean(customer?.id);
  const [form, setForm] = useState(() => ({
    email: customer?.email ?? "",
    full_name: customer?.full_name ?? "",
    phone_number: customer?.phone_number ?? "",
  }));
  const [validationError, setValidationError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const payload = {
      email: form.email.trim(),
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim() || null,
    };
    const invalidMessage = validateCustomerPayload(payload);
    if (invalidMessage) {
      setValidationError(invalidMessage);
      return;
    }

    try {
      await onSubmit(payload);
    } catch {
      // Mutation state renders the API error through the shared alert below.
    }
  }

  return (
    <Card title={isEditing ? "Edit customer" : "New customer"} pad>
      <form onSubmit={handleSubmit} className="stack">
        <div className="form-grid">
          <FormField
            className="span-2"
            id="customer-full-name"
            label="Full name"
            maxLength="255"
            onChange={(event) => updateField("full_name", event.target.value)}
            placeholder="e.g. Mara Okonkwo"
            required
            value={form.full_name}
          />
          <FormField
            autoComplete="email"
            id="customer-email"
            inputMode="email"
            label="Email"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="name@company.com"
            required
            type="email"
            value={form.email}
          />
          <FormField
            id="customer-phone"
            label="Phone number"
            hint="Optional"
            maxLength="50"
            onChange={(event) => updateField("phone_number", event.target.value)}
            placeholder="+91 98765 43210"
            type="tel"
            value={form.phone_number}
          />
        </div>

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="form-actions">
          <Button icon="check" isLoading={isSaving} type="submit">
            {isEditing ? "Save customer" : "Create customer"}
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function validateCustomerPayload(payload) {
  if (!payload.full_name) {
    return "Full name is required.";
  }
  if (!payload.email) {
    return "Email is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Enter a valid email address.";
  }
  return "";
}
