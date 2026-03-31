import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

type NumberItem = {
  id: number;
  number: number;
  color: "green" | "lightGreen" | "yellow";
};
interface NextDrawProb {
  number: number;
  prob: number;
}
const MAX_ITEMS = 100; // Limit to 100 items
type ViewAllNumbersProps = {
  source?: 'magnum' | 'default';
};

const ViewAllNumbers = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const source = params.source as string || 'default';
  const tableName = source === 'magnum' ? 'nextDrawProb_magnum' : 'nextDrawProb';
  
  useEffect(() => {
    console.log('Route params:', params);
    console.log('Component mounted/updated - tableName:', tableName, 'source:', source);
  }, [params, source, tableName]);
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<number | null>(90); // Default to 90%+ filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 100; // Items per page
  const router = useRouter();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const GRID_PADDING = 20 * 2; // Total horizontal padding (left + right)
  const GAP = 10; // Gap between items
  const NUM_COLUMNS = 4;
  // Calculate width for 4 columns with gaps between them
  const CHIP_WIDTH = (SCREEN_WIDTH - GRID_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
  const fetchNumbers = useCallback(async (filterProb: number | null = null, page = 1) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from(tableName)
        .select('number, prob', { count: 'exact' })
        .order('prob', { ascending: false });
      
      if (filterProb !== null) {
        if (filterProb === 90) {
          query = query.gte('prob', 90);
        } else {
          query = query.gte('prob', filterProb).lt('prob', filterProb + 10);
        }
      } else {
        query = query.gte('prob', 50);
      }

      // Calculate pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error: fetchError, count } = await query.range(from, to);
      if (fetchError) throw fetchError;
      
      const items = data.map((item: NextDrawProb, index: number) => {
        let color: "green" | "lightGreen" | "yellow" = "yellow";
        
        if (item.prob >= 90) {
          color = "green";
        } else if (item.prob >= 80) {
          color = "lightGreen";
        }
        
        return {
          id: from + index + 1,
          number: item.number,
          color,
          prob: item.prob
        };
      });
      
      // Calculate total pages and update total items
      const totalItemsCount = count || 0;
      setTotalItems(totalItemsCount);
      setTotalPages(Math.ceil(totalItemsCount / ITEMS_PER_PAGE));
      setCurrentPage(page);
      
      // Sort by probability in descending order
      items.sort((a, b) => b.prob - a.prob);
      setNumbers(items);
    } catch (error) {
      console.error('Error fetching numbers:', error);
      setError('Failed to load numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [numbers.length]);
  useEffect(() => {
    fetchNumbers(90, 1); // Fetch 90%+ numbers by default
  }, []);
  useEffect(() => {
    fetchNumbers(activeFilter);
  }, [activeFilter]);
  
  const handleFilterPress = (filter: number | null) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
    fetchNumbers(filter, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchNumbers(activeFilter, newPage);
    }
  };
  const getChipStyle = (color: string) => {
    switch (color) {
      case 'green':
        return [styles.chip, styles.chipGreen, styles.chipShadow];
      case 'lightGreen':
        return [styles.chip, styles.chipLightGreen, styles.chipShadow];
      default:
        return [styles.chip, styles.chipYellow, styles.chipShadow];
    }
  };
  if (loading && numbers.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>{t('loadingnumbers')}</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('highProbabilityNumbers')}</Text>
        <Text style={styles.countText}>{t('showing')} {numbers.length} {t('of')} {totalItems} {t('numbers')}</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 90 && styles.activeFilter]}
            onPress={() => handleFilterPress(90)}
          >
            <Text style={[styles.filterText, activeFilter === 90 && styles.activeFilterText]}>90%+</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 80 && styles.activeFilter]}
            onPress={() => handleFilterPress(80)}
          >
            <Text style={[styles.filterText, activeFilter === 80 && styles.activeFilterText]}>80-89%</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 70 && styles.activeFilter]}
            onPress={() => handleFilterPress(70)}
          >
            <Text style={[styles.filterText, activeFilter === 70 && styles.activeFilterText]}>70-79%</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 60 && styles.activeFilter]}
            onPress={() => handleFilterPress(60)}
          >
            <Text style={[styles.filterText, activeFilter === 60 && styles.activeFilterText]}>60-69%</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 50 && styles.activeFilter]}
            onPress={() => handleFilterPress(50)}
          >
            <Text style={[styles.filterText, activeFilter === 50 && styles.activeFilterText]}>50-59%</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.grid}>
          {numbers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[getChipStyle(item.color), { 
                width: CHIP_WIDTH,
                marginBottom: GAP 
              }]}
              onPress={() => router.push(`/home/number-details?number=${item.number}`)}
            >
              <Text style={styles.chipText}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {numbers.length === 0 && !loading ? (
          <View style={styles.noMoreContainer}>
            <Text style={styles.noMoreText}>No numbers found</Text>
          </View>
        ) : (
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Text style={[styles.pageButtonText, currentPage === 1 && styles.disabledButtonText]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </Text>
            
            <TouchableOpacity 
              style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.pageButtonText, currentPage === totalPages && styles.disabledButtonText]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F9",
    padding: 18,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  countText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilter: {
    backgroundColor: "#d60000ff",
    borderColor: "#d60000ff",
  },
  filterText: {
    color: '#333',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeFilterText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF3F9',
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF3F9',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  chip: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
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
    fontSize: 16,
  },
  noMoreContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  noMoreText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#d60000ff",
    borderRadius: 20,
  },
  pageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  disabledButtonText: {
    color: '#999999',
  },
  pageInfo: {
    color: '#666',
    fontWeight: '500',
  },
});
const strongShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 8,
};
export default ViewAllNumbers;