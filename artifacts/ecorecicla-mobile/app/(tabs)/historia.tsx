import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useListRecords } from '@workspace/api-client-react';

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

const BIN_HEX: Record<string, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
  gray: '#6B7280',
  brown: '#92400E',
  white: '#CBD5E1',
  orange: '#F97316',
};

interface RecordItem {
  id: number;
  materialName?: string | null;
  weightKg: number;
  date: string;
  complexName?: string | null;
  observation?: string | null;
  materialId: number;
}

interface RecordRowProps {
  item: RecordItem;
  colors: ReturnType<typeof useColors>;
  binColor?: string;
}

function RecordRow({ item, colors, binColor }: RecordRowProps) {
  const dotColor = binColor ? (BIN_HEX[binColor] ?? colors.primary) : colors.primary;

  return (
    <View style={[row.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[row.colorDot, { backgroundColor: dotColor }]} />
      <View style={row.body}>
        <View style={row.top}>
          <Text style={[row.material, { color: colors.foreground }]} numberOfLines={1}>
            {item.materialName ?? 'Material'}
          </Text>
          <Text style={[row.kg, { color: colors.primary }]}>
            {formatWeight(item.weightKg)}
          </Text>
        </View>
        <View style={row.bottom}>
          <Ionicons name="business-outline" size={11} color={colors.mutedForeground} />
          <Text style={[row.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.complexName ?? '–'}
          </Text>
          <Text style={[row.dot2, { color: colors.mutedForeground }]}>·</Text>
          <Ionicons name="calendar-outline" size={11} color={colors.mutedForeground} />
          <Text style={[row.sub, { color: colors.mutedForeground }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        {item.observation ? (
          <Text style={[row.obs, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.observation}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
    gap: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  body: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  material: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flex: 1,
  },
  kg: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginLeft: 8,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    flexShrink: 1,
  },
  dot2: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  obs: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default function HistoriaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';

  const { data, isLoading, refetch } = useListRecords(
    user ? { residentId: user.id, pageSize: 50 } : { pageSize: 50 },
  );

  const records = (data?.data ?? []) as RecordItem[];
  const totalKg = data?.totalKg ?? 0;
  const total = data?.total ?? 0;

  const topPad = isWeb ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 80;

  const ListHeader = () => (
    <View style={[s.headerWrap, { paddingTop: topPad + 20 }]}>
      <View style={s.titleRow}>
        <View style={[s.iconBox, { backgroundColor: colors.accent }]}>
          <Feather name="list" size={20} color={colors.primary} />
        </View>
        <View style={s.titleText}>
          <Text style={[s.title, { color: colors.foreground }]}>Mi Historia</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {total} entrega{total !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Summary strip */}
      {total > 0 && (
        <View style={[s.summaryStrip, { backgroundColor: colors.accent }]}>
          <View style={s.statCell}>
            <Text style={[s.statValue, { color: colors.primary }]}>
              {(totalKg ?? 0).toFixed(2)} kg
            </Text>
            <Text style={[s.statLabel, { color: colors.accentForeground }]}>Reciclado</Text>
          </View>
          <View style={[s.divider, { backgroundColor: `${colors.primary}30` }]} />
          <View style={s.statCell}>
            <Text style={[s.statValue, { color: colors.primary }]}>{total}</Text>
            <Text style={[s.statLabel, { color: colors.accentForeground }]}>Registros</Text>
          </View>
          <View style={[s.divider, { backgroundColor: `${colors.primary}30` }]} />
          <View style={s.statCell}>
            <Text style={[s.statValue, { color: colors.primary }]}>
              {total > 0 ? ((totalKg ?? 0) / total).toFixed(1) : '0.0'} kg
            </Text>
            <Text style={[s.statLabel, { color: colors.accentForeground }]}>Promedio</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <RecordRow item={item} colors={colors} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !isLoading ? (
          <View style={s.empty}>
            <Feather name="archive" size={40} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Sin entregas aún</Text>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              Tus registros de reciclaje aparecerán aquí
            </Text>
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        )
      }
      contentContainerStyle={[s.list, { paddingBottom: bottomPad, backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!!records.length || !isLoading}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
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
  headerWrap: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { flex: 1 },
  title: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  summaryStrip: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
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
