import { signInWithApple, signInWithGoogle, supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";

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

const getRedirectUrl = () => {
  if (Platform.OS === "web") {
    return window.location.origin;
  }
  // For mobile, use the deep link URL scheme
  return "fourdata://";
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        // User is signed in, redirect to home
        router.replace("/(tabs)/home");
      }
    };
    checkSession();
  }, []);
  const handleLogin = async (
    type: "email" | "google" | "facebook" | "apple",
  ) => {
    try {
      setLoading(true);

      if (type === "email") {
        if (!email || !password) {
          throw new Error("Please enter both email and password");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Please verify your email before logging in");
          } else {
            throw new Error(error.message);
          }
        }

        // Check if we have a valid session
        if (data?.session) {
          // Store the session in AsyncStorage for persistence
          await AsyncStorage.setItem(
            "supabase.auth.token",
            data.session.access_token,
          );
          // Navigate to home on successful login
          router.replace("/(tabs)/home");
        }
      } else if (type === "google") {
        await signInWithGoogle();
      }
      if (type === "apple") {
        await signInWithApple();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Welcome To 4Data</Text>
      <Text style={styles.para}>
        Check High probability 4D numbers and detailed information easily!
      </Text>
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

        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={() => handleLogin("email")}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In with Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleLogin("google")}
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

        <TouchableOpacity
          style={[styles.button, styles.appleButton]}
          onPress={() => handleLogin("apple")}
          disabled={loading}
        >
          <MaterialIcons
            name="apple"
            size={20}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Continue with Apple</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.button, styles.button]}
            onPress={() => router.push({ pathname: "/(auth)/register" as any })}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: "#007AFF" }]}>
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={() => router.replace("/(tabs)/home")}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: "#1E5BFF", fontSize: 8 }]}>
              Continue as Guest
            </Text>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  para: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
    color: "#a8a7a7ff",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#ccc",
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
    backgroundColor: "#1E5BFF",
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  appleButton: {
    backgroundColor: "#000000",
    marginTop: 12,
  },
  skipButton: {
    backgroundColor: "#ffffff",          
    borderWidth: 1,
    borderColor: "#7c9df6",
    marginTop: -5,
    width: "22%",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
  },
  icon: {
    marginRight: 10,
  },
  footerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});
