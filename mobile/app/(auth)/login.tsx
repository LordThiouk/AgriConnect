import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { initTelemetry, startTimer, record } from '../../lib/telemetry';

export default function Login() {
	initTelemetry();
	const [phone, setPhone] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const [otp, setOtp] = useState('');

	const sendOtp = async () => {
		setError(null);
		setLoading(true);
		const stop = startTimer('auth_send_otp', { phone_len: phone.length });
		try {
			const { error } = await supabase.auth.signInWithOtp({
				phone,
				options: { shouldCreateUser: true },
			});
			if (error) throw error;
			setSent(true);
			const t = stop();
			record('auth_send_otp', true, 200, { duration_ms: t.end! - t.start });
		} catch (e: any) {
			setError(e.message ?? 'Erreur envoi OTP');
			const t = stop();
			record('auth_send_otp', false, 500, { duration_ms: t.end! - t.start, message: e?.message });
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async () => {
		setError(null);
		setLoading(true);
		const stop = startTimer('auth_verify_otp');
		try {
			const { error } = await supabase.auth.verifyOtp({
				phone,
				token: otp,
				type: 'sms',
			});
			if (error) throw error;
			const t = stop();
			record('auth_verify_otp', true, 200, { duration_ms: t.end! - t.start });
		} catch (e: any) {
			setError(e.message ?? 'OTP invalide');
			const t = stop();
			record('auth_verify_otp', false, 401, { duration_ms: t.end! - t.start, message: e?.message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
			<Text style={{ fontSize: 24, fontWeight: '600', textAlign: 'center' }}>AgriConnect</Text>
			<Text style={{ textAlign: 'center', opacity: 0.7 }}>Connexion par SMS</Text>

			<TextInput
				placeholder="Téléphone (ex: +221...)"
				keyboardType="phone-pad"
				value={phone}
				onChangeText={setPhone}
				style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
			/>

			{sent && (
				<TextInput
					placeholder="Code OTP"
					keyboardType="number-pad"
					value={otp}
					onChangeText={setOtp}
					style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
				/>
			)}

			{error && <Text style={{ color: 'red' }}>{error}</Text>}

			<TouchableOpacity
				disabled={loading}
				onPress={sent ? verifyOtp : sendOtp}
				style={{ backgroundColor: '#3D944B', padding: 14, borderRadius: 8 }}
			>
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
						{sent ? 'Vérifier le code' : 'Recevoir le code'}
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}


