import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import './index.css'

// 模拟数据
const bannerList = [
  { id: 1, title: '热映大片', image: 'https://picsum.photos/750/400?random=1', tag: '热映' },
  { id: 2, title: '热门综艺', image: 'https://picsum.photos/750/400?random=2', tag: '综艺' },
  { id: 3, title: '经典剧集', image: 'https://picsum.photos/750/400?random=3', tag: '剧集' },
]

const hotMovies = [
  { id: 1, title: '流浪地球2', poster: 'https://picsum.photos/300/400?random=4', rating: 9.5, type: '科幻', episodes: 1 },
  { id: 2, title: '满江红', poster: 'https://picsum.photos/300/400?random=5', rating: 8.8, type: '剧情', episodes: 1 },
  { id: 3, title: '狂飙', poster: 'https://picsum.photos/300/400?random=6', rating: 9.2, type: '犯罪', episodes: 39 },
  { id: 4, title: '三体', poster: 'https://picsum.photos/300/400?random=7', rating: 9.1, type: '科幻', episodes: 30 },
  { id: 5, title: '漫长的季节', poster: 'https://picsum.photos/300/400?random=8', rating: 9.4, type: '悬疑', episodes: 12 },
  { id: 6, title: '长相思', poster: 'https://picsum.photos/300/400?random=9', rating: 8.6, type: '古装', episodes: 39 },
]

const categories = [
  { id: 1, name: '电影', icon: '🎬', color: '#ff4757' },
  { id: 2, name: '电视剧', icon: '📺', color: '#ffa502' },
  { id: 3, name: '综艺', icon: '🎤', color: '#2ed573' },
  { id: 4, name: '动漫', icon: '🎮', color: '#1e90ff' },
  { id: 5, name: '纪录片', icon: '🎥', color: '#a55eea' },
  { id: 6, name: '少儿', icon: '🧸', color: '#ff6b81' },
]

const recommendList = [
  { id: 7, title: '长安十二时辰', poster: 'https://picsum.photos/300/400?random=10', rating: 9.3, type: '悬疑', episodes: 48 },
  { id: 8, title: '庆余年', poster: 'https://picsum.photos/300/400?random=11', rating: 9.1, type: '古装', episodes: 46 },
  { id: 9, title: '繁花', poster: 'https://picsum.photos/300/400?random=12', rating: 8.9, type: '都市', episodes: 30 },
  { id: 10, title: '风吹半夏', poster: 'https://picsum.photos/300/400?random=13', rating: 8.7, type: '商战', episodes: 36 },
]

export default class Home extends Component {
  state = {
    currentBanner: 0,
  }

  componentDidMount() {
    // 自动轮播
    setInterval(() => {
      this.setState(prev => ({
        currentBanner: (prev.currentBanner + 1) % bannerList.length
      }))
    }, 3000)
  }

  handleMovieClick = (id: number) => {
    navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  handleCategoryClick = (name: string) => {
    navigateTo({ url: `/pages/category/index?type=${name}` })
  }

  render() {
    const { currentBanner } = this.state

    return (
      <ScrollView className='home-page' scrollY>
        {/* 顶部搜索栏 */}
        <View className='search-bar'>
          <View className='search-input'>
            <Text className='search-icon'>🔍</Text>
            <Text className='search-placeholder'>搜索电影、电视剧、综艺...</Text>
          </View>
        </View>

        {/* 轮播图 */}
        <View className='banner-container'>
          <ScrollView scrollX enableFlex className='banner-scroll'>
            {bannerList.map((item, index) => (
              <View 
                key={item.id} 
                className={`banner-item ${index === currentBanner ? 'active' : ''}`}
                onClick={() => this.handleMovieClick(item.id)}
              >
                <Image src={item.image} className='banner-image' mode='aspectFill' />
                <View className='banner-overlay'>
                  <Text className='banner-tag'>{item.tag}</Text>
                  <Text className='banner-title'>{item.title}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View className='banner-dots'>
            {bannerList.map((_, index) => (
              <View 
                key={index} 
                className={`dot ${index === currentBanner ? 'active' : ''}`}
              />
            ))}
          </View>
        </View>

        {/* 分类导航 */}
        <View className='category-nav'>
          {categories.map(item => (
            <View 
              key={item.id} 
              className='category-item'
              onClick={() => this.handleCategoryClick(item.name)}
            >
              <View className='category-icon' style={{ backgroundColor: item.color }}>
                <Text className='icon-text'>{item.icon}</Text>
              </View>
              <Text className='category-name'>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* 热门电影 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>🔥 热门影视</Text>
            <View className='section-more'>
              <Text className='more-text'>更多</Text>
              <Text className='more-arrow'>›</Text>
            </View>
          </View>
          <ScrollView scrollX enableFlex className='movie-scroll'>
            {hotMovies.map(movie => (
              <View 
                key={movie.id} 
                className='movie-card'
                onClick={() => this.handleMovieClick(movie.id)}
              >
                <View className='movie-poster-wrap'>
                  <Image src={movie.poster} className='movie-poster' mode='aspectFill' />
                  <View className='movie-rating'>
                    <Text className='rating-star'>⭐</Text>
                    <Text className='rating-score'>{movie.rating}</Text>
                  </View>
                  <View className='movie-tag'>{movie.episodes > 1 ? `更新至${movie.episodes}集` : '正片'}</View>
                </View>
                <Text className='movie-title' numberOfLines={1}>{movie.title}</Text>
                <Text className='movie-type'>{movie.type}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 推荐推荐 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>📌 编辑推荐</Text>
            <View className='section-more'>
              <Text className='more-text'>换一换</Text>
              <Text className='more-arrow'>↻</Text>
            </View>
          </View>
          <ScrollView scrollX enableFlex className='movie-scroll'>
            {recommendList.map(movie => (
              <View 
                key={movie.id} 
                className='movie-card'
                onClick={() => this.handleMovieClick(movie.id)}
              >
                <View className='movie-poster-wrap'>
                  <Image src={movie.poster} className='movie-poster' mode='aspectFill' />
                  <View className='movie-rating'>
                    <Text className='rating-star'>⭐</Text>
                    <Text className='rating-score'>{movie.rating}</Text>
                  </View>
                </View>
                <Text className='movie-title' numberOfLines={1}>{movie.title}</Text>
                <Text className='movie-type'>{movie.type}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 底部间距 */}
        <View className='bottom-gap' />
      </ScrollView>
    )
  }
}
