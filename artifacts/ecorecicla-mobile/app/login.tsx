import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import type { AuthUser } from '@/context/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await loginMutation.mutateAsync({ data: { email: email.trim(), password } });
      const user: AuthUser = {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        complexId: result.user.complexId ?? null,
        complexName: result.user.complexName ?? null,
        apartment: result.user.apartment ?? null,
        photoUrl: result.user.photoUrl ?? null,
        documentNumber: result.user.documentNumber,
      };
      await login(result.token, user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const s = styles(colors, insets);

  return (
    <View style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoContainer}>
            <View style={s.logoCircle}>
              <Ionicons name="leaf" size={40} color="#FFFFFF" />
            </View>
            <Text style={s.brandName}>EcoRecicla</Text>
            <Text style={s.brandSub}>Bogotá</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Iniciar sesión</Text>
            <Text style={s.subtitle}>Ingresa para ver tu historial de reciclaje</Text>

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Correo electrónico</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  testID="email-input"
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Contraseña</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  testID="password-input"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={s.errorRow}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Button */}
            <Pressable
              style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              testID="login-button"
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.buttonText}>Entrar</Text>
              )}
            </Pressable>
          </View>

          <Text style={s.footer}>EcoRecicla · Gestión de Reciclaje Residencial</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  const isWeb = Platform.OS === 'web';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: isWeb ? Math.max(insets.top, 67) : insets.top + 24,
      paddingBottom: isWeb ? 34 : insets.bottom + 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    brandName: {
      fontSize: 28,
      fontFamily: 'PlusJakartaSans_700Bold',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    brandSub: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans_500Medium',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius * 1.6,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontFamily: 'PlusJakartaSans_700Bold',
      color: colors.foreground,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans_400Regular',
      color: colors.mutedForeground,
      marginBottom: 28,
    },
    fieldGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      color: colors.foreground,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'PlusJakartaSans_400Regular',
      color: colors.foreground,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.destructive}15`,
      borderRadius: colors.radius,
      padding: 10,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_400Regular',
      color: colors.destructive,
      flex: 1,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      color: colors.primaryForeground,
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      fontFamily: 'PlusJakartaSans_400Regular',
      color: colors.mutedForeground,
      marginTop: 32,
    },
  });
}
