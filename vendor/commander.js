export class Command {
  constructor(name) {
    this.nameValue = name;
    this.descriptionValue = '';
    this.options = [];
    this.commands = [];
    this.actionFn = null;
  }
  name(n) { this.nameValue = n; return this; }
  description(d) { this.descriptionValue = d; return this; }
  command(usage) {
    const [name] = usage.split(/\s+/);
    const cmd = new Command(name);
    this.commands.push(cmd);
    return cmd;
  }
  requiredOption(flag) { this.options.push({ flag, required: true }); return this; }
  option(flag) { this.options.push({ flag, required: false }); return this; }
  action(fn) { this.actionFn = fn; return this; }
  async parseAsync(argv) {
    const [, , sub, ...rest] = argv;
    if (!sub || sub === '--help' || sub === '-h') return this.showHelp();
    const cmd = this.commands.find(c => c.nameValue === sub);
    if (!cmd) return console.error(`Unknown command ${sub}`);
    await cmd._execute(rest);
  }
  async _execute(args) {
    const opts = {};
    const positional = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const val = args[i + 1];
        if (val && !val.startsWith('--')) { opts[key] = val; i++; }
        else opts[key] = true;
      } else {
        positional.push(arg);
      }
    }
    const profile = positional[0];
    for (const opt of this.options) {
      const name = opt.flag.replace(/^--/, '').split(' ')[0];
      if (opt.required && opts[name] === undefined) throw new Error(`missing required option --${name}`);
    }
    if (this.actionFn) await this.actionFn(profile, opts);
  }
  showHelp() {
    console.log(`Usage: ${this.nameValue} <command> [options]`);
    this.commands.forEach(c => {
      console.log(`  ${c.nameValue}\t${c.descriptionValue}`);
    });
  }
}
export default { Command };
