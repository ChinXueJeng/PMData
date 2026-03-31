import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { createClient } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";
GoogleSignin.configure({
  iosClientId:
    "457819047674-uu6gg5cpqh2vri5i34jglmhpkl4at8il.apps.googleusercontent.com",
  webClientId:
    "457819047674-8m2uiko9ddds5g608etkn7aj3tbrgbke.apps.googleusercontent.com",
});
const isWeb = Platform.OS === "web";

// For web, use localStorage
const webStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};

// For native, use SecureStore
const nativeStorage = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const storage = isWeb ? webStorage : nativeStorage;

// Supabase project's credentials
const supabaseUrl = "https://mfrmfxtfjmuolckjfpys.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcm1meHRmam11b2xja2pmcHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk4MTEsImV4cCI6MjA4MTQxNTgxMX0.sClWkXWLf9vWS6Rsffse6gKzYatPJkSpm1n_vWZ0Jxc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isWeb,
  },
});

// Function to generate a random username
export const generateUsername = (email: string) => {
  // Get first 5 characters of the email (or less if shorter)
  const prefix = email.split("@")[0].toLowerCase().slice(0, 5);
  // Generate 4 random digits
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomDigits}`;
};

// Add this debug code FIRST
const debugUri = makeRedirectUri({
  scheme: "yourapp", // Your app's custom scheme
  preferLocalhost: false,
});

console.log("DEBUG - iOS Redirect URI:", debugUri);

// Get the correct redirect URL based on platform
const getRedirectUrl = () => {
  if (isWeb) {
    return `${window.location.origin}/auth/callback`;
  }

  // For iOS, use the app's custom URL scheme
  if (Platform.OS === "ios") {
    return makeRedirectUri({
      scheme: "fourdata",
      preferLocalhost: false,
    });
  }

  // For Android, use the app's custom URL scheme
  if (Platform.OS === "android") {
    return makeRedirectUri({
      scheme: "fourdata",
      preferLocalhost: false,
    });
  }

  // Fallback for other platforms
  return makeRedirectUri({
    scheme: "fourdata",
    preferLocalhost: true,
  });
};

// Initialize auth requests
let googleAuthRequest = null;
let facebookAuthRequest = null;

// Only create the auth request on the client side
if (typeof window !== "undefined") {
  googleAuthRequest = {
    // Replace these with your actual client IDs from Google Cloud Console
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    iosClientId:
      "457819047674-uu6gg5cpqh2vri5i34jglmhpkl4at8il.apps.googleusercontent.com",
    webClientId:
      "457819047674-rb8omn34p5sue7ssbhg25fn325qu4dle.apps.googleusercontent.com",
    expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    redirectUri: getRedirectUrl(),
  };
}

// Helper function to handle Google OAuth sign in
// export const signInWithApple = async () => {
//   try {
//     const credential = await AppleAuthentication.signInAsync({
//       requestedScopes: [
//         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
//         AppleAuthentication.AppleAuthenticationScope.EMAIL,

//       ],
//       nonce: Math.random().toString(36).substring(2, 15), // Generate a random nonce
//     });
//     console.log("Apple sign in credential:", credential);
//     // Sign in via Supabase Auth.
//     if (credential.identityToken) {
//       const {
//         error,
//         data: { user },
//       } = await supabase.auth.signInWithIdToken({
//         provider: "apple",
//         token: credential.identityToken,
//         access_token: credential.authorizationCode as string,
//       });
//       console.log(JSON.stringify({ error, user }, null, 2));
//       if (!error) {
//         // Apple only provides the user's full name on the first sign-in
//         // Save it to user metadata if available
//         if (credential.fullName) {
//           const nameParts = [];
//           if (credential.fullName.givenName)
//             nameParts.push(credential.fullName.givenName);
//           if (credential.fullName.middleName)
//             nameParts.push(credential.fullName.middleName);
//           if (credential.fullName.familyName)
//             nameParts.push(credential.fullName.familyName);
//           const fullName = nameParts.join(" ");
//           await supabase.auth.updateUser({
//             data: {
//               full_name: fullName,
//               given_name: credential.fullName.givenName,
//               family_name: credential.fullName.familyName,
//             },
//           });
//           const { data: sessionData, error: sessionError } =
//             await supabase.auth.getSession();
//           return sessionData;
//         }
//         // User is signed in.
//       }
//     } else {
//       throw new Error("No identityToken.");
//     }
//   } catch (e) {
//     console.error("Error during Apple sign in:", e);
//   }
// };
export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      // Use the identity token to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        // Optional: You can also pass the nonce if you generate and use one
        // nonce: rawNonce,
      });

      if (error) throw error;
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionData?.session) {
        // Store the session in AsyncStorage for persistence
        await AsyncStorage.setItem(
          "supabase.auth.token",
          sessionData.session.access_token,
        );
        // Navigate to home on successful login
        router.replace("/(tabs)/home");
      }
      console.log("Signed in successfully:", data);
      // Handle navigation or state updates upon success
    } else {
      throw new Error("No identity token received");
    }
  } catch (e) {
    if (e.code === "ERR_APPLE_SIGN_IN_REQUEST") {
      console.log("Apple Sign-In cancelled or failed:", e.message);
    } else {
      console.error(
        "An unexpected error occurred during Apple Sign-In:",
        e.message,
      );
    }
  }
};
export const signInWithGoogle = async () => {
  try {
    const response = await GoogleSignin.signIn();

    if (response.data?.idToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.data.idToken,
      });
      console.log("google sign in", error, data);
    }
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionData?.session) {
      // Store the session in AsyncStorage for persistence
      await AsyncStorage.setItem(
        "supabase.auth.token",
        sessionData.session.access_token,
      );
      // Navigate to home on successful login
      router.replace("/(tabs)/home");
    }
  } catch (error: any) {
    console.error("Error during Google sign in:", error);
  }
};

// Function to handle auth state changes
export const handleAuthStateChange = async (event: string, session: any) => {
  console.log("Auth state changed:", event);

  if (event === "SIGNED_IN" && session?.user) {
    console.log("User signed in:", session.user);

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
        return;
      }

      if (!user) {
        console.error("No user found after sign in");
        return;
      }

      console.log("Checking for existing profile for user:", user.id);

      // First, try to get the profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      console.log("Profile check - data:", profile, "error:", profileError);

      // If we have a profile, no need to create one
      if (profile) {
        console.log("Profile already exists:", profile);
        return;
      }

      // If we get here, we need to create a profile
      console.log("No existing profile found. Creating new profile...");
      const username = generateUsername(user.email || "user");
      console.log("Generated username:", username);

      const { data: newProfile, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username,
            email: user.email,
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        )
        .select()
        .single();

      if (upsertError) {
        console.error("Error creating profile:", upsertError);
        // Check if it's a permission issue
        if (upsertError.message.includes("permission denied")) {
          console.error(
            "Permission denied. Please check your RLS policies on the profiles table.",
          );
        }
      } else if (newProfile) {
        console.log("Profile created successfully:", newProfile);
      }
    } catch (e) {
      console.error("Exception in handleAuthStateChange:", e);
    }
  }
};
// Set up the auth state change listener
if (isWeb) {
  console.log("Setting up auth state change listener...");
  supabase.auth.onAuthStateChange(handleAuthStateChange);
}
