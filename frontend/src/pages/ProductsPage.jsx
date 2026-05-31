import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useCategories } from "../api/categories";
import { useDashboardMetrics } from "../api/dashboard";
import {
  useAdjustStock,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useStockMovements,
  useUpdateProduct,
} from "../api/products";
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
import { Select } from "../components/ui/Select";
import { formatCurrency, formatDateTime } from "../lib/format";

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
  const [stockProduct, setStockProduct] = useState(null);

  // Honor the global topbar search (which navigates here with ?q=).
  useEffect(() => {
    setFilters((current) =>
      current.q === queryParam ? current : { ...current, offset: 0, q: queryParam },
    );
  }, [queryParam]);
  const productsQuery = useProducts(filters);
  const dashboardQuery = useDashboardMetrics({ low_stock_limit: 1 });
  const categoriesQuery = useCategories({ limit: 100, offset: 0 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const threshold = dashboardQuery.data?.low_stock_threshold ?? 5;

  const categories = categoriesQuery.data?.items ?? [];
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

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
      header: "Category",
      key: "category_id",
      render: (product) =>
        product.category_id && categoryMap.has(product.category_id) ? (
          <Pill tone="neutral" dot={false}>
            {categoryMap.get(product.category_id).name}
          </Pill>
        ) : (
          <span className="muted">—</span>
        ),
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
              icon="layers"
              label={`Adjust stock for ${product.name}`}
              variant="secondary"
              size="sm"
              onClick={() => openStock(product)}
            />
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
    setStockProduct(null);
    setFormProduct(product);
  }

  function openStock(product) {
    setConfirmingDeleteId(null);
    setFormProduct(null);
    setStockProduct(product);
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

  function changeCategory(event) {
    const value = event.target.value;
    setFilters((current) => ({ ...current, category_id: value || undefined, offset: 0 }));
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
          categories={categories}
          error={mutationError?.message}
          isSaving={isSaving}
          onCancel={() => setFormProduct(null)}
          onSubmit={handleSubmit}
          product={formProduct}
        />
      ) : null}

      {stockProduct ? (
        <StockPanel
          key={stockProduct.id}
          product={stockProduct}
          onClose={() => setStockProduct(null)}
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
            <div style={{ width: 170 }}>
              <Select
                aria-label="Filter by category"
                value={filters.category_id ?? ""}
                onChange={changeCategory}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
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

function ProductFormCard({ categories, error, isSaving, onCancel, onSubmit, product }) {
  const isEditing = Boolean(product.id);
  const [form, setForm] = useState(() => ({
    name: product.name ?? "",
    price: product.price ?? "",
    quantity_in_stock:
      product.quantity_in_stock === undefined ? "" : String(product.quantity_in_stock),
    sku: product.sku ?? "",
    category_id: product.category_id ?? "",
    reorder_point:
      product.reorder_point === undefined || product.reorder_point === null
        ? ""
        : String(product.reorder_point),
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
          <FormField id="product-category" label="Category">
            <Select
              id="product-category"
              value={form.category_id}
              onChange={(event) => updateField("category_id", event.target.value)}
            >
              <option value="">No category</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            id="product-reorder-point"
            inputMode="numeric"
            label="Reorder point"
            hint="Low-stock alert threshold; blank uses the global default."
            min="0"
            onChange={(event) => updateField("reorder_point", event.target.value)}
            placeholder="Default"
            step="1"
            type="number"
            value={form.reorder_point}
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

const MOVEMENT_REASONS = {
  order: { tone: "info", label: "Order" },
  cancellation: { tone: "neutral", label: "Cancellation" },
  manual: { tone: "neutral", label: "Manual" },
  correction: { tone: "warning", label: "Correction" },
  restock: { tone: "success", label: "Restock" },
  damage: { tone: "danger", label: "Damage" },
};

const ADJUST_REASONS = [
  { value: "restock", label: "Restock" },
  { value: "damage", label: "Damage / loss" },
  { value: "correction", label: "Correction" },
  { value: "manual", label: "Manual" },
];

function StockPanel({ product, onClose }) {
  const { notify } = useNotifications();
  const adjustStock = useAdjustStock();
  const movementsQuery = useStockMovements(product.id, { limit: 20, offset: 0 });
  const [current, setCurrent] = useState(product.quantity_in_stock);
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState("add");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState("");

  const movements = movementsQuery.data?.items ?? [];
  const total = movementsQuery.data?.total ?? 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      setValidationError("Enter a positive whole quantity.");
      return;
    }
    const delta = direction === "remove" ? -amount : amount;
    if (current + delta < 0) {
      setValidationError(`Cannot remove ${amount}; only ${current} in stock.`);
      return;
    }

    try {
      const updated = await adjustStock.mutateAsync({
        productId: product.id,
        payload: { delta, reason, note: note.trim() || null },
      });
      setCurrent(updated.quantity_in_stock);
      setQuantity("1");
      setNote("");
      notify({
        message: `${product.name} is now at ${updated.quantity_in_stock} in stock.`,
        tone: "success",
        title: "Stock adjusted",
      });
    } catch {
      // adjustStock.error renders through the alert below.
    }
  }

  const columns = [
    {
      header: "When",
      key: "created_at",
      render: (movement) => <span className="text-2">{formatDateTime(movement.created_at)}</span>,
    },
    {
      header: "Change",
      key: "delta",
      align: "right",
      cellClassName: "num cell-strong",
      render: (movement) => (
        <span
          style={{
            color: movement.delta >= 0 ? "var(--success-fg)" : "var(--danger-fg)",
          }}
        >
          {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
        </span>
      ),
    },
    {
      header: "On hand",
      key: "resulting_quantity",
      align: "right",
      cellClassName: "num",
      render: (movement) => movement.resulting_quantity,
    },
    {
      header: "Reason",
      key: "reason",
      render: (movement) => {
        const meta = MOVEMENT_REASONS[movement.reason] ?? {
          tone: "neutral",
          label: movement.reason,
        };
        return (
          <Pill tone={meta.tone} dot={false}>
            {meta.label}
          </Pill>
        );
      },
    },
    {
      header: "Reference",
      key: "reference",
      render: (movement) =>
        movement.reference_order_id ? (
          <Link className="table-link t-num" to={`/app/orders/${movement.reference_order_id}`}>
            #{movement.reference_order_id.slice(0, 8)}
          </Link>
        ) : movement.note ? (
          <span className="text-2">{movement.note}</span>
        ) : (
          <span className="muted">—</span>
        ),
    },
  ];

  return (
    <Card title={`Adjust stock · ${product.name}`} pad>
      <div className="stack">
        <div className="stat-inline">
          <div className="stat">
            <span className="k">SKU</span>
            <strong className="v t-num" style={{ fontSize: 18 }}>
              {product.sku}
            </strong>
          </div>
          <div className="stat">
            <span className="k">On hand</span>
            <strong className="v t-num">{current}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-grid">
            <FormField id="adjust-direction" label="Direction">
              <Select
                id="adjust-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
              >
                <option value="add">Add stock (+)</option>
                <option value="remove">Remove stock (−)</option>
              </Select>
            </FormField>
            <FormField
              id="adjust-quantity"
              inputMode="numeric"
              label="Quantity"
              min="1"
              onChange={(event) => setQuantity(event.target.value)}
              required
              step="1"
              type="number"
              value={quantity}
            />
            <FormField id="adjust-reason" label="Reason">
              <Select
                id="adjust-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {ADJUST_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="adjust-note"
              label="Note"
              hint="Optional"
              maxLength="255"
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Received PO #1234"
              value={note}
            />
          </div>

          {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
          {adjustStock.error ? <Alert tone="danger">{adjustStock.error.message}</Alert> : null}

          <div className="form-actions">
            <Button icon="check" isLoading={adjustStock.isPending} type="submit">
              Apply adjustment
            </Button>
            <Button onClick={onClose} type="button" variant="secondary">
              Close
            </Button>
          </div>
        </form>

        <div>
          <div className="t-micro muted" style={{ marginBottom: 10 }}>
            Movement history{total ? ` · ${total}` : ""}
          </div>
          {movementsQuery.isPending ? (
            <LoadingState label="Loading movements..." />
          ) : (
            <DataTable
              columns={columns}
              rows={movements}
              emptyMessage="No stock movements recorded yet."
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function normalizeProductPayload(form) {
  const reorderPoint = form.reorder_point === "" ? null : Number(form.reorder_point);
  return {
    name: form.name.trim(),
    price: form.price,
    quantity_in_stock: Number(form.quantity_in_stock),
    sku: form.sku.trim(),
    category_id: form.category_id || null,
    reorder_point: reorderPoint,
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
  if (
    payload.reorder_point !== null &&
    (!Number.isInteger(payload.reorder_point) || payload.reorder_point < 0)
  ) {
    return "Reorder point must be a non-negative whole number.";
  }
  return "";
}
