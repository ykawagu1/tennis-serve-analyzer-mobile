import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export default function FAQScreen({ navigation }) {
  const { t } = useTranslation();

  // FAQリストを配列として取得
  const faqItems = t('faq_items', { returnObjects: true }) || [];
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('faq_title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {faqItems.map((item, idx) => (
          <Card key={idx} style={styles.card}>
            <Card.Content>
              <Text style={styles.q}>{item.q}</Text>
              <Text style={styles.a}>{item.a}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginLeft: 8 },
  card: { marginBottom: 16 },
  q: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#1565c0' },
  a: { fontSize: 14, color: '#444', lineHeight: 21 },
});