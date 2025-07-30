import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';

const CreateRecoveryPhraseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useUser();
  const phrase = user.recoveryPhrase || [];
  const principal = (route.params as any)?.principal || user.principal;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create Your Recovery Phrase</Text>
      <Text style={styles.subtitle}>
        This will take a few minutes. Make sure no one is looking at your screen, and prepare a pen and paper or a password manager.
      </Text>
      <View style={styles.phraseCard}>
        <Text style={styles.phraseLabel}>Your Recovery Phrase</Text>
        <View style={styles.wordsGrid4col}>
          {Array.from({ length: 8 }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.wordRow}>
              {Array.from({ length: 3 }).map((_, colIdx) => {
                const idx = rowIdx * 3 + colIdx;
                if (idx >= phrase.length) return <View key={colIdx} style={{ flex: 1 }} />;
                return (
                  <View key={colIdx} style={styles.wordGridItem}>
                    <Text style={styles.wordIndex}>{idx + 1}</Text>
                    <Text style={styles.wordText}>{phrase[idx]}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ConfirmRecoveryPhrase', { recoveryPhrase: phrase, principal })}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What is a recovery phrase?</Text>
        <Text style={styles.infoText}>
          A recovery phrase is a set of 24 words that represent your Internet Identity and private key. Store it in a secure place. If you lose access to your device, you can use this phrase to recover your identity.{"\n\n"}How do I store my recovery phrase?{"\n"}- Use a password manager{"\n"}- Write it down and store it in multiple safe places{"\n\n"}When should I use my recovery phrase?{"\n"}If you lose access to your device and have no other way to access your Internet Identity.{"\n\n"}Do not share your recovery phrase. If someone gains access to it, they could take control of your account.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#222',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  phraseBox: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: 320,
    backgroundColor: '#fafafa',
  },
  phraseLabel: {
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  wordGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b71c1c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    minWidth: 70,
    minHeight: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  wordIndex: {
    fontSize: 13,
    color: '#b71c1c',
    marginRight: 6,
    fontWeight: 'bold',
  },
  wordText: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: 220,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: 220,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#b71c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: 320,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  infoText: {
    fontSize: 13,
    color: '#444',
  },
  phraseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#eee',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  wordsGrid4col: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
});

export default CreateRecoveryPhraseScreen; 
