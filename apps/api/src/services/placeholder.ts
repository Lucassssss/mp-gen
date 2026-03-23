import { Router, Request, Response } from 'express';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'placeholder-images');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

// 确保缓存目录存在
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// 生成缓存键
function generateCacheKey(params: Record<string, any>): string {
  const str = JSON.stringify(params);
  return crypto.createHash('md5').update(str).digest('hex');
}

// 获取缓存路径
function getCachePath(key: string, format: string): string {
  return path.join(CACHE_DIR, `${key}.${format}`);
}

// 检查缓存
async function getFromCache(key: string, format: string): Promise<Buffer | null> {
  try {
    const cachePath = getCachePath(key, format);
    if (existsSync(cachePath)) {
      const stats = await fs.stat(cachePath);
      const age = Date.now() - stats.mtimeMs;
      if (age < CACHE_TTL) {
        return await fs.readFile(cachePath);
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

// 保存到缓存
async function saveToCache(key: string, format: string, data: Buffer): Promise<void> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(key, format);
    await fs.writeFile(cachePath, data);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// 字体配置 - 优先使用系统中文字体
const FONT_FAMILIES = [
  'PingFang SC',    // macOS 中文
  'Hiragino Sans GB',  // macOS 备选
  'Microsoft Yahei',   // Windows
  'WenQuanYi Micro Hei',  // Linux
  'sans-serif'      // 通用备选
];

function getFontFamily(): string {
  return FONT_FAMILIES.map(font => `"${font}"`).join(', ');
}

// 颜色工具函数
function isValidColor(color: string): boolean {
  const hex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgb = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgba = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
  return hex.test(color) || rgb.test(color) || rgba.test(color);
}

function normalizeColor(color: string): string {
  if (color.startsWith('rgb')) return color;
  if (!color.startsWith('#')) return `#${color}`;
  return color;
}

// 解析渐变参数
function parseGradient(gradient: string): { type: string; colors: string[] } {
  // 支持 linear-gradient(90deg, #ff0000, #0000ff)
  const linearMatch = gradient.match(/linear-gradient\((\d+deg)?,?\s*([^)]+)\)/);
  if (linearMatch) {
    const colors = linearMatch[2].split(',').map(c => c.trim());
    return { type: 'linear', colors };
  }
  
  // 支持 radial-gradient(circle, #ff0000, #0000ff)
  const radialMatch = gradient.match(/radial-gradient\([^,]+,?\s*([^)]+)\)/);
  if (radialMatch) {
    const colors = radialMatch[1].split(',').map(c => c.trim());
    return { type: 'radial', colors };
  }
  
  return { type: 'solid', colors: [gradient] };
}

// 生成纯色图片
export function generateSolidColorImage(
  width: number, 
  height: number, 
  color: string,
  text?: string,
  textColor?: string
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 绘制背景
  ctx.fillStyle = normalizeColor(color);
  ctx.fillRect(0, 0, width, height);
  
  // 绘制文本（如果有）
  if (text) {
    const fontSize = Math.min(width, height) / 8;
    ctx.font = `${fontSize}px ${getFontFamily()}`;
    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toBuffer('image/png');
}

// 生成渐变图片
export function generateGradientImage(
  width: number,
  height: number,
  gradient: string,
  text?: string,
  textColor?: string
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const { type, colors } = parseGradient(gradient);
  
  if (type === 'linear') {
    const gradientObj = ctx.createLinearGradient(0, 0, width, height);
    colors.forEach((color, index) => {
      gradientObj.addColorStop(index / (colors.length - 1), normalizeColor(color));
    });
    ctx.fillStyle = gradientObj;
  } else if (type === 'radial') {
    const gradientObj = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    colors.forEach((color, index) => {
      gradientObj.addColorStop(index / (colors.length - 1), normalizeColor(color));
    });
    ctx.fillStyle = gradientObj;
  } else {
    ctx.fillStyle = normalizeColor(colors[0]);
  }
  
  ctx.fillRect(0, 0, width, height);
  
  // 绘制文本（如果有）
  if (text) {
    const fontSize = Math.min(width, height) / 8;
    ctx.font = `${fontSize}px ${getFontFamily()}`;
    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toBuffer('image/png');
}

// 生成头像图片（圆形）
export function generateAvatarImage(
  size: number,
  color: string,
  initial?: string
): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 绘制圆形背景
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = normalizeColor(color);
  ctx.fill();
  
  // 绘制首字母（如果有）
  if (initial) {
    const fontSize = size / 2;
    ctx.font = `bold ${fontSize}px ${getFontFamily()}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial.charAt(0).toUpperCase(), size / 2, size / 2);
  }
  
  return canvas.toBuffer('image/png');
}

// 生成商品图片（带边框和商品图标）
function generateProductImage(
  width: number,
  height: number,
  bgColor: string,
  text?: string
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 绘制背景
  ctx.fillStyle = normalizeColor(bgColor);
  ctx.fillRect(0, 0, width, height);
  
  // 绘制边框
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, width - 4, height - 4);
  
  // 绘制商品图标（简单的购物车图标）
  ctx.beginPath();
  const iconSize = Math.min(width, height) / 4;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 购物车形状
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  
  // 车轮
  ctx.arc(centerX - iconSize / 3, centerY + iconSize / 2, iconSize / 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.arc(centerX + iconSize / 3, centerY + iconSize / 2, iconSize / 6, 0, Math.PI * 2);
  ctx.stroke();
  
  // 车身
  ctx.beginPath();
  ctx.moveTo(centerX - iconSize / 2, centerY - iconSize / 2);
  ctx.lineTo(centerX + iconSize / 2, centerY - iconSize / 2);
  ctx.lineTo(centerX + iconSize / 3, centerY + iconSize / 4);
  ctx.lineTo(centerX - iconSize / 3, centerY + iconSize / 4);
  ctx.closePath();
  ctx.stroke();
  
  // 绘制文本
  if (text) {
    const fontSize = Math.min(width, height) / 10;
    ctx.font = `${fontSize}px ${getFontFamily()}`;
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, width / 2, height - 10);
  }
  
  return canvas.toBuffer('image/png');
}

// 生成Banner图片（带渐变和文字）
function generateBannerImage(
  width: number,
  height: number,
  colors: string[],
  text?: string
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 创建渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const colorArray = colors.length > 0 ? colors : ['#ff6b6b', '#ff4757'];
  colorArray.forEach((color, index) => {
    gradient.addColorStop(index / (colorArray.length - 1), normalizeColor(color));
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 绘制文字
  if (text) {
    const fontSize = Math.min(width, height) / 6;
    ctx.font = `bold ${fontSize}px ${getFontFamily()}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toBuffer('image/png');
}

export const placeholderRouter = (() => {
  const router = Router();

  // 基础图片生成
  router.get('/:width/:height', async (req: Request, res: Response) => {
    try {
      await ensureCacheDir();
      
      const width = parseInt(req.params.width) || 200;
      const height = parseInt(req.params.height) || 200;
      const bg = req.query.bg as string || '#cccccc';
      const text = req.query.text as string;
      const textColor = req.query.textColor as string || '#ffffff';
      const format = (req.query.format as string) || 'png';
      const gradient = req.query.gradient as string;
      
      const cacheKey = generateCacheKey({ width, height, bg, text, textColor, gradient });
      
      // 检查缓存
      const cached = await getFromCache(cacheKey, format);
      if (cached) {
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
      }
      
      let imageData: Buffer;
      
      if (gradient) {
        imageData = generateGradientImage(width, height, gradient, text, textColor);
      } else {
        imageData = generateSolidColorImage(width, height, bg, text, textColor);
      }
      
      // 保存到缓存
      await saveToCache(cacheKey, format, imageData);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'MISS');
      res.send(imageData);
      
    } catch (error) {
      console.error('Placeholder generation error:', error);
      res.status(500).json({ error: 'Failed to generate placeholder image' });
    }
  });

  // 头像图片
  router.get('/avatar/:size', async (req: Request, res: Response) => {
    try {
      await ensureCacheDir();
      
      const size = parseInt(req.params.size) || 100;
      const bg = req.query.bg as string || '#ff6b6b';
      const initial = req.query.initial as string;
      const format = (req.query.format as string) || 'png';
      
      const cacheKey = generateCacheKey({ type: 'avatar', size, bg, initial });
      
      // 检查缓存
      const cached = await getFromCache(cacheKey, format);
      if (cached) {
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
      }
      
      const imageData = generateAvatarImage(size, bg, initial);
      
      // 保存到缓存
      await saveToCache(cacheKey, format, imageData);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'MISS');
      res.send(imageData);
      
    } catch (error) {
      console.error('Avatar generation error:', error);
      res.status(500).json({ error: 'Failed to generate avatar image' });
    }
  });

  // 商品图片
  router.get('/product/:width/:height', async (req: Request, res: Response) => {
    try {
      await ensureCacheDir();
      
      const width = parseInt(req.params.width) || 200;
      const height = parseInt(req.params.height) || 200;
      const bg = req.query.bg as string || '#f5f5f5';
      const text = req.query.text as string || '商品';
      const format = (req.query.format as string) || 'png';
      
      const cacheKey = generateCacheKey({ type: 'product', width, height, bg, text });
      
      // 检查缓存
      const cached = await getFromCache(cacheKey, format);
      if (cached) {
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
      }
      
      const imageData = generateProductImage(width, height, bg, text);
      
      // 保存到缓存
      await saveToCache(cacheKey, format, imageData);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'MISS');
      res.send(imageData);
      
    } catch (error) {
      console.error('Product image generation error:', error);
      res.status(500).json({ error: 'Failed to generate product image' });
    }
  });

  // Banner图片
  router.get('/banner/:width/:height', async (req: Request, res: Response) => {
    try {
      await ensureCacheDir();
      
      const width = parseInt(req.params.width) || 750;
      const height = parseInt(req.params.height) || 375;
      const colorsParam = req.query.colors as string || '#ff6b6b,#ff4757';
      const colors = colorsParam.split(',');
      const text = req.query.text as string || 'Banner';
      const format = (req.query.format as string) || 'png';
      
      const cacheKey = generateCacheKey({ type: 'banner', width, height, colors, text });
      
      // 检查缓存
      const cached = await getFromCache(cacheKey, format);
      if (cached) {
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
      }
      
      const imageData = generateBannerImage(width, height, colors, text);
      
      // 保存到缓存
      await saveToCache(cacheKey, format, imageData);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'MISS');
      res.send(imageData);
      
    } catch (error) {
      console.error('Banner image generation error:', error);
      res.status(500).json({ error: 'Failed to generate banner image' });
    }
  });

  // 渐变图片快捷方式
  router.get('/gradient/:width/:height', async (req: Request, res: Response) => {
    try {
      await ensureCacheDir();
      
      const width = parseInt(req.params.width) || 200;
      const height = parseInt(req.params.height) || 200;
      const colorsParam = req.query.colors as string || '#667eea,#764ba2';
      const colors = colorsParam.split(',');
      const text = req.query.text as string;
      const textColor = req.query.textColor as string || '#ffffff';
      const format = (req.query.format as string) || 'png';
      
      const cacheKey = generateCacheKey({ type: 'gradient', width, height, colors, text, textColor });
      
      // 检查缓存
      const cached = await getFromCache(cacheKey, format);
      if (cached) {
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached);
      }
      
      const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
      const imageData = generateGradientImage(width, height, gradient, text, textColor);
      
      // 保存到缓存
      await saveToCache(cacheKey, format, imageData);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'MISS');
      res.send(imageData);
      
    } catch (error) {
      console.error('Gradient image generation error:', error);
      res.status(500).json({ error: 'Failed to generate gradient image' });
    }
  });

  // 清除缓存
  router.delete('/cache', async (req: Request, res: Response) => {
    try {
      if (existsSync(CACHE_DIR)) {
        await fs.rm(CACHE_DIR, { recursive: true, force: true });
      }
      res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // 获取服务信息
  router.get('/info', (req: Request, res: Response) => {
    res.json({
      service: 'Placeholder Image Service',
      version: '1.0.0',
      endpoints: {
        basic: 'GET /api/placeholder/:width/:height?bg=color&text=text&textColor=color',
        avatar: 'GET /api/placeholder/avatar/:size?bg=color&initial=char',
        product: 'GET /api/placeholder/product/:width/:height?bg=color&text=text',
        banner: 'GET /api/placeholder/banner/:width/:height?colors=color1,color2&text=text',
        gradient: 'GET /api/placeholder/gradient/:width/:height?colors=color1,color2&text=text',
      },
      parameters: {
        width: 'Image width in pixels',
        height: 'Image height in pixels',
        size: 'Image size (for square images)',
        bg: 'Background color (hex, rgb, rgba)',
        text: 'Text to display on image',
        textColor: 'Color of the text',
        colors: 'Comma-separated colors for gradient',
        gradient: 'CSS gradient string',
        format: 'Output format (png, jpg)',
        initial: 'Initial letter for avatar',
      },
      examples: [
        '/api/placeholder/200/200?bg=%23ff0000&text=Hello',
        '/api/placeholder/avatar/100?bg=%23ff6b6b&initial=J',
        '/api/placeholder/product/300/300?text=商品',
        '/api/placeholder/banner/750/375?colors=%23ff6b6b,%23ff4757&text=促销',
        '/api/placeholder/gradient/400/200?colors=%23667eea,%23764ba2&text=渐变',
      ],
    });
  });

  return router;
})();

export function cleanupPlaceholderCache() {
  // 可以在这里添加定期清理缓存的逻辑
  console.log('Placeholder cache cleanup called');
}

export const PlaceholderService = {};
