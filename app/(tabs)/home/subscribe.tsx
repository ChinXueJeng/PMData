import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import Purchases from 'react-native-purchases';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/app/contexts/LanguageContext';

// Replace with your actual subscription offering IDs
const SUBSCRIPTION_OFFERINGS = [
  { id: 'premium_monthly', name: 'Monthly', price: '$4.99/month' },
  { id: 'premium_yearly', name: 'Yearly', price: '$39.99/year' },
];

export default function SubscribeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (offeringId: string) => {
    try {
      setIsPurchasing(true);
      setError('');
      
      // Get the offering
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current;
      
      if (!offering) {
        throw new Error('No subscription offerings found');
      }
      
      // Find the package to purchase
      const packageToPurchase = offering.availablePackages.find(
        pkg => pkg.identifier === offeringId
      );
      
      if (!packageToPurchase) {
        throw new Error('Selected package not found');
      }
      
      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Check if purchase was successful
      if (customerInfo.entitlements.active['premium']) {
        // Navigate back to the view-all screen
        router.back();
      }
    } catch (error) {
  if (error instanceof Error && 'userCancelled' in error && !error.userCancelled) {
    setError('Failed to complete purchase. Please try again.');
    console.error('Purchase error:', error);
  }
} finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('premiumFeatures')}</Text>
          <Text style={styles.subtitle}>{t('unlockAllFeatures')}</Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• {t('viewAllNumbers')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• {t('exclusiveAnalytics')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• {t('adFreeExperience')}</Text>
          </View>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_OFFERINGS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.planButton}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isPurchasing}
            >
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPopular}>
                {plan.id.includes('yearly') ? t('bestValue') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.footerText}>
          {t('subscriptionTerms')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#444',
  },
  plansContainer: {
    width: '100%',
    marginBottom: 20,
  },
  planButton: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  planPopular: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});
