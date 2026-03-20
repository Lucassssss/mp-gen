import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { navigateTo, useRouter } from '@tarojs/taro'
import './index.css'

// 模拟分类数据
const categoryList = [
  { id: 1, name: '电影', icon: '🎬', count: 1234, subCategories: ['动作', '喜剧', '爱情', '科幻', '悬疑', '恐怖'] },
  { id: 2, name: '电视剧', icon: '📺', count: 2345, subCategories: ['国产剧', '港剧', '美剧', '韩剧', '日剧', '英剧'] },
  { id: 3, name: '综艺', icon: '🎤', count: 567, subCategories: ['选秀', '真人秀', '脱口秀', '美食', '音乐', '舞蹈'] },
  { id: 4, name: '动漫', icon: '🎮', count: 890, subCategories: ['热血', '冒险', '搞笑', '恋爱', '校园', '奇幻'] },
  { id: 5, name: '纪录片', icon: '🎥', count: 234, subCategories: ['自然', '历史', '人文', '科技', '社会', '军事'] },
  { id: 6, name: '短剧', icon: '📱', count: 456, subCategories: ['甜宠', '虐恋', '逆袭', '搞笑', '悬疑', '复仇'] },
]

const movieList = [
  { id: 11, title: '热辣滚烫', poster: 'https://picsum.photos/300/400?random=20', rating: 9.1, type: '喜剧', episodes: 1, year: 2024 },
  { id: 12, title: '飞驰人生2', poster: 'https://picsum.photos/300/400?random=21', rating: 8.9, type: '赛车', episodes: 1, year: 2024 },
  { id: 13, title: '第二十条', poster: 'https://picsum.photos/300/400?random=22', rating: 8.7, type: '剧情', episodes: 1, year: 2024 },
  { id: 14, title: '熊出没·逆转时空', poster: 'https://picsum.photos/300/400?random=23', rating: 8.5, type: '动画', episodes: 1, year: 2024 },
  { id: 15, title: '哥斯拉大战金刚2', poster: 'https://picsum.photos/300/400?random=24', rating: 8.6, type: '科幻', episodes: 1, year: 2024 },
  { id: 16, title: '周处除三害', poster: 'https://picsum.photos/300/400?random=25', rating: 9.0, type: '动作', episodes: 1, year: 2024 },
  { id: 17, title: '被我弄丢的人', poster: 'https://picsum.photos/300/400?random=26', rating: 8.4, type: '爱情', episodes: 1, year: 2024 },
  { id: 18, title: '功夫熊猫4', poster: 'https://picsum.photos/300/400?random=27', rating: 8.3, type: '动画', episodes: 1, year: 2024 },
]

export default class Category extends Component {
  state = {
    activeCategory: '电影',
    activeSubCategory: '',
  }

  componentDidMount() {
    const router = useRouter()
    if (router.params.type) {
      this.setState({ activeCategory: router.params.type })
    }
  }

  handleCategoryClick = (name: string) => {
    this.setState({ activeCategory: name, activeSubCategory: '' })
  }

  handleSubCategoryClick = (sub: string) => {
    this.setState(prev => ({
      activeSubCategory: prev.activeSubCategory === sub ? '' : sub
    }))
  }

  handleMovieClick = (id: number) => {
    navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  render() {
    const { activeCategory, activeSubCategory } = this.state
    const currentCategory = categoryList.find(c => c.name === activeCategory)

    return (
      <View className='category-page'>
        {/* 左侧分类导航 */}
        <ScrollView scrollY className='category-left'>
          {categoryList.map(item => (
            <View
              key={item.id}
              className={`category-item ${activeCategory === item.name ? 'active' : ''}`}
              onClick={() => this.handleCategoryClick(item.name)}
            >
              <Text className='category-icon'>{item.icon}</Text>
              <Text className='category-name'>{item.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧内容区 */}
        <ScrollView scrollY className='category-right'>
          {/* 子分类 */}
          <View className='sub-categories'>
            <View className='sub-categories-header'>
              <Text className='sub-title'>{activeCategory}分类</Text>
              <Text className='sub-count'>共{currentCategory?.count}部</Text>
            </View>
            <View className='sub-list'>
              {currentCategory?.subCategories.map(sub => (
                <View
                  key={sub}
                  className={`sub-item ${activeSubCategory === sub ? 'active' : ''}`}
                  onClick={() => this.handleSubCategoryClick(sub)}
                >
                  {sub}
                </View>
              ))}
            </View>
          </View>

          {/* 筛选标签 */}
          <View className='filter-tags'>
            <View className='filter-tag active'>全部</View>
            <View className='filter-tag'>最新</View>
            <View className='filter-tag'>最热</View>
            <View className='filter-tag'>评分最高</View>
          </View>

          {/* 电影列表 */}
          <View className='movie-grid'>
            {movieList.map(movie => (
              <View
                key={movie.id}
                className='movie-item'
                onClick={() => this.handleMovieClick(movie.id)}
              >
                <View className='movie-poster-wrap'>
                  <Image src={movie.poster} className='movie-poster' mode='aspectFill' />
                  <View className='movie-score'>
                    <Text className='score-text'>{movie.rating}</Text>
                  </View>
                  <View className='movie-type-badge'>{movie.type}</View>
                </View>
                <Text className='movie-title' numberOfLines={1}>{movie.title}</Text>
                <Text className='movie-year'>{movie.year}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }
}
