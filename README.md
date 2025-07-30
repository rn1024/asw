# asw

A simple registry manager for AI services inspired by [nrm](https://github.com/Pana/nrm).
All dependencies are bundled locally so you can run without installation.

## Installation

```bash
chmod +x bin/asw
```

## Usage

```bash
./bin/asw add <profile> --tool <tool> --url <baseURL> --model <modelId> [--key <apiKey>|--key-env <ENV>]
./bin/asw use <profile>
./bin/asw ls
./bin/asw current
./bin/asw rm <profile>
./bin/asw key <profile>
```

Run `./bin/asw --help` for command information.

## Testing

```bash
npm test
```

## License

MIT
