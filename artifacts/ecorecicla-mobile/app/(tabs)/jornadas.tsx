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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListEvents } from '@workspace/api-client-react';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getDayMonth(dateStr: string): { day: string; month: string } {
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(d);
    return { day, month: month.toUpperCase() };
  } catch {
    return { day: '--', month: '---' };
  }
}

type EventStatus = 'scheduled' | 'completed' | 'cancelled';

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
}

function getStatusConfig(status: string, colors: ReturnType<typeof useColors>): StatusConfig {
  switch (status as EventStatus) {
    case 'scheduled':
      return { label: 'Programada', bg: colors.accent, text: colors.primary };
    case 'completed':
      return { label: 'Completada', bg: colors.muted, text: colors.mutedForeground };
    case 'cancelled':
      return { label: 'Cancelada', bg: `${colors.destructive}18`, text: colors.destructive };
    default:
      return { label: status, bg: colors.muted, text: colors.mutedForeground };
  }
}

interface EventItem {
  id: number;
  eventName: string;
  complexId: number;
  complexName?: string | null;
  date: string;
  hour: string;
  responsiblePerson: string;
  location: string;
  description?: string | null;
  status: string;
}

interface EventCardProps {
  item: EventItem;
  colors: ReturnType<typeof useColors>;
}

function EventCard({ item, colors }: EventCardProps) {
  const { day, month } = getDayMonth(item.date);
  const status = getStatusConfig(item.status, colors);

  return (
    <View style={[ec.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Date badge */}
      <View style={[ec.dateBadge, { backgroundColor: colors.accent }]}>
        <Text style={[ec.dateDay, { color: colors.primary }]}>{day}</Text>
        <Text style={[ec.dateMonth, { color: colors.accentForeground }]}>{month}</Text>
      </View>

      {/* Content */}
      <View style={ec.content}>
        <View style={ec.headerRow}>
          <Text style={[ec.name, { color: colors.foreground }]} numberOfLines={2}>
            {item.eventName}
          </Text>
          <View style={[ec.badge, { backgroundColor: status.bg }]}>
            <Text style={[ec.badgeText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        <View style={ec.infoRow}>
          <Ionicons name="business-outline" size={13} color={colors.mutedForeground} />
          <Text style={[ec.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.complexName ?? 'Conjunto'}
          </Text>
        </View>

        <View style={ec.infoRow}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[ec.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={ec.infoRow}>
          <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
          <Text style={[ec.infoText, { color: colors.mutedForeground }]}>{item.hour}</Text>
        </View>

        {item.description ? (
          <Text style={[ec.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const ec = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dateBadge: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dateDay: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dateMonth: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flex: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    flex: 1,
  },
  description: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default function JornadasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const { data, isLoading, refetch } = useListEvents({ pageSize: 50 });

  const events = (data?.data ?? []) as EventItem[];

  const topPad = isWeb ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 80;

  const ListHeader = () => (
    <View style={[s.header, { paddingTop: topPad + 20 }]}>
      <View style={[s.iconBox, { backgroundColor: colors.accent }]}>
        <Feather name="calendar" size={20} color={colors.primary} />
      </View>
      <View style={s.headerText}>
        <Text style={[s.title, { color: colors.foreground }]}>Jornadas</Text>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
          {events.length} jornada{events.length !== 1 ? 's' : ''} registrada{events.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <EventCard item={item} colors={colors} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !isLoading ? (
          <View style={s.empty}>
            <Feather name="calendar" size={40} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Sin jornadas</Text>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              Las jornadas de recolección aparecerán aquí
            </Text>
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        )
      }
      contentContainerStyle={[s.list, { paddingBottom: bottomPad, backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!!events.length || !isLoading}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
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
