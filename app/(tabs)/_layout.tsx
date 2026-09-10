import { Redirect, router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile } from '@/db/queries/profile';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={[styles.tabLabel, { color: focused ? theme.textPrimary : theme.textMuted }]}>{label}</Text>;
}

function FabButton() {
  return (
    <Pressable style={styles.fab} onPress={() => router.push('/registrar-gasto')}>
      <Text style={styles.fabLabel}>+</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const [status, setStatus] = useState<'loading' | 'needs-onboarding' | 'ready'>('loading');

  useEffect(() => {
    getProfile().then((profile) => setStatus(profile ? 'ready' : 'needs-onboarding'));
  }, []);

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (status === 'needs-onboarding') {
    return <Redirect href="/onboarding/salary" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon icon="⌂" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => <TabIcon icon="▤" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Gastos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nuevo-gasto"
        options={{
          title: '',
          tabBarButton: () => <FabButton />,
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tabs.Screen
        name="activos"
        options={{
          title: 'Activos',
          tabBarIcon: ({ focused }) => <TabIcon icon="◆" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Activos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analisis"
        options={{
          title: 'Análisis',
          tabBarIcon: ({ focused }) => <TabIcon icon="▲" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Análisis" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    height: 74,
    paddingTop: 8,
    backgroundColor: theme.surfaceRaised,
    borderTopColor: theme.border,
  },
  tabLabel: { fontFamily: typography.fontDisplay, fontSize: 9.5, fontWeight: '600' },
  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { color: theme.background, fontSize: 24, lineHeight: 26 },
});
