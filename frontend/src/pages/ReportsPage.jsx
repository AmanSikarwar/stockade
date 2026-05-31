import { useState } from "react";

import { useRevenueOverTime, useSalesByCustomer, useTopProducts } from "../api/reports";
import { Alert } from "../components/ui/Alert";
import { BarChart } from "../components/ui/BarChart";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { PersonCell, ProductCell } from "../components/ui/EntityCell";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { formatCurrency, formatDate } from "../lib/format";

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const revenueQuery = useRevenueOverTime({ days });
  const topProductsQuery = useTopProducts({ limit: 10 });
  const salesQuery = useSalesByCustomer({ limit: 10 });

  const revenue = revenueQuery.data;
  const chartData = (revenue?.points ?? []).map((point) => ({
    key: point.date,
    label: formatDate(point.date),
    short: formatDate(point.date),
    value: Number(point.revenue),
  }));

  const topProductColumns = [
    {
      header: "#",
      key: "rank",
      render: (row) => <span className="rank">{row.rank}</span>,
    },
    {
      header: "Product",
      key: "name",
      render: (row) => <ProductCell name={row.name} sku={row.sku} />,
    },
    {
      header: "Units sold",
      key: "quantity_sold",
      align: "right",
      cellClassName: "num",
      render: (row) => row.quantity_sold.toLocaleString("en-IN"),
    },
    {
      header: "Revenue",
      key: "revenue",
      align: "right",
      cellClassName: "num cell-strong",
      render: (row) => formatCurrency(row.revenue),
    },
  ];

  const salesColumns = [
    {
      header: "#",
      key: "rank",
      render: (row) => <span className="rank">{row.rank}</span>,
    },
    {
      header: "Customer",
      key: "full_name",
      render: (row) => <PersonCell name={row.full_name} />,
    },
    {
      header: "Orders",
      key: "order_count",
      align: "right",
      cellClassName: "num",
      render: (row) => row.order_count.toLocaleString("en-IN"),
    },
    {
      header: "Revenue",
      key: "revenue",
      align: "right",
      cellClassName: "num cell-strong",
      render: (row) => formatCurrency(row.revenue),
    },
  ];

  const topProducts = (topProductsQuery.data?.items ?? []).map((item, index) => ({
    ...item,
    id: item.product_id,
    rank: index + 1,
  }));
  const salesByCustomer = (salesQuery.data?.items ?? []).map((item, index) => ({
    ...item,
    id: item.customer_id,
    rank: index + 1,
  }));

  return (
    <div className="page">
      <PageHeader
        title="Reports"
        subtitle="Revenue and rankings from active orders"
        actions={
          <div style={{ width: 180 }}>
            <Select
              aria-label="Date range"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <Card title="Revenue over time" pad>
        {revenueQuery.isPending ? (
          <LoadingState label="Loading revenue..." />
        ) : revenueQuery.isError ? (
          <Alert tone="danger" title="Revenue unavailable">
            {revenueQuery.error.message || "Unable to load revenue."}
          </Alert>
        ) : (
          <>
            <div className="stat-inline">
              <div className="stat">
                <span className="k">Total revenue</span>
                <strong className="v t-num">{formatCurrency(revenue.total_revenue)}</strong>
              </div>
              <div className="stat">
                <span className="k">Orders</span>
                <strong className="v t-num">{revenue.total_orders}</strong>
              </div>
              <div className="stat">
                <span className="k">Avg / day</span>
                <strong className="v t-num">
                  {formatCurrency(Number(revenue.total_revenue) / Math.max(1, revenue.days))}
                </strong>
              </div>
            </div>
            <BarChart data={chartData} formatValue={formatCurrency} emptyLabel="No revenue yet." />
          </>
        )}
      </Card>

      <div className="two-col">
        <Card title="Top products" pad={false}>
          {topProductsQuery.isPending ? (
            <LoadingState label="Loading products..." />
          ) : (
            <DataTable
              columns={topProductColumns}
              rows={topProducts}
              emptyMessage="No sales recorded yet."
            />
          )}
        </Card>

        <Card title="Sales by customer" pad={false}>
          {salesQuery.isPending ? (
            <LoadingState label="Loading customers..." />
          ) : (
            <DataTable
              columns={salesColumns}
              rows={salesByCustomer}
              emptyMessage="No sales recorded yet."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
