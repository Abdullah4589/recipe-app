import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Colors } from './constants/theme';

import AppSplashScreen    from './screens/AppSplashScreen';
import LoginScreen        from './screens/LoginScreen';
import RegisterScreen     from './screens/RegisterScreen';
import HomeScreen         from './screens/HomeScreen';
import WeeklyPlanScreen   from './screens/WeeklyPlanScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import FavouritesScreen   from './screens/FavouritesScreen';
import CustomRecipesScreen from './screens/CustomRecipesScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home"          component={HomeScreen} />
          <Stack.Screen name="WeeklyPlan"    component={WeeklyPlanScreen} />
          <Stack.Screen name="RecipeDetail"  component={RecipeDetailScreen} />
          <Stack.Screen name="Favourites"    component={FavouritesScreen} />
          <Stack.Screen name="CustomRecipes" component={CustomRecipesScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          {!splashDone ? (
            <>
              <StatusBar style="light" />
              <AppSplashScreen onFinish={() => setSplashDone(true)} />
            </>
          ) : (
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          )}
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
