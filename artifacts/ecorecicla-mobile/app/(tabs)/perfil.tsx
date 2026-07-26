import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useGetProfile } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  resident: 'Residente',
};

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | null | undefined;
  colors: ReturnType<typeof useColors>;
}

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={[ir.row, { borderBottomColor: colors.border }]}>
      <View style={[ir.iconBox, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={ir.text}>
        <Text style={[ir.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[ir.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
});

export default function PerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const { data: profile, isLoading } = useGetProfile();

  const displayUser = profile ?? user;
  const initials = displayUser?.fullName
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('') ?? 'R';

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Cerrar sesión?');
      if (confirmed) doLogout();
    } else {
      Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const doLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/login');
  };

  const topPad = isWeb ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 80;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[s.container, { paddingTop: topPad + 20, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.headerRow}>
        <View style={[s.iconBox, { backgroundColor: colors.accent }]}>
          <Feather name="user" size={20} color={colors.primary} />
        </View>
        <View style={s.headerText}>
          <Text style={[s.pageTitle, { color: colors.foreground }]}>Perfil</Text>
          <Text style={[s.pageSubtitle, { color: colors.mutedForeground }]}>
            {ROLE_LABELS[displayUser?.role ?? 'resident'] ?? 'Residente'}
          </Text>
        </View>
      </View>

      {/* Avatar + name */}
      <View style={[s.avatarCard, { backgroundColor: colors.primary }]}>
        <View style={[s.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
        <Text style={s.userName}>{displayUser?.fullName ?? 'Cargando...'}</Text>
        <Text style={s.userEmail}>{displayUser?.email ?? ''}</Text>
        {displayUser?.role && (
          <View style={[s.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={s.roleText}>{ROLE_LABELS[displayUser.role] ?? displayUser.role}</Text>
          </View>
        )}
      </View>

      {/* Info section */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>Información personal</Text>

        <InfoRow
          icon="person-outline"
          label="Nombre completo"
          value={displayUser?.fullName}
          colors={colors}
        />
        <InfoRow
          icon="mail-outline"
          label="Correo electrónico"
          value={displayUser?.email}
          colors={colors}
        />
        <InfoRow
          icon="card-outline"
          label="Documento"
          value={displayUser?.documentNumber}
          colors={colors}
        />
        <InfoRow
          icon="business-outline"
          label="Conjunto"
          value={displayUser?.complexName}
          colors={colors}
        />
        <InfoRow
          icon="home-outline"
          label="Apartamento"
          value={displayUser?.apartment}
          colors={colors}
        />
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [
          s.logoutBtn,
          { backgroundColor: `${colors.destructive}15`, borderColor: `${colors.destructive}40` },
          pressed && s.logoutPressed,
        ]}
        onPress={handleLogout}
        testID="logout-button"
      >
        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
        <Text style={[s.logoutText, { color: colors.destructive }]}>Cerrar sesión</Text>
      </Pressable>

      <Text style={[s.version, { color: colors.mutedForeground }]}>
        EcoRecicla · v1.0.0
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  headerRow: {
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
  pageTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  avatarCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitials: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
