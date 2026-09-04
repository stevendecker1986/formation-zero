import { View, Text, StyleSheet } from "react-native";
import { TIERS } from "@formation-zero/domain";
export default function App() {
  return (
    <View style={styles.root}>
      <Text style={styles.brand}>FORMATION ZERO</Text>
      <Text style={styles.heading}>Readiness Starts Here.</Text>
      <Text style={styles.copy}>Phase A — Foundation</Text>
      <Text style={styles.copy}>{TIERS.join(" / ")}</Text>
      <Text style={styles.copy}>
        Training and formation features are planned for later phases.
      </Text>
      <Text style={styles.note}>
        Independent fitness software. Not an official USMC or DoD product.
        Commercial launch is not authorized.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#101923",
  },
  brand: { color: "#c5d49c", fontSize: 18, letterSpacing: 3 },
  heading: { color: "#f1f4f6", fontSize: 32, marginVertical: 24 },
  copy: { color: "#f1f4f6", fontSize: 17, marginBottom: 16 },
  note: { color: "#bdc7d1", fontSize: 14, marginTop: 32 },
});
