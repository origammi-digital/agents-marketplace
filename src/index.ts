#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLAUDE_SKILLS_DIR = join(homedir(), '.claude', 'skills');
const CATALOG_PATH = join(__dirname, '..', 'skills', 'catalog.json');
const REPO_ROOT = join(__dirname, '..');

interface SkillEntry {
  skill: string;
  installAs: string;
  description: string;
  file: string;
  tags: string[];
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

function loadCatalog(): Catalog {
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
}

function isInstalled(installAs: string): boolean {
  return existsSync(join(CLAUDE_SKILLS_DIR, installAs, 'skill.md'));
}

function installSkill(entry: SkillEntry, force = false): void {
  if (isInstalled(entry.installAs) && !force) {
    console.log(`  — ${entry.installAs} already installed (--force to overwrite)`);
    return;
  }
  const src = join(REPO_ROOT, 'plugins', entry.file.replace('plugins/', ''));
  if (!existsSync(src)) {
    console.error(`  ✗ ${entry.installAs}: file not found at ${entry.file}`);
    return;
  }
  const dest = join(CLAUDE_SKILLS_DIR, entry.installAs);
  mkdirSync(dest, { recursive: true });
  copyFileSync(src, join(dest, 'skill.md'));
  console.log(`  ✓ ${entry.installAs}`);
}

function findPlugin(catalog: Catalog, name: string): Plugin | undefined {
  return catalog.plugins.find(p => p.name === name);
}

function findSkillByInstallAs(catalog: Catalog, installAs: string): { plugin: Plugin; entry: SkillEntry } | undefined {
  for (const plugin of catalog.plugins) {
    const entry = plugin.skills.find(s => s.installAs === installAs);
    if (entry) return { plugin, entry };
  }
}

const program = new Command();

program
  .name('skills')
  .description('Origammi Claude Code skills marketplace')
  .version('0.2.0');

// LIST
program
  .command('list')
  .description('List all plugins and their skills')
  .option('-p, --plugin <name>', 'show only a specific plugin')
  .option('-t, --tag <tag>', 'filter skills by tag')
  .action((opts) => {
    const catalog = loadCatalog();
    let plugins = catalog.plugins;
    if (opts.plugin) plugins = plugins.filter(p => p.name === opts.plugin);

    for (const plugin of plugins) {
      let skills = plugin.skills;
      if (opts.tag) skills = skills.filter(s => s.tags.includes(opts.tag));
      if (skills.length === 0) continue;

      const installedCount = skills.filter(s => isInstalled(s.installAs)).length;
      console.log(`\n[${plugin.name}] ${plugin.description}`);
      console.log(`  ${installedCount}/${skills.length} installed`);
      for (const s of skills) {
        const status = isInstalled(s.installAs) ? '✓' : '○';
        console.log(`  ${status} ${s.installAs.padEnd(32)} ${s.description.slice(0, 55)}`);
      }
    }
    console.log('\n✓ = installed  ○ = not installed');
  });

// INSTALL
program
  .command('install [targets...]')
  .description('Install skills. Targets: plugin name (installs all), or individual installAs names.')
  .option('-a, --all', 'install all skills from all plugins')
  .option('-f, --force', 'overwrite already installed skills')
  .action((targets: string[], opts) => {
    const catalog = loadCatalog();
    const force: boolean = opts.force ?? false;
    const toInstall: SkillEntry[] = [];

    if (opts.all) {
      catalog.plugins.forEach(p => toInstall.push(...p.skills));
    } else if (targets.length === 0) {
      console.error('Specify a plugin name, skill name, or --all');
      process.exit(1);
    } else {
      for (const target of targets) {
        const plugin = findPlugin(catalog, target);
        if (plugin) {
          toInstall.push(...plugin.skills);
          continue;
        }
        const found = findSkillByInstallAs(catalog, target);
        if (found) {
          toInstall.push(found.entry);
          continue;
        }
        console.error(`✗ Unknown plugin or skill: "${target}"`);
        process.exit(1);
      }
    }

    if (toInstall.length === 0) {
      console.log('Nothing to install.');
      return;
    }

    console.log(`Installing ${toInstall.length} skill(s)...`);
    for (const entry of toInstall) installSkill(entry, force);
    console.log('\nDone. Restart Claude Code to load new skills.');
  });

// INFO
program
  .command('info <target>')
  .description('Show details for a plugin or skill')
  .action((target: string) => {
    const catalog = loadCatalog();

    const plugin = findPlugin(catalog, target);
    if (plugin) {
      console.log(`\nPlugin: ${plugin.name}`);
      console.log(`${plugin.description}\n`);
      for (const s of plugin.skills) {
        const status = isInstalled(s.installAs) ? '✓ installed' : '○ not installed';
        console.log(`  ${s.installAs.padEnd(30)} [${status}]`);
        console.log(`  ${s.description}`);
        console.log(`  tags: ${s.tags.join(', ')}\n`);
      }
      return;
    }

    const found = findSkillByInstallAs(catalog, target);
    if (found) {
      const { plugin, entry } = found;
      console.log(`\nSkill:   ${entry.installAs}`);
      console.log(`Plugin:  ${plugin.name}`);
      console.log(`Status:  ${isInstalled(entry.installAs) ? 'installed' : 'not installed'}`);
      console.log(`Tags:    ${entry.tags.join(', ')}`);
      console.log(`\n${entry.description}`);
      return;
    }

    console.error(`Unknown plugin or skill: "${target}"`);
    process.exit(1);
  });

// UNINSTALL
program
  .command('uninstall <target>')
  .description('Remove a plugin (all its skills) or a single skill')
  .action((target: string) => {
    const catalog = loadCatalog();
    const toRemove: SkillEntry[] = [];

    const plugin = findPlugin(catalog, target);
    if (plugin) {
      toRemove.push(...plugin.skills.filter(s => isInstalled(s.installAs)));
    } else {
      const found = findSkillByInstallAs(catalog, target);
      if (!found) {
        console.error(`Unknown plugin or skill: "${target}"`);
        process.exit(1);
      }
      toRemove.push(found.entry);
    }

    if (toRemove.length === 0) {
      console.log('Nothing to uninstall.');
      return;
    }

    for (const entry of toRemove) {
      const path = join(CLAUDE_SKILLS_DIR, entry.installAs);
      if (existsSync(path)) {
        rmSync(path, { recursive: true });
        console.log(`  ✓ removed ${entry.installAs}`);
      }
    }
  });

program.parse();
