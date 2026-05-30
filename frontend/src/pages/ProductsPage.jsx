import { useState } from "react";

import { useDashboardMetrics } from "../api/dashboard";
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "../api/products";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyProducts } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormField } from "../components/ui/FormField";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { SearchField } from "../components/ui/SearchField";
import { StatusBadge } from "../components/ui/StatusBadge";

const emptyProductForm = {
  name: "",
  price: "",
  quantity_in_stock: "",
  sku: "",
};

export default function ProductsPage() {
  const { notify } = useNotifications();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [filters, setFilters] = useState({ include_inactive: false, limit: 50, offset: 0, q: "" });
  const [formProduct, setFormProduct] = useState(null);
  const productsQuery = useProducts(filters);
  const dashboardQuery = useDashboardMetrics({ low_stock_limit: 1 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const threshold = dashboardQuery.data?.low_stock_threshold ?? 5;

  const rows = productsQuery.data?.items ?? [];
  const columns = [
    { header: "Name", key: "name" },
    {
      header: "SKU",
      key: "sku",
      render: (product) => <span className="t-num">{product.sku}</span>,
    },
    {
      header: "Price",
      key: "price",
      render: (product) => <span className="t-num">{formatCurrency(product.price)}</span>,
    },
    {
      header: "Stock",
      key: "quantity_in_stock",
      render: (product) => (
        <StatusBadge tone={getStockTone(product.quantity_in_stock, threshold)}>
          {getStockLabel(product.quantity_in_stock, threshold)}
        </StatusBadge>
      ),
    },
    {
      header: "State",
      key: "active",
      render: (product) => (
        <StatusBadge tone={product.active ? "success" : "info"}>
          {product.active ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (product) => {
        const isConfirmingDelete = confirmingDeleteId === product.id;
        return (
          <div className="row-actions">
            <Button icon="edit" onClick={() => openForm(product)} variant="secondary">
              Edit
            </Button>
            <Button
              icon="trash"
              isLoading={deleteProduct.isPending && deleteProduct.variables === product.id}
              onClick={() =>
                isConfirmingDelete ? handleDelete(product) : setConfirmingDeleteId(product.id)
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

  function openForm(product) {
    createProduct.reset();
    updateProduct.reset();
    setConfirmingDeleteId(null);
    setFormProduct(product);
  }

  function updateSearch(value) {
    setFilters((current) => ({ ...current, offset: 0, q: value }));
  }

  function toggleInactive(event) {
    setFilters((current) => ({
      ...current,
      include_inactive: event.target.checked,
      offset: 0,
    }));
  }

  async function handleSubmit(payload) {
    if (formProduct?.id) {
      const product = await updateProduct.mutateAsync({ payload, productId: formProduct.id });
      notify({ message: `${product.name} was updated.`, tone: "success", title: "Product saved" });
      setFormProduct(null);
      return;
    }

    const product = await createProduct.mutateAsync(payload);
    notify({ message: `${product.name} was created.`, tone: "success", title: "Product added" });
    setFormProduct(null);
  }

  async function handleDelete(product) {
    try {
      await deleteProduct.mutateAsync(product.id);
      setConfirmingDeleteId(null);
      notify({ message: `${product.name} was removed from active inventory.`, tone: "success" });
    } catch (error) {
      notify({
        message: error.message || "Unable to delete product.",
        title: "Delete failed",
        tone: "danger",
      });
    }
  }

  const mutationError = createProduct.error || updateProduct.error;
  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <section className="page-stack" aria-labelledby="products-heading">
      <PageHeader
        actions={
          <Button icon="plus" onClick={() => openForm(emptyProductForm)}>
            New product
          </Button>
        }
        eyebrow="Products"
        title="Product management"
      >
        Track SKU, price, stock quantity, and active state for every product.
      </PageHeader>

      {formProduct ? (
        <ProductFormPanel
          error={mutationError?.message}
          isSaving={isSaving}
          onCancel={() => setFormProduct(null)}
          onSubmit={handleSubmit}
          product={formProduct}
        />
      ) : null}

      <Panel
        actions={
          <label className="checkbox-control">
            <input checked={filters.include_inactive} onChange={toggleInactive} type="checkbox" />
            Include inactive
          </label>
        }
        description={`${productsQuery.data?.total ?? 0} products found.`}
        title="Inventory list"
      >
        <div className="toolbar">
          <SearchField
            label="Search products"
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by name or SKU"
            value={filters.q}
          />
          <Button
            icon="refresh"
            isLoading={productsQuery.isFetching}
            onClick={() => productsQuery.refetch()}
            variant="secondary"
          >
            Refresh
          </Button>
        </div>

        {productsQuery.isPending ? <LoadingState label="Loading products..." /> : null}
        {productsQuery.isError ? (
          <Alert tone="danger" title="Products unavailable">
            {productsQuery.error.message || "Unable to load products."}
          </Alert>
        ) : null}
        {!productsQuery.isPending && !productsQuery.isError ? (
          rows.length ? (
            <DataTable columns={columns} rows={rows} />
          ) : (
            <div className="empty-state">
              <EmptyProducts />
              <p>No products match the current filters.</p>
            </div>
          )
        ) : null}
      </Panel>
    </section>
  );
}

function ProductFormPanel({ error, isSaving, onCancel, onSubmit, product }) {
  const isEditing = Boolean(product.id);
  const [form, setForm] = useState(() => ({
    name: product.name ?? "",
    price: product.price ?? "",
    quantity_in_stock:
      product.quantity_in_stock === undefined ? "" : String(product.quantity_in_stock),
    sku: product.sku ?? "",
  }));
  const [validationError, setValidationError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const payload = normalizeProductPayload(form);
    const invalidMessage = validateProductPayload(payload);
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
      description="Required fields are validated before submission; server rules remain authoritative."
      title={isEditing ? "Edit product" : "Create product"}
    >
      <form className="entity-form" onSubmit={handleSubmit}>
        <FormField
          id="product-name"
          label="Name"
          maxLength="255"
          onChange={(event) => updateField("name", event.target.value)}
          required
          value={form.name}
        />
        <FormField
          id="product-sku"
          label="SKU"
          maxLength="100"
          onChange={(event) => updateField("sku", event.target.value)}
          required
          value={form.sku}
        />
        <FormField
          id="product-price"
          inputMode="decimal"
          label="Price"
          min="0"
          onChange={(event) => updateField("price", event.target.value)}
          required
          step="0.01"
          type="number"
          value={form.price}
        />
        <FormField
          id="product-stock"
          inputMode="numeric"
          label="Quantity in stock"
          min="0"
          onChange={(event) => updateField("quantity_in_stock", event.target.value)}
          required
          step="1"
          type="number"
          value={form.quantity_in_stock}
        />

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="form-actions">
          <Button isLoading={isSaving} type="submit">
            {isEditing ? "Save product" : "Create product"}
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function normalizeProductPayload(form) {
  return {
    name: form.name.trim(),
    price: form.price,
    quantity_in_stock: Number(form.quantity_in_stock),
    sku: form.sku.trim(),
  };
}

function validateProductPayload(payload) {
  if (!payload.name) {
    return "Product name is required.";
  }
  if (!payload.sku) {
    return "SKU is required.";
  }
  if (Number.isNaN(Number(payload.price)) || Number(payload.price) < 0) {
    return "Price must be a non-negative amount.";
  }
  if (!Number.isInteger(payload.quantity_in_stock) || payload.quantity_in_stock < 0) {
    return "Quantity in stock must be a non-negative whole number.";
  }
  return "";
}

function getStockTone(quantity, threshold) {
  if (quantity === 0) {
    return "danger";
  }
  if (quantity <= threshold) {
    return "warning";
  }
  return "success";
}

function getStockLabel(quantity, threshold) {
  if (quantity === 0) {
    return "Out of stock";
  }
  if (quantity <= threshold) {
    return `${quantity} low`;
  }
  return `${quantity} in stock`;
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(numericValue);
}
