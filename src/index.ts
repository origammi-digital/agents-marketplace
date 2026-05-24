#!/usr/bin/env node
import { Command } from 'commander';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, copyFileSync, rmSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLAUDE_SKILLS_DIR = join(homedir(), '.claude', 'skills');
const CATALOG_PATH = join(__dirname, '..', 'skills', 'catalog.json');
const REPO_ROOT = join(__dirname, '..');

// ── Types ──────────────────────────────────────────────────────────────────

interface SkillEntry {
  skill: string;
  installAs: string;
  description: string;
  file: string;
  tags: string[];
  version: string;
  isReference?: boolean;
  dependencies?: string[];
}

interface Plugin {
  name: string;
  description: string;
  skills: SkillEntry[];
}

interface Catalog {
  version: string;
  plugins: Plugin[];
}

interface InstalledMeta {
  version: string;
  installedAt: string;
}

type Platform = 'claude' | 'cursor' | 'codex' | 'gemini';

// ── Helpers ────────────────────────────────────────────────────────────────

function loadCatalog(): Catalog {
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
}

function skillFilePath(entry: SkillEntry): string {
  return join(REPO_ROOT, 'plugins', entry.file.replace('plugins/', ''));
}

function readSkillContent(entry: SkillEntry): string {
  return readFileSync(skillFilePath(entry), 'utf8');
}

/** Strip YAML frontmatter (between the first two `---` lines). */
function stripFrontmatter(content: string): string {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return content;
  const end = lines.indexOf('---', 1);
  if (end === -1) return content;
  return lines.slice(end + 1).join('\n').replace(/^\n+/, '');
}

/** Extract frontmatter value by key. */
function frontmatterValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

function isInstalled(installAs: string): boolean {
  return existsSync(join(CLAUDE_SKILLS_DIR, installAs, 'skill.md'));
}

function getInstalledMeta(installAs: string): InstalledMeta | null {
  const metaPath = join(CLAUDE_SKILLS_DIR, installAs, 'meta.json');
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8')) as InstalledMeta;
  } catch {
    return null;
  }
}

function findPlugin(catalog: Catalog, name: string): Plugin | undefined {
  return catalog.plugins.find(p => p.name === name);
}

function findSkillByInstallAs(
  catalog: Catalog,
  installAs: string,
): { plugin: Plugin; entry: SkillEntry } | undefined {
  for (const plugin of catalog.plugins) {
    const entry = plugin.skills.find(s => s.installAs === installAs);
    if (entry) return { plugin, entry };
  }
}

function resolveTargets(catalog: Catalog, targets: string[], all: boolean): SkillEntry[] {
  if (all) return catalog.plugins.flatMap(p => p.skills);
  const out: SkillEntry[] = [];
  for (const target of targets) {
    const plugin = findPlugin(catalog, target);
    if (plugin) { out.push(...plugin.skills); continue; }
    const found = findSkillByInstallAs(catalog, target);
    if (found) { out.push(found.entry); continue; }
    console.error(`✗ Unknown plugin or skill: "${target}"`);
    process.exit(1);
  }
  return out;
}

/** Returns only non-reference dependencies that need to be installed as separate skills. */
function resolveDependencies(catalog: Catalog, skills: SkillEntry[]): SkillEntry[] {
  const seen = new Set(skills.map(s => s.installAs));
  const result = [...skills];
  const queue = [...skills];

  while (queue.length > 0) {
    const skill = queue.shift()!;
    for (const dep of skill.dependencies ?? []) {
      if (seen.has(dep)) continue;
      const found = findSkillByInstallAs(catalog, dep);
      if (!found) {
        console.error(`  ✗ Dependency "${dep}" required by "${skill.installAs}" not found in catalog`);
        process.exit(1);
      }
      // References are companion files — installed alongside the skill, not as separate skills
      if (found.entry.isReference) continue;
      seen.add(dep);
      result.push(found.entry);
      queue.push(found.entry);
    }
  }

  return result;
}

/** Returns reference dependencies that are copied as companion files into the skill directory. */
function collectReferences(catalog: Catalog, entry: SkillEntry): SkillEntry[] {
  const refs: SkillEntry[] = [];
  for (const dep of entry.dependencies ?? []) {
    const found = findSkillByInstallAs(catalog, dep);
    if (found?.entry.isReference) refs.push(found.entry);
  }
  return refs;
}

// ── Claude Code adapter ───────────────────────────────────────────────────

function installClaude(catalog: Catalog, entry: SkillEntry, force: boolean): void {
  const meta = getInstalledMeta(entry.installAs);
  if (isInstalled(entry.installAs) && !force) {
    if (meta && meta.version === entry.version) {
      console.log(`  — ${entry.installAs} @ ${entry.version} (already up to date)`);
    } else if (meta) {
      console.log(`  ↑ ${entry.installAs} ${meta.version} → ${entry.version} available (--force to update)`);
    } else {
      console.log(`  — ${entry.installAs} already installed (--force to overwrite)`);
    }
    return;
  }
  const src = skillFilePath(entry);
  if (!existsSync(src)) {
    console.error(`  ✗ ${entry.installAs}: file not found at ${entry.file}`);
    return;
  }
  const dest = join(CLAUDE_SKILLS_DIR, entry.installAs);
  mkdirSync(dest, { recursive: true });
  copyFileSync(src, join(dest, 'skill.md'));

  // Copy reference companions into the skill directory as <name>.md
  for (const ref of collectReferences(catalog, entry)) {
    const refSrc = skillFilePath(ref);
    if (existsSync(refSrc)) {
      copyFileSync(refSrc, join(dest, `${ref.installAs}.md`));
    }
  }

  const newMeta: InstalledMeta = { version: entry.version, installedAt: new Date().toISOString() };
  writeFileSync(join(dest, 'meta.json'), JSON.stringify(newMeta, null, 2));
  const prev = meta ? ` (was ${meta.version})` : '';
  console.log(`  ✓ ${entry.installAs} @ ${entry.version}${prev}`);
}

// ── Cursor adapter ────────────────────────────────────────────────────────

function exportCursor(skills: SkillEntry[], outDir: string): void {
  const rulesDir = join(outDir, '.cursor', 'rules');
  mkdirSync(rulesDir, { recursive: true });

  for (const entry of skills) {
    const raw = readSkillContent(entry);
    const description = frontmatterValue(raw, 'description') || entry.description;
    const body = stripFrontmatter(raw);

    const mdc = `---
description: ${description}
globs:
alwaysApply: false
---

${body}`.trimEnd() + '\n';

    const dest = join(rulesDir, `${entry.installAs}.mdc`);
    writeFileSync(dest, mdc, 'utf8');
    console.log(`  ✓ .cursor/rules/${entry.installAs}.mdc @ ${entry.version}`);
  }
}

// ── Codex (OpenAI) adapter ────────────────────────────────────────────────

function exportCodex(skills: SkillEntry[], outDir: string): string {
  const sections = skills.map(entry => {
    const raw = readSkillContent(entry);
    const body = stripFrontmatter(raw);
    return `## ${entry.installAs}\n\n> ${entry.description}\n\n${body}`;
  });

  const content = `# Agents\n\n<!-- Generated by @origammi/agents-marketplace -->\n\n${sections.join('\n\n---\n\n')}\n`;
  const dest = join(outDir, 'AGENTS.md');
  writeFileSync(dest, content, 'utf8');
  return dest;
}

// ── Gemini adapter ────────────────────────────────────────────────────────

function exportGemini(skills: SkillEntry[], outDir: string): string {
  const sections = skills.map(entry => {
    const raw = readSkillContent(entry);
    const body = stripFrontmatter(raw);
    return `## ${entry.installAs}\n\n> ${entry.description}\n\n${body}`;
  });

  const content = `# Agents\n\n<!-- Generated by @origammi/agents-marketplace -->\n\n${sections.join('\n\n---\n\n')}\n`;
  const dest = join(outDir, 'GEMINI.md');
  writeFileSync(dest, content, 'utf8');
  return dest;
}

// ── CLI ────────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('agents')
  .description('Origammi agents marketplace — install or export AI agents for any platform')
  .version('0.4.0');

// LIST
program
  .command('list')
  .description('List all plugins and their agents')
  .option('-p, --plugin <name>', 'show only a specific plugin')
  .option('-t, --tag <tag>', 'filter by tag')
  .option('-u, --updates', 'show only agents with available updates')
  .action((opts) => {
    const catalog = loadCatalog();
    let plugins = catalog.plugins;
    if (opts.plugin) plugins = plugins.filter(p => p.name === opts.plugin);

    for (const plugin of plugins) {
      let skills = plugin.skills.filter(s => !s.isReference);
      if (opts.tag) skills = skills.filter(s => s.tags.includes(opts.tag));
      if (opts.updates) skills = skills.filter(s => {
        const meta = getInstalledMeta(s.installAs);
        return meta && meta.version !== s.version;
      });
      if (skills.length === 0) continue;

      const installedCount = skills.filter(s => isInstalled(s.installAs)).length;
      const updateCount = skills.filter(s => {
        const meta = getInstalledMeta(s.installAs);
        return meta && meta.version !== s.version;
      }).length;

      console.log(`\n[${plugin.name}] ${plugin.description}`);
      const updateNote = updateCount > 0 ? `  ↑ ${updateCount} update(s) available` : '';
      console.log(`  ${installedCount}/${skills.length} installed (Claude Code)${updateNote}`);

      for (const s of skills) {
        const meta = getInstalledMeta(s.installAs);
        const installed = isInstalled(s.installAs);

        let status: string;
        let versionInfo: string;

        if (!installed) {
          status = '○';
          versionInfo = s.version.padEnd(12);
        } else if (meta && meta.version !== s.version) {
          status = '↑';
          versionInfo = `${meta.version}→${s.version}`.padEnd(12);
        } else {
          status = '✓';
          versionInfo = (meta?.version ?? s.version).padEnd(12);
        }

        console.log(`  ${status} ${s.installAs.padEnd(30)} ${versionInfo} ${s.description.slice(0, 50)}`);
      }
    }
    console.log('\n✓ = up to date  ↑ = update available  ○ = not installed');
  });

// INSTALL (Claude Code)
program
  .command('install [targets...]')
  .description('Install agents into Claude Code (~/.claude/skills/). Targets: plugin name or individual agent name.')
  .option('-a, --all', 'install all agents')
  .option('-f, --force', 'overwrite already installed agents')
  .option('-u, --update', 'update agents that have a newer version available')
  .action((targets: string[], opts) => {
    const catalog = loadCatalog();
    if (targets.length === 0 && !opts.all) {
      console.error('Specify a plugin name, agent name, or --all');
      process.exit(1);
    }
    let toInstall = resolveDependencies(
      catalog,
      resolveTargets(catalog, targets, opts.all ?? false),
    );

    if (opts.update && !opts.force) {
      // In update mode without force: only install if not installed or version differs
      toInstall = toInstall.filter(entry => {
        if (!isInstalled(entry.installAs)) return true;
        const meta = getInstalledMeta(entry.installAs);
        return !meta || meta.version !== entry.version;
      });
    }

    if (toInstall.length === 0) { console.log('Nothing to install or update.'); return; }

    console.log(`Installing ${toInstall.length} agent(s) into Claude Code...`);
    for (const entry of toInstall) installClaude(catalog, entry, opts.force ?? false);
    console.log('\nDone. Restart Claude Code to load new agents.');
  });

// EXPORT (multi-platform)
program
  .command('export [targets...]')
  .description('Export agents for a specific AI platform')
  .requiredOption('-p, --platform <platform>', 'target platform: cursor | codex | gemini')
  .option('-a, --all', 'export all agents')
  .option('-o, --output <path>', 'output directory (default: current directory)')
  .action((targets: string[], opts) => {
    const catalog = loadCatalog();
    const platform = opts.platform as Platform;
    const validPlatforms: Platform[] = ['cursor', 'codex', 'gemini'];

    if (!validPlatforms.includes(platform)) {
      console.error(`✗ Unknown platform: "${platform}". Valid: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }

    if (targets.length === 0 && !opts.all) {
      console.error('Specify a plugin name, agent name, or --all');
      process.exit(1);
    }

    const skills = resolveTargets(catalog, targets, opts.all ?? false);
    if (skills.length === 0) { console.log('Nothing to export.'); return; }

    const outDir = resolve(opts.output ?? process.cwd());
    console.log(`Exporting ${skills.length} agent(s) for ${platform} → ${outDir}\n`);

    switch (platform) {
      case 'cursor': {
        exportCursor(skills, outDir);
        console.log(`\nDone. Commit .cursor/rules/ to your project repo.`);
        console.log(`Cursor picks up rules automatically when you open the project.`);
        break;
      }
      case 'codex': {
        const dest = exportCodex(skills, outDir);
        console.log(`  ✓ ${dest}`);
        console.log(`\nDone. Commit AGENTS.md to your project repo.`);
        console.log(`Codex reads it automatically when running in that directory.`);
        break;
      }
      case 'gemini': {
        const dest = exportGemini(skills, outDir);
        console.log(`  ✓ ${dest}`);
        console.log(`\nDone. Commit GEMINI.md to your project repo.`);
        console.log(`Gemini CLI reads it automatically when running in that directory.`);
        break;
      }
    }
  });

// INFO
program
  .command('info <target>')
  .description('Show details for a plugin or agent')
  .action((target: string) => {
    const catalog = loadCatalog();

    const plugin = findPlugin(catalog, target);
    if (plugin) {
      console.log(`\nPlugin: ${plugin.name}`);
      console.log(`${plugin.description}\n`);
      for (const s of plugin.skills) {
        const meta = getInstalledMeta(s.installAs);
        const installed = isInstalled(s.installAs);
        let statusLine: string;
        if (!installed) {
          statusLine = `○ not installed  (catalog: ${s.version})`;
        } else if (meta && meta.version !== s.version) {
          statusLine = `↑ installed ${meta.version} → ${s.version} available`;
        } else {
          statusLine = `✓ installed ${meta?.version ?? s.version}`;
        }
        console.log(`  ${s.installAs.padEnd(30)} [${statusLine}]`);
        console.log(`  ${s.description}`);
        console.log(`  tags: ${s.tags.join(', ')}\n`);
      }
      return;
    }

    const found = findSkillByInstallAs(catalog, target);
    if (found) {
      const { plugin, entry } = found;
      const meta = getInstalledMeta(entry.installAs);
      const installed = isInstalled(entry.installAs);
      let statusLine: string;
      if (!installed) {
        statusLine = 'not installed';
      } else if (meta && meta.version !== entry.version) {
        statusLine = `${meta.version} installed, ${entry.version} available — run: agents install --force ${entry.installAs}`;
      } else {
        statusLine = `${meta?.version ?? entry.version} (up to date)`;
      }
      console.log(`\nAgent:     ${entry.installAs}`);
      console.log(`Plugin:    ${plugin.name}`);
      console.log(`Version:   ${statusLine}`);
      if (meta) console.log(`Installed: ${meta.installedAt}`);
      console.log(`Tags:      ${entry.tags.join(', ')}`);
      console.log(`\n${entry.description}`);
      return;
    }

    console.error(`Unknown plugin or agent: "${target}"`);
    process.exit(1);
  });

// UNINSTALL (Claude Code)
program
  .command('uninstall <target>')
  .description('Remove a plugin or agent from Claude Code (~/.claude/skills/)')
  .action((target: string) => {
    const catalog = loadCatalog();
    const toRemove: SkillEntry[] = [];

    const plugin = findPlugin(catalog, target);
    if (plugin) {
      toRemove.push(...plugin.skills.filter(s => isInstalled(s.installAs)));
    } else {
      const found = findSkillByInstallAs(catalog, target);
      if (!found) { console.error(`Unknown plugin or agent: "${target}"`); process.exit(1); }
      toRemove.push(found.entry);
    }

    if (toRemove.length === 0) { console.log('Nothing to uninstall.'); return; }

    for (const entry of toRemove) {
      const path = join(CLAUDE_SKILLS_DIR, entry.installAs);
      if (existsSync(path)) {
        rmSync(path, { recursive: true });
        console.log(`  ✓ removed ${entry.installAs}`);
      }
    }
  });

program.parse();
