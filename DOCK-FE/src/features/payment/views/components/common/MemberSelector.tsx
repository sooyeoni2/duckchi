import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, Image } from 'react-native';

interface MemberOption {
  userId: number;
  userName: string;
  userTag?: string | null;
  profileImageUrl?: string | null;
}

interface MemberSelectorProps {
  members: MemberOption[];
  selectedUserIds: number[];
  onToggleMember: (userId: number) => void;
  label?: string;
  error?: string | null;
}

/**
 * 👥 멤버 다중 선택 전용 공통 컴포넌트
 * - 가로 스크롤 칩(Chip) 형태
 * - 프로필 이미지 표시 지원
 * - 선택 여부에 따른 스타일 변화
 */
const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedUserIds,
  onToggleMember,
  label,
  error,
}) => {
  const renderItem = useCallback(({ item }: { item: MemberOption }) => {
    const isSelected = selectedUserIds.includes(item.userId);

    return (
      <TouchableOpacity
        style={[
          styles.memberChip,
          isSelected && styles.selectedChip
        ]}
        onPress={() => onToggleMember(item.userId)}
        activeOpacity={0.7}
      >
        <View style={styles.profileWrapper}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>{item.userName[0]}</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={[styles.userName, isSelected && styles.selectedText]}>
            {item.userName}
          </Text>
          {item.userTag && (
            <Text style={[styles.userTag, isSelected && styles.selectedTagText]}>
              #{item.userTag}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedUserIds, onToggleMember]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <FlatList
        data={members}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  listContent: {
    paddingRight: 16,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    minWidth: 80,
  },
  selectedChip: {
    backgroundColor: '#34C759', // Duckchi 메인 포인트 색상 (임시: Green)
    borderColor: '#34C759',
  },
  profileWrapper: {
    marginRight: 6,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  profilePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userTag: {
    fontSize: 10,
    color: '#999',
    fontWeight: '400',
  },
  selectedTagText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default MemberSelector;
