# Package Installation Methods

This guide explains how **end-users** install packages that are packaged and released using Command Launcher Package Action.

> **Note**: This documentation is for package users, not for developers using the Command Launcher Package Action. If you're looking to set up the action in your repository, see the [main README](../README.md).

## Overview

Packages created with Command Launcher Package Action can be installed using Command Launcher (`cdt`) in three ways:

1. **Direct CLI Installation** - Download and install from GitHub Release URL
2. **index.json Configuration** - Add to index file for managed installations
3. **OCI Registry** - Pull from container registry *(coming soon)*

## Method 1: Direct CLI Installation

The simplest way to install a package is directly from the GitHub Release URL.

### Usage

```bash
cdt package install --file <RELEASE_URL>
```

### Example

```bash
cdt package install --file https://github.com/user/repo/releases/download/package_my-plugin_1.0.0/my-plugin-1.0.0.pkg
```

### Finding the Release URL

1. Go to the repository's Releases page
2. Find the release for your package version (e.g., `package_my-plugin_1.0.0`)
3. Right-click the `.pkg` file and copy the download link
4. Use that URL with `cdt package install --file`

### Best for

- Quick installations
- Testing packages
- One-time installations
- Manual package management

## Method 2: index.json Configuration

For managed package installations, add the package to your Command Launcher `index.json` file.

### Usage

Edit your `index.json` file (location varies by installation) and add an entry:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "checksum": "sha256-checksum-here",
  "url": "https://github.com/user/repo/releases/download/package_my-plugin_1.0.0/my-plugin-1.0.0.pkg",
  "startPartition": 0,
  "endPartition": 9
}
```

### Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Plugin package name (from manifest `pkgName`) | `"my-plugin"` |
| `version` | Plugin version to install | `"1.0.0"` |
| `checksum` | SHA256 checksum of the .pkg file | `"sha256-abc123..."` |
| `url` | Download URL for the .pkg file | `"https://github.com/..."` |
| `startPartition` | Start partition for plugin distribution | `0` |
| `endPartition` | End partition for plugin distribution | `9` |

### Finding the Checksum

The checksum is available in the GitHub Release:

1. Go to the release page
2. Look for the `.pkg.sha256` file
3. Download or view the file to get the checksum
4. Use the value in your `index.json`

Alternatively, calculate it locally:

```bash
# Download the .pkg file
curl -L -o plugin.pkg https://github.com/user/repo/releases/download/package_my-plugin_1.0.0/my-plugin-1.0.0.pkg

# Calculate checksum
sha256sum plugin.pkg
```

### Complete Example

```json
{
  "packages": [
    {
      "name": "my-deployment-tool",
      "version": "2.1.0",
      "checksum": "sha256-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "url": "https://github.com/example/packages/releases/download/package_deployment-tool_2.1.0/deployment-tool-2.1.0.pkg",
      "startPartition": 0,
      "endPartition": 9
    },
    {
      "name": "my-testing-plugin",
      "version": "1.5.3",
      "checksum": "sha256-z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1",
      "url": "https://github.com/example/packages/releases/download/package_testing-plugin_1.5.3/testing-plugin-1.5.3.pkg",
      "startPartition": 0,
      "endPartition": 9
    }
  ]
}
```

### Best for

- Managed enterprise deployments
- Consistent package versions across teams
- Automated package distribution
- Centralized configuration management

## Method 3: OCI Registry *(Coming Soon)*

Install packages directly from OCI (Open Container Initiative) registries like GitHub Container Registry.

> **Status**: This feature is being implemented in Command Launcher. The Command Launcher Package Action already supports pushing to OCI registries - this installation method will be available soon.

### Planned Usage

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "url": "oci://ghcr.io/user/my-plugin:1.0.0",
  "startPartition": 0,
  "endPartition": 9
}
```

### Benefits (When Available)

- No checksum needed (built into OCI)
- Faster downloads with layer caching
- Better version management
- Standard container registry tooling

### Enabling OCI Push in Your Repository

If you're a package developer, you can already enable OCI registry pushes:

```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    package-format: 'both'  # Creates .pkg AND pushes to OCI
    oci-registry: 'ghcr.io/${{ github.repository_owner }}'
    oci-username: ${{ github.actor }}
    oci-token: ${{ secrets.GITHUB_TOKEN }}
```

When Command Launcher supports OCI installation, your packages will be ready!

## Comparison

| Feature | Direct CLI | index.json | OCI Registry |
|---------|-----------|------------|--------------|
| **Ease of use** | ⭐⭐⭐ Very easy | ⭐⭐ Moderate | ⭐⭐⭐ Easy |
| **Management** | Manual | Centralized | Centralized |
| **Automation** | No | Yes | Yes |
| **Checksums** | Manual | Required | Built-in |
| **Best for** | Testing | Enterprise | Modern workflows |
| **Availability** | ✅ Now | ✅ Now | 🔜 Coming soon |

## Version Updates

### Direct CLI

To update to a new version:

```bash
# Remove old version
cdt package uninstall my-plugin

# Install new version
cdt package install --file https://github.com/user/repo/releases/download/package_my-plugin_2.0.0/my-plugin-2.0.0.pkg
```

### index.json

Update the version and URL in your index.json:

```jsonc
{
  "name": "my-plugin",
  "version": "2.0.0",  // Updated version
  "checksum": "sha256-new-checksum-here",  // Updated checksum
  "url": "https://github.com/user/repo/releases/download/package_my-plugin_2.0.0/my-plugin-2.0.0.pkg",  // Updated URL
  "startPartition": 0,
  "endPartition": 9
}
```

Then run:
```bash
cdt package update
```

## Troubleshooting

### Installation fails with checksum mismatch

**Problem**: The downloaded .pkg file doesn't match the expected checksum.

**Solution**:
1. Re-download the .pkg file (may have been corrupted)
2. Verify the checksum value in index.json matches the .pkg.sha256 file
3. Recalculate the checksum locally to confirm

### Package not found after installation

**Problem**: Command Launcher can't find the installed package.

**Solution**:
1. Verify installation: `cdt package list`
2. Check the package name matches the manifest `pkgName`
3. Restart your shell to refresh the environment

### Download fails with 404 error

**Problem**: The URL in index.json or CLI command is invalid.

**Solution**:
1. Verify the release exists on GitHub
2. Check the tag format: `package_<name>_<version>`
3. Ensure the .pkg filename matches: `<name>-<version>.pkg`

## See Also

- [Manifest Format Reference](MANIFEST.md) - For plugin developers
- [Repository Modes](REPOSITORY_MODES.md) - For plugin developers
- [Main README](../README.md) - For setting up Command Launcher Package Action
- [Command Launcher Documentation](https://criteo.github.io/command-launcher/) - Official docs
