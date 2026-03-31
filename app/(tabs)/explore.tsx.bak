
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState(["3933"]);

  const removeItem = (index: number) => {
    setRecent((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    if (search.length === 4) {
      // Add to recent searches if not already in the list
      if (!recent.includes(search)) {
        setRecent(prev => [search, ...prev].slice(0, 4)); // Keep only 4 most recent
      }
      // Navigate to number details with source parameter
      router.push({
        pathname: '/(tabs)/explore/number-details_explore',
        params: { 
          number: search,
          fromExplore: 'true'  // Add a flag to indicate navigation from explore
        }
      });
      setSearch("");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              placeholder="Enter 4-digit number"
              value={search}
              onChangeText={(text) => {
                // Only allow numbers and limit to 4 digits
                if (/^\d{0,4}$/.test(text)) {
                  setSearch(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
          </View>
          <TouchableOpacity 
            onPress={handleSearch}
            disabled={search.length !== 4}
            style={[styles.searchButton, search.length !== 4 && styles.searchButtonDisabled]}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.recentText}>Recent</Text>
            <TouchableOpacity onPress={() => setRecent([])}>
              <Text style={styles.clear}>Clear All</Text>
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
                      pathname: '/(tabs)/explore/number-details_explore',
                      params: { number: item,
                        fromExplore: 'true'
                       }
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});