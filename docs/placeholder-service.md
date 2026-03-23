# 图片占位服务 (Placeholder Image Service)

## 概述

图片占位服务是一个为小程序生成过程中提供图片素材的API服务。支持生成纯色/渐变背景图片和多种预设类型图片（头像、商品图、Banner等）。

## 快速开始

服务已集成到API服务器中，通过以下方式启动：

```bash
# 开发模式
bun run dev

# 生产模式
bun run start
```

服务启动后，访问 `http://localhost:3001/api/placeholder/info` 查看服务信息。

## API 接口

### 1. 基础图片生成

**端点**: `GET /api/placeholder/:width/:height`

**参数**:
- `width`: 图片宽度（像素）
- `height`: 图片高度（像素）
- `bg`: 背景颜色，默认 `#cccccc`
- `text`: 图片上显示的文字
- `textColor`: 文字颜色，默认 `#ffffff`
- `gradient`: CSS渐变字符串（可选）
- `format`: 图片格式，默认 `png`

**示例**:
```bash
# 200x200红色背景图片
http://localhost:3001/api/placeholder/200/200?bg=%23ff0000

# 200x200红色背景带白色文字
http://localhost:3001/api/placeholder/200/200?bg=%23ff0000&text=Hello&textColor=%23ffffff

# 使用渐变背景
http://localhost:3001/api/placeholder/400/200?gradient=linear-gradient(90deg,%23ff6b6b,%23ff4757)&text=促销
```

### 2. 头像图片

**端点**: `GET /api/placeholder/avatar/:size`

**参数**:
- `size`: 图片尺寸（正方形）
- `bg`: 背景颜色，默认 `#ff6b6b`
- `initial`: 显示的首字母
- `format`: 图片格式，默认 `png`

**示例**:
```bash
# 100x100红色圆形头像
http://localhost:3001/api/placeholder/avatar/100?bg=%23ff6b6b

# 带首字母的头像
http://localhost:3001/api/placeholder/avatar/120?bg=%23ff6b6b&initial=J
```

### 3. 商品图片

**端点**: `GET /api/placeholder/product/:width/:height`

**参数**:
- `width`: 图片宽度
- `height`: 图片高度
- `bg`: 背景颜色，默认 `#f5f5f5`
- `text`: 商品标签文字，默认 `商品`
- `format`: 图片格式，默认 `png`

**示例**:
```bash
# 200x200商品图片
http://localhost:3001/api/placeholder/product/200/200?text=服装

# 300x300商品图片
http://localhost:3001/api/placeholder/product/300/300?bg=%23ffffff&text=电子产品
```

### 4. Banner图片

**端点**: `GET /api/placeholder/banner/:width/:height`

**参数**:
- `width`: 图片宽度，默认 `750`
- `height`: 图片高度，默认 `375`
- `colors`: 逗号分隔的颜色值，默认 `#ff6b6b,#ff4757`
- `text`: Banner文字，默认 `Banner`
- `format`: 图片格式，默认 `png`

**示例**:
```bash
# 750x375渐变Banner
http://localhost:3001/api/placeholder/banner/750/375?colors=%23ff6b6b,%23ff4757&text=促销活动

# 自定义颜色Banner
http://localhost:3001/api/placeholder/banner/640/320?colors=%23667eea,%23764ba2&text=新品上市
```

### 5. 渐变图片快捷方式

**端点**: `GET /api/placeholder/gradient/:width/:height`

**参数**:
- `width`: 图片宽度
- `height`: 图片高度
- `colors`: 逗号分隔的颜色值，默认 `#667eea,#764ba2`
- `text`: 图片文字
- `textColor`: 文字颜色，默认 `#ffffff`
- `format`: 图片格式，默认 `png`

**示例**:
```bash
# 渐变背景图片
http://localhost:3001/api/placeholder/gradient/400/200?colors=%23667eea,%23764ba2&text=渐变背景
```

### 6. 缓存管理

**清除缓存**:
```bash
DELETE http://localhost:3001/api/placeholder/cache
```

**查看服务信息**:
```bash
GET http://localhost:3001/api/placeholder/info
```

## 在小程序项目中使用

### 1. 在Taro项目中使用

```typescript
// 在React组件中使用
import React from 'react';
import { Image } from '@tarojs/components';

const MyComponent = () => {
  const placeholderImage = 'http://localhost:3001/api/placeholder/200/200?bg=%23cccccc&text=占位图';
  
  return (
    <Image 
      src={placeholderImage}
      mode="aspectFill"
      style={{ width: '200px', height: '200px' }}
    />
  );
};
```

### 2. 在模拟数据中使用

```typescript
// 示例数据
const mockProducts = [
  {
    id: 1,
    name: '商品1',
    price: 99,
    image: 'http://localhost:3001/api/placeholder/product/200/200?text=商品1'
  },
  {
    id: 2,
    name: '商品2',
    price: 199,
    image: 'http://localhost:3001/api/placeholder/product/200/200?text=商品2'
  }
];

const mockBanners = [
  {
    id: 1,
    image: 'http://localhost:3001/api/placeholder/banner/750/375?text=促销活动1'
  },
  {
    id: 2,
    image: 'http://localhost:3001/api/placeholder/banner/750/375?text=促销活动2'
  }
];
```

### 3. 替换外部图片服务

将原有的外部占位图服务替换为本地服务：

```typescript
// 之前使用外部服务
const oldImage = 'https://picsum.photos/200/200?random=1';

// 替换为本地服务
const newImage = 'http://localhost:3001/api/placeholder/200/200?bg=%23cccccc&text=1';
```

## 颜色格式支持

服务支持以下颜色格式：

1. **十六进制颜色**: `#ff0000`, `#f00`
2. **RGB颜色**: `rgb(255, 0, 0)`
3. **RGBA颜色**: `rgba(255, 0, 0, 0.5)`

## 缓存机制

- 图片生成后会自动缓存到 `.cache/placeholder-images` 目录
- 缓存有效期为24小时
- 可通过 `DELETE /api/placeholder/cache` 清除缓存
- 响应头包含 `X-Cache: HIT/MISS` 标识

## 错误处理

所有错误都会返回JSON格式的错误信息：

```json
{
  "error": "错误描述"
}
```

## 开发说明

### 添加新预设类型

1. 在 `src/services/placeholder.ts` 中添加新的生成函数
2. 在 `placeholderRouter` 中添加新的路由端点
3. 更新 `info` 端点中的文档

### 自定义字体

如需使用自定义字体，可以修改 `GlobalFonts` 配置：

```typescript
import { GlobalFonts } from '@napi-rs/canvas';
import path from 'path';

GlobalFonts.registerFromPath(path.join(__dirname, '../fonts/custom.ttf'), 'CustomFont');
```

## 性能优化

1. 使用缓存减少重复生成
2. 支持流式响应（可扩展）
3. 可配置最大并发数
4. 支持图片压缩（通过参数控制质量）

## 部署建议

1. 生产环境建议使用CDN加速
2. 配置合适的缓存策略
3. 监控图片生成性能
4. 定期清理过期缓存
