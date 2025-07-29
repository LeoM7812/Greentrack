import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Invoices from './screens/Invoices';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app startup
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // Show loading screen while checking auth state
  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {props => <Login {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home">
              {props => <Home {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {props => <Profile {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Invoices">
              {props => <Invoices {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
