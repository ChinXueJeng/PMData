import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from 'react-i18next';

interface NumberHistory {
  id: number;
  number: string;
  draw_date: string;
  prize_type: string;
  created_at: string;
}
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function NumberDetailsScreen() {
  const router = useRouter();
  const { number, fromExplore } = useLocalSearchParams<{ number: string; fromExplore?: string }>();
  const [probability, setProbability] = useState<number | null>(null);
  const [descriptions, setDescriptions] = useState<{desc?: string, descCN?: string}>({});
    const [history, setHistory] = useState<NumberHistory[]>([]);
    const [loading, setLoading] = useState({
    probability: true,
    history: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!number) return;
      
      try {
        // Fetch probability and description
        const [probResult, historyResult] = await Promise.all([
          supabase
            .from('nextDrawProb')
            .select('prob, desc, descCN')
            .eq('number', number)
            .single(),
          
          // Fetch number history
          supabase
            .from('result')
            .select('*')
            .eq('number', number)
            .order('draw_date', { ascending: false })
        ]);

        if (probResult.error) throw probResult.error;
        if (historyResult.error) throw historyResult.error;
        
        if (probResult.data) {
          setProbability(probResult.data.prob);
          setDescriptions({
            desc: probResult.data.desc || '',
            descCN: probResult.data.descCN || ''
          });
        }
        
        if (historyResult.data) {
          setHistory(historyResult.data);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load number history');
      } finally {
        setLoading(prev => ({
          ...prev,
          probability: false,
          history: false
        }));
      }
    };

    fetchData();
  }, [number]);

  const { t, i18n } = useTranslation();

  const getPrizeName = (prizeType: number) => {
    switch (prizeType) {
      case 1:
        return t('prizeFirst');
      case 2:
        return t('prizeSecond');
      case 3:
        return t('prizeThird');
      case 4:
        return t('prizeSpecial');
      case 5:
        return t('prizeConsolation');
      default:
        return prizeType.toString();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            if (fromExplore === 'true') {
              // If coming from explore, navigate back to explore tab
              router.replace('/(tabs)/explore');
            } else if (router.canGoBack()) {
              // Otherwise try to go back in the navigation stack
              router.back();
            } else {
              // Fallback to home if nothing else works
              router.replace('/(tabs)/home');
            }
          }}
          style={[styles.backBtn, shadow]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} />
          <Text style={styles.backText}>{t('back')}</Text>
        </TouchableOpacity>

        {/* Number Card */}
        <View style={[styles.numberCard, shadow]}>
          <Text style={styles.bigNumber}>{number}</Text>

          <View style={[styles.percentBadge, shadow]}>
            <Text style={styles.percentText}>
              {loading.probability ? '...' : probability !== null ? `${probability}%` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Number History */}
        <View style={[styles.card, shadow]}>
          <Text style={[styles.cardTitle, { textAlign: "center" }]}>
            {t('numberhistory')}
          </Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.logoCol} />
            <Text style={styles.headerCell}>{t('4D')}</Text>
            <Text style={styles.headerCell}>{t('Draw Date')}</Text>
            <Text style={styles.headerCell}>{t('Prize')}</Text>
          </View>

          {/* Rows */}
          {loading.history ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text style={styles.headerCell}>{t('LoadingHistory')}</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.headerCell}>{error}</Text>
            </View>
          ) : history.length > 0 ? (
            history.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i % 2 === 1 && styles.altRow,
                ]}
              >
                <View style={styles.logoCol}>
                  <Image 
                    source={require("@/assets/images/TotoLOGO.png")} 
                    style={{ height: 40, width: 40, borderRadius: 10 }}
                  />
                </View>
                <Text style={styles.cell}>{item.number}</Text>
                <Text style={styles.cell}>{formatDate(item.draw_date)}</Text>
                <Text style={styles.cell}>{getPrizeName(Number(item.prize_type))}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>{t('numberhistory')}</Text>
            </View>
          )}
        </View>

        {/* Number Analysis */}
        <View style={[styles.card2, shadow]}>
          <Text style={styles.cardTitle}>{t('numberAnalysis')}</Text>
          {descriptions.desc || descriptions.descCN ? (
            <Text style={styles.analysisText}>
              {i18n.language.startsWith('zh') ? (descriptions.descCN || descriptions.desc) : (descriptions.desc || descriptions.descCN)}
            </Text>
          ) : (
            <Text style={styles.analysisText}>
              {t('noanalysisavailable')}
            </Text>
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: {
    padding: 20,
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
    marginLeft: 6,
    fontWeight: "500",
  },

  numberCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  bigNumber: {
    fontSize: 40,
    fontWeight: "bold",
  },

  percentBadge: {
    backgroundColor: "#3BE66A",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },

  percentText: {
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  card2: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    // textAlign: "center",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0b57d0",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFD400",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
  },

  analysisText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  logoCol: {
    width: 40,
    alignItems: "center",
  },

  headerCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 13,
  },

  altRow: {
    backgroundColor: "#F6F8FB",
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
