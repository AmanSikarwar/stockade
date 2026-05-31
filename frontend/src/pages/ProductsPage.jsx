import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { useDashboardMetrics } from "../api/dashboard";
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "../api/products";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyProducts } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { ProductCell } from "../components/ui/EntityCell";
import { FormField } from "../components/ui/FormField";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Pill, StockPill } from "../components/ui/Pill";
import { Pagination } from "../components/ui/Pagination";
import { SearchField } from "../components/ui/SearchField";
import { formatCurrency } from "../lib/format";

const PAGE_SIZE = 10;

const emptyProductForm = {
  name: "",
  price: "",
  quantity_in_stock: "",
  sku: "",
};

export default function ProductsPage() {
  const { notify } = useNotifications();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [filters, setFilters] = useState({
    include_inactive: false,
    limit: PAGE_SIZE,
    offset: 0,
    q: queryParam,
  });
  const [formProduct, setFormProduct] = useState(null);

  // Honor the global topbar search (which navigates here with ?q=).
  useEffect(() => {
    setFilters((current) =>
      current.q === queryParam ? current : { ...current, offset: 0, q: queryParam },
    );
  }, [queryParam]);
  const productsQuery = useProducts(filters);
  const dashboardQuery = useDashboardMetrics({ low_stock_limit: 1 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const threshold = dashboardQuery.data?.low_stock_threshold ?? 5;

  const rows = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;

  const columns = [
    {
      header: "Product",
      key: "name",
      render: (product) => <ProductCell name={product.name} sku={product.sku} />,
    },
    {
      header: "On hand",
      key: "quantity_in_stock",
      align: "right",
      cellClassName: "num cell-strong",
      render: (product) => product.quantity_in_stock.toLocaleString("en-IN"),
    },
    {
      header: "Unit price",
      key: "price",
      align: "right",
      cellClassName: "num",
      render: (product) => formatCurrency(product.price),
    },
    {
      header: "Stock",
      key: "stock",
      render: (product) => <StockPill quantity={product.quantity_in_stock} threshold={threshold} />,
    },
    {
      header: "State",
      key: "active",
      render: (product) => (
        <Pill tone={product.active ? "info" : "neutral"}>
          {product.active ? "Active" : "Inactive"}
        </Pill>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (product) => {
        const isConfirmingDelete = confirmingDeleteId === product.id;
        if (isConfirmingDelete) {
          return (
            <div className="row-actions">
              <Button
                size="sm"
                variant="danger"
                isLoading={deleteProduct.isPending && deleteProduct.variables === product.id}
                onClick={() => handleDelete(product)}
              >
                Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmingDeleteId(null)}>
                Cancel
              </Button>
            </div>
          );
        }
        return (
          <div className="row-actions">
            <IconButton
              icon="edit"
              label={`Edit ${product.name}`}
              variant="secondary"
              size="sm"
              onClick={() => openForm(product)}
            />
            <IconButton
              icon="trash"
              label={`Delete ${product.name}`}
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDeleteId(product.id)}
            />
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
    setFilters((current) => ({ ...current, include_inactive: event.target.checked, offset: 0 }));
  }

  function changePage(offset) {
    setFilters((current) => ({ ...current, offset }));
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
    <div className="page">
      <PageHeader
        title="Products"
        subtitle={`${total} ${total === 1 ? "item" : "items"} in the catalog`}
        actions={
          <Button icon="plus" onClick={() => openForm(emptyProductForm)}>
            New product
          </Button>
        }
      />

      {formProduct ? (
        <ProductFormCard
          error={mutationError?.message}
          isSaving={isSaving}
          onCancel={() => setFormProduct(null)}
          onSubmit={handleSubmit}
          product={formProduct}
        />
      ) : null}

      <Card
        title="Catalog"
        count={total}
        toolbar={
          <>
            <SearchField
              label="Search products"
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search products…"
              value={filters.q}
            />
            <label className="ctl">
              <input checked={filters.include_inactive} onChange={toggleInactive} type="checkbox" />
              <span className="ctl-box">
                {filters.include_inactive ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12.5 9.7 17 19 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="t-caption">Include inactive</span>
            </label>
            <IconButton
              icon="refresh"
              label="Refresh products"
              variant="secondary"
              onClick={() => productsQuery.refetch()}
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
        {productsQuery.isPending ? (
          <LoadingState label="Loading products..." />
        ) : productsQuery.isError ? (
          <div className="card-pad">
            <Alert tone="danger" title="Products unavailable">
              {productsQuery.error.message || "Unable to load products."}
            </Alert>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <div className="empty-state">
                <EmptyProducts />
                <h3>No products yet</h3>
                <p>Create your first product to start tracking stock and pricing.</p>
                <Button icon="plus" onClick={() => openForm(emptyProductForm)}>
                  New product
                </Button>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
}

function ProductFormCard({ error, isSaving, onCancel, onSubmit, product }) {
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
    <Card title={isEditing ? "Edit product" : "New product"} pad>
      <form onSubmit={handleSubmit} className="stack">
        <div className="form-grid">
          <FormField
            className="span-2"
            id="product-name"
            label="Product name"
            maxLength="255"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="e.g. Kraft mailer · L"
            required
            value={form.name}
          />
          <FormField
            id="product-sku"
            label="SKU"
            hint="Unique per organization"
            maxLength="100"
            onChange={(event) => updateField("sku", event.target.value)}
            placeholder="STK-0001"
            required
            value={form.sku}
          />
          <FormField
            id="product-price"
            inputMode="decimal"
            label="Unit price (₹)"
            min="0"
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="0.00"
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
            placeholder="0"
            required
            step="1"
            type="number"
            value={form.quantity_in_stock}
          />
        </div>

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="form-actions">
          <Button icon="check" isLoading={isSaving} type="submit">
            {isEditing ? "Save product" : "Create product"}
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
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
