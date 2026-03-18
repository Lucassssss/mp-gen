import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState } from 'react';
import './index.scss';

export default function AboutPage() {
  return (
    <View className="page">
      <View className="header">
        <Text className="title">关于</Text>
      </View>
      <ScrollView className="content" scrollY>
        <View className="placeholder">
          <Text>正在开发中...</Text>
        </View>
      </ScrollView>
    </View>
  );
}
