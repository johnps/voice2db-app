import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { createAudioRecorderModule } from '../modules/recorder/AudioRecorderModule';
import { createSTTModule } from '../modules/stt/STTModule';
import type { AppStackParamList } from '../navigation/RootNavigator';

const MIN_DURATION_MS = 10_000;
const MAX_DURATION_MS = 60_000;
// Bundled model path — resolved at build time by Metro
const MODEL_PATH = require('../../assets/ggml-tiny.en.bin');

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Recording'>;

type State = 'idle' | 'recording' | 'transcribing' | 'review';

export function RecordingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { beneficiaryId, beneficiaryName } = route.params;

  const recorder = useMemo(() => createAudioRecorderModule(Audio), []);
  const sttRef = useRef<Awaited<ReturnType<typeof createSTTModule>> | null>(null);

  const [screenState, setScreenState] = useState<State>('idle');
  const [canStop, setCanStop] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUri, setAudioUri] = useState('');

  // Load STT module once
  useEffect(() => {
    createSTTModule(MODEL_PATH).then((mod) => { sttRef.current = mod; });
  }, []);

  // Minimum duration timer
  useEffect(() => {
    if (screenState !== 'recording') { setCanStop(false); return; }
    const minTimer = setTimeout(() => setCanStop(true), MIN_DURATION_MS);
    return () => clearTimeout(minTimer);
  }, [screenState]);

  // Auto-stop at 60 seconds
  useEffect(() => {
    if (screenState !== 'recording') { setElapsed(0); return; }
    const maxTimer = setTimeout(handleStop, MAX_DURATION_MS);
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { clearTimeout(maxTimer); clearInterval(tick); };
  }, [screenState]);

  const handleRecord = async () => {
    await recorder.start();
    setScreenState('recording');
  };

  const handleStop = async () => {
    setScreenState('transcribing');
    const file = await recorder.stop();
    setAudioUri(file.uri);
    const text = await sttRef.current!.transcribe(file.uri);
    setTranscript(text);
    setScreenState('review');
  };

  const handleContinue = () => {
    navigation.navigate('Extraction', { beneficiaryId, transcript, audioUri });
  };

  if (screenState === 'idle') {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{beneficiaryName}</Text>
        <Text style={styles.hint}>Tap to start recording your observation.</Text>
        <TouchableOpacity testID="record-button" style={styles.recordBtn} onPress={handleRecord}>
          <Text style={styles.recordBtnText}>Record</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screenState === 'recording') {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{beneficiaryName}</Text>
        <Text style={styles.timer}>{elapsed}s / 60s</Text>
        <TouchableOpacity
          testID="stop-button"
          style={[styles.stopBtn, !canStop && styles.disabled]}
          onPress={handleStop}
          disabled={!canStop}
        >
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>
        {!canStop && <Text style={styles.hint}>Hold for at least 10 seconds…</Text>}
      </View>
    );
  }

  if (screenState === 'transcribing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator testID="transcribing-indicator" size="large" />
        <Text style={styles.hint}>Transcribing…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.name}>{beneficiaryName}</Text>
      <Text style={styles.sectionLabel}>Review and correct transcript</Text>
      <TextInput
        style={styles.transcriptInput}
        multiline
        value={transcript}
        onChangeText={setTranscript}
        autoCorrect={false}
      />
      <TouchableOpacity testID="continue-button" style={styles.continueBtn} onPress={handleContinue}>
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 14, color: '#666', marginTop: 12, textAlign: 'center' },
  timer: { fontSize: 48, fontWeight: '200', marginVertical: 24 },
  sectionLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: 8 },
  recordBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  recordBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stopBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  stopBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  transcriptInput: { width: '100%', minHeight: 160, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: 'top', marginBottom: 24 },
  continueBtn: { width: '100%', backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
