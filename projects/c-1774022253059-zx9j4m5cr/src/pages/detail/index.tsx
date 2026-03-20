import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import './index.css'

// 模拟视频详情数据
const movieDetail = {
  id: 1,
  title: '流浪地球2',
  poster: 'https://picsum.photos/400/600?random=60',
  rating: 9.5,
  year: 2023,
  area: '中国大陆',
  type: ['科幻', '冒险', '灾难'],
  director: '郭帆',
  actors: ['吴京', '刘德华', '李雪健', '沙溢'],
  duration: '173分钟',
  episodes: 1,
  description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。',
  tags: ['硬科幻', '震撼视效', '家国情怀'],
}

const episodeList = [
  { id: 1, episode: 1, isVip: false, isSelected: true },
  { id: 2, episode: 2, isVip: false, isSelected: false },
  { id: 3, episode: 3, isVip: true, isSelected: false },
  { id: 4, episode: 4, isVip: true, isSelected: false },
]

const relatedMovies = [
  { id: 2, title: '满江红', poster: 'https://picsum.photos/300/400?random=61', rating: 8.8 },
  { id: 3, title: '熊出没·逆转时空', poster: 'https://picsum.photos/300/400?random=62', rating: 8.5 },
  { id: 4, title: '第二十条', poster: 'https://picsum.photos/300/400?random=63', rating: 8.7 },
  { id: 5, title: '热辣滚烫', poster: 'https://picsum.photos/300/400?random=64', rating: 9.1 },
]

const comments = [
  {
    id: 1,
    user: '影视达人',
    avatar: 'https://picsum.photos/100/100?random=70',
    time: '2小时前',
    content: '太震撼了！特效和剧情都很棒，是国产科幻的巅峰之作！',
    like: 1234,
  },
  {
    id: 2,
    user: '科幻迷',
    avatar: 'https://picsum.photos/100/100?random=71',
    time: '5小时前',
    content: '吴京和刘德华的演技太赞了，看得我热泪盈眶！',
    like: 876,
  },
  {
    id: 3,
    user: '电影发烧友',
    avatar: 'https://picsum.photos/100/100?random=72',
    time: '1天前',
    content: '这部电影的格局太大了，每一个细节都值得回味。',
    like: 543,
  },
]

export default class Detail extends Component {
  state = {
    isFavorite: false,
    isFollow: false,
    selectedEpisode: 1,
  }

  componentDidMount() {
    const router = useRouter()
    // 根据 router.params.id 加载详情数据
  }

  handleFavorite = () => {
    this.setState(prev => ({ isFavorite: !prev.isFavorite }))
  }

  handleFollow = () => {
    this.setState(prev => ({ isFollow: !prev.isFollow }))
  }

  handleEpisodeSelect = (episode: number) => {
    this.setState({ selectedEpisode: episode })
  }

  handlePlay = () => {
    // 跳转播放器
  }

  render() {
    const { isFavorite, isFollow, selectedEpisode } = this.state

    return (
      <ScrollView scrollY className='detail-page'>
        {/* 顶部海报区域 */}
        <View className='poster-section'>
          <Image src={movieDetail.poster} className='poster-bg' mode='aspectFill' />
          <View className='poster-overlay' />
          <View className='poster-content'>
            <Image src={movieDetail.poster} className='poster-image' mode='aspectFill' />
            <View className='poster-info'>
              <Text className='movie-title'>{movieDetail.title}</Text>
              <View className='rating-row'>
                <Text className='rating'>⭐ {movieDetail.rating}</Text>
                <Text className='year'>{movieDetail.year}</Text>
                <Text className='duration'>{movieDetail.duration}</Text>
              </View>
              <View className='type-tags'>
                {movieDetail.type.map((t, i) => (
                  <Text key={i} className='type-tag'>{t}</Text>
                ))}
              </View>
              <View className='area-tags'>
                <Text className='area-tag'>🌍 {movieDetail.area}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className='action-bar'>
          <View className={`action-btn ${isFavorite ? 'active' : ''}`} onClick={this.handleFavorite}>
            <Text className='action-icon'>{isFavorite ? '❤️' : '🤍'}</Text>
            <Text className='action-text'>{isFavorite ? '已收藏' : '收藏'}</Text>
          </View>
          <View className={`action-btn ${isFollow ? 'active' : ''}`} onClick={this.handleFollow}>
            <Text className='action-icon'>👁️</Text>
            <Text className='action-text'>{isFollow ? '已追剧' : '追剧'}</Text>
          </View>
          <View className='action-btn'>
            <Text className='action-icon'>📤</Text>
            <Text className='action-text'>分享</Text>
          </View>
        </View>

        {/* 播放按钮 */}
        <View className='play-section'>
          <View className='play-btn' onClick={this.handlePlay}>
            <Text className='play-icon'>▶️</Text>
            <Text className='play-text'>立即播放</Text>
          </View>
        </View>

        {/* 剧情简介 */}
        <View className='section'>
          <Text className='section-title'>剧情简介</Text>
          <Text className='description'>{movieDetail.description}</Text>
          <View className='tags'>
            {movieDetail.tags.map((tag, i) => (
              <View key={i} className='tag-item'>{tag}</View>
            ))}
          </View>
        </View>

        {/* 演职员 */}
        <View className='section'>
          <Text className='section-title'>导演</Text>
          <View className='director-row'>
            <View className='person-chip'>
              <Text className='person-name'>{movieDetail.director}</Text>
            </View>
          </View>
        </View>

        <View className='section'>
          <Text className='section-title'>主演</Text>
          <ScrollView scrollX enableFlex className='actors-scroll'>
            {movieDetail.actors.map((actor, i) => (
              <View key={i} className='actor-card'>
                <View className='actor-avatar'>
                  <Text className='actor-emoji'>👤</Text>
                </View>
                <Text className='actor-name' numberOfLines={1}>{actor}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 选集（电视剧） */}
        {movieDetail.episodes > 1 && (
          <View className='section'>
            <View className='section-header'>
              <Text className='section-title'>选集</Text>
              <Text className='episode-count'>共{movieDetail.episodes}集</Text>
            </View>
            <View className='episode-grid'>
              {episodeList.map(ep => (
                <View
                  key={ep.id}
                  className={`episode-item ${selectedEpisode === ep.episode ? 'active' : ''} ${ep.isVip ? 'vip' : ''}`}
                  onClick={() => this.handleEpisodeSelect(ep.episode)}
                >
                  <Text className='episode-num'>第{ep.episode}集</Text>
                  {ep.isVip && <Text className='vip-tag'>VIP</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 热门评论 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>🔥 热门评论</Text>
            <Text className='more-link'>更多 ›</Text>
          </View>
          <View className='comments-list'>
            {comments.map(comment => (
              <View key={comment.id} className='comment-item'>
                <Image src={comment.avatar} className='comment-avatar' mode='aspectFill' />
                <View className='comment-content'>
                  <View className='comment-header'>
                    <Text className='comment-user'>{comment.user}</Text>
                    <Text className='comment-time'>{comment.time}</Text>
                  </View>
                  <Text className='comment-text'>{comment.content}</Text>
                  <View className='comment-footer'>
                    <Text className='like-btn'>👍 {comment.like}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 相关推荐 */}
        <View className='section'>
          <Text className='section-title'>📌 相关推荐</Text>
          <ScrollView scrollX enableFlex className='related-scroll'>
            {relatedMovies.map(movie => (
              <View key={movie.id} className='related-item'>
                <View className='related-poster-wrap'>
                  <Image src={movie.poster} className='related-poster' mode='aspectFill' />
                  <View className='related-rating'>⭐ {movie.rating}</View>
                </View>
                <Text className='related-title' numberOfLines={1}>{movie.title}</Text>
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
