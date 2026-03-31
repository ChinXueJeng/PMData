import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Winner {
  id: string;
  iconName: string;
  iconColor: string;
  number: string;
  prize_type: string;
  total_points: number | null;
}

export default function AnalysisDetails() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [specialPrizes, setSpecialPrizes] = useState<Array<{number: string, total_points: number | null}>>([]);
  const [consolationPrizes, setConsolationPrizes] = useState<Array<{number: string, total_points: number | null}>>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { t, currentLanguage } = useLanguage();

  // Function to format date based on current language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (currentLanguage === 'zh') {
      // Chinese date format: YYYY年M月D日
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    }
    // Default to English format: Month Day, Year
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    const fetchWinners = async () => {
      if (!date) return;
      
      try {
        setLoading(true);
        
        // Fetch prize types 1, 2, 3 for top winners with total_points
        const { data: winnersData, error: winnersError } = await supabase
          .from('result')
          .select('number, prize_type, total_points')
          .eq('draw_date', date)
          .in('prize_type', ['1', '2', '3'])
          .order('prize_type', { ascending: true });

        // Fetch special prizes (type 4) with total_points
        const { data: specialData, error: specialError } = await supabase
          .from('result')
          .select('number, total_points')
          .eq('draw_date', date)
          .eq('prize_type', '4');

        // Fetch consolation prizes (type 5) with total_points
        const { data: consolationData, error: consolationError } = await supabase
          .from('result')
          .select('number, total_points')
          .eq('draw_date', date)
          .eq('prize_type', '5');

        if (winnersError || specialError || consolationError) {
          throw winnersError || specialError || consolationError;
        }

        // Format top winners with points and icons
        const formattedWinners = winnersData.map(item => {
          let iconName = 'medal';
          let iconColor = '#000';
          
          if (item.prize_type === '1') {
            iconName = 'medal';
            iconColor = '#FFD700'; // Gold
          } else if (item.prize_type === '2') {
            iconName = 'medal';
            iconColor = '#C0C0C0'; // Silver
          } else if (item.prize_type === '3') {
            iconName = 'medal';
            iconColor = '#CD7F32'; // Bronze
          }
          
          return {
            id: item.prize_type,
            iconName,
            iconColor,
            number: item.number,
            prize_type: item.prize_type,
            total_points: item.total_points
          };
        });

        setWinners(formattedWinners);
        setSpecialPrizes(specialData);
        setConsolationPrizes(consolationData);
      } catch (error) {
        console.error('Error fetching winners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [date]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
  <TouchableOpacity 
    style={[styles.backBtn, shadow]} 
    onPress={() => router.push('/(tabs)/analysis')}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={16} />
    <Text style={styles.backText}>{t('back')}</Text>
  </TouchableOpacity>
</View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Date */}
        <Text style={styles.date}>
          {date ? formatDate(date) : 'N/A'}
        </Text>

        {/* Top Winners */}
        <View style={styles.topRow}>
          {winners.map((item) => {
            const points = item.total_points;
            const bgColor = points !== null
              ? points >= 85 
                ? '#42ea61' 
                : points >= 70 
                  ? '#a2ffb3' 
                  : '#fffbb5'
              : '#f5f5f5';
              
            return (
              <View key={item.id} style={[styles.topCard, shadow, { backgroundColor: bgColor }]}>
                <Ionicons 
                  name={item.iconName as any} 
                  size={24} 
                  color={item.iconColor} 
                  style={styles.medalIcon} 
                />
                <Text style={styles.topNumber}>{item.number}</Text>
                {item.total_points !== null && (
                  <Text style={styles.pointsText}>{t('point')}{item.total_points}</Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={[{ backgroundColor: "#fff", borderRadius: 10 },shadow]}>
          {/* Special Prize */}
          <Section title={t('Special_Prize')}>
            {specialPrizes.length > 0 ? (
              specialPrizes.map((item, i) => {
                const points = item.total_points;
                const style = points !== null
                  ? points >= 85 
                    ? styles.greenPill 
                    : points >= 70 
                      ? styles.lightGreenPill 
                      : styles.yellowPill
                  : styles.pill;
                return (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Pill text={item.number} style={style} />
                    {item.total_points !== null && (
                      <Text style={styles.pointsText}>{item.total_points}</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>{t('nospecialpriceavalaible')}</Text>
            )}
          </Section>

          {/* Consolation Prize */}
          <Section title={t('Consolation_Prize')}>
            {consolationPrizes.length > 0 ? (
              consolationPrizes.map((item, i) => {
                const points = item.total_points;
                const style = points !== null
                  ? points >= 85 
                    ? styles.greenPill 
                    : points >= 70 
                      ? styles.lightGreenPill 
                      : styles.yellowPill
                  : styles.pill;
                return (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Pill text={item.number} style={style} />
                    {item.total_points !== null && (
                      <Text style={styles.pointsText}>{item.total_points}</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No consolation prizes available</Text>
            )}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Reusable Components ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.pillWrap}>{children}</View>
    </View>
  );
}

function Pill({
  text,
  style,
}: {
  text: string;
  style?: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        shadow,
        style,
      ]}
      onPress={() => console.log("Pressed:", text)}
      activeOpacity={0.7}
    >
      <Text style={styles.pillText}>{text}</Text>
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    paddingHorizontal: 16,
  },

  header: {
    marginBottom: 10,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  backText: {
    marginLeft: 6,
    fontSize: 13,
  },

  date: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 12,
  },

  topRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  topCard: {
    flex: 1,
    backgroundColor: "#f5a623",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    minWidth: 90,
  },

  medalIcon: {
    marginBottom: 4,
  },

  topNumber: {
    marginTop: 6,
    fontWeight: "700",
    fontSize: 14,
    textAlign: 'center',
  },

  section: {
    padding: 10,
    marginBottom: 16,
  },

  sectionTitle: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },

  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  pill: {
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  greenPill: {
    backgroundColor: "#42ea61",
  },

  lightGreenPill: {
    backgroundColor: "#a2ffb3",
  },

  yellowPill: {
    backgroundColor: "#fffbb5",
  },

  pillText: {
    fontWeight: "600",
    fontSize: 12,
  },
  pointsText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10,
    width: '100%',
  },
});
