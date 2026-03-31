
import { useBrand } from "@/app/contexts/BrandContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
        if (!userId || userId === 'default') {
          // Generate a temporary number if no user ID is available
          const tempNumber = Math.floor(1000 + Math.random() * 9000);
          setLuckyNumber(tempNumber);
          return;
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
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
          const yesterdayKey = `lucky_number_${userId}_${yesterday.toISOString().split('T')[0]}`;
          await SecureStore.deleteItemAsync(yesterdayKey);
        }
      } catch (error) {
        console.error('Error generating lucky number:', error);
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
        console.log('🚀 Fetching numbers from Supabase...');

        // Fetch all data with prob >= 80
        const { data: allProbData, error: error90 } = await supabase
          .from('nextDrawProb')
          .select('number, prob')
          .gte('prob', 85)
          .lt('prob', 100);

        // If data exists, randomly pick 20 items
        const prob90 = allProbData ?
          allProbData
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 20) :
          null;

        // Fetch 5 numbers with prob between 80 and 89
        const { data: allProbData2, error: error80 } = await supabase
          .from('nextDrawProb')
          .select('number, prob')
          .gte('prob', 75)
          .lt('prob', 85)

        // If data exists, randomly pick 20 items
        const prob80 = allProbData2 ?
          allProbData2
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 12) :
          null;

        // Fetch 5 numbers with prob between 70 and 79
        const { data: allProbData3, error: error70 } = await supabase
          .from('nextDrawProb')
          .select('number, prob')
          .gte('prob', 60)
          .lt('prob', 75)

        // If data exists, randomly pick 20 items
        const prob70 = allProbData3 ?
          allProbData3
            .sort(() => Math.random() - 0.5) // Shuffle array
            .slice(0, 3) :
          null;

        if (error90 || error80 || error70) throw error90 || error80 || error70;

        // Combine all results
        const allNumbers = [
          ...(prob90 || []).map((item: NextDrawProb) => ({ ...item, color: 'green' as const })),
          ...(prob80 || []).map((item: NextDrawProb) => ({ ...item, color: 'lightGreen' as const })),
          ...(prob70 || []).map((item: NextDrawProb) => ({ ...item, color: 'yellow' as const }))
        ];

        // Add unique IDs and format the data
        const formattedNumbers: NumberItem[] = allNumbers.map((item, index) => ({
          id: index + 1,
          number: item.number,
          color: item.color
        }));

        setTopNumbers(formattedNumbers);
      } catch (err) {
        console.error('Error fetching next draw numbers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch numbers');
      } finally {
        setLoading(false);
      }
    };

    fetchTopNumbers();
  }, []);

  return { topNumbers, loading, error };
};



const useNextDrawDate = () => {
  const [nextDrawDate, setNextDrawDate] = useState<string>('');
  useEffect(() => {
    const fetchNextDrawDate = async () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toISOString().split('T')[0];

        // If it's before 9 PM, check for today's draw
        // If it's after 9 PM, check from tomorrow
        const startDate = currentHour < 21 ? today : new Date(now.setDate(now.getDate() + 1)).toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('lotterydate')
          .select('date')
          .gte('date', startDate)
          .order('date', { ascending: true })
          .limit(1);
        if (error) throw error;

        if (data && data.length > 0) {
          const date = new Date(data[0].date);
          // If the date is today and it's before 9 PM, show "Today"
          if (data[0].date === today && currentHour < 21) {
            setNextDrawDate('Today');
          } else {
            setNextDrawDate(date.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }));
          }
        } else {
          setNextDrawDate('No upcoming draws');
        }
      } catch (error) {
        console.error('Error:', error);
        setNextDrawDate('Error loading date');
      }
    };
    fetchNextDrawDate();
  }, []);
  return nextDrawDate;
};

export default function HomeScreen() {
  const router = useRouter();
  // Get the user's ID from Supabase auth
  const [userId, setUserId] = useState('default');
  const luckyNumber = useDailyLuckyNumber(userId);
  const nextDrawDate = useNextDrawDate();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);
  const { topNumbers, loading, error } = useNextDrawNumbers();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const GRID_PADDING = 20 * 2; // container padding
  const GAP = 10;
  const { selectedBrand, setSelectedBrand } = useBrand();
  const CHIP_WIDTH = (SCREEN_WIDTH - GRID_PADDING - GAP * 3) / 4;

  function ChipGrid({ data, onPressChip, onPressViewAll }: ChipGridProps) {
    return (
      <View style={styles.grid}>
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

        {/* View All */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressViewAll}
          style={[
            styles.chip,
            styles.chipShadow,
            styles.viewAll,
            { width: CHIP_WIDTH, alignItems: "center" },
          ]}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF3F9" }}>
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
                setSelectedBrand("TOTO");   // ← add this line
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
            <Text style={styles.subText}>Next Draw</Text>
            <Text style={styles.title}>{nextDrawDate || "Loading..."}</Text>
          </View>
        </View>


        {/* Lucky Number * Upset Level*/}
        <View style={styles.secondheader}>
          <View style={[styles.upsetBox, strongShadow]}>
            <Text style={[styles.luckyText, { marginBottom: 4 }]}>Select:</Text>
            <Text style={{ color: "#000000", fontSize: 21, fontWeight: "bold", textAlign: "center" }}> MAGNUM</Text>
          </View>
          <View style={[styles.luckyBox, strongShadow]}>
            <Text style={[styles.luckyText, { marginBottom: 4 }]}>Your Lucky Number:</Text>
            <Text style={{ color: "#000000", fontSize: 23, fontWeight: "bold", textAlign: "center" }}>{luckyNumber}</Text>
          </View>
        </View>

        {/* High Probability */}
        <View
          style={[
            {
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              marginBottom: 20,
            },
            strongShadow,
          ]}
        >
          <Text style={{ fontSize: 20, textAlign: "center" }}>
            High Probability Numbers
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading numbers...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : (
          <ChipGrid
            data={topNumbers}
            onPressChip={(item) => router.push(`/(tabs)/home/number-details-magnum?number=${item.number}`)}
            onPressViewAll={() => router.push({
              pathname: "/(tabs)/home/view-all",
              params: { source: 'magnum' }
            })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "#EEF3F9",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
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
    backgroundColor: "#FFD700", // ✅ gold color
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.5,
    minHeight: 80,
    borderWidth: 1,          // ✅ add this
    borderColor: "#000000",  // ✅ black border
  },

  upsetBox: {
    backgroundColor: "#FFD700", // ✅ gold color
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.5,
    minHeight: 80,
    borderWidth: 1,          // ✅ add this
    borderColor: "#000000",  // ✅ black border
  },


  luckyText: {
    color: "#000000",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20, // Ensure proper line height
  },

  card: {
    backgroundColor: "#dabf27",
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
    flexDirection: "row",     // Keep images in a row
    alignItems: "center",     // Center images vertically
    gap: 10,                  // Add some space between images
  },
});
