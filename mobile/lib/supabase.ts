import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

const isWeb = Platform.OS === 'web';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		// Avoid AsyncStorage on web/SSR (causes window undefined during prerender)
		...(isWeb ? {} : { storage: AsyncStorage }),
		persistSession: true,
		autoRefreshToken: true,
	},
});


