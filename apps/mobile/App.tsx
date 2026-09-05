import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { tokens as t } from "@formation-zero/ui/tokens";

type Session = {
  id: string;
  state: string;
  version: number;
  accumulated_ms: string | number;
  running_since: string | null;
  current_line: number;
  consumer_snapshot: {
    label: string;
    objective: string;
    duration_seconds: number;
    rationale: string;
    lines: {
      name: string;
      section: string;
      purpose: string;
      setup_and_execution: string;
      media: unknown[];
    }[];
  };
};
const origin = process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://localhost:4000";
const requestOrigin =
  process.env.EXPO_PUBLIC_WEB_ORIGIN ?? "http://localhost:3000";
const requestKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `mobile-${Date.now()}-${Math.random()}`;

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [queue, setQueue] = useState<
    { path: string; body: Record<string, unknown> }[]
  >([]);
  const [message, setMessage] = useState(
    "Sign in to request a server-authorized session.",
  );
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function api(path: string, body?: unknown) {
    const response = await fetch(`${origin}/api/v1/${path}`, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: body
        ? { "Content-Type": "application/json", Origin: requestOrigin }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(String(data.error?.code ?? "SERVICE_UNAVAILABLE"));
    return data;
  }
  async function login() {
    try {
      await api("auth/login", { email, password });
      await api("account");
      setSignedIn(true);
      setMessage(
        "Signed in. Server authorization will determine what can run.",
      );
    } catch {
      setMessage("Sign-in could not be completed.");
    }
  }
  async function logout() {
    try {
      await api("auth/logout", {});
    } catch {
      /* local private state still clears */
    }
    setSignedIn(false);
    setSession(null);
    setQueue([]);
    setEmail("");
    setPassword("");
    setMessage("Signed out. Private in-memory session data was cleared.");
  }
  async function requestDemo() {
    try {
      const value = await api("training/sessions", {
        idempotency_key: requestKey(),
        demo: true,
        training_date: new Date().toISOString().slice(0, 10),
        objective: "GENERAL_READINESS",
        duration_seconds: 2700,
        equipment: { available: [], unsafe: [] },
        space: "STANDARD",
        restrictions: {},
        preferences: [],
        candidate_scope: [],
      });
      setSession(value);
      setMessage(value.consumer_snapshot.label);
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === "DEMO_NOT_AVAILABLE"
          ? "Synthetic demo sessions are unavailable in production."
          : "The server did not authorize a runnable session.",
      );
    }
  }
  async function command(action: string) {
    if (!session) return;
    try {
      const value = await api(`training/sessions/${session.id}/transitions`, {
        action,
        expected_version: session.version,
        idempotency_key: requestKey(),
        client_timestamp: new Date().toISOString(),
      });
      setSession(value);
      setMessage(`${action.toLowerCase()} recorded.`);
    } catch {
      if (
        ["IN_PROGRESS", "PAUSED"].includes(session.state) &&
        queue.length < 100
      )
        setQueue((current) => [
          ...current,
          {
            path: `training/sessions/${session.id}/transitions`,
            body: {
              action,
              expected_version: session.version + current.length,
              idempotency_key: requestKey(),
            },
          },
        ]);
      setMessage(
        "The action could not be synchronized. It is queued without changing server authority.",
      );
    }
  }
  async function recordActual(item_status: "COMPLETED" | "SKIPPED") {
    if (!session) return;
    const body = {
      expected_version: session.version + queue.length,
      idempotency_key: requestKey(),
      actual: {
        prescribed_line_index: session.current_line,
        item_status,
      },
    };
    try {
      const value = await api(`training/sessions/${session.id}/actuals`, body);
      setSession(value.session);
      setMessage("Actual performance recorded separately.");
    } catch {
      if (queue.length < 100)
        setQueue((current) => [
          ...current,
          {
            path: `training/sessions/${session.id}/actuals`,
            body: {
              ...body,
              expected_version: session.version + current.length,
            },
          },
        ]);
      setMessage("Actual performance is queued in memory for synchronization.");
    }
  }
  async function synchronize() {
    let completed = 0;
    try {
      for (const item of queue) {
        const value = await api(item.path, item.body);
        setSession(value.session ?? value);
        completed++;
      }
      setQueue([]);
      setMessage(`${completed} queued actions synchronized.`);
    } catch {
      setQueue((current) => current.slice(completed));
      setMessage(
        "Synchronization stopped safely. Reload server state before retrying a conflict.",
      );
    }
  }
  const elapsed =
    Number(session?.accumulated_ms ?? 0) +
    (session?.running_since
      ? Math.max(0, now - new Date(session.running_since).getTime())
      : 0);
  const line = session?.consumer_snapshot.lines[session.current_line];
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar barStyle="light-content" />
      <Text style={styles.brand} accessibilityRole="header">
        FORMATION <Text style={styles.accent}>ZERO</Text>
      </Text>
      <Text style={styles.eyebrow}>INDIVIDUAL TRAINING</Text>
      <Text style={styles.heading} accessibilityRole="header">
        Execute the authorized plan.
      </Text>
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {message}
      </Text>
      {!signedIn && (
        <View style={styles.card} accessibilityLabel="Sign in">
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            inputMode="email"
            placeholder="Email"
            placeholderTextColor={t.color.textMuted}
            accessibilityLabel="Email"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="Password"
            placeholderTextColor={t.color.textMuted}
            accessibilityLabel="Password"
          />
          <Action label="Sign in" onPress={login} />
        </View>
      )}
      {signedIn && !session && (
        <View style={styles.card}>
          <Text style={styles.copy}>
            Production remains fail closed until authorized content and policy
            prerequisites exist.
          </Text>
          <Action
            label="Request synthetic demo session"
            onPress={requestDemo}
          />
          <Action label="Sign out" onPress={logout} secondary />
        </View>
      )}
      {session && (
        <View style={styles.card}>
          <Text style={styles.badge}>{session.consumer_snapshot.label}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {session.consumer_snapshot.objective.replaceAll("_", " ")}
          </Text>
          <Text style={styles.copy}>{session.consumer_snapshot.rationale}</Text>
          <Text
            style={styles.timer}
            accessibilityLabel={`Elapsed ${Math.floor(elapsed / 60000)} minutes ${Math.floor(elapsed / 1000) % 60} seconds`}
          >
            {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:
            {String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}
          </Text>
          <Text style={styles.copy}>
            State: {session.state.replaceAll("_", " ")}
          </Text>
          {line && (
            <View style={styles.exercise}>
              <Text style={styles.eyebrow}>{line.section}</Text>
              <Text style={styles.title} accessibilityRole="header">
                {line.name}
              </Text>
              <Text style={styles.copy}>{line.purpose}</Text>
              <Text style={styles.copy}>{line.setup_and_execution}</Text>
              {line.media.length === 0 && (
                <Text style={styles.muted}>
                  No approved image is available. Essential information remains
                  in text.
                </Text>
              )}
            </View>
          )}
          <View style={styles.actions}>
            {session.state === "NOT_STARTED" && (
              <Action label="Start session" onPress={() => command("START")} />
            )}
            {session.state === "IN_PROGRESS" && (
              <Action label="Pause" onPress={() => command("PAUSE")} />
            )}
            {session.state === "PAUSED" && (
              <Action label="Resume" onPress={() => command("RESUME")} />
            )}
            {["IN_PROGRESS", "PAUSED"].includes(session.state) && (
              <>
                <Action
                  label="Record item complete"
                  onPress={() => recordActual("COMPLETED")}
                />
                <Action
                  label="Skip and record"
                  onPress={() => recordActual("SKIPPED")}
                  secondary
                />
                <Action
                  label="Complete workout"
                  onPress={() => command("COMPLETE")}
                />
                <Action
                  label="Abandon workout"
                  onPress={() => command("ABANDON")}
                  secondary
                />
              </>
            )}
            <Action
              label={`Synchronize queued actions (${queue.length})`}
              onPress={synchronize}
              secondary
            />
            <Action label="Sign out and clear" onPress={logout} secondary />
          </View>
          <Text style={styles.muted}>
            Timers assist execution. They do not change prescribed work.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Action({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.color.backgroundPrimary },
  content: {
    flexGrow: 1,
    padding: t.space.lg,
    paddingBottom: t.space.section,
    maxWidth: t.layout.reading,
    width: "100%",
    alignSelf: "center",
    gap: t.space.lg,
  },
  brand: {
    color: t.color.textPrimary,
    fontSize: t.typography.sizeTitle,
    fontWeight: "800",
    letterSpacing: t.typography.tracking,
  },
  accent: { color: t.color.brandText },
  eyebrow: {
    color: t.color.textSecondary,
    fontSize: t.typography.sizeSmall,
    letterSpacing: t.typography.tracking,
  },
  heading: {
    color: t.color.textPrimary,
    fontSize: t.typography.sizeTitle,
    fontWeight: "800",
  },
  title: {
    color: t.color.textPrimary,
    fontSize: t.typography.sizeTitle,
    fontWeight: "700",
  },
  copy: {
    color: t.color.textSecondary,
    fontSize: t.typography.sizeBody,
    lineHeight: t.typography.sizeBody * t.typography.lineBody,
  },
  status: { color: t.color.textSecondary, minHeight: t.layout.target },
  card: {
    backgroundColor: t.color.surfacePrimary,
    borderColor: t.color.borderDefault,
    borderWidth: t.border.thin,
    borderRadius: t.radius.medium,
    padding: t.space.lg,
    gap: t.space.md,
  },
  exercise: {
    backgroundColor: t.color.surfaceElevated,
    borderRadius: t.radius.small,
    padding: t.space.lg,
    gap: t.space.sm,
  },
  input: {
    minHeight: t.layout.target,
    color: t.color.textPrimary,
    backgroundColor: t.color.backgroundSecondary,
    borderColor: t.color.borderDefault,
    borderWidth: t.border.thin,
    borderRadius: t.radius.small,
    padding: t.space.md,
  },
  button: {
    minHeight: t.layout.target,
    justifyContent: "center",
    alignItems: "center",
    padding: t.space.md,
    borderRadius: t.radius.small,
    backgroundColor: t.color.brandAccent,
  },
  secondary: {
    backgroundColor: t.color.surfaceElevated,
    borderColor: t.color.borderDefault,
    borderWidth: t.border.thin,
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: t.color.textPrimary, fontWeight: "700" },
  actions: { gap: t.space.md },
  badge: { color: t.color.brandText, fontWeight: "700" },
  timer: {
    color: t.color.textPrimary,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
  },
  muted: { color: t.color.textMuted, fontSize: t.typography.sizeSmall },
});
