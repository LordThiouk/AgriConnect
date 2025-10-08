import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface TabBarProps {
  children?: React.ReactNode;
}

interface TabBarItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
  isActive?: boolean;
}

const TabBarItem: React.FC<TabBarItemProps> = ({ icon, label, href, isActive }) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(href)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      <Ionicons
        name={icon}
        size={24}
        color={isActive ? theme.colors.primary[500] : theme.colors.gray[400]}
      />
      <Text
        style={{
          fontSize: 12,
          color: isActive ? theme.colors.primary[500] : theme.colors.gray[400],
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const TabBar: React.FC<TabBarProps> = ({ children }) => {
  const theme = useTheme();
  const pathname = usePathname();

  const tabs = [
    { icon: 'home' as const, label: 'Accueil', href: '/(tabs)/agent-dashboard' },
    { icon: 'list' as const, label: 'Parcelles', href: '/(tabs)/parcelles' },
    { icon: 'eye' as const, label: 'Observations', href: '/(tabs)/observations' },
    { icon: 'person' as const, label: 'Profil', href: '/(tabs)/profile' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        paddingBottom: 8,
        paddingTop: 8,
      }}
    >
      {tabs.map((tab) => (
        <TabBarItem
          key={tab.href}
          icon={tab.icon}
          label={tab.label}
          href={tab.href}
          isActive={pathname === tab.href}
        />
      ))}
    </View>
  );
};

export const SimpleTabBar: React.FC<TabBarProps> = ({ children }) => {
  return <TabBar>{children}</TabBar>;
};

export default TabBar;
