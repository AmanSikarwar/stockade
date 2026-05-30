import { Link, useNavigate, useParams } from "react-router";
import { useMemo, useState } from "react";

import { ApiError } from "../api/client";
import { useCustomers } from "../api/customers";
import { useCancelOrder, useCreateOrder, useOrder, useOrders } from "../api/orders";
import { useProducts } from "../api/products";
import { useNotifications } from "../components/feedback/NotificationContext";
import { EmptyOrders } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormField } from "../components/ui/FormField";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatusBadge } from "../components/ui/StatusBadge";

const emptyOrderLine = () => ({
  clientId: crypto.randomUUID(),
  product_id: "",
  quantity: "1",
});

export default function OrdersPage() {
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const ordersQuery = useOrders({ limit: 50, offset: 0 });
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();
  const rows = ordersQuery.data?.items ?? [];

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
      render: (order) => <span className="t-num">{order.customer_id.slice(0, 8)}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (order) => (
        <StatusBadge tone={order.status === "active" ? "success" : "info"}>
          {order.status}
        </StatusBadge>
      ),
    },
    {
      header: "Total",
      key: "total_amount",
      render: (order) => <span className="t-num">{formatCurrency(order.total_amount)}</span>,
    },
    {
      header: "Created",
      key: "created_at",
      render: (order) => formatDate(order.created_at),
    },
    {
      header: "Actions",
      key: "actions",
      render: (order) => {
        const isConfirming = confirmingCancelId === order.id;
        return (
          <div className="row-actions">
            <Link className="button button-secondary" to={`/app/orders/${order.id}`}>
              View
            </Link>
            {order.status === "active" ? (
              <>
                <Button
                  icon="close"
                  isLoading={cancelOrder.isPending && cancelOrder.variables === order.id}
                  onClick={() =>
                    isConfirming ? handleCancelOrder(order) : setConfirmingCancelId(order.id)
                  }
                  variant={isConfirming ? "danger" : "secondary"}
                >
                  {isConfirming ? "Confirm" : "Cancel"}
                </Button>
                {isConfirming ? (
                  <Button onClick={() => setConfirmingCancelId(null)} variant="secondary">
                    Keep
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  async function handleCreateOrder(payload) {
    const order = await createOrder.mutateAsync(payload);
    notify({
      message: `Order #${order.id.slice(0, 8)} was created with server total ${formatCurrency(
        order.total_amount,
      )}.`,
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
      notify({ message: `Order #${order.id.slice(0, 8)} was cancelled.`, tone: "success" });
    } catch (error) {
      notify({
        message: error.message || "Unable to cancel order.",
        title: "Cancel failed",
        tone: "danger",
      });
    }
  }

  return (
    <section className="page-stack" aria-labelledby="orders-heading">
      <PageHeader
        actions={
          <Button icon="plus" onClick={() => setIsFormOpen(true)}>
            New order
          </Button>
        }
        eyebrow="Orders"
        title="Order management"
      >
        Create multi-line orders, review server totals, and inspect price snapshots.
      </PageHeader>

      {isFormOpen ? (
        <OrderFormPanel
          error={createOrder.error}
          isSaving={createOrder.isPending}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={handleCreateOrder}
        />
      ) : null}

      <Panel description={`${ordersQuery.data?.total ?? 0} orders found.`} title="Order list">
        {ordersQuery.isPending ? <LoadingState label="Loading orders..." /> : null}
        {ordersQuery.isError ? (
          <Alert tone="danger" title="Orders unavailable">
            {ordersQuery.error.message || "Unable to load orders."}
          </Alert>
        ) : null}
        {!ordersQuery.isPending && !ordersQuery.isError ? (
          rows.length ? (
            <DataTable columns={columns} rows={rows} />
          ) : (
            <div className="empty-state">
              <EmptyOrders />
              <p>No orders have been placed yet.</p>
            </div>
          )
        ) : null}
      </Panel>
    </section>
  );
}

function OrderFormPanel({ error, isSaving, onCancel, onSubmit }) {
  const customersQuery = useCustomers({ limit: 100, offset: 0 });
  const productsQuery = useProducts({ limit: 100, offset: 0 });
  const [customerId, setCustomerId] = useState("");
  const [lineItems, setLineItems] = useState([emptyOrderLine()]);
  const [validationError, setValidationError] = useState("");
  const productMap = useMemo(
    () => new Map((productsQuery.data?.items ?? []).map((product) => [product.id, product])),
    [productsQuery.data?.items],
  );
  const indicativeTotal = lineItems.reduce((sum, lineItem) => {
    const product = productMap.get(lineItem.product_id);
    const quantity = Number(lineItem.quantity);
    if (!product || Number.isNaN(quantity)) {
      return sum;
    }
    return sum + Number(product.price) * quantity;
  }, 0);

  function updateLine(clientId, field, value) {
    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.clientId === clientId ? { ...lineItem, [field]: value } : lineItem,
      ),
    );
  }

  function removeLine(clientId) {
    setLineItems((current) => current.filter((lineItem) => lineItem.clientId !== clientId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const payload = {
      customer_id: customerId,
      line_items: lineItems.map((lineItem) => ({
        product_id: lineItem.product_id,
        quantity: Number(lineItem.quantity),
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
      // Mutation state renders the API error through the shared alert below.
    }
  }

  return (
    <Panel
      className="form-panel"
      description="The total below is indicative. The API computes the authoritative total and snapshots prices."
      title="Create order"
    >
      <form className="order-form" onSubmit={handleSubmit}>
        <FormField id="order-customer" label="Customer" required>
          <select
            disabled={customersQuery.isPending}
            id="order-customer"
            onChange={(event) => setCustomerId(event.target.value)}
            required
            value={customerId}
          >
            <option value="">Select a customer</option>
            {(customersQuery.data?.items ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} ({customer.email})
              </option>
            ))}
          </select>
        </FormField>

        <div className="line-editor">
          <div className="line-editor-head">
            <div>
              <h3>Line items</h3>
              <p>Choose active products and quantities to reserve inventory.</p>
            </div>
            <Button
              icon="plus"
              onClick={() => setLineItems((current) => [...current, emptyOrderLine()])}
              variant="secondary"
            >
              Add line
            </Button>
          </div>

          {lineItems.map((lineItem, index) => {
            const selectedProduct = productMap.get(lineItem.product_id);
            return (
              <div className="order-line" key={lineItem.clientId}>
                <FormField
                  id={`line-product-${lineItem.clientId}`}
                  label={`Product ${index + 1}`}
                  required
                >
                  <select
                    disabled={productsQuery.isPending}
                    id={`line-product-${lineItem.clientId}`}
                    onChange={(event) =>
                      updateLine(lineItem.clientId, "product_id", event.target.value)
                    }
                    required
                    value={lineItem.product_id}
                  >
                    <option value="">Select a product</option>
                    {(productsQuery.data?.items ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.sku} · {product.quantity_in_stock} available
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  id={`line-quantity-${lineItem.clientId}`}
                  inputMode="numeric"
                  label="Quantity"
                  min="1"
                  onChange={(event) =>
                    updateLine(lineItem.clientId, "quantity", event.target.value)
                  }
                  required
                  step="1"
                  type="number"
                  value={lineItem.quantity}
                />
                <div className="line-total">
                  <span>Line estimate</span>
                  <strong className="t-num">
                    {formatCurrency(
                      (Number(selectedProduct?.price ?? 0) || 0) * Number(lineItem.quantity || 0),
                    )}
                  </strong>
                </div>
                {lineItems.length > 1 ? (
                  <Button onClick={() => removeLine(lineItem.clientId)} variant="secondary">
                    Remove
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="order-summary">
          <span>Indicative total</span>
          <strong className="t-num">{formatCurrency(indicativeTotal)}</strong>
        </div>

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{formatOrderError(error, productMap)}</Alert> : null}

        <div className="form-actions">
          <Button isLoading={isSaving} type="submit">
            Place order
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const columns = [
    { header: "Product", key: "product_name" },
    {
      header: "SKU",
      key: "product_sku",
      render: (lineItem) => <span className="t-num">{lineItem.product_sku}</span>,
    },
    {
      header: "Quantity",
      key: "quantity_ordered",
      render: (lineItem) => <span className="t-num">{lineItem.quantity_ordered}</span>,
    },
    {
      header: "Unit price snapshot",
      key: "unit_price",
      render: (lineItem) => <span className="t-num">{formatCurrency(lineItem.unit_price)}</span>,
    },
    {
      header: "Line total",
      key: "line_total",
      render: (lineItem) => <span className="t-num">{formatCurrency(lineItem.line_total)}</span>,
    },
  ];

  return (
    <section className="page-stack" aria-labelledby="order-detail-heading">
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/app/orders">
            Back to orders
          </Link>
        }
        eyebrow="Order detail"
        title={order ? `Order #${order.id.slice(0, 8)}` : "Order detail"}
      >
        Server-computed total and line-item price snapshots.
      </PageHeader>

      {orderQuery.isPending ? <LoadingState label="Loading order..." /> : null}
      {orderQuery.isError ? (
        <Alert tone="danger" title="Order unavailable">
          {orderQuery.error.message || "Unable to load order."}
        </Alert>
      ) : null}
      {order ? (
        <>
          <div className="metric-grid order-detail-metrics">
            <article className="metric-card">
              <div>
                <span>Status</span>
                <strong>{order.status}</strong>
              </div>
            </article>
            <article className="metric-card">
              <div>
                <span>Total amount</span>
                <strong className="t-num">{formatCurrency(order.total_amount)}</strong>
              </div>
            </article>
            <article className="metric-card">
              <div>
                <span>Customer ID</span>
                <strong className="t-num">{order.customer_id.slice(0, 8)}</strong>
              </div>
            </article>
          </div>
          <Panel description={`Created ${formatDate(order.created_at)}.`} title="Line items">
            <DataTable columns={columns} rows={order.line_items} />
          </Panel>
        </>
      ) : null}
    </section>
  );
}

function validateOrderPayload(payload) {
  if (!payload.customer_id) {
    return "Select a customer.";
  }
  if (!payload.line_items.length) {
    return "Add at least one line item.";
  }
  if (payload.line_items.some((lineItem) => !lineItem.product_id)) {
    return "Every line item needs a product.";
  }
  if (
    payload.line_items.some(
      (lineItem) => !Number.isInteger(lineItem.quantity) || lineItem.quantity <= 0,
    )
  ) {
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

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
