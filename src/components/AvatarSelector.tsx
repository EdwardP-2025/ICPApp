import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Avatar {
  id: string;
  uri?: string;
  icon?: string | null;
}

interface AvatarSelectorProps {
  currentAvatar: string | null;
  onAvatarSelect: (avatar: string | null) => void;
  visible: boolean;
  onClose: () => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  onAvatarSelect,
  visible,
  onClose,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar);

  const presetAvatars: Avatar[] = [
    { id: 'avatar1', uri: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=A', icon: null },
    { id: 'avatar2', uri: 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=B', icon: null },
    { id: 'avatar3', uri: 'https://via.placeholder.com/100x100/45B7D1/FFFFFF?text=C', icon: null },
    { id: 'avatar4', uri: 'https://via.placeholder.com/100x100/96CEB4/FFFFFF?text=D', icon: null },
    { id: 'avatar5', uri: 'https://via.placeholder.com/100x100/FFEAA7/FFFFFF?text=E', icon: null },
    { id: 'avatar6', uri: 'https://via.placeholder.com/100x100/DDA0DD/FFFFFF?text=F', icon: null },
    { id: 'avatar7', uri: 'https://via.placeholder.com/100x100/98D8C8/FFFFFF?text=G', icon: null },
    { id: 'avatar8', uri: 'https://via.placeholder.com/100x100/F7DC6F/FFFFFF?text=H', icon: null },
  ];

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar.uri || null);
  };

  const handleCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take a photo.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Camera', 'Camera functionality would be implemented here');
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      Alert.alert('Camera', 'Camera functionality would be implemented here');
    }
  };

  const handleGallery = () => {
    Alert.alert('Gallery', 'Gallery functionality would be implemented here');
  };

  const handleConfirm = () => {
    onAvatarSelect(selectedAvatar);
    onClose();
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
  };

  const renderAvatarItem = (avatar: Avatar) => {
    const isSelected = selectedAvatar === avatar.uri;
    
    return (
      <TouchableOpacity
        key={avatar.id}
        style={[styles.avatarItem, isSelected && styles.selectedAvatar]}
        onPress={() => handleAvatarSelect(avatar)}
      >
        {avatar.uri ? (
          <View style={styles.avatarImage}>
            <Text style={styles.avatarText}>{avatar.uri.split('text=')[1]}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color="#666" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Camera & Gallery</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCamera}>
                  <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleGallery}>
                  <MaterialCommunityIcons name="image" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preset Avatars</Text>
              <View style={styles.avatarGrid}>
                {presetAvatars.map(renderAvatarItem)}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Avatar</Text>
              <View style={styles.currentAvatarContainer}>
                {currentAvatar ? (
                  <View style={styles.currentAvatar}>
                    <Text style={styles.currentAvatarText}>
                      {currentAvatar.split('text=')[1] || 'A'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noAvatar}>
                    <MaterialCommunityIcons name="account" size={32} color="#ccc" />
                    <Text style={styles.noAvatarText}>No avatar selected</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={handleRemoveAvatar}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#b71c1c" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b71c1c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  selectedAvatar: {
    borderColor: '#b71c1c',
    backgroundColor: '#ffe5e5',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentAvatarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  currentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  noAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAvatarText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  removeButtonText: {
    color: '#b71c1c',
    fontSize: 14,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#b71c1c',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AvatarSelector; 