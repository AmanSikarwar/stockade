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
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-art" aria-hidden="true">
          <Logo />
          <LoginHero />
        </div>

        <div className="login-panel">
          <Logo />
          <p className="eyebrow">Secure workspace</p>
          <h1 id="login-heading">Sign in to Stockade</h1>
          <p className="panel-copy">
            Manage products, customers, orders, and inventory levels from one controlled workspace.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <FormField
              autoComplete="email"
              id="email"
              inputMode="email"
              label="Email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
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
              required
              type="password"
              value={password}
            />

            {error ? <Alert tone="danger">{error}</Alert> : null}

            <Button icon="login" isLoading={isSubmitting} type="submit">
              Sign in
            </Button>
          </form>

          <p className="api-footnote">
            API endpoint <span className="t-num">{getApiBaseUrl()}</span>
          </p>
        </div>
      </section>
    </main>
  );
}
