'use client';

import { useState } from 'react';
import { validateDisplayName } from '@/lib/profanity';
import styles from './NameModal.module.css';

interface NameModalProps {
  visible: boolean;
  onSave: (name: string) => void;
}

export function NameModal({ visible, onSave }: NameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  function handleSave() {
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(name.trim());
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Reality Cup</span>
        <h2 className={styles.title}>Enter your analyst name</h2>
        <p className={styles.subtitle}>Used on leaderboards and session history.</p>

        <input
          className={styles.input}
          placeholder="Display name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={20}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.button} onClick={handleSave}>
          Continue →
        </button>
      </div>
    </div>
  );
}
