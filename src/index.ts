#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(homedir(), '.claude', 'skills');
const CATALOG_PATH = join(__dirname, '..', 'skills', 'catalog.json');
const SKILLS_ROOT = join(__dirname, '..', 'skills');

interface SkillEntry {
  name: string;
  category: string;
  description: string;
  file: string;
  tags: string[];
}

interface Catalog {
  version: string;
  skills: SkillEntry[];
}

function loadCatalog(): Catalog {
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
}

function isInstalled(name: string): boolean {
  return existsSync(join(SKILLS_DIR, name, 'skill.md'));
}

function installSkill(entry: SkillEntry): void {
  const src = join(SKILLS_ROOT, entry.file);
  if (!existsSync(src)) {
    console.error(`  ✗ ${entry.name}: skill file not found at ${entry.file}`);
    return;
  }
  const dest = join(SKILLS_DIR, entry.name);
  mkdirSync(dest, { recursive: true });
  copyFileSync(src, join(dest, 'skill.md'));
  console.log(`  ✓ ${entry.name}`);
}

const program = new Command();

program
  .name('skills')
  .description('Origammi Claude Code skills marketplace')
  .version('0.1.0');

program
  .command('list')
  .description('List all available skills')
  .option('-c, --category <category>', 'filter by category')
  .option('-t, --tag <tag>', 'filter by tag')
  .action((opts) => {
    const catalog = loadCatalog();
    let skills = catalog.skills;
    if (opts.category) skills = skills.filter(s => s.category === opts.category);
    if (opts.tag) skills = skills.filter(s => s.tags.includes(opts.tag));

    const categories = [...new Set(skills.map(s => s.category))];
    for (const cat of categories) {
      console.log(`\n[${cat}]`);
      for (const s of skills.filter(s => s.category === cat)) {
        const status = isInstalled(s.name) ? '✓' : '○';
        console.log(`  ${status} ${s.name.padEnd(30)} ${s.description.slice(0, 60)}`);
      }
    }
    console.log('\n✓ = installed  ○ = not installed');
  });

program
  .command('install [names...]')
  .description('Install one or more skills (or use --all / --category)')
  .option('-a, --all', 'install all skills')
  .option('-c, --category <category>', 'install all skills in a category')
  .option('-f, --force', 'overwrite already installed skills')
  .action((names: string[], opts) => {
    const catalog = loadCatalog();
    let targets: SkillEntry[] = [];

    if (opts.all) {
      targets = catalog.skills;
    } else if (opts.category) {
      targets = catalog.skills.filter(s => s.category === opts.category);
    } else if (names.length > 0) {
      for (const name of names) {
        const found = catalog.skills.find(s => s.name === name);
        if (!found) {
          console.error(`✗ Unknown skill: ${name}`);
          process.exit(1);
        }
        targets.push(found);
      }
    } else {
      console.error('Specify skill names, --all, or --category <cat>');
      process.exit(1);
    }

    if (!opts.force) {
      targets = targets.filter(s => {
        if (isInstalled(s.name)) {
          console.log(`  — ${s.name} already installed (use --force to overwrite)`);
          return false;
        }
        return true;
      });
    }

    if (targets.length === 0) {
      console.log('Nothing to install.');
      return;
    }

    console.log(`Installing ${targets.length} skill(s)...`);
    for (const entry of targets) installSkill(entry);
    console.log('\nDone. Restart Claude Code to pick up new skills.');
  });

program
  .command('info <name>')
  .description('Show skill details')
  .action((name: string) => {
    const catalog = loadCatalog();
    const skill = catalog.skills.find(s => s.name === name);
    if (!skill) {
      console.error(`Unknown skill: ${name}`);
      process.exit(1);
    }
    console.log(`\nName:     ${skill.name}`);
    console.log(`Category: ${skill.category}`);
    console.log(`Tags:     ${skill.tags.join(', ')}`);
    console.log(`Status:   ${isInstalled(skill.name) ? 'installed' : 'not installed'}`);
    console.log(`\n${skill.description}`);
  });

program
  .command('uninstall <name>')
  .description('Remove a skill from ~/.claude/skills')
  .action((name: string) => {
    const path = join(SKILLS_DIR, name, 'skill.md');
    if (!existsSync(path)) {
      console.error(`${name} is not installed.`);
      process.exit(1);
    }
    rmSync(join(SKILLS_DIR, name), { recursive: true });
    console.log(`✓ ${name} removed.`);
  });

program.parse();
