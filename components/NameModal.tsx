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
          <Text style={styles.eyebrow}>Probability Cup</Text>
          <Text style={styles.title}>Enter your analyst name</Text>
          <Text style={styles.subtitle}>Used on leaderboards and session history.</Text>

          <TextInput
            style={styles.input}
            placeholder="Display name"
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
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
    fontSize: 14,
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 16,
  },
});
