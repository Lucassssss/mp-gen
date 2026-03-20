import { Component } from 'react'
import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import './index.css'

// 模拟搜索历史和热门搜索
const searchHistory = ['流浪地球', '狂飙', '三体', '庆余年']
const hotSearch = [
  { id: 1, keyword: '热辣滚烫', hot: '989万' },
  { id: 2, keyword: '飞驰人生2', hot: '876万' },
  { id: 3, keyword: '周处除三害', hot: '765万' },
  { id: 4, keyword: '繁花', hot: '654万' },
  { id: 5, keyword: '与凤行', hot: '543万' },
  { id: 6, keyword: '追风者', hot: '432万' },
  { id: 7, keyword: '城中之城', hot: '321万' },
  { id: 8, keyword: '乘风踏浪', hot: '210万' },
]

const searchResults = [
  { id: 1, title: '流浪地球', poster: 'https://picsum.photos/300/400?random=30', rating: 9.5, type: '科幻', year: 2019 },
  { id: 2, title: '流浪地球2', poster: 'https://picsum.photos/300/400?random=31', rating: 9.5, type: '科幻', year: 2023 },
  { id: 3, title: '疯狂的外星人', poster: 'https://picsum.photos/300/400?random=32', rating: 8.2, type: '喜剧', year: 2019 },
  { id: 4, title: '疯狂动物城', poster: 'https://picsum.photos/300/400?random=33', rating: 9.3, type: '动画', year: 2016 },
  { id: 5, title: '流量地球', poster: 'https://picsum.photos/300/400?random=34', rating: 7.8, type: '剧情', year: 2020 },
]

export default class Search extends Component {
  state = {
    keyword: '',
    isSearching: false,
    showHistory: true,
  }

  handleInput = (e: any) => {
    this.setState({ 
      keyword: e.detail.value,
      showHistory: e.detail.value === ''
    })
  }

  handleSearch = () => {
    if (this.state.keyword) {
      this.setState({ isSearching: true, showHistory: false })
    }
  }

  handleHistoryClick = (keyword: string) => {
    this.setState({ keyword, isSearching: true, showHistory: false })
  }

  handleHotClick = (keyword: string) => {
    this.setState({ keyword, isSearching: true, showHistory: false })
  }

  handleClearHistory = () => {
    // 清除历史记录
  }

  handleMovieClick = (id: number) => {
    navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  render() {
    const { keyword, isSearching, showHistory } = this.state

    return (
      <View className='search-page'>
        {/* 搜索框 */}
        <View className='search-header'>
          <View className='search-input-wrap'>
            <Text className='search-icon'>🔍</Text>
            <Input
              className='search-input'
              placeholder='搜索电影、电视剧、综艺...'
              value={keyword}
              onInput={this.handleInput}
              onConfirm={this.handleSearch}
              focus={true}
            />
            {keyword && (
              <Text className='clear-btn' onClick={() => this.setState({ keyword: '', isSearching: false, showHistory: true })}>✕</Text>
            )}
          </View>
          <Text className='search-cancel' onClick={() => this.setState({ keyword: '', isSearching: false, showHistory: true })}>取消</Text>
        </View>

        {/* 搜索历史 */}
        {showHistory && (
          <View className='history-section'>
            <View className='section-header'>
              <Text className='section-title'>搜索历史</Text>
              <Text className='clear-history' onClick={this.handleClearHistory}>清空</Text>
            </View>
            <View className='history-list'>
              {searchHistory.map((item, index) => (
                <View
                  key={index}
                  className='history-item'
                  onClick={() => this.handleHistoryClick(item)}
                >
                  <Text className='history-icon'>🕐</Text>
                  <Text className='history-text'>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 热门搜索 */}
        {showHistory && (
          <View className='hot-section'>
            <View className='section-header'>
              <Text className='section-title'>🔥 热门搜索</Text>
            </View>
            <View className='hot-list'>
              {hotSearch.map((item, index) => (
                <View
                  key={item.id}
                  className='hot-item'
                  onClick={() => this.handleHotClick(item.keyword)}
                >
                  <View className={`hot-rank ${index < 3 ? 'top' : ''}`}>{index + 1}</View>
                  <View className='hot-content'>
                    <Text className='hot-keyword'>{item.keyword}</Text>
                    <Text className='hot-count'>{item.hot} 搜索</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 搜索结果 */}
        {isSearching && (
          <ScrollView scrollY className='results-section'>
            <View className='results-header'>
              <Text className='results-count'>找到 {searchResults.length} 条相关结果</Text>
            </View>
            <View className='results-list'>
              {searchResults.map(movie => (
                <View
                  key={movie.id}
                  className='result-item'
                  onClick={() => this.handleMovieClick(movie.id)}
                >
                  <Image src={movie.poster} className='result-poster' mode='aspectFill' />
                  <View className='result-info'>
                    <Text className='result-title'>{movie.title}</Text>
                    <View className='result-meta'>
                      <Text className='result-type'>{movie.type}</Text>
                      <Text className='result-year'>{movie.year}</Text>
                    </View>
                    <View className='result-rating'>
                      <Text className='rating-star'>⭐</Text>
                      <Text className='rating-score'>{movie.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 搜索提示 */}
        {!showHistory && !isSearching && (
          <View className='search-tip'>
            <Text className='tip-icon'>💡</Text>
            <Text className='tip-text'>输入关键词开始搜索</Text>
          </View>
        )}
      </View>
    )
  }
}
