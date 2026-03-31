import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  handleSubscriptionChange: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

// Replace with your RevenueCat API key
const iOSKey = "appl_mDLVbdLtNzYAGnnsvdQBCMYzBrg";
const androidKey = "goog_HYquXHhzebDACXSxFyldrQmuQxl";
const REVENUECAT_API_KEY = Platform.OS === "android" ? androidKey : iOSKey;
// Replace with your actual API key

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        // Initialize RevenueCat
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
        });

        // Check subscription status
        await checkSubscription();
      } catch (error) {
        console.error("Error setting up RevenueCat:", error);
        setIsLoading(false);
      }
    };

    setupRevenueCat();
  }, []);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsSubscribed(false);
        return;
      }

      // Set the user ID for RevenueCat
      await Purchases.logIn(user.id);

      // Get customer info
      const customerInfo = await Purchases.getCustomerInfo();

      // Check if user has active subscription
      const hasActiveSubscription =
        customerInfo.entitlements.active["premium"] !== undefined;
      console.log("Subscription status:", hasActiveSubscription);
      setIsSubscribed(hasActiveSubscription);
      if (hasActiveSubscription) {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubscriptionChange = async () => {
    const customerInfo = await Purchases.getCustomerInfo();

    // Check if user has active subscription
    const hasActiveSubscription =
      customerInfo.entitlements.active["premium"] !== undefined;
    console.log("Subscription status:", hasActiveSubscription);
    setIsSubscribed(hasActiveSubscription);
    if (hasActiveSubscription) {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        checkSubscription,
        handleSubscriptionChange,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
