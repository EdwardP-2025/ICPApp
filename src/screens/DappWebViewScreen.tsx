import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const DappWebViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const url = (route.params as any)?.url || 'www.baidu.com';

  return (
    <View style={styles.container}>
      <View style={styles.addressBar}>
        <TextInput
          style={styles.urlInput}
          value={url}
          editable={false}
        />
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Link Identity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.dappArea}>
        <Text style={styles.dappAreaText}>DAPP Custom Page</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 24,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#222',
  },
  iconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  topButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  topBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  topBtnText: {
    color: '#222',
    fontSize: 15,
  },
  linkBtn: {
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 10,
  },
  linkBtnText: {
    color: '#444',
    fontSize: 15,
  },
  dappArea: {
    flex: 1,
    margin: 16,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dappAreaText: {
    color: '#222',
    fontSize: 16,
  },
});

export default DappWebViewScreen; 