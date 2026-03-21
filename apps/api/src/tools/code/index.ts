import { tool } from "ai6";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import fsSync from "fs";
import { exec } from "child_process";
import { getToolSessionId } from "../mini-program.js";
import { mpPreviewService } from "../../services/taro-preview.js";

const BASE_PROJECTS_DIR = path.join(process.cwd(), "..", "..", "projects");

function getCurrentProjectPath(): string {
  const sessionId = getToolSessionId();
  if (sessionId) {
    return path.join(BASE_PROJECTS_DIR, sessionId);
  }
  return BASE_PROJECTS_DIR;
}

function resolveProjectPath(inputPath: string): string {
  const normalized = path.normalize(inputPath);
  const currentProjectPath = getCurrentProjectPath();

  if (normalized.startsWith("/app/projects/")) {
    const relativePath = normalized.replace("/app/projects/", "");
    const parts = relativePath.split("/");
    if (parts.length >= 1) {
      return path.join(currentProjectPath, ...parts);
    }
  }
  if (path.isAbsolute(inputPath)) {
    return normalized;
  }
  return path.join(currentProjectPath, inputPath);
}

function validatePath(resolvedPath: string): { valid: boolean; error?: string } {
  const normalizedResolved = path.normalize(resolvedPath);
  const currentProjectPath = getCurrentProjectPath();
  const normalizedProjects = path.normalize(currentProjectPath);

  if (!normalizedResolved.startsWith(normalizedProjects + path.sep) && normalizedResolved !== normalizedProjects) {
    return {
      valid: false,
      error: `路径超出允许范围，仅允许访问当前项目目录 ${currentProjectPath} 下的文件`
    };
  }
  return { valid: true };
}

const searchCodebaseTool = tool({
  description: "语义搜索代码库，用于理解功能实现位置。当需要探索未知代码时使用，返回相关代码片段及文件路径。",
  inputSchema: z.object({
    query: z.string().describe("完整问题，如“登录逻辑在哪里？”"),
    target_directories: z.array(z.string()).optional().describe("限定搜索目录，使用相对于项目根目录的相对路径"),
  }),
  execute: async ({ query, target_directories }) => {
    try {
      let searchDirs = target_directories && target_directories.length > 0
        ? target_directories.map(d => resolveProjectPath(d))
        : [getCurrentProjectPath()];

      for (const dir of searchDirs) {
        const validation = validatePath(dir);
        if (!validation.valid) {
          return { error: validation.error, results: [] };
        }
      }

      const results: Array<{ file: string; snippet: string; line: number }> = [];
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      async function searchDir(dir: string, depth: number = 0) {
        if (depth > 5) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== "build") {
                await searchDir(fullPath, depth + 1);
              }
            } else if (entry.isFile() && /\.(ts|tsx|js|jsx|py|go|rs|java)$/.test(entry.name)) {
              try {
                const content = await fs.readFile(fullPath, "utf-8");
                const lowerContent = content.toLowerCase();
                const matches = keywords.filter(kw => lowerContent.includes(kw));
                if (matches.length > 0) {
                  const lines = content.split("\n");
                  for (let i = 0; i < lines.length; i++) {
                    const lineLower = lines[i].toLowerCase();
                    if (matches.some(m => lineLower.includes(m))) {
                      results.push({
                        file: fullPath,
                        snippet: lines[i].trim().substring(0, 200),
                        line: i + 1,
                      });
                      if (results.length >= 20) return;
                    }
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }

      for (const dir of searchDirs) {
        await searchDir(dir);
        if (results.length >= 20) break;
      }

      return {
        query,
        results: results.slice(0, 20),
        message: `找到 ${results.length} 个相关结果`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), results: [] };
    }
  },
});

const grepSearchTool = tool({
  description: "正则表达式搜索，用于精确匹配字符串或符号。当你知道精确的变量名或函数名时使用。",
  inputSchema: z.object({
    pattern: z.string().describe("正则表达式"),
    path: z.string().optional().describe("搜索路径，使用相对于项目根目录的相对路径"),
    case_sensitive: z.boolean().optional().default(false).describe("是否区分大小写"),
    include: z.string().optional().describe("文件包含模式，如 *.ts"),
  }),
  execute: async ({ pattern, path: searchPath, case_sensitive, include }) => {
    try {
      const dir = searchPath ? resolveProjectPath(searchPath) : getCurrentProjectPath();
      const validation = validatePath(dir);
      if (!validation.valid) {
        return { error: validation.error, results: [] };
      }
      const regex = new RegExp(pattern, case_sensitive ? "" : "i");
      const results: Array<{ file: string; line: number; content: string }> = [];

      async function searchDir(dir: string, depth: number = 0) {
        if (depth > 5) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist") {
                await searchDir(fullPath, depth + 1);
              }
            } else if (entry.isFile()) {
              if (include) {
                const globPattern = include.replace("*.", "").replace("*", "");
                if (!entry.name.endsWith(globPattern)) continue;
              }
              if (!/\.(ts|tsx|js|jsx|py|go|rs|java|md|txt)$/.test(entry.name)) continue;
              try {
                const content = await fs.readFile(fullPath, "utf-8");
                const lines = content.split("\n");
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  const matchStr = case_sensitive ? line : line.toLowerCase();
                  const patternStr = case_sensitive ? pattern : pattern.toLowerCase();
                  if (matchStr.includes(patternStr)) {
                    results.push({
                      file: fullPath,
                      line: i + 1,
                      content: line.trim().substring(0, 300),
                    });
                    if (results.length >= 100) return;
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }

      await searchDir(dir);
      return {
        pattern,
        results: results.slice(0, 100),
        message: `找到 ${results.length} 个匹配`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), results: [] };
    }
  },
});

const findByNameTool = tool({
  description: "按文件名搜索文件或目录。快速定位已知文件。",
  inputSchema: z.object({
    pattern: z.string().describe("glob 模式，如 **/*.ts 或 **/index.ts"),
    search_directory: z.string().optional().describe("搜索目录，默认为当前目录"),
    type: z.enum(["file", "directory"]).optional().describe("文件或目录"),
  }),
  execute: async ({ pattern, search_directory, type }) => {
    try {
      const dir = search_directory ? resolveProjectPath(search_directory) : getCurrentProjectPath();
      const validation = validatePath(dir);
      if (!validation.valid) {
        return { error: validation.error, results: [] };
      }
      const results: Array<{ path: string; type: "file" | "directory" }> = [];

      async function globMatch(dir: string, pattern: string, depth: number = 0) {
        if (depth > 10) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const patternParts = pattern.split("/");
          const isWildcard = pattern.includes("*");
          const isRecursive = pattern.startsWith("**");

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const matchesType = !type || (type === "file" && entry.isFile()) || (type === "directory" && entry.isDirectory());

            if (isRecursive) {
              if (matchesType) {
                const patternMatch = pattern.replace("**/", "").replace("**", "");
                if (patternMatch === "*" || entry.name.match(new RegExp(patternMatch.replace(/\*/g, ".*")))) {
                  results.push({ path: fullPath, type: entry.isFile() ? "file" : "directory" });
                }
              }
              if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                await globMatch(fullPath, pattern, depth + 1);
              }
            } else if (isWildcard) {
              const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
              if (entry.name.match(new RegExp(regexPattern)) && matchesType) {
                results.push({ path: fullPath, type: entry.isFile() ? "file" : "directory" });
              }
            } else if (entry.name === pattern) {
              if (matchesType) {
                results.push({ path: fullPath, type: entry.isFile() ? "file" : "directory" });
              }
            }
          }
        } catch {}
      }

      await globMatch(dir, pattern);
      return {
        pattern,
        results: results.slice(0, 50),
        message: `找到 ${results.length} 个结果`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), results: [] };
    }
  },
});

const readFileTool = tool({
  description: "读取文件内容。阅读文件全部或部分内容，优先一次性读取大段，减少调用次数。",
  inputSchema: z.object({
    target_file: z.string().describe("相对于项目根目录的路径，如 src/pages/index/index.tsx"),
    offset: z.number().optional().default(1).describe("起始行，默认1"),
    limit: z.number().optional().default(200).describe("行数，默认200"),
  }),
  execute: async ({ target_file, offset, limit }) => {
    try {
      const resolvedPath = resolveProjectPath(target_file);
      const validation = validatePath(resolvedPath);
      if (!validation.valid) {
        return { error: validation.error, content: "" };
      }
      const stat = await fs.stat(resolvedPath);
      if (stat.isDirectory()) {
        return { error: "路径是目录而非文件", content: "" };
      }
      const content = await fs.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");
      const start = Math.max(0, offset - 1);
      const end = Math.min(lines.length, start + limit);
      const selectedLines = lines.slice(start, end);

      return {
        file: resolvedPath,
        totalLines: lines.length,
        offset,
        limit,
        content: selectedLines.join("\n"),
        message: `读取行 ${offset}-${end}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), content: "" };
    }
  },
});

const viewCodeItemTool = tool({
  description: "查看文件中特定代码项（类、函数）的完整内容。当语义搜索返回的片段不够时，展开查看完整定义。",
  inputSchema: z.object({
    file: z.string().describe("相对于项目根目录的路径，如 src/components/Button.tsx"),
    node_paths: z.array(z.string()).describe("符号名数组，如 LoginPage"),
  }),
  execute: async ({ file, node_paths }) => {
    try {
      const resolvedPath = resolveProjectPath(file);
      const content = await fs.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");
      const results: Array<{ name: string; line: number; content: string; endLine: number }> = [];

      for (const nodePath of node_paths) {
        const parts = nodePath.split(".");
        const searchName = parts[parts.length - 1];

        let foundLine = -1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const classMatch = line.match(new RegExp(`^\\s*(export\\s+)?class\\s+${searchName}\\s*`));
          const funcMatch = line.match(new RegExp(`^\\s*(export\\s+)?(async\\s+)?function\\s+${searchName}\\s*`));
          const constMatch = line.match(new RegExp(`^\\s*(export\\s+)?(const|let|var)\\s+${searchName}\\s*=`));
          const typeMatch = line.match(new RegExp(`^\\s*(export\\s+)?type\\s+${searchName}\\s*=`));
          const interfaceMatch = line.match(new RegExp(`^\\s*(export\\s+)?interface\\s+${searchName}\\s*`));

          if (classMatch || funcMatch || constMatch || typeMatch || interfaceMatch) {
            foundLine = i;
            break;
          }
        }

        if (foundLine === -1) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchName) && lines[i].includes("function")) {
              foundLine = i;
              break;
            }
          }
        }

        if (foundLine !== -1) {
          let braceCount = 0;
          let started = false;
          let endLine = foundLine;
          for (let i = foundLine; i < lines.length; i++) {
            const l = lines[i];
            for (const char of l) {
              if (char === "{") {
                braceCount++;
                started = true;
              } else if (char === "}") {
                braceCount--;
              }
            }
            if (started && braceCount === 0) {
              endLine = i;
              break;
            }
          }
          results.push({
            name: nodePath,
            line: foundLine + 1,
            endLine: endLine + 1,
            content: lines.slice(foundLine, endLine + 1).join("\n"),
          });
        }
      }

      return {
        file: resolvedPath,
        items: results,
        message: `找到 ${results.length} 个代码项`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), items: [] };
    }
  },
});

const listDirTool = tool({
  description: "列出目录内容。了解项目结构。",
  inputSchema: z.object({
    directory_path: z.string().describe("相对于项目根目录的路径，如 src/pages"),
    ignore_globs: z.array(z.string()).optional().describe("忽略模式，如 node_modules"),
  }),
  execute: async ({ directory_path, ignore_globs }) => {
    try {
      const resolvedPath = resolveProjectPath(directory_path);
      const validation = validatePath(resolvedPath);
      if (!validation.valid) {
        return { error: validation.error, entries: [] };
      }
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        return { error: "路径不是目录", entries: [] };
      }
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      const ignoreSet = new Set(ignore_globs || []);

      const result = entries
        .filter(entry => !ignoreSet.has(entry.name) && !entry.name.startsWith("."))
        .map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
          path: path.join(resolvedPath, entry.name),
        }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      return {
        directory: resolvedPath,
        entries: result,
        message: `${result.length} 个条目`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), entries: [] };
    }
  },
});

const writeToFileTool = tool({
  description: "创建新文件（不得覆盖现有）。生成新组件、页面等。",
  inputSchema: z.object({
    target_file: z.string().describe("相对于项目根目录的路径，如 src/pages/index/index.tsx"),
    code_content: z.string().describe("内容"),
    empty_file: z.boolean().optional().default(false).describe("是否创建空文件"),
  }),
  execute: async ({ target_file, code_content, empty_file }) => {
    try {
      const resolvedPath = resolveProjectPath(target_file);
      const validation = validatePath(resolvedPath);
      if (!validation.valid) {
        return { error: validation.error, success: false };
      }
      const exists = fsSync.existsSync(resolvedPath);
      if (exists && !empty_file) {
        return { error: "文件已存在，无法覆盖", path: resolvedPath };
      }
      if (empty_file) {
        await fs.writeFile(resolvedPath, "", "utf-8");
      } else {
        const dir = path.dirname(resolvedPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(resolvedPath, code_content, "utf-8");
      }
      return {
        success: true,
        path: resolvedPath,
        message: `文件已创建: ${resolvedPath}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), success: false };
    }
  },
});

const replaceFileContentTool = tool({
  description: "编辑现有文件，支持多个不连续替换。精确修改代码，避免重写整个文件。",
  inputSchema: z.object({
    target_file: z.string().describe("相对于项目根目录的路径，如 src/pages/index/index.tsx"),
    replacement_chunks: z.array(z.object({
      target_content: z.string().describe("要替换的内容"),
      replacement_content: z.string().describe("替换后的内容"),
      allow_multiple: z.boolean().optional().default(false).describe("是否允许多处替换"),
    })).describe("替换块数组"),
    instruction: z.string().optional().describe("变更描述"),
  }),
  execute: async ({ target_file, replacement_chunks, instruction }) => {
    try {
      const resolvedPath = resolveProjectPath(target_file);
      const stat = await fs.stat(resolvedPath);
      if (stat.isDirectory()) {
        return { error: "路径是目录而非文件", success: false };
      }
      let content = await fs.readFile(resolvedPath, "utf-8");
      const replacements: Array<{ target: string; replacement: string; count: number }> = [];

      for (const chunk of replacement_chunks) {
        if (chunk.allow_multiple) {
          let count = 0;
          content = content.split(chunk.target_content).join(chunk.replacement_content);
          count = (content.match(new RegExp(chunk.replacement_content, "g")) || []).length;
          replacements.push({ target: chunk.target_content, replacement: chunk.replacement_content, count });
        } else {
          if (content.includes(chunk.target_content)) {
            content = content.replace(chunk.target_content, chunk.replacement_content);
            replacements.push({ target: chunk.target_content, replacement: chunk.replacement_content, count: 1 });
          } else {
            return { error: `未找到要替换的内容: ${chunk.target_content.substring(0, 50)}...`, success: false };
          }
        }
      }

      await fs.writeFile(resolvedPath, content, "utf-8");
      return {
        success: true,
        path: resolvedPath,
        replacements,
        message: `完成 ${replacements.length} 处替换${instruction ? `: ${instruction}` : ""}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), success: false };
    }
  },
});

const deleteFileTool = tool({
  description: "删除文件。清理无用文件。",
  inputSchema: z.object({
    target_file: z.string().describe("相对于项目根目录的路径，如 src/pages/index/index.tsx"),
  }),
  execute: async ({ target_file }) => {
    try {
      const resolvedPath = resolveProjectPath(target_file);
      const validation = validatePath(resolvedPath);
      if (!validation.valid) {
        return { error: validation.error, success: false };
      }
      const stat = await fs.stat(resolvedPath);
      if (stat.isDirectory()) {
        return { error: "路径是目录，请使用其他方法删除目录", success: false };
      }
      await fs.unlink(resolvedPath);
      return {
        success: true,
        path: resolvedPath,
        message: `文件已删除: ${resolvedPath}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), success: false };
    }
  },
});

const checkErrorsTool = tool({
  description: "检查项目运行时的错误。完成业务代码开发后，必须调用此工具检查项目是否存在运行错误。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const sessionId = getToolSessionId();
      if (!sessionId) {
        return { error: "No active session", errors: [] };
      }

      const response = await fetch(`http://localhost:3001/api/mp/errors/${sessionId}`);
      if (!response.ok) {
        return { error: "Failed to fetch errors", errors: [] };
      }

      console.log("Response:", response);

      const data = await response.json();
      const errors = data.errors || [];

      if (errors.length === 0) {
        return {
          hasErrors: false,
          errors: [],
          message: "项目运行正常，未检测到错误",
        };
      }

      const errorSummary = errors.map((e: any, i: number) =>
        `${i + 1}. [${e.type}] ${e.message}${e.filename ? ` (${e.filename}${e.lineno ? `:${e.lineno}` : ''})` : ''}${e.stack ? `\n   Stack: ${e.stack.split('\n').slice(0, 3).join('\n   ')}` : ''}`
      ).join('\n');

      return {
        hasErrors: true,
        count: errors.length,
        errors,
        message: `检测到 ${errors.length} 个错误:\n${errorSummary}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error), errors: [] };
    }
  },
});

const createPreviewTool = tool({
  description: "创建预览项目。初始化项目目录和基本结构。",
  inputSchema: z.object({
    sessionId: z.string().describe("会话ID，用于标识项目"),
  }),
  execute: async ({ sessionId }) => {
    try {
      const result = await mpPreviewService.createProject(sessionId);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});

const startPreviewTool = tool({
  description: "启动预览服务。安装依赖（如需要）并启动开发服务器。如果已启动会自动重启。",
  inputSchema: z.object({
    sessionId: z.string().describe("会话ID"),
  }),
  execute: async ({ sessionId }) => {
    try {
      const result = await mpPreviewService.startPreview(sessionId);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});

const getPreviewStatusTool = tool({
  description: "获取预览项目状态。包括编译状态、预览URL等信息。",
  inputSchema: z.object({
    sessionId: z.string().describe("会话ID"),
  }),
  execute: async ({ sessionId }) => {
    try {
      const project = mpPreviewService.getProjectStatus(sessionId);
      if (!project) {
        return { found: false, message: "项目未找到" };
      }
      return {
        found: true,
        id: project.id,
        name: project.name,
        status: project.status,
        previewUrl: project.previewUrl,
        port: project.port,
        createdAt: project.createdAt,
        message: `项目状态: ${project.status}`,
      };
    } catch (error: any) {
      return { error: error.message || String(error) };
    }
  },
});

const clearPreviewErrorsTool = tool({
  description: "清除预览错误记录。",
  inputSchema: z.object({
    sessionId: z.string().describe("会话ID"),
  }),
  execute: async ({ sessionId }) => {
    try {
      mpPreviewService.clearErrors(sessionId);
      return { success: true, message: "错误记录已清除" };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});

const taroLucideTabbarGenerateTool = tool({
  description: "为tabbar生成png格式的lucide图标。如tabbar的home.png和home-active.png。",
  inputSchema: z.object({
    icons: z.array(z.string()).describe("图标名称数组，如 ['House', 'Settings', 'User']"),
    default_color: z.string().describe("默认状态颜色，如 '#999999'"),
    active_color: z.string().describe("选中状态颜色，如 '#1890ff'"),
  }),
  execute: async ({ icons, default_color, active_color }) => {
    try {
      const projectPath = getCurrentProjectPath();
      const outputDir = path.join(projectPath, "src/assets/images/tabbar");
      const command = `cd ${projectPath} && node_modules/.bin/taro-lucide-tabbar ${icons.join(" ")} -c "${default_color}" -a "${active_color}" -o "${outputDir}"`;

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
        exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
          if (error) {
            resolve({ stdout, stderr, exitCode: (error as any).code || 1 });
          } else {
            resolve({ stdout, stderr, exitCode: 0 });
          }
        });
      });

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: result.stderr || "图标生成失败",
          stdout: result.stdout,
        };
      }

      const generatedImages = icons.map((name) => ({
        name,
        path: `${outputDir}/${name}.png`,
        activePath: `${outputDir}/${name}-active.png`,
      }));

      return {
        success: true,
        message: `成功生成 ${generatedImages.length} 个图标`,
        command,
        images: generatedImages,
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  },
});

export const codeTools = {
  searchCodebaseTool,
  grepSearchTool,
  findByNameTool,
  readFileTool,
  viewCodeItemTool,
  listDirTool,
  writeToFileTool,
  replaceFileContentTool,
  deleteFileTool,
  taroLucideTabbarGenerateTool,
  checkErrorsTool,
  createPreviewTool,
  startPreviewTool,
  getPreviewStatusTool,
  clearPreviewErrorsTool,
};
