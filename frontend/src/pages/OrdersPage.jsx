import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "../api/client";
import { useCustomer, useCustomers } from "../api/customers";
import { useCancelOrder, useCreateOrder, useOrder, useOrders } from "../api/orders";
import { useProducts } from "../api/products";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyOrders } from "../components/illustrations/Illustrations";
import { Icon } from "../components/icons/Icon";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { ProductCell } from "../components/ui/EntityCell";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Pill } from "../components/ui/Pill";
import { Select } from "../components/ui/Select";
import { Tabs } from "../components/ui/Tabs";
import { formatCurrency, formatDateTime } from "../lib/format";

const PAGE_SIZE = 10;

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Cancelled", value: "cancelled" },
];

const emptyOrderLine = () => ({ clientId: crypto.randomUUID(), product_id: "", quantity: "1" });

function statusTone(status) {
  return status === "active" ? "success" : "danger";
}

export default function OrdersPage() {
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);

  const ordersQuery = useOrders({
    limit: PAGE_SIZE,
    offset,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const customersQuery = useCustomers({ limit: 100, offset: 0 });
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  const rows = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const customerMap = useMemo(
    () => new Map((customersQuery.data?.items ?? []).map((customer) => [customer.id, customer])),
    [customersQuery.data?.items],
  );

  function selectTab(value) {
    setStatusFilter(value);
    setOffset(0);
  }

  const columns = [
    {
      header: "Order",
      key: "id",
      render: (order) => (
        <Link className="table-link t-num" to={`/app/orders/${order.id}`}>
          #{order.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      header: "Customer",
      key: "customer_id",
      render: (order) => {
        const customer = customerMap.get(order.customer_id);
        return customer ? (
          customer.full_name
        ) : (
          <span className="t-num">{order.customer_id.slice(0, 8)}</span>
        );
      },
    },
    {
      header: "Date",
      key: "created_at",
      render: (order) => <span className="text-2">{formatDateTime(order.created_at)}</span>,
    },
    {
      header: "Total",
      key: "total_amount",
      align: "right",
      cellClassName: "num cell-strong",
      render: (order) => formatCurrency(order.total_amount),
    },
    {
      header: "Status",
      key: "status",
      render: (order) => (
        <Pill tone={statusTone(order.status)}>
          {order.status === "active" ? "Active" : "Cancelled"}
        </Pill>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (order) => {
        const isConfirming = confirmingCancelId === order.id;
        if (order.status !== "active") {
          return (
            <div className="row-actions">
              <Link className="btn btn-secondary btn-sm" to={`/app/orders/${order.id}`}>
                View
              </Link>
            </div>
          );
        }
        if (isConfirming) {
          return (
            <div className="row-actions">
              <Button
                size="sm"
                variant="danger"
                isLoading={cancelOrder.isPending && cancelOrder.variables === order.id}
                onClick={() => handleCancelOrder(order)}
              >
                Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmingCancelId(null)}>
                Keep
              </Button>
            </div>
          );
        }
        return (
          <div className="row-actions">
            <Link className="btn btn-secondary btn-sm" to={`/app/orders/${order.id}`}>
              View
            </Link>
            <IconButton
              icon="close"
              label={`Cancel order ${order.id.slice(0, 8)}`}
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingCancelId(order.id)}
            />
          </div>
        );
      },
    },
  ];

  async function handleCreateOrder(payload) {
    const order = await createOrder.mutateAsync(payload);
    notify({
      message: `Order #${order.id.slice(0, 8)} placed · server total ${formatCurrency(order.total_amount)}.`,
      tone: "success",
      title: "Order placed",
    });
    setIsFormOpen(false);
    navigate(`/app/orders/${order.id}`);
  }

  async function handleCancelOrder(order) {
    try {
      await cancelOrder.mutateAsync(order.id);
      setConfirmingCancelId(null);
      notify({
        message: `Order #${order.id.slice(0, 8)} cancelled · stock restored.`,
        tone: "success",
      });
    } catch (error) {
      notify({
        message: error.message || "Unable to cancel order.",
        title: "Cancel failed",
        tone: "danger",
      });
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Orders"
        subtitle={`${total} ${total === 1 ? "order" : "orders"}`}
        actions={
          <Button icon="plus" onClick={() => setIsFormOpen((open) => !open)}>
            New order
          </Button>
        }
      />

      {isFormOpen ? (
        <OrderBuilder
          error={createOrder.error}
          isSaving={createOrder.isPending}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={handleCreateOrder}
        />
      ) : null}

      <Card
        title="All orders"
        count={total}
        toolbar={<Tabs items={statusTabs} value={statusFilter} onChange={selectTab} />}
        footer={
          total > 0 ? (
            <Pagination total={total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
          ) : null
        }
      >
        {ordersQuery.isPending ? (
          <LoadingState label="Loading orders..." />
        ) : ordersQuery.isError ? (
          <div className="card-pad">
            <Alert tone="danger" title="Orders unavailable">
              {ordersQuery.error.message || "Unable to load orders."}
            </Alert>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <div className="empty-state">
                <EmptyOrders />
                <h3>No orders here</h3>
                <p>Create a multi-line order to reserve inventory and capture prices.</p>
                <Button icon="plus" onClick={() => setIsFormOpen(true)}>
                  New order
                </Button>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
}

function OrderBuilder({ error, isSaving, onCancel, onSubmit }) {
  const customersQuery = useCustomers({ limit: 100, offset: 0 });
  const productsQuery = useProducts({ limit: 100, offset: 0 });
  const [customerId, setCustomerId] = useState("");
  const [lineItems, setLineItems] = useState([emptyOrderLine()]);
  const [validationError, setValidationError] = useState("");

  const products = productsQuery.data?.items ?? [];
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const overStockLines = lineItems.filter((line) => {
    const product = productMap.get(line.product_id);
    return product && Number(line.quantity) > product.quantity_in_stock;
  });

  const subtotal = lineItems.reduce((sum, line) => {
    const product = productMap.get(line.product_id);
    const quantity = Number(line.quantity);
    if (!product || Number.isNaN(quantity)) {
      return sum;
    }
    return sum + Number(product.price) * quantity;
  }, 0);

  function updateLine(clientId, field, value) {
    setLineItems((current) =>
      current.map((line) => (line.clientId === clientId ? { ...line, [field]: value } : line)),
    );
  }

  function removeLine(clientId) {
    setLineItems((current) => current.filter((line) => line.clientId !== clientId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const payload = {
      customer_id: customerId,
      line_items: lineItems.map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
      })),
    };
    const invalidMessage = validateOrderPayload(payload);
    if (invalidMessage) {
      setValidationError(invalidMessage);
      return;
    }

    try {
      await onSubmit(payload);
    } catch {
      // Mutation error is surfaced through the shared alert below.
    }
  }

  const blockPlacement = overStockLines.length > 0;

  return (
    <Card title="New order" pad>
      <form onSubmit={handleSubmit} className="two-col wide-left">
        <div className="stack">
          <div className="field">
            <label className="field-label" htmlFor="order-customer">
              Customer
              <span className="req" aria-hidden="true">
                {" "}
                *
              </span>
            </label>
            <Select
              id="order-customer"
              disabled={customersQuery.isPending}
              onChange={(event) => setCustomerId(event.target.value)}
              required
              value={customerId}
            >
              <option value="">Select a customer…</option>
              {(customersQuery.data?.items ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.email})
                </option>
              ))}
            </Select>
          </div>

          <div className="field">
            <span className="field-label">Line items</span>
            <div className="order-lines-head">
              <span>Product</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {lineItems.map((line) => {
              const product = productMap.get(line.product_id);
              const quantity = Number(line.quantity) || 0;
              const lineTotal = product ? Number(product.price) * quantity : 0;
              const over = product && quantity > product.quantity_in_stock;
              return (
                <div className="order-line" key={line.clientId}>
                  <div className="field-product">
                    <Select
                      aria-label="Product"
                      disabled={productsQuery.isPending}
                      onChange={(event) =>
                        updateLine(line.clientId, "product_id", event.target.value)
                      }
                      required
                      value={line.product_id}
                    >
                      <option value="">Select a product…</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {option.sku} · {option.quantity_in_stock} available
                        </option>
                      ))}
                    </Select>
                    {over ? (
                      <div className="field-error" style={{ marginTop: 6 }}>
                        <Icon name="lowStock" size={13} stroke={2} />
                        Only {product.quantity_in_stock} in stock
                      </div>
                    ) : null}
                  </div>
                  <input
                    className={`input ${over ? "is-error" : ""}`.trim()}
                    aria-label="Quantity"
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => updateLine(line.clientId, "quantity", event.target.value)}
                    required
                    step="1"
                    style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}
                    type="number"
                    value={line.quantity}
                  />
                  <div className="line-static unit">
                    {product ? formatCurrency(product.price) : "—"}
                  </div>
                  <div className="line-static total">{formatCurrency(lineTotal)}</div>
                  <div className="line-trash">
                    {lineItems.length > 1 ? (
                      <IconButton
                        icon="trash"
                        label="Remove line"
                        size="sm"
                        onClick={() => removeLine(line.clientId)}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}

            <div style={{ paddingTop: 14 }}>
              <Button
                icon="plus"
                size="sm"
                variant="secondary"
                onClick={() => setLineItems((current) => [...current, emptyOrderLine()])}
              >
                Add line
              </Button>
            </div>
          </div>
        </div>

        <div className="stack">
          {blockPlacement ? (
            <Alert tone="danger" title={`${overStockLines.length} line exceeds stock`}>
              Reduce the flagged quantities or restock before placing the order.
            </Alert>
          ) : null}
          {error ? <Alert tone="danger">{formatOrderError(error, productMap)}</Alert> : null}
          {validationError ? <Alert tone="warning">{validationError}</Alert> : null}

          <Card pad>
            <div className="t-micro muted" style={{ marginBottom: 14 }}>
              Summary
            </div>
            <div className="summary-row">
              <span>Subtotal (estimate)</span>
              <span className="v">{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="v">{formatCurrency(subtotal)}</span>
            </div>
            <Button
              block
              icon="check"
              isLoading={isSaving}
              disabled={blockPlacement}
              type="submit"
              style={{ marginTop: 16 }}
            >
              Place order
            </Button>
            <Button
              block
              variant="secondary"
              onClick={onCancel}
              type="button"
              style={{ marginTop: 10 }}
            >
              Cancel
            </Button>
            <p className="t-caption muted" style={{ textAlign: "center", marginTop: 10 }}>
              The server computes the authoritative total and snapshots unit prices.
            </p>
          </Card>
        </div>
      </form>
    </Card>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const customerQuery = useCustomer(order?.customer_id);
  const customer = customerQuery.data;

  const columns = [
    {
      header: "Product",
      key: "product_name",
      render: (line) => <ProductCell name={line.product_name} sku={line.product_sku} />,
    },
    {
      header: "Qty",
      key: "quantity_ordered",
      align: "right",
      cellClassName: "num",
      render: (line) => line.quantity_ordered.toLocaleString("en-IN"),
    },
    {
      header: "Unit price",
      key: "unit_price",
      align: "right",
      cellClassName: "num",
      render: (line) => formatCurrency(line.unit_price),
    },
    {
      header: "Line total",
      key: "line_total",
      align: "right",
      cellClassName: "num cell-strong",
      render: (line) => formatCurrency(line.line_total),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        backTo="/app/orders"
        backLabel="Orders"
        title={order ? `Order #${order.id.slice(0, 8)}` : "Order detail"}
      />

      {orderQuery.isPending ? <LoadingState label="Loading order..." /> : null}
      {orderQuery.isError ? (
        <Alert tone="danger" title="Order unavailable">
          {orderQuery.error.message || "Unable to load order."}
        </Alert>
      ) : null}

      {order ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Pill tone={statusTone(order.status)}>
              {order.status === "active" ? "Active" : "Cancelled"}
            </Pill>
            <span className="t-caption muted">
              {formatDateTime(order.created_at)} · captured prices shown
            </span>
          </div>

          <div className="two-col wide-left">
            <Card title="Line items">
              <DataTable columns={columns} rows={order.line_items} />
              <div className="card-foot" style={{ justifyContent: "flex-end" }}>
                <div style={{ width: 260, maxWidth: "100%" }}>
                  <div className="summary-row total" style={{ borderTop: "none", marginTop: 0 }}>
                    <span>Total</span>
                    <span className="v">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="stack">
              <Card pad>
                <div className="t-micro muted" style={{ marginBottom: 14 }}>
                  Customer
                </div>
                {customer ? (
                  <>
                    <div className="t-body-md" style={{ marginBottom: 6 }}>
                      {customer.full_name}
                    </div>
                    <div className="info-line">
                      {customer.email}
                      {customer.phone_number ? (
                        <>
                          <br />
                          {customer.phone_number}
                        </>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="info-line t-num">{order.customer_id}</div>
                )}
              </Card>

              <Card pad>
                <div className="t-micro muted" style={{ marginBottom: 14 }}>
                  Details
                </div>
                <div className="summary-row">
                  <span>Status</span>
                  <span className="v" style={{ fontFamily: "var(--font-sans)" }}>
                    {order.status === "active" ? "Active" : "Cancelled"}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Line items</span>
                  <span className="v">{order.line_items.length}</span>
                </div>
                <div className="summary-row">
                  <span>Placed</span>
                  <span className="v" style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function validateOrderPayload(payload) {
  if (!payload.customer_id) {
    return "Select a customer.";
  }
  if (!payload.line_items.length) {
    return "Add at least one line item.";
  }
  if (payload.line_items.some((line) => !line.product_id)) {
    return "Every line item needs a product.";
  }
  if (payload.line_items.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)) {
    return "Every quantity must be a positive whole number.";
  }
  return "";
}

function formatOrderError(error, productMap) {
  if (!(error instanceof ApiError) || error.detail?.code !== "insufficient_stock") {
    return error.message || "Unable to place order.";
  }

  const shortfalls = error.detail.shortfalls ?? [];
  if (!shortfalls.length) {
    return error.detail.message || "Insufficient stock for one or more line items.";
  }

  return shortfalls
    .map((shortfall) => {
      const product = productMap.get(shortfall.product_id);
      const label = product ? product.name : `Product ${shortfall.product_id.slice(0, 8)}`;
      return `${label}: requested ${shortfall.requested}, available ${shortfall.available}.`;
    })
    .join(" ");
}
