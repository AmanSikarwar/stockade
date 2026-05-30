import { useState } from "react";

import { useCreateCustomer, useCustomers, useDeleteCustomer } from "../api/customers";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyCustomers } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormField } from "../components/ui/FormField";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { SearchField } from "../components/ui/SearchField";

const emptyCustomerForm = {
  email: "",
  full_name: "",
  phone_number: "",
};

export default function CustomersPage() {
  const { notify } = useNotifications();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [filters, setFilters] = useState({ limit: 50, offset: 0, q: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const customersQuery = useCustomers(filters);
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const rows = customersQuery.data?.items ?? [];
  const columns = [
    { header: "Name", key: "full_name" },
    {
      header: "Email",
      key: "email",
      render: (customer) => <span className="t-num">{customer.email}</span>,
    },
    {
      header: "Phone",
      key: "phone_number",
      render: (customer) => customer.phone_number || <span className="muted-text">Not set</span>,
    },
    {
      header: "Actions",
      key: "actions",
      render: (customer) => {
        const isConfirmingDelete = confirmingDeleteId === customer.id;
        return (
          <div className="row-actions">
            <Button
              icon="trash"
              isLoading={deleteCustomer.isPending && deleteCustomer.variables === customer.id}
              onClick={() =>
                isConfirmingDelete ? handleDelete(customer) : setConfirmingDeleteId(customer.id)
              }
              variant={isConfirmingDelete ? "danger" : "secondary"}
            >
              {isConfirmingDelete ? "Confirm" : "Delete"}
            </Button>
            {isConfirmingDelete ? (
              <Button onClick={() => setConfirmingDeleteId(null)} variant="secondary">
                Cancel
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  function openForm() {
    createCustomer.reset();
    setConfirmingDeleteId(null);
    setIsFormOpen(true);
  }

  function updateSearch(value) {
    setFilters((current) => ({ ...current, offset: 0, q: value }));
  }

  async function handleSubmit(payload) {
    const customer = await createCustomer.mutateAsync(payload);
    notify({
      message: `${customer.full_name} was created.`,
      tone: "success",
      title: "Customer added",
    });
    setIsFormOpen(false);
  }

  async function handleDelete(customer) {
    try {
      await deleteCustomer.mutateAsync(customer.id);
      setConfirmingDeleteId(null);
      notify({ message: `${customer.full_name} was deleted.`, tone: "success" });
    } catch (error) {
      notify({
        message: error.message || "Unable to delete customer.",
        title: "Delete failed",
        tone: "danger",
      });
    }
  }

  return (
    <section className="page-stack" aria-labelledby="customers-heading">
      <PageHeader
        actions={
          <Button icon="plus" onClick={openForm}>
            New customer
          </Button>
        }
        eyebrow="Customers"
        title="Customer management"
      >
        Keep customer contact details organized for order creation and history.
      </PageHeader>

      {isFormOpen ? (
        <CustomerFormPanel
          error={createCustomer.error?.message}
          isSaving={createCustomer.isPending}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <Panel
        description={`${customersQuery.data?.total ?? 0} customers found.`}
        title="Customer list"
      >
        <div className="toolbar">
          <SearchField
            label="Search customers"
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by name or email"
            value={filters.q}
          />
          <Button
            icon="refresh"
            isLoading={customersQuery.isFetching}
            onClick={() => customersQuery.refetch()}
            variant="secondary"
          >
            Refresh
          </Button>
        </div>

        {customersQuery.isPending ? <LoadingState label="Loading customers..." /> : null}
        {customersQuery.isError ? (
          <Alert tone="danger" title="Customers unavailable">
            {customersQuery.error.message || "Unable to load customers."}
          </Alert>
        ) : null}
        {!customersQuery.isPending && !customersQuery.isError ? (
          rows.length ? (
            <DataTable columns={columns} rows={rows} />
          ) : (
            <div className="empty-state">
              <EmptyCustomers />
              <p>No customers match the current filters.</p>
            </div>
          )
        ) : null}
      </Panel>
    </section>
  );
}

function CustomerFormPanel({ error, isSaving, onCancel, onSubmit }) {
  const [form, setForm] = useState(emptyCustomerForm);
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
    <Panel
      className="form-panel"
      description="Email uniqueness is enforced per organization by the API."
      title="Create customer"
    >
      <form className="entity-form customer-form" onSubmit={handleSubmit}>
        <FormField
          id="customer-full-name"
          label="Full name"
          maxLength="255"
          onChange={(event) => updateField("full_name", event.target.value)}
          required
          value={form.full_name}
        />
        <FormField
          autoComplete="email"
          id="customer-email"
          inputMode="email"
          label="Email"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={form.email}
        />
        <FormField
          id="customer-phone"
          label="Phone number"
          maxLength="50"
          onChange={(event) => updateField("phone_number", event.target.value)}
          type="tel"
          value={form.phone_number}
        />

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="form-actions">
          <Button isLoading={isSaving} type="submit">
            Create customer
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
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
