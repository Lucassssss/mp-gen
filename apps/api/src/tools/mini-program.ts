import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), '..', '..', 'projects');

let currentSessionId: string | null = null;

export function setToolSessionId(sessionId: string) {
  currentSessionId = sessionId;
}

export function getToolSessionId(): string | null {
  return currentSessionId;
}

export function clearToolSessionId() {
  currentSessionId = null;
}

async function ensureProjectsDir() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
  } catch {}
}

const PageConfigSchema = z.object({
  name: z.string().describe('页面路径，如 "pages/index/index"'),
  title: z.string().describe('页面标题'),
  description: z.string().optional().describe('页面功能描述'),
});

const TaroInitSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  name: z.string().describe('项目名称'),
  description: z.string().optional().describe('项目描述'),
  pages: z.array(PageConfigSchema).describe('页面配置列表'),
  config: z.object({
    window: z.object({
      navigationBarTitleText: z.string().optional(),
      navigationBarBackgroundColor: z.string().optional(),
      backgroundColor: z.string().optional(),
    }).optional(),
    tabBar: z.object({
      color: z.string(),
      selectedColor: z.string(),
      backgroundColor: z.string(),
      list: z.array(z.object({
        pagePath: z.string(),
        text: z.string(),
        iconPath: z.string().optional(),
        selectedIconPath: z.string().optional(),
      })),
    }).optional(),
  }).optional().describe('项目配置'),
});

function generateBaseTaroProject(data: z.infer<typeof TaroInitSchema>) {
  const files: Array<{ path: string; content: string }> = [];
  const projectName = data.sessionId || 'default';

  files.push({
    path: `${projectName}/package.json`,
    content: JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      description: data.description || 'Taro Mini Program',
      scripts: {
        dev: 'npm run dev:h5',
        build: 'npm run build:h5',
        'dev:h5': 'taro dev --type h5',
        'build:h5': 'taro build --type h5',
      },
      dependencies: {
        '@tarojs/components': '^3.6.0',
        '@tarojs/plugin-framework-react': '^3.6.0',
        '@tarojs/plugin-platform-weapp': '^3.6.0',
        '@tarojs/react': '^3.6.0',
        '@tarojs/runtime': '^3.6.0',
        '@tarojs/taro': '^3.6.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@babel/core': '^7.23.0',
        '@tarojs/cli': '^3.6.0',
        '@tarojs/webpack5-runner': '^3.6.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'babel-preset-taro': '^3.6.0',
        'typescript': '^5.0.0',
        'webpack': '^5.88.0',
      },
    }, null, 2),
  });

  files.push({
    path: `${projectName}/tsconfig.json`,
    content: JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
      },
      include: ['src/**/*'],
    }, null, 2),
  });

  const pages = data.pages.map(p => `'${p.name}'`).join(',\n  ');
  
  files.push({
    path: `${projectName}/config/index.ts`,
    content: `import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: '${projectName}',
  date: '${new Date().toISOString().split('T')[0]}',
  designWidth: 375,
  deviceRatio: { 375: 2, 750: 1 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-framework-react'],
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    router: { mode: 'hash', customRoutes: {} },
    devServer: { port: 10086 },
  },
  mini: {},
});
`,
  });

  const windowConfig = data.config?.window || {
    navigationBarTitleText: data.name,
    navigationBarBackgroundColor: '#ffffff',
    backgroundColor: '#f5f5f5',
  };

  let appConfig = `export default defineAppConfig({
  pages: [
  ${pages}
  ],
  window: ${JSON.stringify(windowConfig, null, 4).replace(/\n/g, '\n  ')}
`;

  if (data.config?.tabBar) {
    appConfig += `,
  tabBar: ${JSON.stringify(data.config.tabBar, null, 4).replace(/\n/g, '\n  ')}`;
  }

  appConfig += `
});
`;

  files.push({
    path: `${projectName}/src/app.config.ts`,
    content: appConfig,
  });

  files.push({
    path: `${projectName}/src/app.tsx`,
    content: `import { Component, PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import './app.scss';

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.');
  });
  return children;
}

export default App;
`,
  });

  files.push({
    path: `${projectName}/src/app.scss`,
    content: `page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif;
}
`,
  });

  for (const page of data.pages) {
    const fullPath = page.name;
    const pageName = fullPath.split('/').pop() || 'index';
    const dirs = fullPath.split('/').slice(0, -1).join('/');

    files.push({
      path: `${projectName}/src/${dirs}/${pageName}/index.tsx`,
      content: defaultPageTemplate(page.title, page.name),
    });

    files.push({
      path: `${projectName}/src/${dirs}/${pageName}/index.scss`,
      content: defaultPageStyle(page.title),
    });
  }

  return { files, projectName };
}

function defaultPageTemplate(title: string, pagePath: string): string {
  const pageName = pagePath.split('/').pop() || 'index';
  const componentName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return `import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState } from 'react';
import './index.scss';

export default function ${componentName}Page() {
  return (
    <View className="page">
      <View className="header">
        <Text className="title">${title}</Text>
      </View>
      <ScrollView className="content" scrollY>
        <View className="placeholder">
          <Text>正在开发中...</Text>
        </View>
      </ScrollView>
    </View>
  );
}
`;
}

function defaultPageStyle(title: string): string {
  return `.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  padding: 40px 20px 60px;
  text-align: center;
}

.title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.content {
  padding: 20px;
  margin-top: -20px;
}

.placeholder {
  background: #fff;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
`;
}

export const initTaroProjectTool = tool({
  description: '初始化一个 Taro 基础小程序项目。根据提供的页面配置自动生成项目结构、页面路由和基础代码。',
  inputSchema: TaroInitSchema,
  execute: async (data) => {
    const sessionId = data.sessionId;
    console.log('[initTaroProject] Starting...', { sessionId, name: data.name, pages: data.pages?.length });
    
    await ensureProjectsDir();
    const projectPath = path.join(PROJECTS_DIR, sessionId);
    console.log('[initTaroProject] Project path:', projectPath);
    
    const templatePath = path.join(process.cwd(), '..', '..', 'lib', 'app-react');
    console.log('[initTaroProject] Template path:', templatePath);
    
    await fs.cp(templatePath, projectPath, { recursive: true });
    console.log('[initTaroProject] Template copied');

    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.name = sessionId;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('[initTaroProject] package.json updated');

    return {
      type: 'artifact',
      artifactType: 'taro-project',
      id: sessionId || 'default',
      title: data.name,
      projectName: sessionId,
      files: [],
      status: 'complete',
      progress: 1,
      metadata: {
        pageCount: data.pages?.length || 1,
        pages: data.pages?.map(p => p.name),
        platforms: ['h5', 'weapp'],
        action: 'init',
        projectPath,
      },
    };
  },
});

const PageEditSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  projectId: z.string().describe('项目ID'),
  pagePath: z.string().describe('页面路径，如 "pages/index/index"'),
  code: z.string().describe('页面的完整 TSX 代码'),
  style: z.string().optional().describe('页面样式 SCSS 代码'),
});

export const editPageCodeTool = tool({
  description: '编辑指定页面的代码。用于修改页面逻辑、组件和样式。只更新指定页面的代码，不影响其他页面。',
  inputSchema: PageEditSchema,
  execute: async ({ projectId, pagePath, code, style }) => {
    let normalizedPath = pagePath;
    if (pagePath.endsWith('/index')) {
      normalizedPath = pagePath.slice(0, -6);
    }
    const pageName = normalizedPath.split('/').pop() || 'index';
    
    const files: Array<{ path: string; content: string }> = [];
    
    await ensureProjectsDir();
    const projectPath = path.join(PROJECTS_DIR, projectId);
    
    const tsxPath = path.join(projectPath, 'src', normalizedPath, 'index.tsx');
    await fs.mkdir(path.dirname(tsxPath), { recursive: true });
    await fs.writeFile(tsxPath, code, 'utf-8');
    files.push({
      path: `src/${normalizedPath}/index.tsx`,
      content: code,
    });

    if (style) {
      const scssPath = path.join(projectPath, 'src', normalizedPath, 'index.scss');
      await fs.writeFile(scssPath, style, 'utf-8');
      files.push({
        path: `src/${normalizedPath}/index.scss`,
        content: style,
      });
    }

    return {
      type: 'artifact',
      artifactType: 'taro-edit',
      id: `${projectId}-${pagePath}`,
      title: `编辑页面: ${pagePath}`,
      projectId,
      pagePath,
      files,
      status: 'complete',
      progress: 1,
      metadata: {
        action: 'edit',
        pageName,
        projectPath,
      },
    };
  },
});

export const miniProgramArtifactTools = {
  initTaroProject: initTaroProjectTool,
  editPageCode: editPageCodeTool,
};
