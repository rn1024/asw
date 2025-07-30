import { Command } from '../vendor/commander.js';
import inquirer from '../vendor/inquirer.js';
import yaml from '../vendor/js-yaml.js';
import fs from '../vendor/fs-extra.js';
import os from 'node:os';
import path from 'node:path';

const configDir = path.join(os.homedir(), '.asw');
const profilesFile = path.join(configDir, 'profiles.yml');
const keysDir = path.join(configDir, 'keys');
const stateFile = path.join(configDir, 'state.json');
const claudeSettings = path.join(os.homedir(), '.claude', 'settings.json');

fs.ensureDirSync(configDir);
fs.ensureDirSync(keysDir);

const program = new Command();
program
  .name('asw')
  .description('AI profile switcher');

function loadProfiles() {
  if (!fs.existsSync(profilesFile)) return {};
  const data = fs.readFileSync(profilesFile, 'utf8');
  return yaml.load(data) || {};
}

function saveProfiles(profiles) {
  const data = yaml.dump(profiles, { indent: 2 });
  fs.writeFileSync(profilesFile, data);
}

function loadState() {
  if (!fs.existsSync(stateFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

async function promptKey(message) {
  const { apiKey } = await inquirer.prompt([
    { type: 'password', name: 'apiKey', message, mask: '*', validate: v => v ? true : '不可为空' }
  ]);
  return apiKey;
}

function defaultKeyEnv(profile) {
  const name = profile.split(/[\-_]/)[0] || 'API';
  return `${name.toUpperCase()}_API_KEY`;
}

program
  .command('add <profile>')
  .requiredOption('--tool <tool>')
  .requiredOption('--url <baseURL>')
  .requiredOption('--model <modelId>')
  .option('--key <apiKey>')
  .option('--key-env <env>')
  .description('添加配置 profile')
  .action(async (profile, options) => {
    try {
      const profiles = loadProfiles();
      if (profiles[profile]) {
        const { overwrite } = await inquirer.prompt([{ type: 'confirm', name: 'overwrite', default: false, message: `profile ${profile} 已存在，是否覆盖?` }]);
        if (!overwrite) return;
      }
      const keyEnv = options.keyEnv || defaultKeyEnv(profile);
      let apiKey = options.key;
      if (!apiKey) {
        apiKey = await promptKey(`首次输入 ${keyEnv}:`);
      }
      profiles[profile] = {
        tool: options.tool,
        base_url: options.url,
        model_id: options.model,
        key_env: keyEnv
      };
      saveProfiles(profiles);
      fs.writeFileSync(path.join(keysDir, `${profile}.key`), apiKey, { mode: 0o600 });
      console.log(`✅ 已保存 profile ${profile}`);
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

program
  .command('use <profile>')
  .description('切换到指定 profile')
  .action(async (profile) => {
    try {
      const profiles = loadProfiles();
      const info = profiles[profile];
      if (!info) throw new Error(`不存在 profile ${profile}`);
      const keyPath = path.join(keysDir, `${profile}.key`);
      let apiKey;
      if (!fs.existsSync(keyPath)) {
        apiKey = await promptKey(`首次输入 ${info.key_env}:`);
        fs.writeFileSync(keyPath, apiKey, { mode: 0o600 });
      } else {
        const { update } = await inquirer.prompt([{ type: 'confirm', name: 'update', default: false, message: 'API Key 已存在，是否更新?' }]);
        if (update) {
          apiKey = await promptKey(`输入新的 ${info.key_env}:`);
          fs.writeFileSync(keyPath, apiKey, { mode: 0o600 });
        } else {
          apiKey = fs.readFileSync(keyPath, 'utf8');
        }
      }
      let settings = { env: {} };
      if (fs.existsSync(claudeSettings)) {
        try {
          settings = JSON.parse(fs.readFileSync(claudeSettings, 'utf8'));
        } catch {}
      } else {
        fs.ensureDirSync(path.dirname(claudeSettings));
      }
      settings.env = settings.env || {};
      settings.env.ANTHROPIC_BASE_URL = info.base_url;
      settings.env.ANTHROPIC_AUTH_TOKEN = apiKey;
      settings.env.ANTHROPIC_MODEL = info.model_id;
      fs.writeFileSync(claudeSettings, JSON.stringify(settings, null, 2));
      saveState({ current: profile });
      console.log(`✅ Claude Code 已切换到 ${profile}`);
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

program
  .command('ls')
  .description('列出所有 profiles')
  .action(() => {
    try {
      const profiles = loadProfiles();
      const names = Object.keys(profiles).sort();
      const state = loadState();
      names.forEach(name => {
        const star = state.current === name ? '* ' : '  ';
        console.log(`${star}${name}`);
      });
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

program
  .command('current')
  .description('显示当前 profile')
  .action(() => {
    try {
      const state = loadState();
      console.log(state.current || '(none)');
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

program
  .command('rm <profile>')
  .description('删除指定 profile')
  .action(async (profile) => {
    try {
      const profiles = loadProfiles();
      if (!profiles[profile]) throw new Error(`不存在 profile ${profile}`);
      const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', default: false, message: `确定删除 profile ${profile}?` }]);
      if (!confirm) return;
      delete profiles[profile];
      saveProfiles(profiles);
      const keyPath = path.join(keysDir, `${profile}.key`);
      if (fs.existsSync(keyPath)) fs.removeSync(keyPath);
      const state = loadState();
      if (state.current === profile) fs.removeSync(stateFile);
      console.log(`✅ 已删除 profile ${profile}`);
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

program
  .command('key <profile>')
  .description('更新指定 profile 的 API Key')
  .action(async (profile) => {
    try {
      const profiles = loadProfiles();
      const info = profiles[profile];
      if (!info) throw new Error(`不存在 profile ${profile}`);
      const keyPath = path.join(keysDir, `${profile}.key`);
      let proceed = true;
      if (fs.existsSync(keyPath)) {
        const ans = await inquirer.prompt([{ type: 'confirm', name: 'yes', default: false, message: 'API Key 已存在，是否更新?' }]);
        proceed = ans.yes;
      }
      if (!proceed) return;
      const apiKey = await promptKey(`输入新的 ${info.key_env}:`);
      fs.writeFileSync(keyPath, apiKey, { mode: 0o600 });
      console.log('✅ 密钥已更新');
    } catch (err) {
      console.error(`❌ ${err.message}`);
    }
  });

export async function main(argv = process.argv) {
  await program.parseAsync(argv);
}
