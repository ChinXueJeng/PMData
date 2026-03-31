import { useSubscription } from "@/contexts/SubscriptionContext";
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Paywall() {
  const { handleSubscriptionChange } = useSubscription();
  const router = useRouter();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);

          // Select annual by default if available, else first
          const annual = offerings.current.availablePackages.find(p => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
          setSelectedPackage(annual || offerings.current.availablePackages[0]);
        }
      } catch (e) {
        console.error("Error fetching offerings", e);
        Alert.alert("Error", "Could not fetch subscription plans.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
        console.log(`Purchase completed for ${selectedPackage.identifier}`);
        await handleSubscriptionChange();
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error(e);
        Alert.alert("Purchase Failed", e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
        console.log("Restore completed");
        await handleSubscriptionChange();
        Alert.alert("Success", "Your purchases have been restored.");
        router.back();
      } else {
        Alert.alert("No Subscriptions", "We could not find any active premium subscriptions for this account.");
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Restore Failed", e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>PMData Premium</Text>
          <Text style={styles.subtitle}>
            Complete analysis of all numbers and more{'\n'}detailed prediction data. Cancel anytime.
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/paywall.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.plansContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#e00000" style={{ marginVertical: 30, alignSelf: 'center', flex: 1 }} />
            ) : packages.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 30, flex: 1 }}>No subscription plans found. Make sure offerings are configured in RevenueCat.</Text>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const isAnnual = pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL;

                // Clean up title to remove App Store metadata like "(App Name)"
                const displayTitle = pkg.packageType.toString();

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.planCard,
                      isSelected ? styles.planCardSelected : styles.planCardUnselected
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                    activeOpacity={0.8}
                  >
                    {isAnnual && (
                      <View style={[styles.discountBadge, { borderColor: '#000', borderWidth: 1.5 }]}>
                        <Text style={styles.discountText}>BEST VALUE</Text>
                      </View>
                    )}

                    <View style={[styles.planHeaderRow, !isAnnual && { marginTop: 4 }]}>
                      <Text style={styles.planTitle}>{displayTitle}</Text>
                      {isSelected ? (
                        <View style={styles.checkCircleActive}>
                          <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                      ) : (
                        <View style={styles.checkCircleInactive} />
                      )}
                    </View>
                    <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                    <Text style={styles.planSubtext}>{pkg.product.description}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isPurchasing && { opacity: 0.7 }]}
            onPress={handlePurchase}
            disabled={isPurchasing || packages.length === 0 || !selectedPackage}
          >
            {isPurchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {selectedPackage?.product.introPrice
                  ? "Try Free For 7 Days"
                  : "Subscribe Now"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
              <Text style={styles.footerLinkText}>Restore Purchases</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={styles.footerLinkText}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 20,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 16,
    position: 'relative',
    minHeight: 110,
    justifyContent: 'center',
  },
  planCardSelected: {
    borderColor: '#e00000',
    backgroundColor: '#f6f6f6',
  },
  planCardUnselected: {
    borderColor: '#d0d0d0',
    backgroundColor: '#f2f2f2',
  },
  discountBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#e00000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e00000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#b0b0b0',
    backgroundColor: 'transparent',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  planSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  ctaButton: {
    backgroundColor: '#e00000',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
});
