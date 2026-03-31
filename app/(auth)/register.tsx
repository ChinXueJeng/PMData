import { generateUsername, supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (type: "email" | "google") => {
    setLoading(true);

    try {
      if (type === "email") {
        // Basic validation
        if (!email || !password || !confirmPassword) {
          throw new Error("Please fill in all fields");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          throw new Error("Please enter a valid email address");
        }

        console.log("Attempting to register with email:", email);

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            emailRedirectTo:
              Platform.OS === "web"
                ? window.location.origin + "/auth/callback"
                : "fourdata://auth/callback",
            data: {
              email: email.trim(),
              full_name: generateUsername(email),
              username: generateUsername(email),
              // Add any additional user metadata here
            },
          },
        });

        console.log("Signup response:", { data, error });

        if (error) {
          console.error("Signup error details:", error);

          // Handle specific error cases
          if (error.message.includes("already registered")) {
            throw new Error(
              "This email is already registered. Please log in instead.",
            );
          } else if (error.message.includes("weak_password")) {
            throw new Error("Please choose a stronger password");
          } else if (error.message.includes("email")) {
            throw new Error("Please enter a valid email address");
          } else {
            throw error;
          }
        }

        // If we get here, signup was successful
        if (data.user?.identities?.length === 0) {
          throw new Error("This email is already registered");
        }

        // Store the email in AsyncStorage for the login screen
        await AsyncStorage.setItem("userEmail", email);

        // Show success message
        Alert.alert(
          "Check your email",
          "A confirmation email has been sent. Please verify your email to continue.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/(auth)/login"),
              style: "default",
            },
          ],
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={() => handleRegister("email")}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up with Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleRegister("google")}
          disabled={loading}
        >
          <MaterialIcons
            name="language"
            size={20}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  emailButton: {
    backgroundColor: "#007AFF",
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  icon: {
    marginRight: 10,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#888",
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
