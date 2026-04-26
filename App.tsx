import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import LoginScreen      from './src/screens/LoginScreen';
import HomeScreen       from './src/screens/HomeScreen';
import ResultsScreen    from './src/screens/ResultsScreen';
import MapScreen        from './src/screens/MapScreen';
import MapPickerScreen  from './src/screens/MapPickerScreen';
import ProfileScreen    from './src/screens/ProfileScreen';
import { COLORS } from './src/constants';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Login"     component={LoginScreen}     />
          <Stack.Screen name="Home"      component={HomeScreen}      />
          <Stack.Screen name="Results"   component={ResultsScreen}   />
          <Stack.Screen name="Map"       component={MapScreen}       />
          <Stack.Screen name="MapPicker" component={MapPickerScreen} />
          <Stack.Screen name="Profile"   component={ProfileScreen}   />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
