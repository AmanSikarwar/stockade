import { emptyDashboardMetrics, useDashboardMetrics } from "../api/dashboard";
import { getApiBaseUrl } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { DataTable } from "../components/ui/DataTable";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatusBadge } from "../components/ui/StatusBadge";

const lowStockColumns = [
  { header: "Name", key: "name" },
  { header: "SKU", key: "sku", render: (product) => <span className="t-num">{product.sku}</span> },
  {
    header: "Price",
    key: "price",
    render: (product) => <span className="t-num">{formatCurrency(product.price)}</span>,
  },
  {
    header: "Stock",
    key: "quantity_in_stock",
    render: (product) => (
      <StatusBadge tone={product.quantity_in_stock === 0 ? "danger" : "warning"}>
        {product.quantity_in_stock === 0 ? "Out" : `${product.quantity_in_stock} left`}
      </StatusBadge>
    ),
  },
];

export default function DashboardPage() {
  const metricsQuery = useDashboardMetrics();
  const dashboard = metricsQuery.data ?? emptyDashboardMetrics;

  return (
    <section className="dashboard" aria-labelledby="dashboard-heading">
      <PageHeader eyebrow="Dashboard" title="Operations overview">
        Real-time totals from the Stockade API. API base:{" "}
        <span className="t-num">{getApiBaseUrl()}</span>.
      </PageHeader>

      {metricsQuery.isPending ? <LoadingState label="Loading dashboard..." /> : null}

      {metricsQuery.isError ? (
        <Alert tone="danger" title="Dashboard unavailable">
          {metricsQuery.error.message || "Unable to load dashboard metrics."}
        </Alert>
      ) : null}

      {!metricsQuery.isPending && !metricsQuery.isError ? (
        <>
          <div className="metric-grid">
            <MetricCard icon="box" label="Products" value={dashboard.total_products} />
            <MetricCard
              icon="warehouse"
              label="Active products"
              meta="Visible in active listings"
              value={dashboard.total_active_products}
            />
            <MetricCard icon="customers" label="Customers" value={dashboard.total_customers} />
            <MetricCard icon="orders" label="Orders" value={dashboard.total_orders} />
            <MetricCard
              icon="check"
              label="Active orders"
              meta={`${dashboard.total_cancelled_orders} cancelled`}
              value={dashboard.total_active_orders}
            />
            <MetricCard
              icon="lowStock"
              label="Low-stock products"
              meta={`Threshold: ${dashboard.low_stock_threshold}`}
              value={dashboard.low_stock_products_count}
            />
          </div>

          <Panel
            description={`${dashboard.low_stock_products_count} products are at or below ${dashboard.low_stock_threshold} units.`}
            title="Low-stock alerts"
          >
            <DataTable
              columns={lowStockColumns}
              emptyMessage="No low-stock products need attention."
              rows={dashboard.low_stock_products}
            />
          </Panel>
        </>
      ) : null}
    </section>
  );
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
