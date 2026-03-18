import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const TEMP_BASE_DIR = path.join(process.cwd(), '.temp');
const PROJECTS_DIR = path.join(process.cwd(), '..', '..', 'projects');

function getSessionTempDir(sessionId: string): string {
  return path.join(TEMP_BASE_DIR, `mp-${sessionId}`);
}

interface ProjectInstance {
  id: string;
  name: string;
  projectPath: string;
  previewUrl: string;
  port: number;
  process?: ReturnType<typeof spawn>;
  createdAt: Date;
  status: 'compiling' | 'ready' | 'error' | 'stopped';
}

const projects = new Map<string, ProjectInstance>();

async function ensureTempDir(sessionId?: string) {
  const tempDir = sessionId ? getSessionTempDir(sessionId) : TEMP_BASE_DIR;
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

async function installDependencies(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install'], {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let output = '';
    npm.stdout?.on('data', (data) => { output += data.toString(); });
    npm.stderr?.on('data', (data) => { output += data.toString(); });

    npm.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install failed`));
    });
    npm.on('error', reject);
  });
}

function startTaroDevServer(
  projectPath: string,
  port: number,
  onReady: () => void,
  onError: (error: Error) => void
): ReturnType<typeof spawn> {
  const devProcess = spawn('npx', ['taro', 'dev', '--type', 'h5', '--port', String(port)], {
    cwd: projectPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  let buffer = '';
  let ready = false;

  devProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    buffer += text;
    if (!ready && (text.includes('Compiled') || text.includes('webpack compiled'))) {
      ready = true;
      onReady();
    }
  });

  devProcess.stderr?.on('data', (data) => {
    const text = data.toString();
    if (!ready && (text.includes('Compiled') || text.includes('webpack compiled'))) {
      ready = true;
      onReady();
    }
  });

  devProcess.on('error', onError);

  setTimeout(() => {
    if (!ready) { ready = true; onReady(); }
  }, 45000);

  return devProcess;
}

export const taroRouter = Router();

taroRouter.post('/create', async (req, res) => {
  try {
    const { id, name, files, sessionId } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'files array is required' });
    }

    const tempDir = await ensureTempDir(sessionId);

    const projectId = id || randomUUID().slice(0, 8);
    const projectName = name || 'taro-project';
    const projectPath = path.join(tempDir, `${projectName}-${projectId}`);
    const port = 10000 + Math.floor(Math.random() * 9000);

    await fs.mkdir(projectPath, { recursive: true });

    for (const file of files) {
      const filePath = path.join(projectPath, file.path);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    const project: ProjectInstance = {
      id: projectId,
      name: projectName,
      projectPath,
      previewUrl: `http://localhost:${port}`,
      port,
      createdAt: new Date(),
      status: 'compiling',
    };

    projects.set(projectId, project);

    res.json({
      projectId,
      status: 'compiling',
      message: 'Project is being compiled',
    });

    try {
      await installDependencies(projectPath);
      
      const devProcess = startTaroDevServer(
        projectPath,
        port,
        () => {
          const p = projects.get(projectId);
          if (p) { p.status = 'ready'; p.process = devProcess; }
        },
        (error) => {
          const p = projects.get(projectId);
          if (p) { p.status = 'error'; }
          console.error('Taro dev server error:', error);
        }
      );
    } catch (compileError) {
      const p = projects.get(projectId);
      if (p) { p.status = 'error'; }
      console.error('Compilation error:', compileError);
    }
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: String(error) });
  }
});

taroRouter.post('/update-page', async (req, res) => {
  try {
    const { projectId, pagePath, code, style } = req.body;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const dirs = pagePath.split('/').slice(0, -1).join('/');
    const pageName = pagePath.split('/').pop() || 'index';

    const tsxPath = path.join(project.projectPath, 'src', pagePath, 'index.tsx');
    const scssPath = path.join(project.projectPath, 'src', pagePath, 'index.scss');

    await fs.mkdir(path.dirname(tsxPath), { recursive: true });
    await fs.writeFile(tsxPath, code, 'utf-8');

    if (style) {
      await fs.writeFile(scssPath, style, 'utf-8');
    }

    res.json({ success: true, message: 'Page updated' });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: String(error) });
  }
});

taroRouter.get('/status/:projectId', (req, res) => {
  const { projectId } = req.params;
  const project = projects.get(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json({
    id: project.id,
    name: project.name,
    status: project.status,
    previewUrl: project.status === 'ready' ? project.previewUrl : null,
    port: project.port,
  });
});

taroRouter.post('/stop/:projectId', (req, res) => {
  const { projectId } = req.params;
  const project = projects.get(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.process) {
    project.process.kill();
    project.status = 'stopped';
  }

  res.json({ success: true, message: 'Project stopped' });
});

taroRouter.get('/list', (req, res) => {
  const projectList = Array.from(projects.values()).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    previewUrl: p.status === 'ready' ? p.previewUrl : null,
    createdAt: p.createdAt,
  }));

  res.json({ projects: projectList });
});

taroRouter.post('/init-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('[init-session] Request received:', { sessionId });
    
    if (!sessionId) {
      console.log('[init-session] No sessionId provided');
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const projectPath = path.join(PROJECTS_DIR, sessionId);
    console.log('[init-session] Project path:', projectPath);
    console.log('[init-session] Checking if project exists:', existsSync(projectPath));
    
    if (!existsSync(projectPath)) {
      console.log('[init-session] Project does not exist');
      return res.json({ exists: false, message: 'No project found for this session' });
    }

    const existingProject = Array.from(projects.values()).find(p => 
      p.projectPath === projectPath
    );
    console.log('[init-session] Existing project:', existingProject?.status);

    if (existingProject && existingProject.status === 'ready') {
      console.log('[init-session] Preview already running, returning URL:', existingProject.previewUrl);
      return res.json({
        exists: true,
        projectId: existingProject.id,
        previewUrl: existingProject.previewUrl,
        status: existingProject.status,
        message: 'Preview already running'
      });
    }

    if (existingProject && existingProject.status === 'compiling') {
      console.log('[init-session] Project is compiling, waiting...');
      for (let i = 0; i < 90; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const p = projects.get(existingProject.id);
        if (p?.status === 'ready') {
          return res.json({
            exists: true,
            projectId: p.id,
            previewUrl: p.previewUrl,
            status: p.status,
            message: 'Preview ready'
          });
        }
        if (p?.status === 'error') {
          return res.json({
            exists: true,
            projectId: p.id,
            status: p.status,
            error: 'Failed to start preview'
          });
        }
      }
    }

    console.log('[init-session] Starting new preview...');
    const port = 10000 + Math.floor(Math.random() * 9000);
    
    const project: ProjectInstance = {
      id: sessionId,
      name: sessionId,
      projectPath: projectPath,
      previewUrl: `http://localhost:${port}`,
      port,
      createdAt: new Date(),
      status: 'compiling',
    };
    
    projects.set(sessionId, project);
    
    try {
      await installDependencies(projectPath);
    } catch (installError) {
      console.error('Failed to install dependencies:', installError);
      const p = projects.get(sessionId);
      if (p) { p.status = 'error'; }
      return res.json({
        exists: true,
        projectId: sessionId,
        status: 'error',
        error: 'Failed to install dependencies'
      });
    }
    
    startTaroDevServer(
      projectPath,
      port,
      () => {
        const p = projects.get(sessionId);
        if (p) { p.status = 'ready'; }
      },
      (error) => {
        const p = projects.get(sessionId);
        if (p) { p.status = 'error'; }
        console.error('Taro dev server error:', error);
      }
    );

    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const p = projects.get(sessionId);
      if (p?.status === 'ready') {
        return res.json({
          exists: true,
          projectId: p.id,
          previewUrl: p.previewUrl,
          status: p.status,
          message: 'Preview started'
        });
      }
      if (p?.status === 'error') {
        return res.json({
          exists: true,
          projectId: p.id,
          status: p.status,
          error: 'Failed to start preview'
        });
      }
    }

    res.json({
      exists: true,
      projectId: sessionId,
      status: 'compiling',
      message: 'Preview starting...'
    });

  } catch (error) {
    console.error('Init session error:', error);
    res.status(500).json({ error: String(error) });
  }
});

taroRouter.delete('/cleanup', async (req, res) => {
  const now = Date.now();
  const expireMs = 30 * 60 * 1000;

  for (const [id, project] of projects) {
    if (now - project.createdAt.getTime() > expireMs || project.status === 'stopped') {
      if (project.process) {
        project.process.kill();
      }
      try {
        await fs.rm(project.projectPath, { recursive: true, force: true });
      } catch (e) {
        console.error('Cleanup error:', e);
      }
      projects.delete(id);
    }
  }

  res.json({ success: true, message: 'Cleanup completed' });
});

export function cleanupAllProjects() {
  for (const [id, project] of projects) {
    if (project.process) {
      project.process.kill();
    }
    try {
      fs.rm(project.projectPath, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
  projects.clear();
}

export { projects };
