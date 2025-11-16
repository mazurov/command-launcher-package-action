# Repository Modes and Structure

This guide explains the two repository structures supported by Command Launcher Package Action and how the action detects which mode to use.

## Overview

Command Launcher Package Action supports **two repository structures**:

1. **Single-Package Repository** - Your entire repository is a single plugin
2. **Multi-Package Repository** - Your repository contains multiple packages in subdirectories

## 🎯 Single-Package Repository

Your repository **is** the package - `manifest.mf` is located at the root level.

### Structure

```
my-plugin/                # Repository root
├── manifest.mf           # Plugin manifest (required)
├── README.md             # Documentation (recommended)
├── bin/                  # Executables
│   ├── my-plugin.sh
│   └── my-plugin.bat
├── lib/                  # Libraries
│   └── helper.js
├── src/                  # Source code
│   └── main.ts
└── .github/
    └── workflows/
        └── release.yml   # GitHub Actions workflow
```

### How it works

When `packages-directory` input is **empty** (default), the action:
1. Checks if the root directory contains `manifest.mf`
2. If found → treats the root directory as a single plugin
3. Validates and packages that plugin

### Usage Example

```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    # No packages-directory needed - checks root for manifest.mf
    validate-only: 'true'
```

### Best for

- Simple packages with a single purpose
- Plugins maintained in dedicated repositories
- Easier to version and release (one plugin = one repo)

## 📦 Multi-Package Repository

Your repository **contains** multiple packages, each in its own subdirectory.

### Structure

```
my-packages-repo/          # Repository root
├── packages/             # Packages directory (customizable)
│   ├── plugin-one/
│   │   ├── manifest.mf   # Required
│   │   ├── README.md     # Recommended
│   │   ├── bin/
│   │   │   └── run.sh
│   │   └── lib/
│   ├── plugin-two/
│   │   ├── manifest.mf
│   │   ├── README.md
│   │   └── src/
│   │       └── index.js
│   └── plugin-three/
│       ├── manifest.mf
│       └── README.md
└── .github/
    └── workflows/
        └── release.yml
```

### How it works

The action scans for subdirectories containing `manifest.mf` files:

**Case 1: `packages-directory` is empty AND no root `manifest.mf`**
- Scans current directory's subdirectories
- Example: `my-repo/plugin1/manifest.mf`, `my-repo/plugin2/manifest.mf`

**Case 2: `packages-directory` is set** (e.g., `'packages'`)
- Scans that specific directory for subdirectories with `manifest.mf`
- Example: `my-repo/packages/plugin1/manifest.mf`

### Usage Example

**With packages directory:**
```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    packages-directory: 'packages'  # Scans packages/* for manifest.mf files
    validate-only: 'true'
```

**Root subdirectories (no packages folder):**
```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    packages-directory: ''  # Scans root subdirectories
    validate-only: 'true'
```

### Best for

- Related packages sharing common infrastructure
- Monorepo setups
- Plugin collections with shared CI/CD

## Release Tag Format

Each plugin gets its own release with a unique tag format: `package_<name>_<version>`

### Examples

```
package_my-plugin_1.0.0
package_my-plugin_1.1.0
package_another-plugin_2.0.0
```

### Benefits

- Multiple plugin versions coexist in the same repository
- Clear separation between different packages
- Easy to track which plugin version was released
- Works seamlessly with GitHub Releases

### Release Creation

When you push a new version:

1. **Single-Package**: Creates release `package_my-plugin_1.0.0`
2. **Multi-Package**: Creates separate releases for each plugin:
   - `package_plugin-one_1.0.0`
   - `package_plugin-two_2.0.0`
   - `package_plugin-three_1.5.0`

## Detection Logic Summary

The action uses this logic to determine repository mode:

```
1. Is packages-directory set to a path?
   YES → Scan that directory for subdirectories with manifest.mf
   NO  → Continue to step 2

2. Does root contain manifest.mf?
   YES → Single-package mode (package root directory)
   NO  → Continue to step 3

3. Scan root subdirectories for manifest.mf files
   → Multi-package mode
```

## Choosing the Right Mode

| Factor | Single-Package | Multi-Package |
|--------|----------------|---------------|
| **Number of packages** | 1 | 2+ |
| **Repository structure** | Root is the package | Subdirectories are packages |
| **Versioning** | One version per repo | Independent versions |
| **CI/CD** | Simpler workflows | Shared workflows |
| **Maintenance** | Easier for single plugin | Better for related packages |

## Back to Documentation

- [Main README](../README.md)
- [Manifest Format Reference](MANIFEST.md)
- [Package Installation Methods](INSTALLATION.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
