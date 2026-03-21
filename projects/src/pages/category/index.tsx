// 分类页面
import Taro from '@tarojs/taro';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { categories, getNewsByCategory, NewsItem } from '../../utils/news';
import NewsCard from '../../components/NewsCard';

const Category: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  useEffect(() => {
    loadNewsByCategory();
  }, [selectedCategory]);

  const loadNewsByCategory = () => {
    const news = getNewsByCategory(selectedCategory);
    setNewsList(news);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <View className='min-h-screen bg-gray-100'>
      {/* 顶部标题 */}
      <View className='bg-white px-4 pt-3 pb-4'>
        <View className='bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 shadow-lg'>
          <Text className='text-white text-xl font-bold block mb-1'>新闻分类</Text>
          <Text className='text-purple-100 text-sm'>按类别浏览感兴趣的资讯</Text>
        </View>
      </View>

      {/* 分类网格 */}
      <View className='bg-white px-4 py-4'>
        <View className='grid grid-cols-4 gap-3'>
          {categories.map(category => (
            <View
              key={category.id}
              className={`flex flex-col items-center py-3 rounded-lg transition-all ${
                selectedCategory === category.id 
                  ? 'bg-opacity-20 shadow-md' 
                  : 'bg-gray-50'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id 
                  ? category.color + '20' 
                  : '#f9fafb'
              }}
              onClick={() => handleCategoryClick(category.id)}
            >
              <View 
                className='w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2'
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? category.color 
                    : '#f3f4f6'
                }}
              >
                {category.icon}
              </View>
              <Text 
                className={`text-xs font-medium ${
                  selectedCategory === category.id ? 'font-bold' : 'text-gray-600'
                }`}
                style={{
                  color: selectedCategory === category.id 
                    ? category.color 
                    : '#4b5563'
                }}
              >
                {category.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 当前分类标题 */}
      <View className='px-4 py-3 flex items-center justify-between'>
        <View className='flex items-center gap-2'>
          <View 
            className='w-1 h-4 rounded-full'
            style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color }}
          />
          <Text className='text-base font-medium text-gray-800'>
            {categories.find(c => c.id === selectedCategory)?.name}资讯
          </Text>
        </View>
        <Text className='text-sm text-gray-400'>
          {newsList.length} 条
        </Text>
      </View>

      {/* 新闻列表 */}
      <View className='px-4 pb-4'>
        {newsList.length > 0 ? (
          newsList.map(news => (
            <NewsCard key={news.id} news={news} layout='horizontal' />
          ))
        ) : (
          <View className='flex flex-col items-center justify-center py-20 bg-white rounded-lg'>
            <Text className='text-4xl mb-4'>📰</Text>
            <Text className='text-gray-400 text-base'>该分类暂无新闻</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Category;
