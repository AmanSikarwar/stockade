import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";

import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons/Icon";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { ThemeToggle } from "../ui/ThemeToggle";

const navItems = [
  { icon: "dashboard", label: "Dashboard", to: "/app" },
  { icon: "box", label: "Products", to: "/app/products" },
  { icon: "orders", label: "Orders", to: "/app/orders" },
  { icon: "customers", label: "Customers", to: "/app/customers" },
];

export function AppShell() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

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
          <span className="topbar-title">Operations workspace</span>
          <span className="spacer" />
          <ThemeToggle />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
