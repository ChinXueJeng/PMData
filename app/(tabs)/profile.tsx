import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();

  type UserProfile = {
    id: string;
    username: string;
    email: string;
  };

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setProfile({
          id: session.user.id,
          username: session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setProfile({
          id: session.user.id,
          username: session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
        });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);

      // Get the current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Alert.alert("Error", "Please log in again to delete your account.");
        return;
      }

      // Call the edge function to delete the user account
      const response = await fetch(
        "https://mfrmfxtfjmuolckjfpys.supabase.co/functions/v1/delete-user-account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Sign out the user locally
        await supabase.auth.signOut();
        Alert.alert(t("accountDeleted"), "", [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]);
      } else {
        const errorData = await response.text();
        console.error("Delete account error:", errorData);
        Alert.alert("Error", t("deleteAccountError"));
      }
    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert("Error", t("deleteAccountError"));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 25 }]}>
      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {session ? t("myaccount") : "Guest Account"}
        </Text>

        {/* Avatar */}
        <Image
          source={require("@/assets/images/TotoLOGO.png")}
          style={styles.avatar}
        />

        {/* Section */}
        <Text style={styles.section}>{t("general")}</Text>

        <ProfileRow title={t("FAQ")} onPress={() => setShowFAQ(true)} />
        <ProfileRow
          title={t("termandconditions")}
          onPress={() => setShowTerms(true)}
        />
        <ProfileRow
          title={t("privacypolicy")}
          onPress={() => setShowPrivacy(true)}
        />
        <ProfileRow
          title={
            currentLanguage === "zh"
              ? t("switchToEnglish")
              : t("switchToChinese")
          }
          onPress={() => changeLanguage(currentLanguage === "zh" ? "en" : "zh")}
        />
        <ProfileRow
          title={t("Become a premium member")}
          onPress={() => {
            if (!session) {
              Alert.alert(t("loginRequired"), t("pleaseLoginToSubscribe"), [
                {
                  text: t("cancel"),
                  style: "cancel",
                },
                {
                  text: t("login"),
                  onPress: () => router.replace("/(auth)/login"),
                },
              ]);
            } else {
              router.push("/paywall");
            }
          }}
        />
        {/* Logout / Login */}
        {session ? (
          <>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace("/(auth)/login");
              }}
            >
              <Text style={styles.logoutText}>{t("logout")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Text style={styles.deleteText}>{t("deleteAccount")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.logoutBtn]}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.logoutText}>{t("signInRegister")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setShowTerms(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.lastUpdated}>
              Last updated: January 7, 2025
            </Text>

            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading, accessing, or using the 4Data mobile application,
              you agree to be bound by these Terms and Conditions ("Terms"). If
              you do not agree to these Terms, please do not use the App.
            </Text>

            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.paragraph}>
              The App provides statistical analysis, historical data review, and
              probability insights regarding past lottery results. It uses
              mathematical models and algorithms to suggest which numbers may
              have a higher probability of being drawn in future lottery events
              based on past data only. The App does not guarantee winning
              outcomes, nor does it claim to predict future lottery results with
              certainty.
            </Text>

            <Text style={styles.sectionTitle}>3. No Gambling or Wagering</Text>
            <Text style={styles.paragraph}>
              The App does not facilitate, promote, or participate in any form
              of gambling, betting, or wagering. It is solely an analytical tool
              for informational and entertainment purposes. Users are solely
              responsible for their own decisions regarding lottery play.
            </Text>

            <Text style={styles.sectionTitle}>
              4. No Guarantee of Accuracy or Results
            </Text>
            <Text style={styles.paragraph}>
              All insights, probabilities, and suggestions provided by the App
              are based on historical data and statistical calculations. There
              is no guarantee that any number or combination will be drawn in
              any lottery. Lottery draws are random, and past results do not
              influence future outcomes.
            </Text>

            <Text style={styles.sectionTitle}>5. Eligibility</Text>
            <Text style={styles.paragraph}>
              You must be at least 18 years old (or the legal age for
              participating in lottery games in your jurisdiction) to use this
              App. By using the App, you represent and warrant that you meet
              these age requirements.
            </Text>

            <Text style={styles.sectionTitle}>6. Responsible Use</Text>
            <Text style={styles.paragraph}>
              The App is intended for responsible and lawful use. You agree not
              to use the App for any unlawful purpose or in any way that could
              violate applicable local, national, or international laws
              regarding gambling or betting.
            </Text>

            <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All content, algorithms, designs, logos, and software in the App
              are the property of 4Data or its licensors and are protected by
              copyright and other intellectual property laws. You may not copy,
              modify, distribute, or reverse-engineer any part of the App
              without explicit written permission.
            </Text>

            <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              To the fullest extent permitted by law, 4Data and its affiliates,
              directors, employees, and agents shall not be liable for any
              direct, indirect, incidental, special, or consequential damages
              arising from: 1. Your use or inability to use the App. 2. Any
              decisions made based on the App's analysis. 3. Any financial
              losses resulting from lottery participation.
            </Text>

            <Text style={styles.sectionTitle}>
              9. Third-Party Services and Links
            </Text>
            <Text style={styles.paragraph}>
              The App may contain links to third-party websites or services. We
              are not responsible for the content, accuracy, or practices of
              these third parties. Any reliance on such links is at your own
              risk.
            </Text>

            <Text style={styles.sectionTitle}>10. Privacy</Text>
            <Text style={styles.paragraph}>
              Your use of the App is also governed by our Privacy Policy, which
              explains how we collect, use, and protect your personal
              information.
            </Text>

            <Text style={styles.sectionTitle}>11. Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms shall be governed by and construed in accordance with
              the laws of Malaysia and Singapore, without regard to its conflict
              of law principles.
            </Text>

            <Text style={styles.sectionTitle}>Disclaimer of Affiliation:</Text>
            <Text style={styles.paragraph}>
              This App is not affiliated with, endorsed by, or connected to any
              official lottery organization. All lottery names and logos are
              trademarks of their respective owners and are used here for
              informational purposes only.
            </Text>

            <Text style={[styles.paragraph, { marginBottom: 30 }]}>
              If you have any questions about these Terms, please contact us at
              support@magnumapp.com.
            </Text>
          </ScrollView>
        </View>
      </Modal>
      {/* Privacy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setShowPrivacy(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Privacy Policy for 4Data</Text>
            <Text style={styles.paragraph}>Last Updated: 7 January 2026</Text>
            <Text style={styles.paragraph}>
              This Privacy Policy describes how 4Data ("we," "us," or "our")
              collects, uses, and protects your information when you use the
              4Data mobile application (the "App"). By using the App, you
              consent to the data practices described in this policy.
            </Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.subSectionTitle}>a) Personal Information:</Text>
            <Text style={styles.paragraph}>
              We may collect and store the following personal information when
              you subscribe to our services:
            </Text>
            <Text style={styles.bulletPoint}>
              • Subscription Information: Details related to your purchase,
              including transaction history, subscription status, and renewal
              dates
            </Text>
            <Text style={styles.bulletPoint}>
              • App Store Account Identifiers: If you subscribe through Apple
              App Store or Google Play Store, we receive anonymized transaction
              confirmation and subscription status from the respective platform
            </Text>
            <Text style={styles.bulletPoint}>
              • Email Address: If you voluntarily provide it for account
              recovery, support, or receipts (typically managed through the app
              store)
            </Text>
            <Text style={styles.bulletPoint}>
              • Device ID/Advertising ID: Used for subscription management and
              fraud prevention
            </Text>

            <Text style={styles.subSectionTitle}>
              b) Non-Personal Information:
            </Text>
            <Text style={styles.paragraph}>
              We may collect anonymous, aggregated data including:
            </Text>
            <Text style={styles.bulletPoint}>
              • Device information (type, operating system, unique device
              identifiers)
            </Text>
            <Text style={styles.bulletPoint}>
              • App usage statistics (features accessed, session duration,
              frequency of use)
            </Text>
            <Text style={styles.bulletPoint}>
              • Analytical data regarding user interaction with probability
              models
            </Text>
            <Text style={styles.bulletPoint}>
              • Technical logs (crash reports, performance data)
            </Text>

            <Text style={styles.subSectionTitle}>
              c) Lottery Selection Data:
            </Text>
            <Text style={styles.paragraph}>
              The App may temporarily process:
            </Text>
            <Text style={styles.bulletPoint}>
              • Numbers you input for analysis
            </Text>
            <Text style={styles.bulletPoint}>
              • Historical lottery data you choose to review
            </Text>
            <Text style={styles.bulletPoint}>
              • Your saved preferences and customized settings
            </Text>
            <Text style={styles.paragraph}>
              This data is processed locally on your device and is not
              transmitted to our servers unless explicitly stated.
            </Text>

            <Text style={styles.sectionTitle}>
              2. How We Use Your Information
            </Text>
            <Text style={styles.paragraph}>
              We use collected information solely for the following purposes:
            </Text>
            <Text style={styles.bulletPoint}>
              • To provide and improve the App's analytical features
            </Text>
            <Text style={styles.bulletPoint}>
              • To manage your subscription, process payments, and send renewal
              notifications
            </Text>
            <Text style={styles.bulletPoint}>
              • To verify subscription status and restore purchases across
              devices
            </Text>
            <Text style={styles.bulletPoint}>
              • To enhance user experience and app functionality
            </Text>
            <Text style={styles.bulletPoint}>
              • To fix bugs and optimize performance
            </Text>
            <Text style={styles.bulletPoint}>
              • To generate anonymous statistical insights about general usage
              patterns
            </Text>
            <Text style={styles.bulletPoint}>
              • To comply with legal obligations if required
            </Text>
            <Text style={styles.bulletPoint}>
              • To prevent fraud and unauthorized access to subscription
              features
            </Text>

            <Text style={styles.sectionTitle}>3. Payment Processing</Text>
            <Text style={styles.subSectionTitle}>
              a) Third-Party Processors:
            </Text>
            <Text style={styles.paragraph}>
              All subscription payments are processed through:
            </Text>
            <Text style={styles.bulletPoint}>
              • Apple App Store (for iOS users)
            </Text>
            <Text style={styles.bulletPoint}>
              • Google Play Store (for Android users)
            </Text>
            <Text style={styles.paragraph}>
              We do not store or have access to your full payment details
              (credit card numbers, bank account information). Payment
              information is handled securely by the respective app store
              according to their privacy policies and terms.
            </Text>

            <Text style={styles.subSectionTitle}>
              b) Subscription Management:
            </Text>
            <Text style={styles.paragraph}>
              You can manage your subscription (cancel, change plan, view
              billing history) directly through your app store account settings.
            </Text>

            <Text style={styles.sectionTitle}>
              4. Data Storage and Security
            </Text>
            <Text style={styles.subSectionTitle}>a) Local Storage:</Text>
            <Text style={styles.paragraph}>
              All user preferences, historical data, and analysis inputs are
              stored locally on your device using secure storage methods. You
              can clear this data at any time by uninstalling the App or
              clearing the App's cache/data through your device settings.
            </Text>

            <Text style={styles.subSectionTitle}>b) Transmission:</Text>
            <Text style={styles.paragraph}>
              No personal or lottery-related data is transmitted to our servers
              unless:
            </Text>
            <Text style={styles.bulletPoint}>
              • Subscription verification requires communication with app store
              APIs
            </Text>
            <Text style={styles.bulletPoint}>
              • You voluntarily submit crash reports
            </Text>
            <Text style={styles.bulletPoint}>
              • You opt-in for anonymous usage analytics
            </Text>
            <Text style={styles.bulletPoint}>
              • Technical data required for app functionality (e.g., updating
              lottery result databases)
            </Text>

            <Text style={styles.subSectionTitle}>c) Security Measures:</Text>
            <Text style={styles.paragraph}>
              We implement reasonable technical and organizational measures to
              protect any data processed. However, no method of electronic
              transmission or storage is 100% secure.
            </Text>

            <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              The App may use third-party services that have their own privacy
              policies:
            </Text>

            <Text style={styles.subSectionTitle}>a) Analytics Providers:</Text>
            <Text style={styles.paragraph}>
              We may use services like Google Firebase Analytics or Apple's App
              Analytics to understand general usage patterns. These services
              collect anonymous, aggregated data that cannot identify individual
              users.
            </Text>

            <Text style={styles.subSectionTitle}>
              b) Subscription Platforms:
            </Text>
            <Text style={styles.bulletPoint}>
              • Apple App Store: Privacy policy available at [Apple Privacy
              Link]
            </Text>
            <Text style={styles.bulletPoint}>
              • Google Play Store: Privacy policy available at [Google Privacy
              Link]
            </Text>

            <Text style={styles.subSectionTitle}>
              c) Ad Networks (if applicable):
            </Text>
            <Text style={styles.paragraph}>
              If the App displays advertisements in the free version, ad
              networks may collect non-personal information to serve relevant
              ads. We do not control these third-party data collection
              practices.
            </Text>

            <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              The App is not intended for children under:
            </Text>
            <Text style={styles.bulletPoint}>• 18 years old, OR</Text>
            <Text style={styles.bulletPoint}>
              • The legal age for lottery participation in your jurisdiction,
              whichever is higher
            </Text>
            <Text style={styles.paragraph}>
              We do not knowingly collect any information from children. If you
              believe a child has provided us with information, please contact
              us immediately.
            </Text>

            <Text style={styles.sectionTitle}>7. User Rights and Choices</Text>
            <Text style={styles.paragraph}>You have the right to:</Text>
            <Text style={styles.bulletPoint}>
              • Access any data we may have collected about you
            </Text>
            <Text style={styles.bulletPoint}>
              • Request deletion of your data (excluding data required for legal
              compliance)
            </Text>
            <Text style={styles.bulletPoint}>
              • Opt-out of analytics collection (through device or app settings)
            </Text>
            <Text style={styles.bulletPoint}>
              • Cancel your subscription at any time through your app store
              account
            </Text>
            <Text style={styles.bulletPoint}>
              • Disable notifications if the App provides them
            </Text>
            <Text style={styles.paragraph}>
              To exercise these rights regarding data we control, contact us at
              [Your Contact Email].
            </Text>

            <Text style={styles.sectionTitle}>8. Lottery Data Sources</Text>
            <Text style={styles.paragraph}>
              The App may access publicly available lottery result databases to
              update its analytical models. This data is:
            </Text>
            <Text style={styles.bulletPoint}>
              • Collected from official or publicly verified sources
            </Text>
            <Text style={styles.bulletPoint}>
              • Used solely for statistical analysis
            </Text>
            <Text style={styles.bulletPoint}>
              • Processed in an aggregated, anonymized manner
            </Text>

            <Text style={styles.sectionTitle}>
              9. Changes to This Privacy Policy
            </Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy periodically. We will notify you
              of significant changes by:
            </Text>
            <Text style={styles.bulletPoint}>
              • Posting the new Privacy Policy in the App
            </Text>
            <Text style={styles.bulletPoint}>
              • Updating the "Last Updated" date
            </Text>
            <Text style={styles.bulletPoint}>
              • Providing in-app notifications for major changes
            </Text>
            <Text style={styles.bulletPoint}>
              • For subscribers, we may notify via email if you have provided
              your email address
            </Text>

            <Text style={styles.sectionTitle}>10. International Users</Text>
            <Text style={styles.paragraph}>
              If you are using the App outside [Your Country], please note that
              data may be transferred to and processed in [Your Country]. By
              using the App, you consent to this transfer.
            </Text>

            <Text style={styles.sectionTitle}>11. Legal Compliance</Text>
            <Text style={styles.paragraph}>
              We will disclose your information where required to do so by law
              or in response to valid requests by public authorities.
            </Text>

            <Text style={styles.paragraph}></Text>
            <Text style={styles.paragraph}>
              Additional Disclaimer: This Privacy Policy applies only to the
              4Data application. It does not apply to any lottery organizations
              or third-party services you may access through lottery
              participation. We are not responsible for the privacy practices of
              official lottery providers or gambling websites.
            </Text>
          </ScrollView>
        </View>
      </Modal>
      {/* FAQ Modal */}
      <Modal
        visible={showFAQ}
        animationType="slide"
        onRequestClose={() => setShowFAQ(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setShowFAQ(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>{t("FAQ")}</Text>

            <Text style={styles.sectionTitle}>About the App</Text>
            <Text style={styles.subSectionTitle}>
              Q: What does this app do?
            </Text>
            <Text style={styles.paragraph}>
              A: Our app analyzes historical lottery data using statistical
              methods to identify patterns and calculate probabilities. It shows
              which numbers have appeared more frequently in the past and
              provides insights based on probability theory.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Can the app predict winning lottery numbers?
            </Text>
            <Text style={styles.paragraph}>
              A: <Text style={styles.bold}>No.</Text> The app cannot and does
              not predict winning numbers. Lottery draws are completely random
              events. Our app only analyzes past data to show statistical
              probabilities - this is for informational and entertainment
              purposes only. There is no guarantee that any number or
              combination will be drawn.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: How accurate are the probability calculations?
            </Text>
            <Text style={styles.paragraph}>
              A: Our calculations are mathematically accurate based on the
              historical data we analyze. However, remember that past results do
              not influence future lottery draws. Each draw is independent and
              random.
            </Text>

            <Text style={styles.sectionTitle}>Subscription & Payment</Text>
            <Text style={styles.subSectionTitle}>
              Q: How does the subscription work?
            </Text>
            <Text style={styles.paragraph}>
              A: We offer a monthly subscription that unlocks premium features.
              The subscription automatically renews each month until canceled.
              You can try some basic features for free.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: How do I cancel my subscription?
            </Text>
            <Text style={styles.paragraph}>
              A: Subscriptions are managed through your app store (Apple App
              Store for iOS, Google Play Store for Android). To cancel:
            </Text>
            <Text style={styles.bulletPoint}>
              1. Open your device's Settings
            </Text>
            <Text style={styles.bulletPoint}>
              2. Go to your App Store account
            </Text>
            <Text style={styles.bulletPoint}>3. Select "Subscriptions"</Text>
            <Text style={styles.bulletPoint}>
              4. Find our app and choose "Cancel Subscription"
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Will I lose my data if I cancel?
            </Text>
            <Text style={styles.paragraph}>
              A: Your analysis history and preferences are stored locally on
              your device. If you uninstall the app, this data may be lost. Your
              subscription status is managed separately by the app stores.
            </Text>

            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <Text style={styles.subSectionTitle}>
              Q: What data do you collect?
            </Text>
            <Text style={styles.paragraph}>
              A: We collect minimal anonymous usage data to improve the app.
              This includes:
            </Text>
            <Text style={styles.bulletPoint}>
              • App performance and crash reports
            </Text>
            <Text style={styles.bulletPoint}>
              • Basic usage statistics (which features are used)
            </Text>
            <Text style={styles.bulletPoint}>
              • Device type and OS version (for compatibility)
            </Text>
            <Text style={styles.paragraph}>
              We do <Text style={styles.bold}>NOT</Text> collect:
            </Text>
            <Text style={styles.bulletPoint}>
              • Your personal information (name, address, etc.)
            </Text>
            <Text style={styles.bulletPoint}>
              • Your lottery number selections
            </Text>
            <Text style={styles.bulletPoint}>
              • Your payment information (handled by app stores)
            </Text>

            <Text style={styles.subSectionTitle}>Q: Do you sell my data?</Text>
            <Text style={styles.paragraph}>
              A: <Text style={styles.bold}>Absolutely not.</Text> We do not
              sell, rent, or share your personal data with third parties for
              marketing purposes.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: How do you get lottery results?
            </Text>
            <Text style={styles.paragraph}>
              A: We use publicly available data from official lottery sources.
              Our databases are updated regularly to ensure accuracy.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Why isn't my subscription working after purchase?
            </Text>
            <Text style={styles.paragraph}>1. Restart the app</Text>
            <Text style={styles.bulletPoint}>
              2. Check your internet connection
            </Text>
            <Text style={styles.bulletPoint}>
              3. Verify the purchase went through in your app store
            </Text>
            <Text style={styles.bulletPoint}>
              4. Try restoring purchases (in app settings)
            </Text>
            <Text style={styles.bulletPoint}>
              5. Contact us if issues persist
            </Text>

            <Text style={styles.sectionTitle}>Responsible Use</Text>
            <Text style={styles.subSectionTitle}>Q: Is this app gambling?</Text>
            <Text style={styles.paragraph}>
              A: <Text style={styles.bold}>No.</Text> This is an analytical
              tool, not a gambling platform. We do not facilitate betting, take
              wagers, or operate any gambling services.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: What is the minimum age to use this app?
            </Text>
            <Text style={styles.paragraph}>
              A: You must be at least 18 years old (or the legal age for lottery
              participation in your jurisdiction) to use this app.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Can I use this app to guarantee wins?
            </Text>
            <Text style={styles.paragraph}>
              A: <Text style={styles.bold}>No.</Text> There is no system, app,
              or method that can guarantee lottery wins. Our app is for
              informational purposes only. Please play responsibly and only
              spend what you can afford to lose.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Is this app affiliated with official lottery organizations?
            </Text>
            <Text style={styles.paragraph}>
              A: No. We are an independent third-party app and are not
              affiliated with, endorsed by, or connected to any official lottery
              organization.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: How quickly do you respond to support requests?
            </Text>
            <Text style={styles.paragraph}>
              A: We aim to respond within 24-48 hours during business days.
            </Text>

            <Text style={styles.subSectionTitle}>
              Q: Do you accept feature requests?
            </Text>
            <Text style={styles.paragraph}>
              A: Yes! We welcome suggestions. Please email us your ideas at
              [Your Contact Email].
            </Text>

            <Text style={styles.paragraph}></Text>
            <Text style={styles.disclaimer}>
              <Text style={styles.bold}>Disclaimer:</Text> This app is for
              informational and entertainment purposes only. Lottery
              participation involves risk. Please play responsibly and within
              your means. If you or someone you know has a gambling problem,
              please seek help from professional organizations in your country.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={32} color="#ff4444" />
              <Text style={styles.deleteModalTitle}>{t("deleteAccount")}</Text>
            </View>

            <Text style={styles.deleteModalMessage}>
              {t("deleteAccountWarning")}
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  deleting && styles.disabledButton,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.confirmDeleteButtonText}>
                      {t("deletingAccount")}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>
                    {t("confirmDelete")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProfileRow({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );
}

const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
};

const styles = StyleSheet.create({
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50, // Add padding to prevent content from going under the status bar
  },

  modalBackButton: {
    position: "absolute",
    top: 50,
    left: 15,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 1.0)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    ...shadow,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  backButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    color: "#666",
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
    marginBottom: 15,
  },

  // Original Styles
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    paddingHorizontal: 16,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backText: {
    marginLeft: 10,
    fontSize: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  loading: {
    marginTop: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  title: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 14,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 10,
  },

  name: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 20,
  },

  section: {
    color: "#999",
    fontSize: 13,
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  rowText: {
    fontSize: 14,
  },

  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#d60000ff",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4444",
  },

  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    ...shadow,
  },

  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },

  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },

  deleteModalMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },

  deleteModalButtons: {
    gap: 15,
    width: "100%",
  },

  cancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },

  confirmDeleteButton: {
    backgroundColor: "#ff4444",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmDeleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
    color: "#444",
  },

  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 20,
    marginBottom: 8,
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
    color: "#333",
  },
  disclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 30,
    color: "#888",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
});
