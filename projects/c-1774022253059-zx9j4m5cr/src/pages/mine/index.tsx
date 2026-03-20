import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import './index.css'

// 模拟用户数据
const userInfo = {
  name: '影视达人',
  avatar: 'https://picsum.photos/200/200?random=50',
  vipLevel: '黄金会员',
  vipExpire: '2025-12-31',
}

const menuList = [
  { id: 1, icon: '📺', title: '观看历史', subtitle: '记录观看足迹', color: '#ff4757' },
  { id: 2, icon: '⭐', title: '我的收藏', subtitle: '收藏喜欢的影视', color: '#ffa502' },
  { id: 3, icon: '👀', title: '追剧中心', subtitle: '追更新的剧集', color: '#2ed573' },
  { id: 4, icon: '📥', title: '下载管理', subtitle: '离线缓存视频', color: '#1e90ff' },
]

const quickActions = [
  { id: 1, icon: '💰', title: '积分商城', bgColor: '#ff4757' },
  { id: 2, icon: '🎫', title: '优惠券', bgColor: '#ffa502' },
  { id: 3, icon: '📋', title: '邀请好友', bgColor: '#2ed573' },
  { id: 4, icon: '⚙️', title: '设置', bgColor: '#a55eea' },
]

const watchHistory = [
  { id: 1, title: '狂飙', poster: 'https://picsum.photos/300/400?random=40', progress: 85, episode: '第39集' },
  { id: 2, title: '三体', poster: 'https://picsum.photos/300/400?random=41', progress: 60, episode: '第18集' },
  { id: 3, title: '流浪地球2', poster: 'https://picsum.photos/300/400?random=42', progress: 100, episode: '已看完' },
]

export default class Mine extends Component {
  render() {
    return (
      <ScrollView scrollY className='mine-page'>
        {/* 用户信息卡片 */}
        <View className='user-card'>
          <View className='user-info'>
            <Image src={userInfo.avatar} className='user-avatar' mode='aspectFill' />
            <View className='user-detail'>
              <Text className='user-name'>{userInfo.name}</Text>
              <View className='vip-badge'>
                <Text className='vip-icon'>👑</Text>
                <Text className='vip-text'>{userInfo.vipLevel}</Text>
              </View>
              <Text className='vip-expire'>有效期至 {userInfo.vipExpire}</Text>
            </View>
          </View>
          <View className='user-stats'>
            <View className='stat-item'>
              <Text className='stat-num'>128</Text>
              <Text className='stat-label'>观看时长</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-num'>56</Text>
              <Text className='stat-label'>收藏</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-num'>12</Text>
              <Text className='stat-label'>追剧</Text>
            </View>
          </View>
        </View>

        {/* 会员权益卡片 */}
        <View className='vip-card'>
          <View className='vip-header'>
            <Text className='vip-title'>尊享会员特权</Text>
            <View className='vip-action'>
              <Text className='action-text'>立即开通</Text>
              <Text className='action-arrow'>›</Text>
            </View>
          </View>
          <View className='vip-benefits'>
            <View className='benefit-item'>
              <Text className='benefit-icon'>🎬</Text>
              <Text className='benefit-text'>去广告</Text>
            </View>
            <View className='benefit-item'>
              <Text className='benefit-icon'>⬇️</Text>
              <Text className='benefit-text'>高速下载</Text>
            </View>
            <View className='benefit-item'>
              <Text className='benefit-icon'>🎁</Text>
              <Text className='benefit-text'>专属内容</Text>
            </View>
            <View className='benefit-item'>
              <Text className='benefit-icon'>💎</Text>
              <Text className='benefit-text'>4K画质</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className='menu-section'>
          {menuList.map(item => (
            <View key={item.id} className='menu-item'>
              <View className='menu-icon' style={{ backgroundColor: item.color }}>
                <Text className='icon-text'>{item.icon}</Text>
              </View>
              <View className='menu-content'>
                <Text className='menu-title'>{item.title}</Text>
                <Text className='menu-subtitle'>{item.subtitle}</Text>
              </View>
              <Text className='menu-arrow'>›</Text>
            </View>
          ))}
        </View>

        {/* 继续观看 */}
        <View className='history-section'>
          <View className='section-header'>
            <Text className='section-title'>📺 继续观看</Text>
            <View className='section-more'>
              <Text className='more-text'>查看全部</Text>
              <Text className='more-arrow'>›</Text>
            </View>
          </View>
          <ScrollView scrollX enableFlex className='history-scroll'>
            {watchHistory.map(item => (
              <View key={item.id} className='history-item'>
                <View className='history-poster-wrap'>
                  <Image src={item.poster} className='history-poster' mode='aspectFill' />
                  <View className='progress-bar'>
                    <View className='progress-fill' style={{ width: `${item.progress}%` }} />
                  </View>
                  <View className='episode-tag'>{item.episode}</View>
                </View>
                <Text className='history-title' numberOfLines={1}>{item.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 快捷功能 */}
        <View className='quick-section'>
          {quickActions.map(item => (
            <View key={item.id} className='quick-item' style={{ backgroundColor: item.bgColor }}>
              <Text className='quick-icon'>{item.icon}</Text>
              <Text className='quick-text'>{item.title}</Text>
            </View>
          ))}
        </View>

        {/* 底部间距 */}
        <View className='bottom-gap' />
      </ScrollView>
    )
  }
}
