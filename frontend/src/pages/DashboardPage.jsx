import { useMemo } from "react";
import { Link } from "react-router";

import { useCustomers } from "../api/customers";
import { emptyDashboardMetrics, useDashboardMetrics } from "../api/dashboard";
import { useOrders } from "../api/orders";
import { useRevenueOverTime } from "../api/reports";
import { FeedbackSuccess } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { ProductCell } from "../components/ui/EntityCell";
import { Icon } from "../components/icons/Icon";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { Pill } from "../components/ui/Pill";
import { formatCurrency } from "../lib/format";

const today = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

export default function DashboardPage() {
  const metricsQuery = useDashboardMetrics();
  const ordersQuery = useOrders({ limit: 5, offset: 0 });
  const customersQuery = useCustomers({ limit: 100, offset: 0 });
  const revenueQuery = useRevenueOverTime({ days: 30 });
  const dashboard = metricsQuery.data ?? emptyDashboardMetrics;
  const revenue30d = revenueQuery.data?.total_revenue ?? "0";

  const customerMap = useMemo(
    () => new Map((customersQuery.data?.items ?? []).map((customer) => [customer.id, customer])),
    [customersQuery.data?.items],
  );

  const recentOrders = ordersQuery.data?.items ?? [];
  const threshold = dashboard.low_stock_threshold || 5;

  const lowStockColumns = [
    {
      header: "Product",
      key: "name",
      render: (product) => <ProductCell name={product.name} sku={product.sku} />,
    },
    {
      header: "On hand",
      key: "quantity_in_stock",
      align: "right",
      cellClassName: "num",
      render: (product) => (
        <span
          style={{
            fontWeight: 600,
            color: product.quantity_in_stock <= 0 ? "var(--danger-fg)" : "var(--warning-fg)",
          }}
        >
          {product.quantity_in_stock}
        </span>
      ),
    },
    {
      header: "Reorder at",
      key: "threshold",
      align: "right",
      cellClassName: "num",
      render: () => <span className="muted">{threshold}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (product) =>
        product.quantity_in_stock <= 0 ? (
          <Pill tone="danger">Out of stock</Pill>
        ) : (
          <Pill tone="warning">Low stock</Pill>
        ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle={today}
        actions={
          <Button
            icon="download"
            variant="secondary"
            disabled={dashboard.low_stock_products.length === 0}
            onClick={() => exportLowStock(dashboard.low_stock_products, threshold)}
          >
            Export
          </Button>
        }
      />

      {metricsQuery.isError ? (
        <Alert tone="danger" title="Dashboard unavailable">
          {metricsQuery.error.message || "Unable to load dashboard metrics."}
        </Alert>
      ) : null}

      <div className="metric-grid">
        <MetricCard icon="box" label="Total products" value={dashboard.total_products} />
        <MetricCard icon="customers" label="Customers" value={dashboard.total_customers} />
        <MetricCard icon="orders" label="Orders" value={dashboard.total_orders} />
        <MetricCard icon="cart" label="Revenue · 30d" value={formatCurrency(revenue30d)} />
      </div>

      {metricsQuery.isPending ? (
        <LoadingState label="Loading dashboard..." />
      ) : (
        <div className="two-col wide-left">
          <Card
            title="Low-stock alerts"
            count={dashboard.low_stock_products_count}
            toolbar={
              <Link className="btn btn-ghost btn-sm" to="/app/products">
                <span>View all</span>
                <Icon name="chevron" size={14} stroke={2} />
              </Link>
            }
          >
            <DataTable
              columns={lowStockColumns}
              rows={dashboard.low_stock_products}
              empty={
                <div className="empty-state">
                  <FeedbackSuccess />
                  <h3>All clear — nothing low on stock</h3>
                  <p>
                    Products at or below {dashboard.low_stock_threshold} units will appear here.
                  </p>
                </div>
              }
            />
          </Card>

          <Card
            title="Recent orders"
            toolbar={
              <Link className="btn btn-ghost btn-sm" to="/app/orders">
                <span>View all</span>
                <Icon name="chevron" size={14} stroke={2} />
              </Link>
            }
          >
            {recentOrders.length ? (
              <div>
                {recentOrders.map((order) => {
                  const customer = customerMap.get(order.customer_id);
                  return (
                    <Link className="list-row" key={order.id} to={`/app/orders/${order.id}`}>
                      <span className="order-no">#{order.id.slice(0, 6)}</span>
                      <span className="who">
                        {customer?.full_name ?? `Customer ${order.customer_id.slice(0, 6)}`}
                      </span>
                      <span className="amt">{formatCurrency(order.total_amount)}</span>
                      <Pill tone={order.status === "active" ? "success" : "danger"}>
                        {order.status === "active" ? "Active" : "Cancelled"}
                      </Pill>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No orders yet. Place your first order to see activity here.</p>
                <Link className="btn btn-primary btn-md" to="/app/orders?new=1">
                  <Icon name="plus" size={18} />
                  <span>New order</span>
                </Link>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportLowStock(products, threshold) {
  const header = ["Name", "SKU", "On hand", "Reorder at", "Status"];
  const rows = products.map((product) => [
    product.name,
    product.sku,
    product.quantity_in_stock,
    threshold,
    product.quantity_in_stock <= 0 ? "Out of stock" : "Low stock",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stockade-low-stock-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
