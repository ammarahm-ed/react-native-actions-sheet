import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  scrollView: {
    height: "100%",
    width: "100%",
    backgroundColor: "transparent",
  },
  container: {
    width: "100%",
    backgroundColor: "white",
    alignSelf: "center",
  },
  safearea: {
    position: "absolute",
    top: 999999,
    left: 999999,
  },
  indicator: {
    height: 6,
    width: 45,
    borderRadius: 100,
    backgroundColor: "#f0f0f0",
    marginVertical: 5,
    alignSelf: "center",
  },
  parentContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
