import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

function ask(query, mask) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input, output });
    if (mask) {
      output.write(query);
      input.setRawMode(true);
      let val = '';
      const onData = ch => {
        ch = ch.toString();
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          output.write('\n');
          input.setRawMode(false);
          input.off('data', onData);
          rl.close();
          resolve(val);
        } else if (ch === '\u0003') process.exit(1);
        else if (ch === '\u007f') { if (val) { val = val.slice(0,-1); output.write('\b \b'); } }
        else { val += ch; output.write('*'); }
      };
      input.on('data', onData);
    } else {
      rl.question(query, ans => { rl.close(); resolve(ans); });
    }
  });
}

export async function prompt(questions) {
  const answers = {};
  for (const q of questions) {
    if (q.type === 'confirm') {
      const ans = await ask(`${q.message} `, false);
      const res = ans.trim() || (q.default ? 'y' : 'n');
      answers[q.name] = /^y/i.test(res);
    } else if (q.type === 'password') {
      let val;
      do {
        val = await ask(`${q.message} `, true);
        if (q.validate) {
          const ok = q.validate(val);
          if (ok === true) break;
          console.log(ok);
        } else break;
      } while (true);
      answers[q.name] = val;
    } else {
      answers[q.name] = await ask(`${q.message} `, false);
    }
  }
  return answers;
}

export default { prompt };
