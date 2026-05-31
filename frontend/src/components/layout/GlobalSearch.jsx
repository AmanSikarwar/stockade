import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useCategories } from "../../api/categories";
import { useCustomers } from "../../api/customers";
import { useOrders } from "../../api/orders";
import { useProducts } from "../../api/products";
import { formatCurrency } from "../../lib/format";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { Icon } from "../icons/Icon";

const RESULT_LIMIT = 4;
const SEARCHABLE_PATHS = new Set([
  "/app/products",
  "/app/customers",
  "/app/categories",
  "/app/orders",
]);

function searchUrl(path, term) {
  return `${path}?q=${encodeURIComponent(term)}`;
}

function productMeta(product) {
  const stock = product.quantity_in_stock.toLocaleString("en-IN");
  return `${product.sku} - ${stock} on hand${product.active ? "" : " - inactive"}`;
}

function customerMeta(customer) {
  return customer.phone_number ? `${customer.email} - ${customer.phone_number}` : customer.email;
}

function categoryMeta(category) {
  return `${category.product_count} ${category.product_count === 1 ? "product" : "products"}`;
}

function orderMeta(order) {
  const customer = order.customer_name ?? `Customer ${order.customer_id.slice(0, 8)}`;
  const status = order.status === "active" ? "Active" : "Cancelled";
  return `${customer} - ${formatCurrency(order.total_amount)} - ${status}`;
}

export function GlobalSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, 250);
  const canSearch = debouncedTerm.length > 0;
  const queryOptions = { enabled: canSearch, staleTime: 15_000 };

  const productsQuery = useProducts(
    {
      include_inactive: true,
      limit: RESULT_LIMIT,
      offset: 0,
      q: debouncedTerm || undefined,
    },
    queryOptions,
  );
  const customersQuery = useCustomers(
    { limit: RESULT_LIMIT, offset: 0, q: debouncedTerm || undefined },
    queryOptions,
  );
  const categoriesQuery = useCategories(
    { limit: RESULT_LIMIT, offset: 0, q: debouncedTerm || undefined },
    queryOptions,
  );
  const ordersQuery = useOrders(
    { limit: RESULT_LIMIT, offset: 0, q: debouncedTerm || undefined },
    queryOptions,
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(SEARCHABLE_PATHS.has(location.pathname) ? (params.get("q") ?? "") : "");
    setPanelOpen(false);
  }, [location.pathname, location.search]);

  const sections = useMemo(
    () => [
      {
        allTo: searchUrl("/app/products", debouncedTerm),
        icon: "box",
        items: (productsQuery.data?.items ?? []).map((product) => ({
          id: product.id,
          meta: productMeta(product),
          title: product.name,
          to: searchUrl("/app/products", debouncedTerm),
        })),
        label: "Products",
        query: productsQuery,
        total: productsQuery.data?.total,
      },
      {
        allTo: searchUrl("/app/customers", debouncedTerm),
        icon: "customers",
        items: (customersQuery.data?.items ?? []).map((customer) => ({
          id: customer.id,
          meta: customerMeta(customer),
          title: customer.full_name,
          to: searchUrl("/app/customers", debouncedTerm),
        })),
        label: "Customers",
        query: customersQuery,
        total: customersQuery.data?.total,
      },
      {
        allTo: searchUrl("/app/categories", debouncedTerm),
        icon: "tag",
        items: (categoriesQuery.data?.items ?? []).map((category) => ({
          id: category.id,
          meta: categoryMeta(category),
          title: category.name,
          to: searchUrl("/app/categories", debouncedTerm),
        })),
        label: "Categories",
        query: categoriesQuery,
        total: categoriesQuery.data?.total,
      },
      {
        allTo: searchUrl("/app/orders", debouncedTerm),
        icon: "orders",
        items: (ordersQuery.data?.items ?? []).map((order) => ({
          id: order.id,
          meta: orderMeta(order),
          title: `Order #${order.id.slice(0, 8)}`,
          to: `/app/orders/${order.id}`,
        })),
        label: "Orders",
        query: ordersQuery,
        total: ordersQuery.data?.total,
      },
    ],
    [categoriesQuery, customersQuery, debouncedTerm, ordersQuery, productsQuery],
  );

  const isFetching = [productsQuery, customersQuery, categoriesQuery, ordersQuery].some(
    (query) => query.isFetching,
  );
  const hasErrors = [productsQuery, customersQuery, categoriesQuery, ordersQuery].some(
    (query) => query.isError,
  );
  const hasResults = sections.some((section) => section.items.length > 0);

  function go(to) {
    navigate(to);
    setPanelOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();
    if (!term) {
      return;
    }
    go(searchUrl("/app/products", term));
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPanelOpen(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setPanelOpen(false);
      event.currentTarget.blur();
    }
  }

  return (
    <form
      className={`global-search input-affix topbar-search ${panelOpen ? "open" : ""}`.trim()}
      role="search"
      onSubmit={submitSearch}
      onFocus={() => setPanelOpen(Boolean(search.trim()))}
      onBlur={handleBlur}
    >
      <span className="affix-icon">
        <Icon name="search" size={17} />
      </span>
      <input
        aria-controls="global-search-results"
        aria-expanded={panelOpen}
        aria-label="Search workspace"
        autoComplete="off"
        className="input"
        onChange={(event) => {
          setSearch(event.target.value);
          setPanelOpen(Boolean(event.target.value.trim()));
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search products, orders, customers..."
        type="search"
        value={search}
      />

      {panelOpen ? (
        <div className="global-search-panel" id="global-search-results">
          <div className="global-search-head">
            <span>Workspace search</span>
            <button
              type="button"
              className="global-search-submit"
              disabled={!term}
              onClick={() => term && go(searchUrl("/app/products", term))}
            >
              Open products
            </button>
          </div>

          {!canSearch ? (
            <div className="global-search-status">Type to search this workspace.</div>
          ) : null}

          {hasErrors ? (
            <div className="global-search-status danger">
              Some search results could not be loaded.
            </div>
          ) : null}

          {sections.map((section) => (
            <div className="global-search-section" key={section.label}>
              <div className="global-search-section-head">
                <span>{section.label}</span>
                {section.total != null ? (
                  <button type="button" onClick={() => go(section.allTo)}>
                    {section.total} total
                  </button>
                ) : null}
              </div>

              {section.query.isFetching && !section.items.length ? (
                <div className="global-search-status">
                  Searching {section.label.toLowerCase()}...
                </div>
              ) : null}

              {section.items.map((item) => (
                <button
                  className="global-search-item"
                  key={`${section.label}-${item.id}`}
                  onClick={() => go(item.to)}
                  type="button"
                >
                  <span className="global-search-icon">
                    <Icon name={section.icon} size={16} />
                  </span>
                  <span className="global-search-copy">
                    <span className="global-search-title">{item.title}</span>
                    <span className="global-search-meta">{item.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {canSearch && !isFetching && !hasResults ? (
            <div className="global-search-empty">No matches for "{debouncedTerm}".</div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
