# asw

A simple registry manager for AI services inspired by [nrm](https://github.com/Pana/nrm).
All dependencies are bundled locally so you can run without installation.

## Installation

Install the CLI globally from npm:

```bash
npm install -g asw
```

For local development before publishing, you can link the current checkout:

```bash
npm link
```

## Usage

```bash
asw add <profile> --tool <tool> --url <baseURL> --model <modelId> [--key <apiKey>|--key-env <ENV>]
asw use <profile>
asw ls
asw current
asw rm <profile>
asw key <profile>
```

Run `asw --help` for command information.

## Testing

```bash
npm test
```

## License

MIT
