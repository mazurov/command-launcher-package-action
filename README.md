# Command Launcher Package Action

A comprehensive GitHub Action for Command Launcher package lifecycle management. Automates validation and packaging for package repositories.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- ✅ **Manifest Validation** - Validates package manifests against Command Launcher specification
- 📦 **Multi-format Packaging** - Creates .pkg archives for releases and/or pushes to OCI registries
- 🔄 **Flexible Repository Modes** - Supports both single-package and multi-package repositories
- 🔗 **Automatic Repository Linking** - OCI packages are automatically linked to your GitHub repository via OCI annotations
- 📝 **Rich Release Notes** - Auto-generates comprehensive documentation from manifests
- 🔧 **Local Testing** - Full support for local testing without GitHub infrastructure
- 🚀 **Easy Integration** - Simple YAML configuration for any package repository

## 📚 Ready-to-Use Examples

### Live Example Repositories

See this action in use:

- **[Single Package Example](https://github.com/mazurov/cdt-package-example)** - Example of single-package repository mode
- **[Multi-Package Example](https://github.com/mazurov/cdt-packages-monorepo-example)** - Example of multi-package repository mode (monorepo)

### Workflow Template

Check out the complete CI/CD workflow example:

- **[Full CI/CD Pipeline](examples/workflows/plugins-ci.yml)** - Complete automation with validation, testing, and releases

This example includes:
- ✅ Manifest validation on every push and PR
- 📦 Test packaging on PRs
- 🚀 Automated releases to GitHub and OCI registry
- 🧹 Artifact cleanup

## Quick Start

> **Repository Modes**: This action supports both single-package and multi-package repositories. See [Repository Modes](docs/REPOSITORY_MODES.md) for detailed information.

### Basic Usage (Validation Only)

```yaml
name: Validate Package

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mazurov/command-launcher-package-action@v1
        with:
          validate-only: 'true'
```

For multi-package repositories, specify the packages directory:
```yaml
packages-directory: 'packages'  # Scans packages/* for manifest.mf files
```

### Package and Release

```yaml
name: Release Packages

on:
  push:
    branches: [main]

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: mazurov/command-launcher-package-action@v1
        with:
          packages-directory: 'packages'  # Optional: for multi-package repos
          package-format: 'both'  # Creates .pkg AND pushes to OCI
          oci-registry: 'ghcr.io/${{ github.repository_owner }}'
          packages-namespace: 'command-launcher'  # Optional: defaults to '' (no namespace)
          oci-username: ${{ github.actor }}
          oci-token: ${{ secrets.GITHUB_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}  # Creates individual releases
```

Users can install your package with:
```bash
cdt package install --file https://github.com/user/repo/releases/download/package_my-package_1.0.0/my-package-1.0.0.pkg
```

> **Note:** When using GitHub Actions with `${{ secrets.GITHUB_TOKEN }}`, packages pushed to GitHub Container Registry are automatically linked to your repository via OCI annotations (`org.opencontainers.image.source`). This enables the package page to display your repository's README and allows permission inheritance.

See [Package Installation Methods](docs/INSTALLATION.md) for all installation options.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `packages-directory` | No | `''` (empty) | **Empty (default)**: Checks root for `manifest.mf` (single-package) or scans root subdirectories (multi-package). **Set to path** (e.g., `'packages'`): Scans that directory for subdirectories with `manifest.mf`. |
| `validate-only` | No | `false` | Only validate manifests without packaging |
| `package-format` | No | `zip` | Package format: `zip` (creates .pkg archives), `oci` (pushes to registry), or `both` |
| `oci-registry` | No | - | OCI registry URL (e.g., `ghcr.io/username`) |
| `packages-namespace` | No | `''` (empty) | Namespace path in OCI registry (e.g., `project-name`). Empty by default (no namespace) |
| `oci-username` | No | - | OCI registry username |
| `oci-token` | No | - | OCI registry token/password |
| `github-token` | No | - | GitHub token for creating individual releases per package |
| `force-release` | No | `false` | Force recreate releases by deleting existing releases and tags first |

## Outputs

| Output | Description |
|--------|-------------|
| `validated-packages` | JSON array of validated package directories |
| `packaged-artifacts` | JSON array of created artifact paths |
| `docs-url` | URL to generated documentation |

## Manifest Format

Your package must include a `manifest.mf` file in **JSON or YAML format**.

### Quick Example

```json
{
  "pkgName": "my-package",
  "version": "1.0.0",
  "cmds": [
    {
      "name": "my-command",
      "type": "executable",
      "short": "A brief description of what this package does",
      "executable": "{{.PackageDir}}/bin/my-command"
    }
  ],
  "_metadata": {
    "author": "Your Name <email@example.com>",
    "license": "MIT",
    "homepage": "https://example.com"
  }
}
```

**What's included in releases**:
- Package metadata (author, license, homepage)
- Command documentation with flags
- Your README.md content
- Installation instructions

For complete examples, field reference, and validation rules, see:
- 📝 [Manifest Format Reference](docs/MANIFEST.md)
- 📖 [Command Launcher Specification](https://criteo.github.io/command-launcher/docs/overview/manifest/)

## Required Permissions

When creating releases or pushing to OCI registries, add these permissions to your workflow:

```yaml
permissions:
  contents: write    # For creating releases
  packages: write    # For OCI registry push
```

## Documentation

- 📁 [Repository Modes and Structure](docs/REPOSITORY_MODES.md) - Single vs multi-package repositories
- 📝 [Manifest Format Reference](docs/MANIFEST.md) - Complete manifest specification
- 📦 [Package Installation Methods](docs/INSTALLATION.md) - How users install your packages
- 🔧 [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- 🤝 [Contributing Guide](CONTRIBUTING.md) - Development setup and guidelines

## Contributing

Contributions are welcome! For development setup, testing, and contribution guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## References

- [Command Launcher Documentation](https://criteo.github.io/command-launcher/)
- [Manifest Specification](https://criteo.github.io/command-launcher/docs/overview/manifest/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ORAS Documentation](https://oras.land/)

## Support

- 📝 [Report Issues](https://github.com/mazurov/command-launcher-package-action/issues)
- 💬 [Discussions](https://github.com/mazurov/command-launcher-package-action/discussions)
- 📖 [Documentation](https://github.com/mazurov/command-launcher-package-action/wiki)

---

**Maintained by**: Alexander Mazurov
**License**: MIT
**Version**: 1.0.0
