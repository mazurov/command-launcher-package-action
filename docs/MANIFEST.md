# Manifest Format Reference

This guide provides comprehensive documentation for the `manifest.mf` format used by Command Launcher packages.

## Overview

Your package must include a `manifest.mf` file in **JSON or YAML format** following the Command Launcher specification.

📖 **Official specification**: [Command Launcher Manifest Documentation](https://criteo.github.io/command-launcher/docs/overview/manifest/)

## Quick Examples

### JSON Format

```json
{
  "pkgName": "my-plugin",
  "version": "1.0.0",
  "cmds": [
    {
      "name": "my-plugin",
      "type": "executable",
      "short": "A brief description of what this plugin does",
      "executable": "{{.PackageDir}}/bin/my-plugin"
    }
  ],
  "_metadata": {
    "author": "Your Name <email@example.com>",
    "license": "MIT",
    "homepage": "https://example.com"
  }
}
```

### YAML Format

```yaml
pkgName: my-plugin
version: 1.0.0
cmds:
  - name: my-plugin
    type: executable
    short: A brief description of what this plugin does
    executable: "{{.PackageDir}}/bin/my-plugin"
_metadata:
  author: "Your Name <email@example.com>"
  license: MIT
  homepage: https://example.com
```

## Complete Example with Flags and Metadata

This example demonstrates all commonly used features:

```yaml
pkgName: awesome-tool
version: 2.1.0
cmds:
  - name: deploy
    type: executable
    group: deployment
    short: Deploy application to cloud
    long: |
      Deploys your application to the specified cloud environment
      with comprehensive configuration options and validation.
    executable: "{{.PackageDir}}/bin/deploy.{{if eq .Os \"windows\"}}exe{{else}}sh{{end}}"
    flags:
      - name: environment
        short: e
        desc: Target environment (dev, staging, prod)
        type: string
        required: true
      - name: dry-run
        short: d
        desc: Perform a dry run without actual deployment
        type: bool
        required: false
      - name: timeout
        short: t
        desc: Deployment timeout in seconds
        type: string
        default: "300"
      - name: verbose
        short: v
        desc: Enable verbose logging
        type: bool
        required: false

  - name: rollback
    type: executable
    group: deployment
    short: Rollback to previous version
    long: Rollback the application to the previously deployed version
    executable: "{{.PackageDir}}/bin/rollback.{{if eq .Os \"windows\"}}exe{{else}}sh{{end}}"
    flags:
      - name: environment
        short: e
        desc: Target environment to rollback
        type: string
        required: true

_metadata:
  author: "DevOps Team <devops@example.com>"
  license: Apache-2.0
  homepage: https://awesome-tool.example.com
  repository: https://github.com/example/awesome-tool
  tags:
    - deployment
    - devops
    - cloud
  description: A comprehensive deployment tool for cloud applications
```

## Release Notes Preview

When you create a GitHub Release with this action, the release notes automatically include:

✅ **Plugin Information** - From `_metadata` fields:
- Author, license, homepage
- Repository link
- Tags for categorization

✅ **Command Documentation** - Auto-generated from `cmds`:
- Command names and descriptions
- All flags with types and defaults
- Usage examples

✅ **README Content** - Your plugin's README.md

✅ **Installation Instructions** - Multiple installation methods:
- Direct CLI installation
- index.json configuration
- OCI registry (when available)

**Example Release Notes Structure:**

```markdown
# awesome-tool v2.1.0

A comprehensive deployment tool for cloud applications

**Author**: DevOps Team <devops@example.com>
**License**: Apache-2.0
**Homepage**: https://awesome-tool.example.com

## Commands

### deploy
Deploy application to cloud

Flags:
- `--environment, -e` (string, required) - Target environment (dev, staging, prod)
- `--dry-run, -d` (bool) - Perform a dry run without actual deployment
- `--timeout, -t` (string, default: "300") - Deployment timeout in seconds
- `--verbose, -v` (bool) - Enable verbose logging

### rollback
Rollback to previous version

Flags:
- `--environment, -e` (string, required) - Target environment to rollback

## Installation

[Installation methods...]

## Documentation

[Your README.md content...]
```

## Key Fields Reference

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **pkgName** | string | Package name (unique identifier) | `"my-plugin"` |
| **version** | string | Semantic version (no `v` prefix) | `"1.0.0"` |
| **cmds** | array | Array of commands (at least one) | See below |

### Command Fields

**Required in each command:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **name** | string | Command name (lowercase, hyphens) | `"my-command"` |
| **type** | string | Command type | `"executable"`, `"alias"`, or `"starlark"` |

**Recommended:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **short** | string | Brief one-line description | `"Deploy application"` |
| **long** | string | Detailed multi-line description | `"Deploys your app..."` |
| **group** | string | Command group/category | `"deployment"` |
| **executable** | string | Path to executable (for type=executable) | `"{{.PackageDir}}/bin/cmd"` |

**Optional:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **flags** | array | Command flags/options | See Flag Fields below |
| **args** | array | Static arguments | `["--verbose"]` |
| **validArgs** | array | Argument completion options | `["dev", "prod"]` |
| **validArgsCmd** | array | Dynamic completion command | `["bash", "-c", "echo dev prod"]` |

### Flag Fields

Each flag in the `flags` array can have:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **name** | string | Flag name (required) | `"environment"` |
| **short** | string | Single-letter shortcut | `"e"` |
| **desc** | string | Flag description | `"Target environment"` |
| **type** | string | Flag type: `"string"` or `"bool"` | `"string"` |
| **default** | string | Default value (for string flags) | `"dev"` |
| **required** | boolean | Whether flag is mandatory | `true` |

### Metadata Fields (Optional but Recommended)

The `_metadata` object supports these fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **author** | string | Author name and email | `"John Doe <john@example.com>"` |
| **license** | string | License identifier | `"MIT"`, `"Apache-2.0"` |
| **homepage** | string | Package website URL | `"https://example.com"` |
| **repository** | string | Source code repository URL | `"https://github.com/user/repo"` |
| **tags** | array | Tags for categorization | `["devops", "deployment"]` |
| **description** | string | Short package description | `"A deployment tool"` |

> **Important**: The `_metadata` fields are automatically included in GitHub Release notes when you create a release with this action. This provides comprehensive documentation for package users.

## Template Variables

Use these template variables in your manifest for cross-platform support:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{.PackageDir}}` | Package installation directory | `/home/user/.cola/packages/my-package` |
| `{{.Os}}` | Operating system | `windows`, `linux`, `darwin` |
| `{{.Arch}}` | Architecture | `amd64`, `arm64` |

**Example with templates:**

```yaml
executable: "{{.PackageDir}}/bin/tool.{{if eq .Os \"windows\"}}exe{{else}}sh{{end}}"
```

This resolves to:
- Windows: `C:\Users\user\.cola\packages\tool\bin\tool.exe`
- Linux/Mac: `/home/user/.cola/packages/tool/bin/tool.sh`

## Validation Rules

The action validates these rules:

✅ **Package Name**
- Must be unique
- Lowercase letters, numbers, hyphens allowed
- No underscores or uppercase

✅ **Version**
- Must be semantic version: `MAJOR.MINOR.PATCH`
- Valid: `1.0.0`, `2.1.3`, `1.0.0-beta`
- Invalid: `v1.0.0`, `1.0`, `1`

✅ **Commands**
- At least one command required
- Command names: lowercase, hyphens only
- Valid: `my-command`
- Invalid: `My-Command`, `my_command`

✅ **Command Type**
- Must be: `executable`, `alias`, or `starlark`
- If `type: executable`, then `executable` field is required

✅ **File Format**
- Must be valid JSON or YAML
- No comments in JSON (use YAML for comments)

## Common Patterns

### Multi-Command Plugin

```yaml
pkgName: devtools
version: 1.0.0
cmds:
  - name: build
    type: executable
    group: development
    short: Build the project
    executable: "{{.PackageDir}}/bin/build.sh"

  - name: test
    type: executable
    group: development
    short: Run tests
    executable: "{{.PackageDir}}/bin/test.sh"

  - name: deploy
    type: executable
    group: deployment
    short: Deploy to production
    executable: "{{.PackageDir}}/bin/deploy.sh"
```

### Cross-Platform Executable

```yaml
executable: "{{.PackageDir}}/bin/{{.Os}}/{{.Arch}}/tool{{if eq .Os \"windows\"}}.exe{{end}}"
```

### Boolean Flags

```yaml
flags:
  - name: verbose
    short: v
    desc: Enable verbose output
    type: bool
    required: false

  - name: force
    short: f
    desc: Force operation without confirmation
    type: bool
    required: false
```

### Required String Flags

```yaml
flags:
  - name: environment
    short: e
    desc: Target environment
    type: string
    required: true

  - name: region
    short: r
    desc: Cloud region
    type: string
    required: true
```

## See Also

- [Official Command Launcher Manifest Docs](https://criteo.github.io/command-launcher/docs/overview/manifest/)
- [Repository Modes](REPOSITORY_MODES.md)
- [Package Installation Methods](INSTALLATION.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Main README](../README.md)
