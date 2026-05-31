import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { ApiError, getApiBaseUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "../components/brand/Logo";
import { useNotifications } from "../components/feedback/NotificationContext";
import { LoginHero } from "../components/illustrations/Illustrations";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { notify } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const redirectPath = location.state?.from?.pathname ?? "/app";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      notify({ message: "Signed in successfully.", tone: "success", title: "Welcome back" });
      navigate(redirectPath, { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : "Unable to reach the Stockade API",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login">
      <aside className="login-art" aria-hidden="true">
        <Logo markSize={34} />
        <div className="hero">
          <LoginHero />
          <div>
            <div className="t-h2" style={{ marginBottom: 8 }}>
              Everything in its place.
            </div>
            <p className="t-body-lg text-2">
              Inventory, customers and orders — one calm, dependable place to run your stock.
            </p>
          </div>
        </div>
        <div className="t-caption muted">Self-hosted · your data stays yours</div>
      </aside>

      <section className="login-panel" aria-labelledby="login-heading">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="head">
            <h1 className="t-h1" id="login-heading">
              Sign in
            </h1>
            <p className="t-body text-2" style={{ marginTop: 6 }}>
              Welcome back to Stockade.
            </p>
          </div>

          <FormField
            autoComplete="email"
            id="email"
            inputMode="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />

          <FormField
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Button block icon="login" isLoading={isSubmitting} size="lg" type="submit">
            Sign in
          </Button>

          <p className="t-caption muted" style={{ textAlign: "center" }}>
            API endpoint <span className="t-num">{getApiBaseUrl()}</span>
          </p>
        </form>
      </section>
    </main>
  );
}
