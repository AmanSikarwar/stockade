import { useEffect, useState } from "react";

import { getApiBaseUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const emptyDashboard = {
  low_stock_products: [],
  low_stock_products_count: 0,
  low_stock_threshold: 0,
  total_active_orders: 0,
  total_active_products: 0,
  total_cancelled_orders: 0,
  total_customers: 0,
  total_orders: 0,
  total_products: 0,
};

export default function DashboardPage() {
  const { apiRequest } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setStatus("loading");
      setError("");

      try {
        const data = await apiRequest("/dashboard", { signal: controller.signal });
        setDashboard(data);
        setStatus("ready");
      } catch (caughtError) {
        if (caughtError.name === "AbortError") {
          return;
        }

        setError(caughtError.message || "Unable to load dashboard");
        setStatus("error");
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [apiRequest]);

  return (
    <section className="dashboard" aria-labelledby="dashboard-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 id="dashboard-heading">Operations overview</h2>
        </div>
        <span className="api-chip">API: {getApiBaseUrl()}</span>
      </div>

      {status === "loading" ? <div className="status-panel">Loading dashboard...</div> : null}

      {status === "error" ? (
        <div className="error-message" role="alert">
          {error}
        </div>
      ) : null}

      {status === "ready" ? (
        <>
          <div className="metric-grid">
            <Metric label="Products" value={dashboard.total_products} />
            <Metric label="Active products" value={dashboard.total_active_products} />
            <Metric label="Customers" value={dashboard.total_customers} />
            <Metric label="Orders" value={dashboard.total_orders} />
            <Metric label="Active orders" value={dashboard.total_active_orders} />
            <Metric label="Cancelled orders" value={dashboard.total_cancelled_orders} />
          </div>

          <section className="data-panel" aria-labelledby="low-stock-heading">
            <div className="panel-heading">
              <div>
                <h3 id="low-stock-heading">Low stock</h3>
                <p>
                  {dashboard.low_stock_products_count} products at or below{" "}
                  {dashboard.low_stock_threshold} units.
                </p>
              </div>
            </div>

            {dashboard.low_stock_products.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.low_stock_products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.price}</td>
                        <td>{product.quantity_in_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No low-stock products need attention.</p>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
