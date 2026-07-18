import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { validateDisplayName } from '../lib/profanity';
import { theme } from '../lib/theme';

interface NameModalProps {
  visible: boolean;
  onSave: (name: string) => void;
}

export function NameModal({ visible, onSave }: NameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(name.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Fill in your name to get started.</Text>

          <TextInput
            style={styles.input}
            placeholder="Your display name"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            maxLength={20}
            autoFocus
            onSubmitEditing={handleSave}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save & Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.md,
  },
  title: {
    color: c.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: c.textMuted,
    fontSize: 15,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: c.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  error: {
    color: c.danger,
    marginTop: theme.spacing.sm,
    fontSize: 14,
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: c.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: c.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
