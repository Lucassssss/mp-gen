import { app, BrowserWindow, shell, ipcMain } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import log from 'electron-log';

log.initialize();
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('Application starting...');

const isDev = !app.isPackaged;
const API_PORT = 26318;

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
let apiRunning = false;

// Config management
interface AppConfig {
  apiKeys: {
    deepseek?: string;
    deepseekBaseUrl?: string;
    minimax?: string;
    minimaxBaseUrl?: string;
    openrouter?: string;
    openrouterBaseUrl?: string;
  };
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
  settings: {
    defaultModel?: string;
    defaultMode?: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  apiKeys: {
    deepseekBaseUrl: 'https://api.deepseek.com',
    minimaxBaseUrl: 'https://api.minimaxi.com/anthropic/v1',
    openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  },
  settings: {
    defaultModel: 'deepseek/deepseek-chat',
    defaultMode: 'agent',
  },
};

let appConfig: AppConfig = DEFAULT_CONFIG;

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

async function loadConfig(): Promise<AppConfig> {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    appConfig = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    log.info('Config loaded from:', configPath);
    return appConfig;
  } catch (error) {
    log.info('Config file not found, using default config');
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config: AppConfig): Promise<void> {
  appConfig = config;
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  log.info('Config saved to:', configPath);
}

async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const updated = { ...appConfig, ...partial };
  if (partial.apiKeys) {
    updated.apiKeys = { ...appConfig.apiKeys, ...partial.apiKeys };
  }
  if (partial.smtp) {
    updated.smtp = { ...appConfig.smtp, ...partial.smtp };
  }
  if (partial.settings) {
    updated.settings = { ...appConfig.settings, ...partial.settings };
  }
  await saveConfig(updated);
  return updated;
}

function getConfigEnvVars(): Record<string, string> {
  const envVars: Record<string, string> = {};
  if (appConfig.apiKeys.deepseek) envVars.DEEPSEEK_API_KEY = appConfig.apiKeys.deepseek;
  if (appConfig.apiKeys.deepseekBaseUrl) envVars.DEEPSEEK_BASE_URL = appConfig.apiKeys.deepseekBaseUrl;
  if (appConfig.apiKeys.minimax) envVars.MINIMAX_API_KEY = appConfig.apiKeys.minimax;
  if (appConfig.apiKeys.minimaxBaseUrl) envVars.MINIMAX_API_BASE_URL = appConfig.apiKeys.minimaxBaseUrl;
  if (appConfig.apiKeys.openrouter) envVars.OPENROUTER_API_KEY = appConfig.apiKeys.openrouter;
  if (appConfig.apiKeys.openrouterBaseUrl) envVars.OPENROUTER_API_BASE_URL = appConfig.apiKeys.openrouterBaseUrl;
  if (appConfig.smtp) {
    if (appConfig.smtp.host) envVars.SMTP_HOST = appConfig.smtp.host;
    if (appConfig.smtp.port) envVars.SMTP_PORT = String(appConfig.smtp.port);
    if (appConfig.smtp.user) envVars.SMTP_USER = appConfig.smtp.user;
    if (appConfig.smtp.pass) envVars.SMTP_PASS = appConfig.smtp.pass;
    if (appConfig.smtp.from) envVars.SMTP_FROM = appConfig.smtp.from;
  }
  return envVars;
}

function isConfigured(): boolean {
  return !!(appConfig.apiKeys.deepseek || appConfig.apiKeys.minimax || appConfig.apiKeys.openrouter);
}

// IPC handlers for config
ipcMain.handle('config:get', () => appConfig);
ipcMain.handle('config:save', (_, config: AppConfig) => saveConfig(config));
ipcMain.handle('config:update', (_, partial: Partial<AppConfig>) => updateConfig(partial));
ipcMain.handle('config:isConfigured', () => isConfigured());

function getResourcePath(relativePath: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '../../', relativePath);
}

function startApiServer(): Promise<void> {
  return new Promise((resolve) => {
    const apiPath = getResourcePath('api/server');
    const userDataPath = app.getPath('userData');
    const configEnvVars = getConfigEnvVars();
    
    log.info('Starting API server from:', apiPath);
    log.info('User data path:', userDataPath);
    log.info('Config env vars:', Object.keys(configEnvVars).join(', '));
    
    apiProcess = spawn(apiPath, [], {
      env: {
        ...process.env,
        PORT: API_PORT.toString(),
        NODE_ENV: 'production',
        ECLAW_DATA_DIR: userDataPath,
        ...configEnvVars,
      },
      stdio: 'pipe',
    });

    apiProcess.stdout?.on('data', (data) => {
      log.info('[API]', data.toString().trim());
    });

    apiProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      log.warn('[API]', msg);
      
      if (msg.includes('Error:') || msg.includes('error:')) {
        log.warn('[API] API server encountered an error but continuing...');
      }
    });

    apiProcess.on('spawn', () => {
      log.info('API server started on port', API_PORT);
      apiRunning = true;
      resolve();
    });

    apiProcess.on('exit', (code) => {
      log.warn('API server exited with code:', code);
      apiRunning = false;
      
      if (!isDev && code !== 0) {
        log.info('Restarting API server in 3 seconds...');
        setTimeout(() => {
          if (!apiRunning) {
            startApiServer();
          }
        }, 3000);
      }
    });

    apiProcess.on('error', (err) => {
      log.error('Failed to start API server:', err.message);
      resolve();
    });
  });
}

function createWindow(): void {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    log.info('Window ready to show');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const webPath = getResourcePath('web/index.html');
    log.info('Loading web from:', webPath);
    mainWindow.loadFile(webPath);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  log.info('App is ready');
  
  // Load config first
  await loadConfig();
  log.info('Config loaded, isConfigured:', isConfigured());

  if (!isDev) {
    await startApiServer();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function cleanup() {
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
}

app.on('window-all-closed', () => {
  log.info('All windows closed');
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
