import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from './lib/supabase';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadNotes(): Promise<void> {
    setError(null);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setNotes(data ?? []);
    setLoading(false);
  }

  async function addNote(): Promise<void> {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    const { error } = await supabase.from('notes').insert({ content });
    if (error) setError(error.message);
    else loadNotes();
  }

  useEffect(() => {
    loadNotes().catch((e: unknown) => setError(getErrorMessage(e)));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase + Expo ✅</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Write a note…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addNote}
        />
        <Button title="Add" onPress={addNote} />
      </View>

      {error && <Text style={styles.error}>⚠️ {error}</Text>}

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <FlatList
          style={styles.list}
          data={notes}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
          renderItem={({ item }) => (
            <Text style={styles.note}>• {item.content}</Text>
          )}
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  spinner: { marginTop: 24 },
  list: { marginTop: 20 },
  note: { fontSize: 16, paddingVertical: 6 },
  empty: { color: '#888', marginTop: 24 },
  error: { color: '#c00', marginTop: 12 },
});
