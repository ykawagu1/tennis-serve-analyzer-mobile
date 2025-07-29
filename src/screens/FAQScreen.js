// screens/FAQScreen.js
import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Card, IconButton } from 'react-native-paper';

const FAQ_LIST = [
  {
    q: 'アプリでできることは何ですか？',
    a: 'テニスのサーブ動作を動画で撮影し、AIが自動でフォームの解析・スコア化・ワンポイントアドバイスを表示します。また、スコアカードをSNSなどで簡単にシェアできます。プレミアム版ではAIによる詳細アドバイスが表示されます。',
  },
  {
    q: 'どのような動画を撮影すればAI解析がうまくいきますか？',
    a: '1人でサーブをしている全身がしっかり映る動画を推奨します。カメラはサービスラインの斜め後方から撮影してください。',
  },
  {
    q: '解析できるサーブは何本までですか？',
    a: '無料版では1日に３回まで解析が可能です。有料会員になると回数制限なく何度でも解析できます。',
  },
  {
    q: '無料版と有料版の違いは何ですか？',
    a: '無料版は広告が表示され、解析回数に制限があります。プレミアム版では広告なし・無制限の解析・プレミアムスキン・AI詳細アドバイスなど、追加の機能が利用できます。',
  },
  {
    q: '有料版の料金と支払い方法を教えてください。',
    a: '有料版は月額¥300（年額の場合は割引価格¥3000）でご利用いただけます。お支払いはApp StoreまたはGoogle Playを通じたサブスクリプション決済となります。',
  },
  {
    q: 'AIアドバイスが表示されない・スコアが見えない場合は？',
    a: '通信状況やサーバの混雑状況によって一時的に表示が遅れる場合があります。アプリを再起動しても解決しない場合は、お手数ですがサポートまでご連絡ください。',
  },
  {
    q: 'アップロードした動画や解析結果はどこに保存されますか？',
    a: '動画や解析結果は、保存されません。自動で削除されます。',
  },
  {
    q: '解析結果を友達やコーチにシェアする方法は？',
    a: '解析結果画面にある「シェア」ボタンから、SNSやメール、LINEなどで簡単に共有できます。スコアカード画像を端末に保存してシェアすることも可能です。',
  },
  {
    q: 'アプリがうまく動作しない・不具合が出た場合はどこに問い合わせればいいですか？',
    a: 'アプリの「設定」画面またはヘルプページ内のお問い合わせフォームからご連絡ください。迅速にサポート対応いたします。',
  },
];

export default function FAQScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={28}
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 0 }}
        />
        <Text style={styles.headerTitle}>よくある質問（FAQ）</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {FAQ_LIST.map((item, idx) => (
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