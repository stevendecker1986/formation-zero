"use client";
import { useEffect, useState, type FormEvent } from "react";
type Action =
  | "register"
  | "login"
  | "request-password-reset"
  | "send-verification-email"
  | "reset-password"
  | "verify-email";
export default function Account() {
  const [action, setAction] = useState<Action>("login");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<string>("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const kind = params.get("action");
    if (kind === "verify" || kind === "reset") {
      setAction(kind === "verify" ? "verify-email" : "reset-password");
      setToken(params.get("token") ?? "");
      window.history.replaceState(null, "", "/account");
    }
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Working…");
    const data = new FormData(event.currentTarget);
    const body =
      action === "verify-email"
        ? { token }
        : action === "reset-password"
          ? { token, newPassword: data.get("password") }
          : action === "register"
            ? {
                email: data.get("email"),
                password: data.get("password"),
                name: data.get("name"),
              }
            : action === "login"
              ? { email: data.get("email"), password: data.get("password") }
              : { email: data.get("email") };
    try {
      const response = await fetch(`/api/account/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMessage(
        response.ok
          ? action === "login"
            ? "Signed in."
            : "Request accepted. Check account instructions when applicable."
          : "Request could not be completed. Check your details or try later.",
      );
    } catch {
      setMessage("Account service is unavailable.");
    }
  }
  async function loadAccount() {
    try {
      const response = await fetch("/api/account/account");
      const data: unknown = await response.json();
      setAccount(
        response.ok
          ? JSON.stringify(data, null, 2)
          : "Sign in to view your account.",
      );
    } catch {
      setAccount("Account service is unavailable.");
    }
  }
  async function logout() {
    const response = await fetch("/api/account/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setMessage(response.ok ? "Signed out." : "Unable to sign out.");
    if (response.ok) setAccount("");
  }
  return (
    <section className="fz-surface">
      <h2>Account</h2>
      <label>
        Action{" "}
        <select
          value={action}
          onChange={(event) => setAction(event.target.value as Action)}
        >
          <option value="login">Sign in</option>
          <option value="register">Register</option>
          <option value="request-password-reset">Request password reset</option>
          <option value="send-verification-email">Resend verification</option>
          <option value="verify-email">Verify email</option>
          <option value="reset-password">Reset password</option>
        </select>
      </label>
      <form onSubmit={submit} className="fz-form">
        {action === "register" && (
          <label>
            Display name{" "}
            <input
              name="name"
              required
              maxLength={80}
              autoComplete="nickname"
            />
          </label>
        )}
        {!["reset-password", "verify-email"].includes(action) && (
          <label>
            Email{" "}
            <input name="email" type="email" required autoComplete="email" />
          </label>
        )}
        {["login", "register", "reset-password"].includes(action) && (
          <label>
            Password{" "}
            <input
              name="password"
              type="password"
              required
              minLength={action === "login" ? 1 : 12}
              maxLength={128}
              autoComplete={
                action === "login" ? "current-password" : "new-password"
              }
            />
          </label>
        )}
        {["reset-password", "verify-email"].includes(action) && (
          <label>
            Private token{" "}
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              autoComplete="off"
            />
          </label>
        )}
        <button type="submit">Continue</button>
      </form>
      <p role="status">{message}</p>
      <div className="fz-actions">
        <button onClick={loadAccount}>View account</button>
        <button onClick={logout}>Sign out</button>
      </div>
      <pre>{account}</pre>
    </section>
  );
}
