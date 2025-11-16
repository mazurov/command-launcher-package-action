# Contributing to Command Launcher Package Action

Thank you for your interest in contributing to Command Launcher Package Action!

## Development Setup

### Prerequisites

```bash
# Install Node.js 20+
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@20

# Install dependencies
npm install
```

## Building the Action

```bash
# Build TypeScript
npm run build

# Package for distribution (creates dist/index.js)
npm run package

# Run all checks (build, format, lint, package)
npm run all
```

## Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Build Output

The action is compiled into:
```
dist/
├── index.js       # Bundled action code (1.5MB)
└── licenses.txt   # Dependency licenses
```

**Note**: The `dist/` folder must be committed as GitHub Actions runs from the compiled JavaScript.

## Testing with act

[act](https://github.com/nektos/act) allows you to run GitHub Actions locally for faster development and testing.

### Install act

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows
choco install act-cli
```

### Run workflows locally

```bash
# List all available jobs
act --list

# Output:
# - build-and-test           (Build and Unit Test)
# - test-packaging           (Test Packaging (.pkg))
# - test-validation-valid    (Test Validation - Valid Packages)
# - test-validation-invalid  (Test Validation - Invalid Packages)

# Run all jobs with push event
act push

# Run all jobs with pull_request event
act pull_request

# Run specific jobs (use actual job IDs from --list)
act -j build-and-test
act -j test-packaging
act -j test-validation-valid
act -j test-validation-invalid

# Dry run (show what would be executed)
act -n

# Run with verbose output
act -v
```

### Advanced usage

```bash
# Use specific workflow file
act -W .github/workflows/test.yml

# Use specific Docker image for better compatibility (recommended for M-series Macs)
act -P ubuntu-latest=catthehacker/ubuntu:act-latest --container-architecture linux/amd64

# Run specific job with verbose output
act -j test-packaging -v

# Bind mount current directory for live code changes
act --bind
```

### Create .actrc configuration

Create a `.actrc` file in the project root for default options:

```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--bind
-v
```

Now you can simply run: `act`

**Note**: act requires Docker to be installed and running.

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: code refactoring
chore: maintenance tasks
```

## Pull Request Process

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run `npm run all` to verify everything works
6. Commit with conventional commit messages
7. Push to your fork and create a pull request

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated (README.md, CLAUDE.md if applicable)
- [ ] Commit messages follow conventional format
- [ ] `dist/` folder updated (`npm run package`)

## Questions?

- Open a [Discussion](https://github.com/mazurov/command-launcher-package-action/discussions)
- File an [Issue](https://github.com/mazurov/command-launcher-package-action/issues)

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

---

Thank you for contributing!
