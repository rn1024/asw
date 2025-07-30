import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';

const bin = path.resolve('bin/asw');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asw-test-'));
const env = { ...process.env, HOME: tmp };

function run(args, input = '\n') {
  return spawnSync('node', [bin, ...args], { env, input, encoding: 'utf8' });
}

// add profile
let res = run(['add', 'p1', '--tool', 'claude', '--url', 'http://x', '--model', 'm1', '--key', '123']);
assert.strictEqual(res.status, 0);
assert(fs.existsSync(path.join(tmp, '.asw', 'profiles.yml')));

// use profile
res = run(['use', 'p1']);
assert.strictEqual(res.status, 0);
const state = JSON.parse(fs.readFileSync(path.join(tmp, '.asw', 'state.json'), 'utf8'));
assert.strictEqual(state.current, 'p1');

// ls
res = run(['ls']);
assert.strictEqual(res.status, 0);
assert(res.stdout.includes('p1'));

console.log('All tests passed');


