import spawn from 'cross-spawn';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import stripAnsi from 'strip-ansi';
import kill from 'kill-port-fast';

const TEMP_BASE_DIR = path.join(process.cwd(), '.temp');
const PROJECTS_DIR = path.join(process.cwd(), '..', '..', 'projects');
const PREVIEW_PORT = 11970;

function decodeOutput(data: Buffer | string): string {
  let text = typeof data === 'string' ? data : new TextDecoder('utf-8', { fatal: false }).decode(data);
  return stripAnsi(text);
}

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

class MpPreviewService {
  private projects: Map<string, ProjectInstance> = new Map();
  private errors: Map<string, Array<{
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    timestamp: number;
  }>> = new Map();

  private getLogger(context: string) {
    return {
      info: (msg: string, data?: any) => console.log(`[MpPreview][${context}] ${msg}`, data || ''),
      error: (msg: string, err?: any) => console.error(`[MpPreview][${context}] ERROR: ${msg}`, err || ''),
      debug: (msg: string, data?: any) => console.log(`[MpPreview][${context}] DEBUG: ${msg}`, data || ''),
    };
  }

  private async killExistingProcesses(): Promise<void> {
    const logger = this.getLogger('kill');
    for (const [id, project] of this.projects) {
      if (project.process) {
        logger.info(`Killing process for project ${id}`);
        project.process.kill();
        project.process = undefined;
      }
    }
    try {
      await kill(PREVIEW_PORT, 'tcp');
      logger.info(`Killed any process on port ${PREVIEW_PORT}`);
    } catch (err) {
      logger.debug(`No process on port ${PREVIEW_PORT} to kill`);
    }
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
      npm.stdout?.on('data', (data) => { output += decodeOutput(data); });
      npm.stderr?.on('data', (data) => { output += decodeOutput(data); });

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
    let hasError = false;
    let errorMessage = '';
    let resolveReady: (value: void | PromiseLike<void>) => void;
    let rejectReady: (reason: any) => void;
    const readyPromise = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    let errorBuffer: string[] = [];
    let inErrorBlock = false;
    let errorFlushTimer: ReturnType<typeof setTimeout> | null = null;

    const checkReady = (text: string) => {
      if (ready || hasError) return;

      if (text.includes('http://localhost')) {
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

    const flushError = () => {
      if (errorFlushTimer) {
        clearTimeout(errorFlushTimer);
        errorFlushTimer = null;
      }
      if (errorBuffer.length > 0) {
        errorMessage = errorBuffer.join('\n').slice(0, 1000);
        hasError = true;
        inErrorBlock = false;
        errorBuffer = [];
        logger.error('Build error detected', errorMessage);
        rejectReady(new Error(`Build failed: ${errorMessage}`));
      }
    };

    const checkError = (text: string) => {
      if (hasError || ready) return;

      if (text.includes('\u2715 [ERROR]') || text.includes('✘ [ERROR]')) {
        inErrorBlock = true;
        errorBuffer = [text];
        if (errorFlushTimer) clearTimeout(errorFlushTimer);
        errorFlushTimer = setTimeout(flushError, 500);
        return;
      }

      if (inErrorBlock) {
        errorBuffer.push(text);
        if (errorFlushTimer) clearTimeout(errorFlushTimer);
        errorFlushTimer = setTimeout(flushError, 500);

        if (text.includes('ELIFECYCLE') || text.includes('Command failed')) {
          flushError();
        }
      }
    };

    devProcess.stdout?.on('data', (data) => {
      const text = decodeOutput(data);
      logger.debug('stdout', text.slice(0, 300));
      checkReady(text);
      checkError(text);
    });

    devProcess.stderr?.on('data', (data) => {
      const text = decodeOutput(data);
      logger.debug('stderr', text.slice(0, 300));
      checkReady(text);
      checkError(text);
    });

    devProcess.on('error', (err) => {
      logger.error('Process error', err);
      if (!ready) {
        hasError = true;
        rejectReady(err);
      }
    });

    devProcess.on('exit', (code) => {
      if (errorFlushTimer) {
        clearTimeout(errorFlushTimer);
        errorFlushTimer = null;
      }
      if (code !== 0 && !ready && !hasError) {
        flushError();
        if (!hasError) {
          hasError = true;
          rejectReady(new Error(`Process exited with code ${code}`));
        }
      }
    });

    setTimeout(() => {
      if (!ready && !hasError) {
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

    await this.killExistingProcesses();

    const projectPath = path.join(PROJECTS_DIR, sessionId);
    await this.ensureDir(projectPath);

    const project: ProjectInstance = {
      id: sessionId,
      name: sessionId,
      projectPath,
      previewUrl: null,
      port: PREVIEW_PORT,
      createdAt: new Date(),
      status: 'compiling',
    };

    this.projects.set(sessionId, project);
    logger.info('Project created', { projectPath, port: PREVIEW_PORT });

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

    await this.killExistingProcesses();

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

      project = {
        id: sessionId,
        name: sessionId,
        projectPath,
        previewUrl: null,
        port: PREVIEW_PORT,
        createdAt: new Date(),
        status: 'compiling',
      };
      this.projects.set(sessionId, project);
    } else {
      project.status = 'compiling';
      project.previewUrl = null;
      project.process = undefined;
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

    try {
      await readyPromise;
    } catch (err) {
      logger.error('Build failed', err);
      project.status = 'error';
      return {
        success: false,
        projectId: sessionId,
        status: 'error',
        message: 'Build failed',
        error: String(err),
      };
    }

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

  getProjectStatus(sessionId: string): ProjectInstance | null {
    return this.projects.get(sessionId) || null;
  }

  getAllProjects(): ProjectInstance[] {
    return Array.from(this.projects.values());
  }

  storeErrors(sessionId: string, errors: Array<{
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    timestamp: number;
  }>): void {
    const existing = this.errors.get(sessionId) || [];
    const newErrors = errors.filter(e =>
      !existing.some(ex =>
        ex.message === e.message && ex.type === e.type
      )
    );
    this.errors.set(sessionId, [...existing, ...newErrors]);
  }

  getErrors(sessionId: string): Array<{
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    timestamp: number;
  }> {
    return this.errors.get(sessionId) || [];
  }

  clearErrors(sessionId: string): void {
    this.errors.delete(sessionId);
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

export const mpPreviewService = new MpPreviewService();

export const mpPreviewRouter = (() => {
  const { Router } = require('express');
  const router = Router();

  router.post('/create', async (req, res) => {
    try {
      const { sessionId } = req.body;
      const result = await mpPreviewService.createProject(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] create error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.post('/start/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await mpPreviewService.startPreview(sessionId);
      res.json(result);
    } catch (error) {
      console.error('[taro-router] start error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/status/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const project = mpPreviewService.getProjectStatus(sessionId);
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
      const projects = mpPreviewService.getAllProjects();
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

  router.post('/errors/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { errors } = req.body;
      if (!Array.isArray(errors)) {
        return res.status(400).json({ error: 'errors must be an array' });
      }
      mpPreviewService.storeErrors(sessionId, errors);
      res.json({ success: true, count: errors.length });
    } catch (error) {
      console.error('[taro-router] errors post error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.get('/errors/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const errors = mpPreviewService.getErrors(sessionId);
      res.json({ errors });
    } catch (error) {
      console.error('[taro-router] errors get error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  router.delete('/errors/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      mpPreviewService.clearErrors(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('[taro-router] errors delete error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
})();

export function cleanupAllProjects() {
  mpPreviewService.cleanupAll();
}

export { MpPreviewService };
