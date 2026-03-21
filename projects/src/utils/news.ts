// 新闻应用工具函数和模拟数据

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  publishTime: string;
  imageUrl: string;
  readCount: number;
  isHot?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 新闻分类
export const categories: Category[] = [
  { id: 'tech', name: '科技', icon: '💻', color: '#1890ff' },
  { id: 'finance', name: '财经', icon: '💰', color: '#52c41a' },
  { id: 'sports', name: '体育', icon: '⚽', color: '#fa8c16' },
  { id: 'entertainment', name: '娱乐', icon: '🎬', color: '#eb2f96' },
  { id: 'social', name: '社会', icon: '🌍', color: '#722ed1' },
  { id: 'international', name: '国际', icon: '🌐', color: '#13c2c2' },
  { id: 'military', name: '军事', icon: '✈️', color: '#fa541c' },
  { id: 'culture', name: '文化', icon: '📚', color: '#fadb14' },
];

// 模拟新闻数据
export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: '人工智能技术取得重大突破，开启智能新时代',
    summary: '最新研究表明，深度学习算法在多个领域实现了超越人类的表现，这一突破将深刻改变我们的生活方式。',
    content: `人工智能技术在近年来取得了飞速发展，尤其是在大语言模型和生成式AI领域。最新研究表明，深度学习算法在多个领域实现了超越人类的表现。

专家表示，这一突破将深刻改变我们的生活方式。从医疗诊断到金融分析，从自动驾驶到智能制造，AI技术正在渗透到各行各业。

然而，技术进步也带来了新的挑战。如何确保AI系统的安全性和可控性？如何处理AI带来的就业结构变化？这些都是我们需要认真思考的问题。

不过，业界普遍认为，只要合理利用，AI技术必将为人类社会带来巨大的福祉。`,
    category: 'tech',
    author: '科技日报',
    publishTime: '2小时前',
    imageUrl: 'https://picsum.photos/seed/tech1/400/200',
    readCount: 12580,
    isHot: true,
  },
  {
    id: '2',
    title: '全球金融市场震荡，投资者需保持理性',
    summary: '受多重因素影响，全球金融市场近期出现较大波动。专家建议投资者应该保持理性，做好风险控制。',
    content: `全球金融市场近期出现较大波动，多个主要股指出现明显下跌。这一现象引起了投资者的广泛关注。

分析师指出，本次市场波动主要受以下因素影响：首先，全球经济增长放缓的压力依然存在；其次，地缘政治风险有所上升；再者，通胀预期的不确定性增加。

面对市场波动，专家建议投资者应该保持理性，做好风险控制。不要盲目追涨杀跌，也不要把所有鸡蛋放在一个篮子里。

对于长期投资者来说，市场调整往往是布局的良机。但前提是要有足够的风险承受能力和投资耐心。`,
    category: 'finance',
    author: '财经观察',
    publishTime: '4小时前',
    imageUrl: 'https://picsum.photos/seed/finance1/400/200',
    readCount: 8920,
    isHot: true,
  },
  {
    id: '3',
    title: '世界杯预选赛精彩回顾：各支球队表现亮眼',
    summary: '世界杯预选赛进入关键阶段，多支球队表现出色，为球迷们奉献了精彩的比赛。',
    content: `世界杯预选赛正在激烈进行中，各支球队为了晋级名额拼尽全力。

在最近一轮比赛中，多支球队表现出色。传统强队依然保持着稳定的发挥，而一些黑马球队也给人们带来了惊喜。

球员们的精彩表现赢得了球迷们的喝彩。无论是精准的传球，还是精彩的进球，都让人印象深刻。

随着预选赛进入尾声，各支球队的竞争也愈发激烈。让我们期待接下来的比赛能够带来更多精彩。`,
    category: 'sports',
    author: '体育周刊',
    publishTime: '5小时前',
    imageUrl: 'https://picsum.photos/seed/sports1/400/200',
    readCount: 6540,
    isHot: false,
  },
  {
    id: '4',
    title: '新电影上映获好评，口碑票房双丰收',
    summary: '近期上映的新电影获得了观众的一致好评，票房成绩也相当亮眼。',
    content: `近期上映的一部新电影获得了观众的一致好评，票房成绩也相当亮眼。

这部电影在制作上下了很大功夫，无论是剧情设置还是视觉效果都给观众留下了深刻印象。

主演的表现也可圈可点，将角色塑造得十分立体。配乐和摄影同样出色，为影片增色不少。

目前，该电影的排片率和上座率都保持在较高水平，预计最终票房将突破预期目标。`,
    category: 'entertainment',
    author: '娱乐前线',
    publishTime: '6小时前',
    imageUrl: 'https://picsum.photos/seed/ent1/400/200',
    readCount: 4320,
    isHot: false,
  },
  {
    id: '5',
    title: '城市交通改造提升市民出行体验',
    summary: '为改善城市交通状况，相关部門实施了一系列改造措施，取得了明显成效。',
    content: `为改善城市交通状况，相关部門实施了一系列改造措施，取得了明显成效。

主要措施包括：优化公交线路布局，增加地铁运力，改善自行车道设施等。这些举措大大提升了市民的出行体验。

市民们表示，现在出行比以前方便多了。特别是在早晚高峰时段，交通拥堵情况有所缓解。

相关部门表示，未来还将继续加大投入，不断完善城市交通系统，让市民享受到更便捷的出行服务。`,
    category: 'social',
    author: '民生关注',
    publishTime: '8小时前',
    imageUrl: 'https://picsum.photos/seed/social1/400/200',
    readCount: 3210,
    isHot: false,
  },
  {
    id: '6',
    title: '国际会议召开，各国代表共商发展大计',
    summary: '为期三天的国际会议近日闭幕，与会各国代表就多个议题达成了重要共识。',
    content: `为期三天的国际会议近日闭幕，与会各国代表就多个议题达成了重要共识。

会议期间，各国代表就经济合作、气候变化、可持续发展等议题进行了深入讨论。

作为本次会议的主办方，中方提出了多项建设性倡议，得到了与会各方的积极响应。

会议的成功举办为各国加强合作、共同应对全球性挑战奠定了基础。`,
    category: 'international',
    author: '国际观察',
    publishTime: '10小时前',
    imageUrl: 'https://picsum.photos/seed/intl1/400/200',
    readCount: 2870,
    isHot: false,
  },
  {
    id: '7',
    title: '军事演习展示国防实力，提升作战能力',
    summary: '近日举行的军事演习展示了军队现代化建设成果，提升了部队实战能力。',
    content: `近日举行的军事演习展示了军队现代化建设成果，提升了部队实战能力。

演习中，各型先进装备悉数亮相，展现了强大的综合作战能力。

参演官兵精神抖擞，操作熟练，充分展示了平时训练的成效。

演习的成功举行，不仅检验了装备性能，也锻炼了部队的实际作战能力。`,
    category: 'military',
    author: '军事要闻',
    publishTime: '12小时前',
    imageUrl: 'https://picsum.photos/seed/mil1/400/200',
    readCount: 4100,
    isHot: false,
  },
  {
    id: '8',
    title: '传统文化展览吸引众多参观者，展现中华文明魅力',
    summary: '正在举办的传统文化展览吸引了大量参观者，让人们近距离感受中华文明的博大精深。',
    content: `正在举办的传统文化展览吸引了大量参观者，让人们近距离感受中华文明的博大精深。

展览涵盖了书法、绘画、陶瓷、服饰等多个领域，展示了中华优秀传统文化的独特魅力。

许多参观者表示，通过这次展览，对传统文化有了更深入的了解，也增强了对中华文化的自豪感。

展览将持续一个月，期间还将举办多场传统文化体验活动，欢迎广大市民前来参观。`,
    category: 'culture',
    author: '文化频道',
    publishTime: '14小时前',
    imageUrl: 'https://picsum.photos/seed/culture1/400/200',
    readCount: 2350,
    isHot: false,
  },
  {
    id: '9',
    title: '5G技术全面商用，开启万物互联新时代',
    summary: '随着5G网络覆盖范围的扩大，越来越多的应用场景正在变为现实。',
    content: `随着5G网络覆盖范围的扩大，越来越多的应用场景正在变为现实。

5G技术的高速率、低时延、大连接特性，为各行各业的数字化转型提供了有力支撑。

在工业、医疗、教育、交通等领域，5G应用正在蓬勃发展，展现出巨大的发展潜力。

专家预测，5G技术的普及将催生一系列新业态、新模式，推动经济社会高质量发展。`,
    category: 'tech',
    author: '科技前沿',
    publishTime: '16小时前',
    imageUrl: 'https://picsum.photos/seed/tech2/400/200',
    readCount: 5680,
    isHot: true,
  },
  {
    id: '10',
    title: '新能源汽车销量持续增长，市场前景广阔',
    summary: '新能源汽车市场保持高速增长态势，各大车企纷纷加大研发投入。',
    content: `新能源汽车市场保持高速增长态势，各大车企纷纷加大研发投入。

数据显示，新能源汽车的渗透率不断提升，消费者对新能源汽车的接受度也越来越高。

技术创新是推动新能源汽车发展的关键。电池技术、智能驾驶等方面的突破，为行业发展注入了新动能。

展望未来，新能源汽车市场前景广阔，将在实现碳中和目标中发挥重要作用。`,
    category: 'tech',
    author: '汽车世界',
    publishTime: '18小时前',
    imageUrl: 'https://picsum.photos/seed/tech3/400/200',
    readCount: 3890,
    isHot: false,
  },
];

// 根据分类获取新闻
export function getNewsByCategory(categoryId: string): NewsItem[] {
  if (categoryId === 'all') {
    return mockNews;
  }
  return mockNews.filter(item => item.category === categoryId);
}

// 根据ID获取新闻详情
export function getNewsById(id: string): NewsItem | undefined {
  return mockNews.find(item => item.id === id);
}

// 格式化阅读量
export function formatReadCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count.toString();
}

// 获取分类名称
export function getCategoryName(categoryId: string): string {
  const category = categories.find(item => item.id === categoryId);
  return category ? category.name : '未知';
}

// 获取分类颜色
export function getCategoryColor(categoryId: string): string {
  const category = categories.find(item => item.id === categoryId);
  return category ? category.color : '#999999';
}
