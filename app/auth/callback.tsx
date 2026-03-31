import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import 'react-native-url-polyfill/auto';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the initial URL from the OAuth redirect
        const url = await Linking.getInitialURL();
        
        if (!url) {
          console.log('No URL found - might be opening app fresh');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/login');
          }
          return;
        }
        
        // Parse the URL to get the hash fragment
        const hashFragment = url.split('#')[1];
        if (!hashFragment) {
          throw new Error('No hash fragment in URL');
        }
        
        // Parse the hash fragment to get params
        const params = new URLSearchParams(hashFragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) throw error;
          
          // Success - navigate to home
          router.replace('/(tabs)/home');
        } else {
          throw new Error('Missing tokens in URL');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        router.replace('/login');
      }
    };
    
    handleAuth();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Completing sign in...</Text>
    </View>
  );
}