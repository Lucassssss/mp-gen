import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const TEMP_BASE_DIR = path.join(process.cwd(), '.temp');
const PROJECTS_DIR = path.join(process.cwd(), '..', '..', 'projects');

export interface ProjectInstance {
  id: string;
  name: string;
  projectPath: string;
  previewUrl: string | null;
  port: number;
  process?: ReturnType<typeof spawn>;
  createdAt: Date;
  status: 'compiling' | 'ready' | 'error' | 'stopped';
}

export interface PreviewResult {
  success: boolean;
  projectId: string;
  previewUrl?: string;
  status: ProjectInstance['status'];
  message: string;
  error?: string;
}

class TaroPreviewService {
  private projects: Map<string, ProjectInstance> = new Map();

  private getLogger(context: string) {
    return {
      info: (msg: string, data?: any) => console.log(`[TaroPreview][${context}] ${msg}`, data || ''),
      error: (msg: string, err?: any) => console.error(`[TaroPreview][${context}] ERROR: ${msg}`, err || ''),
      debug: (msg: string, data?: any) => console.log(`[TaroPreview][${context}] DEBUG: ${msg}`, data || ''),
    };
  }

  async ensureDir(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  async installDependencies(projectPath: string, sessionId: string): Promise<void> {
    const logger = this.getLogger(`install:${sessionId}`);
    logger.info('Installing dependencies...');

    return new Promise((resolve, reject) => {
      const npm = spawn('pnpm', ['install'], {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      let output = '';
      npm.stdout?.on('data', (data) => { output += data.toString(); });
      npm.stderr?.on('data', (data) => { output += data.toString(); });

      npm.on('close', (code) => {
        if (code === 0) {
          logger.info('Dependencies installed successfully');
          resolve();
        } else {
          logger.error('Install failed', output.slice(-500));
          reject(new Error(`pnpm install failed: ${output.slice(-500)}`));
        }
      });
      npm.on('error', (err) => {
        logger.error('Install process error', err);
        reject(err);
      });
    });
  }

  async checkDependencies(projectPath: string): Promise<boolean> {
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    return existsSync(nodeModulesPath);
  }

  private async startDevServer(
    projectPath: string,
    port: number,
    projectId: string
  ): Promise<{ process: ReturnType<typeof spawn>; promise: Promise<void> }> {
    const logger = this.getLogger(`dev:${projectId}`);
    logger.info(`Starting dev server on port ${port}...`);

    const devProcess = spawn('pnpm', ['run', 'dev:h5', '--port', String(port)], {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let ready = false;
    let resolveReady: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const checkReady = (text: string) => {
      if (ready) return;

      if (text.includes('Local:') && text.includes('http://localhost:')) {
        ready = true;
        logger.info('Server ready detected from URL');
        resolveReady();
        return;
      }

      if (text.includes('Compiled') || text.includes('webpack compiled')) {
        ready = true;
        logger.info('Server ready detected from compiled message');
        resolveReady();
      }
    };

    devProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      logger.debug('stdout', text.slice(0, 300));
      checkReady(text);
    });

    devProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      logger.debug('stderr', text.slice(0, 300));
      checkReady(text);
    });

    devProcess.on('error', (err) => {
      logger.error('Process error', err);
    });

    setTimeout(() => {
      if (!ready) {
        logger.info('Timeout reached, marking as ready anyway');
        ready = true;
        resolveReady();
      }
    }, 10000);

    return { process: devProcess, promise: readyPromise };
  }

  async createProject(sessionId: string): Promise<PreviewResult> {
    const logger = this.getLogger(`create:${sessionId}`);
    logger.info('Creating project...');

    const projectPath = path.join(PROJECTS_DIR, sessionId);
    await this.ensureDir(projectPath);

    const port = 10000 + Math.floor(Math.random() * 9000);

    const project: ProjectInstance = {
      id: sessionId,
      name: sessionId,
      projectPath,
      previewUrl: null,
      port,
      createdAt: new Date(),
      status: 'compiling',
    };

    this.projects.set(sessionId, project);
    logger.info('Project created', { projectPath, port });

    return {
      success: true,
      projectId: sessionId,
      status: 'compiling',
      message: 'Project created, use startPreview to launch',
    };
  }

  async startPreview(sessionId: string): Promise<PreviewResult> {
    const logger = this.getLogger(`start:${sessionId}`);
    logger.info('Starting preview...');

    let project = this.projects.get(sessionId);

    if (!project) {
      const projectPath = path.join(PROJECTS_DIR, sessionId);
      if (!existsSync(projectPath)) {
        logger.error('Project directory not found');
        return {
          success: false,
          projectId: sessionId,
          status: 'error',
          message: 'Project not found',
          error: 'Project directory does not exist',
        };
      }

      const port = 10000 + Math.floor(Math.random() * 9000);
      project = {
        id: sessionId,
        name: sessionId,
        projectPath,
        previewUrl: null,
        port,
        createdAt: new Date(),
        status: 'compiling',
      };
      this.projects.set(sessionId, project);
    }

    if (project.process) {
      logger.info('Stopping existing process...');
      project.process.kill();
      project.process = undefined;
    }

    if (project.status === 'ready') {
      logger.info('Project already ready');
      return {
        success: true,
        projectId: sessionId,
        previewUrl: project.previewUrl!,
        status: 'ready',
        message: 'Preview already running',
      };
    }

    const hasDeps = await this.checkDependencies(project.projectPath);
    if (!hasDeps) {
      logger.info('Installing dependencies...');
      try {
        await this.installDependencies(project.projectPath, sessionId);
      } catch (err) {
        logger.error('Failed to install dependencies', err);
        project.status = 'error';
        return {
          success: false,
          projectId: sessionId,
          status: 'error',
          message: 'Failed to install dependencies',
          error: String(err),
        };
      }
    }

    const { process: devProcess, promise: readyPromise } = await this.startDevServer(
      project.projectPath,
      project.port,
      sessionId
    );

    project.process = devProcess;
    project.status = 'compiling';

    await readyPromise;

    project.status = 'ready';
    project.previewUrl = `http://localhost:${project.port}`;
    logger.info('Preview ready', { previewUrl: project.previewUrl });

    return {
      success: true,
      projectId: sessionId,
      previewUrl: project.previewUrl,
      status: 'ready',
      message: 'Preview started',
    };
  }

  async restartPreview(sessionId: string): Promise<PreviewResult> {
    const logger = this.getLogger(`restart:${sessionId}`);
    logger.info('Restarting preview...');

    const project = this.projects.get(sessionId);
    if (project?.process) {
      logger.info('Killing existing process');
      project.process.kill();
      project.process = undefined;
    }

    if (project) {
      project.status = 'compiling';
      project.previewUrl = null;
    }

    return this.startPreview(sessionId);
  }

  async stopPreview(sessionId: string): Promise<PreviewResult> {
    const logger = this.getLogger(`stop:${sessionId}`);
    logger.info('Stopping preview...');

    const project = this.projects.get(sessionId);
    if (!project) {
      return {
        success: false,
        projectId: sessionId,
        status: 'stopped',
        message: 'Project not found in memory',
      };
    }

    if (project.process) {
      project.process.kill();
      project.process = undefined;
    }

    project.status = 'stopped';
    project.previewUrl = null;
    logger.info('Preview stopped');

    return {
      success: true,
      projectId: sessionId,
      status: 'stopped',
      message: 'Preview stopped',
    };
  }

  async refreshPreview(sessionId: string): Promise<PreviewResult> {
    const logger = this.getLogger(`refresh:${sessionId}`);
    logger.info('Refreshing preview...');

    const project = this.projects.get(sessionId);
    if (!project) {
      logger.info('Project not found, starting fresh');
      return this.startPreview(sessionId);
    }

    if (project.status !== 'ready' || !project.process) {
      logger.info('Project not running, starting...');
      return this.startPreview(sessionId);
    }

    logger.info('Triggering hot reload via file touch');

    const srcPath = path.join(project.projectPath, 'src');
    try {
      const files = await fs.readdir(srcPath);
      const configFile = path.join(project.projectPath, 'src', 'app.config.ts');
      const stat = await fs.stat(configFile);
      await fs.writeFile(configFile, await fs.readFile(configFile, 'utf-8'));
      logger.info('Touched config file to trigger reload');
    } catch (err) {
      logger.error('Failed to trigger refresh', err);
    }

    return {
      success: true,
      projectId: sessionId,
      previewUrl: project.previewUrl!,
      status: project.status,
      message: 'Refresh triggered',
    };
  }

  getProjectStatus(sessionId: string): ProjectInstance | null {
    return this.projects.get(sessionId) || null;
  }

  getAllProjects(): ProjectInstance[] {
    return Array.from(this.projects.values());
  }

  async cleanupProject(sessionId: string): Promise<void> {
    const project = this.projects.get(sessionId);
    if (project?.process) {
      project.process.kill();
    }
    this.projects.delete(sessionId);
  }

  async cleanupAll(): Promise<void> {
    for (const [id] of this.projects) {
      await this.cleanupProject(id);
    }
  }
}

export const taroPreviewService = new TaroPreviewService();

export const taroPreviewRouter = (() => {
  const { Router } = require('express');
  const router = Router();

  router.post('/create', async (req, res) => {
    try {
      const { sessionId } = req.body;
      const result = await taroPreviewService.createProject(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] create error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/start/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await taroPreviewService.startPreview(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] start error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/restart/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await taroPreviewService.restartPreview(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] restart error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/stop/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await taroPreviewService.stopPreview(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] stop error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/refresh/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await taroPreviewService.refreshPreview(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] refresh error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/status/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const project = taroPreviewService.getProjectStatus(sessionId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({
        id: project.id,
        name: project.name,
        status: project.status,
        previewUrl: project.previewUrl,
        port: project.port,
      });
    } catch (error) {
      console.error('[taro-router] status error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/list', async (req, res) => {
    try {
      const projects = taroPreviewService.getAllProjects();
      res.json({
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          previewUrl: p.previewUrl,
          createdAt: p.createdAt,
        })),
      });
    } catch (error) {
      console.error('[taro-router] list error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
})();

export function cleanupAllProjects() {
  taroPreviewService.cleanupAll();
}

export { TaroPreviewService };
