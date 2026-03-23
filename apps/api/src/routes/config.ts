import { Router } from "express";
import { promises as fs } from 'fs';
import * as path from 'path';

const router = Router();

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

function getConfigPath(): string {
  const dataDir = process.env.ECLAW_DATA_DIR || process.cwd();
  return path.join(dataDir, 'config.json');
}

async function loadConfig(): Promise<AppConfig> {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config: AppConfig): Promise<void> {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

router.get("/config", async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ config });
  } catch (error) {
    console.error('Failed to load config:', error);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

router.put("/config", async (req, res) => {
  try {
    const partial = req.body;
    const current = await loadConfig();
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
    
    await saveConfig(updated);
    res.json({ config: updated, success: true });
  } catch (error) {
    console.error('Failed to save config:', error);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

router.get("/config/status", async (req, res) => {
  try {
    const config = await loadConfig();
    const isConfigured = !!(
      config.apiKeys.deepseek || 
      config.apiKeys.minimax || 
      config.apiKeys.openrouter
    );
    res.json({ 
      isConfigured,
      providers: {
        deepseek: !!config.apiKeys.deepseek,
        minimax: !!config.apiKeys.minimax,
        openrouter: !!config.apiKeys.openrouter,
      }
    });
  } catch (error) {
    res.json({ isConfigured: false, providers: {} });
  }
});

router.post("/config/test/:provider", async (req, res) => {
  const { provider } = req.params;
  try {
    const config = await loadConfig();
    let apiKey: string | undefined;
    let baseUrl: string | undefined;
    
    switch (provider) {
      case 'deepseek':
        apiKey = config.apiKeys.deepseek;
        baseUrl = config.apiKeys.deepseekBaseUrl || 'https://api.deepseek.com';
        break;
      case 'minimax':
        apiKey = config.apiKeys.minimax;
        baseUrl = config.apiKeys.minimaxBaseUrl;
        break;
      case 'openrouter':
        apiKey = config.apiKeys.openrouter;
        baseUrl = config.apiKeys.openrouterBaseUrl;
        break;
      default:
        return res.status(400).json({ error: 'Unknown provider' });
    }
    
    if (!apiKey) {
      return res.json({ success: false, error: 'API key not configured' });
    }
    
    res.json({ success: true, message: 'API key is configured' });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

export default router;
