import { useBrand } from "@/app/contexts/BrandContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Generate a consistent daily lucky number for the user
const useDailyLuckyNumber = (userId: string): number => {
  const [luckyNumber, setLuckyNumber] = useState<number>(0);
  useEffect(() => {
    const generateLuckyNumber = async () => {
      try {
        // Ensure we have a valid userId
        if (!userId || userId === "default") {
          // Generate a temporary number if no user ID is available
          const tempNumber = Math.floor(1000 + Math.random() * 9000);
          setLuckyNumber(tempNumber);
          return;
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
        const storageKey = `lucky_number_${userId}_${today}`;

        // Try to get today's number from secure storage
        const storedNumber = await SecureStore.getItemAsync(storageKey);

        if (storedNumber) {
          setLuckyNumber(parseInt(storedNumber, 10));
        } else {
          // Generate a new 4-digit number (1000-9999)
          const newNumber = Math.floor(1000 + Math.random() * 9000);

          // Store the new number for today
          await SecureStore.setItemAsync(storageKey, newNumber.toString());
          setLuckyNumber(newNumber);

          // Clear yesterday's number if it exists
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = `lucky_number_${userId}_${yesterday.toISOString().split("T")[0]}`;
          await SecureStore.deleteItemAsync(yesterdayKey);
        }
      } catch (error) {
        console.error("Error generating lucky number:", error);
        // Fallback to a default number
        setLuckyNumber(Math.floor(1000 + Math.random() * 9000));
      }
    };

    generateLuckyNumber();
  }, [userId]);

  return luckyNumber;
};

type NumberItem = {
  id: number;
  number: number;
  color: "green" | "lightGreen" | "yellow";
};

type ChipGridProps = {
  data: NumberItem[];
  onPressChip?: (item: NumberItem) => void;
  onPressViewAll?: () => void;
};

interface NextDrawProb {
  number: number;
  prob: number;
}

const useNextDrawNumbers = () => {
  const [topNumbers, setTopNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchTopNumbers = async () => {
      try {
        setLoading(true);
        console.log("🚀 Fetching numbers from Supabase...");

        // Fetch all data with prob >= 80
        const { data: allProbData, error: error90 } = await supabase
          .from("nextDrawProb")
          .select("number, prob")
          .gte("prob", 90)
          .lt("prob", 100);

        // If data exists, randomly pick 20 items
        const prob90 = allProbData
          ? allProbData
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 20)
          : null;

        // Fetch 5 numbers with prob between 80 and 89
        const { data: allProbData2, error: error80 } = await supabase
          .from("nextDrawProb")
          .select("number, prob")
          .gte("prob", 75)
          .lt("prob", 90);

        // If data exists, randomly pick 20 items
        const prob80 = allProbData2
          ? allProbData2
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 12)
          : null;

        // Fetch 5 numbers with prob between 70 and 79
        const { data: allProbData3, error: error70 } = await supabase
          .from("nextDrawProb")
          .select("number, prob")
          .gte("prob", 60)
          .lt("prob", 75);

        // If data exists, randomly pick 20 items
        const prob70 = allProbData3
          ? allProbData3
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 3)
          : null;

        if (error90 || error80 || error70) throw error90 || error80 || error70;

        // Combine all results
        const allNumbers = [
          ...(prob90 || []).map((item: NextDrawProb) => ({
            ...item,
            color: "green" as const,
          })),
          ...(prob80 || []).map((item: NextDrawProb) => ({
            ...item,
            color: "lightGreen" as const,
          })),
          ...(prob70 || []).map((item: NextDrawProb) => ({
            ...item,
            color: "yellow" as const,
          })),
        ];

        // Add unique IDs and format the data
        const formattedNumbers: NumberItem[] = allNumbers.map(
          (item, index) => ({
            id: index + 1,
            number: item.number,
            color: item.color,
          }),
        );

        setTopNumbers(formattedNumbers);
      } catch (err) {
        console.error("Error fetching next draw numbers:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch numbers",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopNumbers();
  }, []);

  return { topNumbers, loading, error };
};

const useNextDrawDate = () => {
  const [nextDrawDate, setNextDrawDate] = useState("");
  const { currentLanguage } = useLanguage();

  // Get localized date format based on language
  const getLocalizedDate = (date: Date) => {
    if (currentLanguage === "zh") {
      // Chinese date format: YYYY年M月D日
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }
    // Default to English format: Month Day, Year
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  useEffect(() => {
    const fetchNextDrawDate = async () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toISOString().split("T")[0];

        // If it's before 9 PM, check for today's draw
        // If it's after 9 PM, check from tomorrow
        const startDate =
          currentHour < 21
            ? today
            : new Date(now.setDate(now.getDate() + 1))
              .toISOString()
              .split("T")[0];
        const { data, error } = await supabase
          .from("lotterydate")
          .select("date")
          .gte("date", startDate)
          .order("date", { ascending: true })
          .limit(1);
        if (error) throw error;

        if (data && data.length > 0) {
          const date = new Date(data[0].date);
          // Show the date in user's preferred language
          setNextDrawDate(getLocalizedDate(date));
        } else {
          setNextDrawDate("No upcoming draws");
        }
      } catch (error) {
        console.error("Error:", error);
        setNextDrawDate("Error loading date");
      }
    };
    fetchNextDrawDate();
  }, [currentLanguage]); // Add currentLanguage to the dependency array
  return nextDrawDate;
};

export default function HomeScreen() {
  const router = useRouter();
  // Get the user's ID from Supabase auth
  const [userId, setUserId] = useState("default");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const luckyNumber = useDailyLuckyNumber(userId);
  const nextDrawDate = useNextDrawDate();
  const { t } = useLanguage();


  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);
  const { topNumbers, loading, error } = useNextDrawNumbers();
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const GRID_PADDING = 20 * 2; // container padding
  const GAP = 10;
  const { selectedBrand, setSelectedBrand } = useBrand();
  const CHIP_WIDTH = (SCREEN_WIDTH - GRID_PADDING - GAP * 3) / 4;

  const handleViewAllPress = useCallback(() => {
    if (!userId || userId === "default") {
      Alert.alert(t("loginRequired"), t("pleaseLoginToViewAll"), [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("login"),
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
      return;
    }

    if (isSubscribed) {
      router.push({
        pathname: "/(tabs)/home/view-all",
        params: { source: "default" },
      });
    } else {
      // Navigate to subscription screen
      router.push({ pathname: "/paywall" });
    }
  }, [isSubscribed, router, userId]);
  const useGlowPulse = () => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const glowAnim = React.useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.08,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: false,
            }),
          ]),
        ])
      ).start();
    }, []);

    return { scaleAnim, glowAnim };
  };

  function ChipGrid({ data, onPressChip, onPressViewAll }: ChipGridProps) {
    const { scaleAnim, glowAnim } = useGlowPulse();

    return (
      <View style={styles.grid}>
        {/* ✅ Normal chips (NO animation) */}
        {data.slice(0, 40).map((item) => {
          const ChipWrapper = onPressChip ? TouchableOpacity : View;

          return (
            <ChipWrapper
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onPressChip?.(item)}
              style={[
                styles.chip,
                styles.chipShadow,
                { width: CHIP_WIDTH, alignItems: "center" },
                item.color === "yellow"
                  ? styles.chipYellow
                  : item.color === "lightGreen"
                    ? styles.chipLightGreen
                    : styles.chipGreen,
              ]}
            >
              <Text style={styles.chipText}>{item.number}</Text>
            </ChipWrapper>
          );
        })}

        {/* 🔥 ONLY View All is animated */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            shadowColor: "yellow",
            shadowOpacity: glowAnim,
            shadowRadius: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPressViewAll}
            style={[
              styles.chip,
              styles.chipShadow,
              styles.viewAll,
              {
                width: CHIP_WIDTH,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "yellow",
              },
            ]}
          >
            <Text style={[styles.viewAllText, { color: "#bfa100" }]}>
              {t("viewall")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF3F9" }}>
      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAlert}
        onRequestClose={() => setShowAlert(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAlert(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.alertContainer}>
          <Text style={styles.alertText}>{alertMessage}</Text>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>

            {/* MAGNUM LOGO */}
            <TouchableOpacity
              onPress={() => {
                setSelectedBrand("MAGNUM");
                router.replace("/(tabs)/home/index_magnum");
              }}
            >
              <Image
                source={require("@/assets/images/magnumLOGO.png")}
                style={{ height: 50, width: 50, borderRadius: 10 }}
              />
            </TouchableOpacity>

            {/* TOTO LOGO */}
            <TouchableOpacity
              onPress={() => {
                setSelectedBrand("TOTO");
                router.replace("/(tabs)/home");
              }}

            >
              <Image
                source={require("@/assets/images/TotoLOGO.png")}
                style={{ height: 50, width: 50, borderRadius: 10 }}
              />
            </TouchableOpacity>

          </View>

          <View>
            <Text style={styles.subText}>{t("nextDraw")}</Text>
            <Text style={styles.title}>{nextDrawDate || "Loading..."}</Text>
          </View>
        </View>

        {/* Lucky Number * Upset Level*/}
        <View style={styles.secondheader}>
          <View style={[styles.upsetBox, strongShadow]}>
            <Text style={[styles.luckyText, { marginBottom: 4 }]}>
              {t("select")}
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 21,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              TOTO
            </Text>
          </View>
          <View style={[styles.luckyBox, strongShadow]}>
            <Text style={[styles.luckyText, { marginBottom: 4 }]}>
              {t("yourluckynumber")}
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 23,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {luckyNumber}
            </Text>
          </View>
        </View>
        <View style={[styles.jackpotCard, strongShadow]}>
          <View style={styles.jackpotHeader}>
            <Text style={styles.jackpotTitle}>ESTIMATED JACKPOT AMOUNT</Text>
            <View style={styles.jackpotMeta}>
              <Text style={styles.jackpotMetaText}>Draw Date: 28/03/2026, WEDNESDAY</Text>
              <Text style={styles.jackpotMetaText}>Draw No: 6108/26</Text>
            </View>
          </View>
          <View style={styles.jackpotRow}>
            <Image source={require("@/assets/images/jackpot.png")} style={styles.jackpotLogo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.jackpotLabel}>Jackpot 1</Text>
              <Text style={styles.jackpotAmount}>RM18,111,000.00</Text>
            </View>
          </View>
          <View style={styles.jackpotDivider} />
          <View style={styles.jackpotRow}>
            <Image source={require("@/assets/images/jackpot.png")} style={styles.jackpotLogo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.jackpotLabel}>Jackpot 2</Text>
              <Text style={styles.jackpotAmount}>RM488,000.00</Text>
            </View>
          </View>
        </View>
        {/* High Probability */}
        <View
          style={[
            {
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              marginBottom: 20,
            },
            strongShadow,
          ]}
        >
          <Text style={{ fontSize: 20, textAlign: "center" }}>
            {t("highProbabilityNumbers")}
          </Text>
        </View>
        {/* JACKPOT CARD */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>{t("loadingnum")}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : (
          <ChipGrid
            data={topNumbers}
            onPressChip={(item) =>
              router.push(`/(tabs)/home/number-details?number=${item.number}`)
            }
            onPressViewAll={handleViewAllPress}
          />
        )}

        {/* bottom spacing for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const strongShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 8,
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertContainer: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  jackpotCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  jackpotHeader: {
    backgroundColor: "#660004",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  jackpotTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  jackpotMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  jackpotMetaText: {
    color: "#b7b7b7",
    fontSize: 10,
  },
  jackpotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fe0000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 18,
  },
  jackpotLogo: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginLeft: 68,
  },
  jackpotLabel: {
    color: "#ffffffcc",
    fontSize: 12,
    marginBottom: 2,
  },
  jackpotAmount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  jackpotDivider: {
    height: 0.6,
    backgroundColor: "#826a6a",
  },
  alertText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#EEF3F9",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  secondheader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
    marginBottom: 15,
    gap: 9, // Add gap between the two boxes
  },

  subText: {
    color: "#555",
    fontSize: 16,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  luckyBox: {
    backgroundColor: "#d60000ff",
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.5, // This will make both boxes take equal width
    minHeight: 80, // Set a minimum height
  },
  upsetBox: {
    backgroundColor: "#d60000ff",
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.5, // This will make both boxes take equal width
    minHeight: 80, // Set a minimum height
  },

  luckyText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20, // Ensure proper line height
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: {
    fontWeight: "600",
    fontSize: 15,
  },

  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1E5BFF",
    justifyContent: "center",
    alignItems: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  chipShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },

  chipGreen: {
    backgroundColor: "#42ea61",
  },

  chipLightGreen: {
    backgroundColor: "#a2ffb3",
  },

  chipYellow: {
    backgroundColor: "#fffbb5",
  },

  chipText: {
    fontWeight: "600",
  },

  viewAll: {
    backgroundColor: "#fff",
  },

  viewAllText: {
    fontWeight: "500",
  },
  imageContainer: {
    flexDirection: "row", // Keep images in a row
    alignItems: "center", // Center images vertically
    gap: 10, // Add some space between images
  },
});
