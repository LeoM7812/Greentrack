import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Invoices from './screens/Invoices';
import InvoiceAnalysisDashboard from './screens/InvoiceAnalysisDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [navKey, setNavKey] = useState(0); // chave para forçar reset

  useEffect(() => {
    const checkAuthState = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };
    checkAuthState();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setNavKey(prev => prev + 1); // força recriação da árvore de navegação
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    setIsLoggedIn(false);
    setNavKey(prev => prev + 1); // força reset da navegação
  };

  if (isLoading) return null;

  return (
    <NavigationContainer key={navKey}>
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
            <Stack.Screen 
              name="InvoiceAnalysisDashboard" 
              component={InvoiceAnalysisDashboard} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
