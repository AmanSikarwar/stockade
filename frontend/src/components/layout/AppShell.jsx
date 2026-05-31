import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { useDashboardMetrics } from "../../api/dashboard";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons/Icon";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { ThemeToggle } from "../ui/ThemeToggle";

const navItems = [
  { icon: "dashboard", label: "Dashboard", to: "/app" },
  { icon: "box", label: "Products", to: "/app/products" },
  { icon: "orders", label: "Orders", to: "/app/orders", badgeKey: "orders" },
  { icon: "customers", label: "Customers", to: "/app/customers" },
];

export function AppShell() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState("");

  const metricsQuery = useDashboardMetrics();
  const activeOrders = metricsQuery.data?.total_active_orders ?? 0;
  const badges = { orders: activeOrders > 0 ? activeOrders : null };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  function submitSearch(event) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/app/products?q=${encodeURIComponent(term)}` : "/app/products");
  }

  return (
    <div className="shell">
      {navOpen ? (
        <button className="scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
      ) : null}

      <aside className={`nav ${navOpen ? "open" : ""}`.trim()} aria-label="Primary navigation">
        <div className="nav-brand">
          <Logo />
          <IconButton
            icon="close"
            label="Close navigation"
            className="nav-close"
            onClick={() => setNavOpen(false)}
          />
        </div>

        <div className="nav-scroll">
          <nav className="nav-group">
            <div className="nav-group-label">Workspace</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) => `nav-item ${isActive ? "on" : ""}`.trim()}
              >
                <Icon name={item.icon} size={19} stroke={1.85} />
                <span>{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] != null ? (
                  <span className="badge">{badges[item.badgeKey]}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="nav-footer">
            <div className="nav-user">
              <Avatar name={user?.email} size={32} />
              <span className="meta">
                <span className="name">{user?.email ?? "Signed in"}</span>
                <span className="role">{user?.role ?? "member"}</span>
              </span>
              <IconButton icon="logout" label="Log out" onClick={logout} size="sm" />
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <IconButton
            icon="list"
            label="Open navigation"
            className="menu-button"
            variant="ghost"
            onClick={() => setNavOpen(true)}
          />
          <form className="input-affix topbar-search" role="search" onSubmit={submitSearch}>
            <span className="affix-icon">
              <Icon name="search" size={17} />
            </span>
            <input
              className="input"
              type="search"
              aria-label="Search products"
              placeholder="Search products, orders, customers…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <span className="spacer" />
          <ThemeToggle />
          <Button icon="plus" onClick={() => navigate("/app/orders?new=1")}>
            New order
          </Button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
