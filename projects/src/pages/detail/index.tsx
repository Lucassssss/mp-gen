// 新闻详情页
import Taro from '@tarojs/taro';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { getNewsById, NewsItem, formatReadCount, getCategoryName, getCategoryColor } from '../../utils/news';

const Detail: React.FC = () => {
  const [news, setNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = (currentPage as any).options || {};
    const { id } = options;

    if (id) {
      const newsDetail = getNewsById(id);
      setNews(newsDetail || null);
    }
  }, []);

  const handleBack = () => {
    Taro.navigateBack();
  };

  if (!news) {
    return (
      <View className='flex items-center justify-center h-screen bg-white'>
        <Text className='text-gray-400 text-base'>加载中...</Text>
      </View>
    );
  }

  return (
    <View className='min-h-screen bg-white'>
      {/* 顶部导航 */}
      <View className='bg-white px-4 py-3 flex items-center sticky top-0 z-50 shadow-b-sm'>
        <View 
          className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200'
          onClick={handleBack}
        >
          <Text className='text-gray-600 text-lg'>←</Text>
        </View>
        <Text className='flex-1 text-center text-base font-medium text-gray-800 mr-8'>新闻详情</Text>
      </View>

      <ScrollView scrollY className='h-screen pb-20'>
        {/* 顶部图片 */}
        <Image 
          src={news.imageUrl} 
          className='w-full h-56 object-cover'
          mode='aspectFill'
        />

        {/* 文章内容 */}
        <View className='px-4 py-5'>
          {/* 标签和时间 */}
          <View className='flex items-center gap-3 mb-4'>
            <View 
              className='px-3 py-1 text-xs rounded-full'
              style={{ 
                backgroundColor: getCategoryColor(news.category) + '20',
                color: getCategoryColor(news.category)
              }}
            >
              {getCategoryName(news.category)}
            </View>
            <Text className='text-sm text-gray-400'>{news.publishTime}</Text>
          </View>

          {/* 标题 */}
          <Text className='text-xl font-bold text-gray-900 leading-relaxed mb-4 block'>
            {news.title}
          </Text>

          {/* 作者信息 */}
          <View className='flex items-center gap-3 pb-4 border-b border-gray-200'>
            <View className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
              <Text className='text-white text-sm font-medium'>
                {news.author.slice(0, 1)}
              </Text>
            </View>
            <View className='flex-1'>
              <Text className='text-sm font-medium text-gray-800 block'>{news.author}</Text>
              <Text className='text-xs text-gray-400 block'>
                阅读 {formatReadCount(news.readCount)}
              </Text>
            </View>
          </View>

          {/* 摘要 */}
          <View className='bg-blue-50 rounded-lg p-4 mt-4'>
            <Text className='text-sm text-blue-800 leading-relaxed'>
              {news.summary}
            </Text>
          </View>

          {/* 正文内容 */}
          <View className='mt-6'>
            {news.content.split('\n\n').map((paragraph, index) => (
              <Text 
                key={index}
                className='text-base text-gray-700 leading-loose mb-4 block'
              >
                {paragraph}
              </Text>
            ))}
          </View>

          {/* 底部信息 */}
          <View className='mt-8 pt-6 border-t border-gray-200'>
            <View className='flex items-center justify-between'>
              <Text className='text-sm text-gray-500'>
                发布时间：2024年1月15日
              </Text>
              <Text className='text-sm text-gray-500'>
                来源：{news.author}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50'>
        <View className='flex items-center gap-6'>
          <View className='flex items-center gap-1'>
            <Text className='text-gray-400'>👍</Text>
            <Text className='text-sm text-gray-500'>点赞</Text>
          </View>
          <View className='flex items-center gap-1'>
            <Text className='text-gray-400'>⭐</Text>
            <Text className='text-sm text-gray-500'>收藏</Text>
          </View>
          <View className='flex items-center gap-1'>
            <Text className='text-gray-400'>↗️</Text>
            <Text className='text-sm text-gray-500'>分享</Text>
          </View>
        </View>
        <View className='px-4 py-2 bg-blue-500 text-white text-sm rounded-full'>
          评论
        </View>
      </View>
    </View>
  );
};

export default Detail;
