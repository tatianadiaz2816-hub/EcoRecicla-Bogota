import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  useGetTotalKg,
  useListRecords,
} from '@workspace/api-client-react';

function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return '0.00 kg';
  return `${kg.toFixed(2)} kg`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

const BIN_COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
  gray: '#6B7280',
  brown: '#92400E',
  white: '#E2E8F0',
  orange: '#F97316',
};

interface RecordCardProps {
  item: {
    id: number;
    materialName?: string | null;
    weightKg: number;
    date: string;
    complexName?: string | null;
  };
  colors: ReturnType<typeof useColors>;
}

function RecordCard({ item, colors }: RecordCardProps) {
  return (
    <View style={[cardStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[cardStyles.dot, { backgroundColor: colors.primary }]} />
      <View style={cardStyles.body}>
        <Text style={[cardStyles.material, { color: colors.foreground }]}>
          {item.materialName ?? 'Material'}
        </Text>
        <Text style={[cardStyles.sub, { color: colors.mutedForeground }]}>
          {item.complexName ?? ''} · {formatDate(item.date)}
        </Text>
      </View>
      <Text style={[cardStyles.kg, { color: colors.primary }]}>
        {formatWeight(item.weightKg)}
      </Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: { flex: 1 },
  material: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  kg: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';

  const {
    data: totalKgData,
    isLoading: totalLoading,
    refetch: refetchTotal,
  } = useGetTotalKg(user ? { residentId: user.id } : {});

  const {
    data: recordsData,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useListRecords(user ? { residentId: user.id, pageSize: 5 } : { pageSize: 5 });

  const isLoading = totalLoading || recordsLoading;
  const totalKg = totalKgData?.totalKg ?? 0;
  const records = recordsData?.data ?? [];
  const totalRecords = recordsData?.total ?? 0;

  const onRefresh = async () => {
    await Promise.all([refetchTotal(), refetchRecords()]);
  };

  const topPad = isWeb ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 80;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Residente';

  const ListHeader = () => (
    <View>
      {/* Greeting */}
      <View style={[s.header, { paddingTop: topPad + 20 }]}>
        <View>
          <Text style={[s.greeting, { color: colors.mutedForeground }]}>Bienvenido,</Text>
          <Text style={[s.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <View style={[s.avatarCircle, { backgroundColor: colors.accent }]}>
          <Text style={[s.avatarText, { color: colors.primary }]}>
            {user?.fullName?.charAt(0).toUpperCase() ?? 'R'}
          </Text>
        </View>
      </View>

      {/* Hero stat card */}
      <View style={[s.heroCard, { backgroundColor: colors.primary }]}>
        <View style={s.heroTop}>
          <Ionicons name="leaf" size={22} color="rgba(255,255,255,0.7)" />
          <Text style={s.heroLabel}>Total reciclado</Text>
        </View>
        {totalLoading ? (
          <ActivityIndicator color="#FFFFFF" size="large" style={{ marginVertical: 16 }} />
        ) : (
          <Text style={s.heroKg}>{formatWeight(totalKg)}</Text>
        )}
        <Text style={s.heroSub}>{totalRecords} registro{totalRecords !== 1 ? 's' : ''} en total</Text>
      </View>

      {/* Section title */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Entregas recientes</Text>
      </View>

      {recordsLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      )}

      {!recordsLoading && records.length === 0 && (
        <View style={s.empty}>
          <Feather name="inbox" size={36} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Sin registros aún</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Tus entregas de reciclaje aparecerán aquí
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <RecordCard item={item} colors={colors} />}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={[s.list, { paddingBottom: bottomPad, backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!!records.length || !isLoading}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const s = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  name: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  heroKg: {
    fontSize: 52,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
});
