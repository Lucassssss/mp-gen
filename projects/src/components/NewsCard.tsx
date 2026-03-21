// 新闻卡片组件
import Taro from '@tarojs/taro';
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { NewsItem, formatReadCount, getCategoryName, getCategoryColor } from '../utils/news';

interface NewsCardProps {
  news: NewsItem;
  layout?: 'vertical' | 'horizontal';
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, layout = 'vertical' }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${news.id}`
    });
  };

  // 垂直布局（带图片）
  if (layout === 'vertical') {
    return (
      <View 
        className='bg-white rounded-lg overflow-hidden shadow-sm mb-3 active:bg-gray-50'
        onClick={handleClick}
      >
        <Image 
          src={news.imageUrl} 
          className='w-full h-40 object-cover'
          mode='aspectFill'
        />
        <View className='p-3'>
          {news.isHot && (
            <View className='inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded mb-2'>
              热点
            </View>
          )}
          <Text className='text-base font-medium text-gray-800 leading-snug line-clamp-2 block mb-2'>
            {news.title}
          </Text>
          <Text className='text-sm text-gray-500 leading-relaxed line-clamp-2 block mb-3'>
            {news.summary}
          </Text>
          <View className='flex items-center justify-between'>
            <View className='flex items-center gap-2'>
              <View 
                className='px-2 py-0.5 text-xs rounded'
                style={{ 
                  backgroundColor: getCategoryColor(news.category) + '20',
                  color: getCategoryColor(news.category)
                }}
              >
                {getCategoryName(news.category)}
              </View>
              <Text className='text-xs text-gray-400'>{news.publishTime}</Text>
            </View>
            <Text className='text-xs text-gray-400'>
              阅读 {formatReadCount(news.readCount)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 水平布局（图片在右侧）
  return (
    <View 
      className='bg-white rounded-lg p-3 flex gap-3 shadow-sm mb-3 active:bg-gray-50'
      onClick={handleClick}
    >
      <View className='flex-1 flex flex-col justify-between'>
        {news.isHot && (
          <View className='inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded mb-1 self-start'>
            热点
          </View>
        )}
        <Text className='text-sm font-medium text-gray-800 leading-snug line-clamp-2 block mb-2'>
          {news.title}
        </Text>
        <View className='flex items-center justify-between'>
          <View className='flex items-center gap-2'>
            <View 
              className='px-2 py-0.5 text-xs rounded'
              style={{ 
                backgroundColor: getCategoryColor(news.category) + '20',
                color: getCategoryColor(news.category)
              }}
            >
              {getCategoryName(news.category)}
            </View>
          </View>
          <Text className='text-xs text-gray-400'>
            {formatReadCount(news.readCount)}阅读
          </Text>
        </View>
      </View>
      <Image 
        src={news.imageUrl} 
        className='w-24 h-24 rounded-lg flex-shrink-0'
        mode='aspectFill'
      />
    </View>
  );
};

export default NewsCard;
