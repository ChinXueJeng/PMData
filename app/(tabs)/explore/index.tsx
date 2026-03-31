import { useLanguage } from "@/app/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RECENT_SEARCHES_KEY = "@recent_searches";
const SEARCH_COUNT_KEY = "@search_count";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const { t } = useLanguage();
  const { isSubscribed } = useSubscription();

  // Load recent searches and search count from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedSearches, storedCount] = await Promise.all([
          AsyncStorage.getItem(RECENT_SEARCHES_KEY),
          AsyncStorage.getItem(SEARCH_COUNT_KEY),
        ]);
        if (storedSearches) {
          setRecent(JSON.parse(storedSearches));
        }
        const TODAY = new Date().toDateString();

        if (storedCount) {
          const parsed = JSON.parse(storedCount);

          if (parsed.date === TODAY) {
            setSearchCount(parsed.count);
          } else {
            setSearchCount(0);
            await AsyncStorage.setItem(
              SEARCH_COUNT_KEY,
              JSON.stringify({ count: 0, date: TODAY })
            );
          }
        }

      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Save recent searches to storage whenever it changes
  const saveRecentSearches = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving recent searches:", error);
    }
  };

  const removeItem = async (index: number) => {
    const newRecent = recent.filter((_, i) => i !== index);
    setRecent(newRecent);
    await saveRecentSearches(newRecent);
  };

  const clearAll = async () => {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = async () => {
    if (search.length === 4) {
      if (!isSubscribed && searchCount >= 4) {
        // Check if user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          Alert.alert(
            t("loginRequired"),
            t("pleaseLoginToContinueSearching"),
            [
              {
                text: t("cancel"),
                style: "cancel",
              },
              {
                text: t("login"),
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
          return;
        }

        // Check if user needs to see paywall (subscribed check)
        if (!isSubscribed) {
          router.push("/paywall");
          return;
        }
      }

      // Increment search count
      const newSearchCount = searchCount + 1;
      setSearchCount(newSearchCount);
      await AsyncStorage.setItem(
        SEARCH_COUNT_KEY,
        JSON.stringify({
          count: newSearchCount,
          date: new Date().toDateString(),
        })
      );

      // Create new recent searches array with the new search term at the beginning
      const newRecent = [
        search,
        ...recent.filter((item) => item !== search), // Remove duplicate if it exists
      ].slice(0, 4); // Keep only 4 most recent

      // Update state and save to storage
      setRecent(newRecent);
      await saveRecentSearches(newRecent);

      // Navigate to number details with source parameter
      router.push({
        pathname: "/(tabs)/explore/number-details_explore",
        params: {
          number: search,
          fromExplore: "true", // Add a flag to indicate navigation from explore
        },
      });
      setSearch("");
    }
  };

return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            placeholder={t("enter4digitnumber")}
            value={search}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "");
              setSearch(cleaned.slice(0, 4));
            }}
            keyboardType="numeric"
            inputMode="numeric"
            maxLength={4}
            style={styles.input}
            // Add this:
            onSubmitEditing={handleSearch}           // ← very useful bonus
            returnKeyType="search"
            blurOnSubmit={false}
          />
        </View>
          <TouchableOpacity
            onPress={handleSearch}
            disabled={search.length !== 4}
            activeOpacity={0.7}
            style={[
              styles.searchButton,
              search.length !== 4 && styles.searchButtonDisabled,
            ]}
          >
            <Text style={styles.searchButtonText}>{t("search")}</Text>
          </TouchableOpacity>
        </View>
        {!isSubscribed && (
          <Text style={{ marginTop: 8, color: "#555" }}>
            Remaining searches: {Math.max(0, 4 - searchCount)}
          </Text>
        )}


        {/* Recent Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.recentText}>{t("recent")}</Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clear}>{t("clearall")}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={recent}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#eef2f7",
                    flex: 1,
                    justifyContent: "center",
                    padding: 5,
                    borderRadius: 20,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: "/(tabs)/explore/number-details_explore",
                      params: { number: item, fromExplore: "true" },
                    });
                  }}
                >
                  <Text style={styles.item}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#eef2f7",
                    padding: 5,
                    borderRadius: 20,
                  }}
                  onPress={() => removeItem(index)}
                >
                  <Ionicons name="close" size={20} color="#b0b0b0" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    paddingHorizontal: 20,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  input: {
    marginLeft: 8,
    flex: 1,
  },

  cancel: {
    color: "#3b82f6",
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 16,
    padding: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  recentText: {
    fontWeight: "600",
    fontSize: 16,
  },

  clear: {
    color: "#3b82f6",
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  item: {
    fontSize: 16,
    color: "#1f2937",
    paddingLeft: 20,
  },
searchButton: {
  backgroundColor: "#3b82f6",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  // NEW:
  minWidth: 90,           // prevent tiny tap target
},
  searchButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
