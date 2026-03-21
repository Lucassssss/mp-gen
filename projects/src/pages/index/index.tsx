// 首页 - 新闻列表
import Taro from '@tarojs/taro';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, PullDownRefresh } from '@tarojs/components';
import { mockNews, NewsItem, categories } from '../../utils/news';
import NewsCard from '../../components/NewsCard';

const Index: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, [selectedCategory]);

  const loadNews = () => {
    // 模拟加载数据
    let filteredNews = mockNews;
    if (selectedCategory !== 'all') {
      filteredNews = mockNews.filter(item => item.category === selectedCategory);
    }
    setNewsList(filteredNews);
  };

  const handlePullDownRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadNews();
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <View className='min-h-screen bg-gray-100'>
      {/* 顶部轮播区域 */}
      <View className='bg-white px-4 pt-3 pb-4'>
        <View className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg'>
          <Text className='text-white text-xl font-bold block mb-1'>新闻资讯</Text>
          <Text className='text-blue-100 text-sm'>实时更新，热点资讯一手掌握</Text>
        </View>
      </View>

      {/* 分类标签 */}
      <View className='bg-white px-4 py-3 sticky top-0 z-10 shadow-sm'>
        <ScrollView 
          scrollX 
          className='whitespace-nowrap'
          showHorizontalScrollIndicator={false}
        >
          <View className='flex gap-2'>
            <View 
              className={`inline-block px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => handleCategoryChange('all')}
            >
              全部
            </View>
            {categories.map(category => (
              <View 
                key={category.id}
                className={`inline-block px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === category.id 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : '#f3f4f6'
                }}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.icon} {category.name}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 新闻列表 */}
      <View className='px-4 py-4'>
        {newsList.length > 0 ? (
          newsList.map(news => (
            <NewsCard key={news.id} news={news} layout='vertical' />
          ))
        ) : (
          <View className='flex flex-col items-center justify-center py-20'>
            <Text className='text-gray-400 text-base'>暂无相关新闻</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Index;
