import { NavLink, Outlet } from "react-router";

import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons/Icon";
import { Button } from "../ui/Button";

const navItems = [
  { icon: "dashboard", label: "Dashboard", to: "/app" },
  { icon: "box", label: "Products", to: "/app/products" },
];

export function AppShell() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <Logo />
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/app"}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Inventory and orders</p>
            <p className="topbar-title">Operations workspace</p>
          </div>
          <div className="user-menu">
            <span>{user?.email}</span>
            <Button icon="logout" onClick={logout} variant="secondary">
              Log out
            </Button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
