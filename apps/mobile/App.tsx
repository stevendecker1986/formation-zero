import { ScrollView, View, Text, StyleSheet, StatusBar } from "react-native";
import { TIERS } from "@formation-zero/domain";
import { tokens as t, brand } from "@formation-zero/ui/tokens";
export default function App() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brand} accessibilityRole="header">
          FORMATION <Text style={styles.accent}>ZERO</Text>
        </Text>
        <Text style={styles.eyebrow}>BUILD CAPABILITY. IMPROVE EVERY DAY.</Text>
      </View>
      <Text style={styles.heading} accessibilityRole="header">
        {brand.tagline}
      </Text>
      <Text style={styles.copy}>
        For every athlete. Every body. Every goal.
      </Text>
      <View style={styles.surface}>
        <Text style={styles.title} accessibilityRole="header">
          The foundation
        </Text>
        <Text style={styles.copy}>
          Universal fitness, human performance, recovery, readiness, and group
          training.
        </Text>
        <View style={styles.tiers}>
          {TIERS.map((tier) => (
            <Text key={tier} style={styles.badge}>
              {tier}
            </Text>
          ))}
        </View>
        <Text style={styles.copy}>
          Phase A — Foundation. Training features are planned for later phases.
        </Text>
      </View>
      <Text style={styles.note}>
        Independent fitness and human-performance software. Not an official USMC
        or DoD product. No endorsement implied. Commercial launch is not
        authorized.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.color.backgroundPrimary },
  content: {
    flexGrow: 1,
    paddingHorizontal: t.space.lg,
    paddingTop: t.space.section,
    paddingBottom: t.space.section,
    maxWidth: t.layout.reading,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    borderBottomWidth: t.border.thin,
    borderBottomColor: t.color.borderDefault,
    paddingBottom: t.space.lg,
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
    marginTop: t.space.md,
  },
  heading: {
    color: t.color.textPrimary,
    fontSize: t.typography.sizeTitle,
    fontWeight: "800",
    marginTop: t.space.xxl,
    marginBottom: t.space.md,
  },
  title: {
    color: t.color.textPrimary,
    fontSize: t.typography.sizeTitle,
    fontWeight: "700",
    marginBottom: t.space.md,
  },
  copy: {
    color: t.color.textSecondary,
    fontSize: t.typography.sizeBody,
    lineHeight: t.typography.sizeBody * t.typography.lineBody,
    marginBottom: t.space.md,
  },
  surface: {
    backgroundColor: t.color.surfacePrimary,
    borderColor: t.color.borderDefault,
    borderWidth: t.border.thin,
    borderRadius: t.radius.medium,
    padding: t.space.lg,
    marginTop: t.space.lg,
  },
  tiers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.space.sm,
    marginBottom: t.space.lg,
  },
  badge: {
    color: t.color.textPrimary,
    borderColor: t.color.borderDefault,
    borderWidth: t.border.thin,
    borderRadius: t.radius.small,
    padding: t.space.sm,
    fontSize: t.typography.sizeSmall,
  },
  note: {
    color: t.color.textMuted,
    fontSize: t.typography.sizeSmall,
    lineHeight: t.typography.sizeSmall * t.typography.lineBody,
    marginTop: t.space.xl,
  },
});
