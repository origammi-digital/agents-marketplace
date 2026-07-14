#!/usr/bin/env node
// Portable skill regression guards. Runs on Node alone — the runtime this repo
// already requires (the `agents` CLI runs on it). No API key, no network, no
// extra deps, no build step. A guard that only runs in a privileged environment
// doesn't guard anything.
//
//   node evals/skill-hygiene.mjs        (or: npm test)

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = join(REPO_ROOT, 'skills', 'catalog.json');

// ── Load skills from the catalog ─────────────────────────────────────────────

function allSkills() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const skills = [];
  for (const plugin of catalog.plugins) {
    for (const s of plugin.skills) {
      skills.push({
        plugin: plugin.name,
        installAs: s.installAs,
        version: s.version,
        description: s.description,
        file: join(REPO_ROOT, s.file),
      });
    }
  }
  return skills;
}

function raw(skill) {
  return readFileSync(skill.file, 'utf8');
}

function body(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text;
  return text.slice(end + 4).replace(/^\n+/, '');
}

// ── Guards ───────────────────────────────────────────────────────────────────

// Product-specific leakage that must never appear in a "generic" skill
// (PR #1 extracted these from red-team/blue-team; this keeps them out).
const PRODUCT_LEAKAGE = /\b(b2p|b2p-backend|BACEN|logger\.(InfoS|WarnS|ErrorS)|identity\.FromContext)\b/i;

// Raw harness tool names that break `agents export` to Cursor/Codex/Gemini —
// skills must name the ACTION ("dispatch a subagent"), not the tool.
const TOOL_NAME_LITERALS = /(?<![`\w])(TodoWrite|AskUserQuestion)(?![`\w])/g;

// Each check guards a failure mode this repo has actually hit or is structurally
// exposed to — no padding. See evals/README.md for the rationale.
const checks = {
  // The native restructure (c3f2c6f) moved skill files and left catalog paths
  // stale, breaking the CLI. This catches that class of drift.
  every_skill_file_exists() {
    for (const s of allSkills()) {
      if (!existsSync(s.file)) throw new Error(`${s.installAs}: file missing at ${s.file}`);
    }
  },

  // The security skills came from a b2p fintech project; PR #1 stripped that
  // context out. Nothing else stops a future edit from pasting it back.
  no_product_specific_leakage() {
    const offenders = [];
    for (const s of allSkills()) {
      const m = raw(s).match(PRODUCT_LEAKAGE);
      if (m) offenders.push(`${s.installAs}: ${m[0]}`);
    }
    if (offenders.length) throw new Error('product-specific leakage found:\n  ' + offenders.join('\n  '));
  },

  // writing-skills requires naming the action, not the tool, so bodies survive
  // `agents export` to Cursor/Codex/Gemini. Cheap to guard.
  no_raw_tool_names_in_bodies() {
    const offenders = [];
    for (const s of allSkills()) {
      const hits = [...body(raw(s)).matchAll(TOOL_NAME_LITERALS)].map(m => m[1]);
      if (hits.length) offenders.push(`${s.installAs}: ${[...new Set(hits)].join(', ')}`);
    }
    if (offenders.length)
      throw new Error('raw harness tool names found (name the action, not the tool):\n  ' + offenders.join('\n  '));
  },
};

// ── Runner ───────────────────────────────────────────────────────────────────

let failures = 0;
const names = Object.keys(checks);
for (const name of names) {
  try {
    checks[name]();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}
console.log(`\n${names.length - failures}/${names.length} hygiene checks passed.`);
process.exit(failures ? 1 : 0);
