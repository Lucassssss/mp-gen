import { promises as fs } from 'fs';
import * as path from 'path';
import log from 'electron-log';

export interface AppConfig {
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

class ConfigService {
  private configPath: string;
  private config: AppConfig | null = null;

  constructor(dataDir: string) {
    this.configPath = path.join(dataDir, 'config.json');
  }

  async init(): Promise<void> {
    try {
      await this.load();
    } catch (error) {
      log.info('Config file not found, creating default config');
      await this.save(DEFAULT_CONFIG);
    }
  }

  async load(): Promise<AppConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      return this.config;
    } catch (error) {
      throw new Error('Config file not found');
    }
  }

  async save(config: AppConfig): Promise<void> {
    this.config = config;
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    log.info('Config saved to:', this.configPath);
  }

  async update(partial: Partial<AppConfig>): Promise<AppConfig> {
    const current = this.config || await this.load().catch(() => DEFAULT_CONFIG);
    const updated = { ...current, ...partial };
    
    if (partial.apiKeys) {
      updated.apiKeys = { ...current.apiKeys, ...partial.apiKeys };
    }
    if (partial.smtp) {
      updated.smtp = { ...current.smtp, ...partial.smtp };
    }
    if (partial.settings) {
      updated.settings = { ...current.settings, ...partial.settings };
    }
    
    await this.save(updated);
    return updated;
  }

  get(): AppConfig {
    return this.config || DEFAULT_CONFIG;
  }

  toEnvVars(): Record<string, string> {
    const config = this.get();
    const envVars: Record<string, string> = {};

    if (config.apiKeys.deepseek) {
      envVars.DEEPSEEK_API_KEY = config.apiKeys.deepseek;
    }
    if (config.apiKeys.deepseekBaseUrl) {
      envVars.DEEPSEEK_BASE_URL = config.apiKeys.deepseekBaseUrl;
    }
    if (config.apiKeys.minimax) {
      envVars.MINIMAX_API_KEY = config.apiKeys.minimax;
    }
    if (config.apiKeys.minimaxBaseUrl) {
      envVars.MINIMAX_API_BASE_URL = config.apiKeys.minimaxBaseUrl;
    }
    if (config.apiKeys.openrouter) {
      envVars.OPENROUTER_API_KEY = config.apiKeys.openrouter;
    }
    if (config.apiKeys.openrouterBaseUrl) {
      envVars.OPENROUTER_API_BASE_URL = config.apiKeys.openrouterBaseUrl;
    }

    if (config.smtp) {
      if (config.smtp.host) envVars.SMTP_HOST = config.smtp.host;
      if (config.smtp.port) envVars.SMTP_PORT = String(config.smtp.port);
      if (config.smtp.user) envVars.SMTP_USER = config.smtp.user;
      if (config.smtp.pass) envVars.SMTP_PASS = config.smtp.pass;
      if (config.smtp.from) envVars.SMTP_FROM = config.smtp.from;
    }

    return envVars;
  }

  isConfigured(): boolean {
    const config = this.get();
    return !!(config.apiKeys.deepseek || config.apiKeys.minimax || config.apiKeys.openrouter);
  }
}

export default ConfigService;
