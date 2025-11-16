# Troubleshooting Guide

This guide helps you resolve common issues when using Command Launcher Package Action.

## Validation Failures

### Error: Invalid manifest format

**Problem**: Your `manifest.mf` file has syntax errors.

**Common Causes**:

**1. Comments in JSON**

```jsonc
{
  "pkgName": "my-plugin",  // ❌ Wrong - no comments in JSON
  "version": "1.0.0"
}
```

**Solution**: Remove comments or use YAML format:

```json
{
  "pkgName": "my-plugin",
  "version": "1.0.0"
}
```
✅ Correct - no comments in JSON

Or switch to YAML:

```yaml
pkgName: my-plugin  # ✅ Comments allowed in YAML
version: 1.0.0
```

**2. Invalid JSON/YAML syntax**

```jsonc
{
  "pkgName": "my-plugin",
  "version": "1.0.0",  // ❌ Trailing comma
}
```

**Solution**: Use a JSON/YAML validator to check syntax:

```bash
# Validate JSON
jq . manifest.mf

# Validate YAML
yq eval manifest.mf
```

### Error: Invalid version format

**Problem**: Version doesn't follow semantic versioning.

**Common Mistakes**:

```jsonc
"version": "v1.0.0"  // ❌ Wrong - no 'v' prefix
"version": "1.0"     // ❌ Wrong - must have MAJOR.MINOR.PATCH
"version": "1"       // ❌ Wrong - must have MAJOR.MINOR.PATCH
```

**Solution**: Use semantic versioning without prefix:

```jsonc
"version": "1.0.0"         // ✅ Correct
"version": "2.1.3"         // ✅ Correct
"version": "1.0.0-beta"    // ✅ Correct (pre-release)
"version": "1.0.0-rc.1"    // ✅ Correct (release candidate)
```

**Semantic Versioning Format**: `MAJOR.MINOR.PATCH[-PRERELEASE]`

### Error: Missing required field

**Problem**: Your manifest is missing required fields.

**Required Fields**:
- `pkgName` - Package name
- `version` - Version number
- `cmds` - Array of commands (at least one)

**Example of missing field**:

```jsonc
{
  "pkgName": "my-plugin",
  "cmds": [...]
  // ❌ Missing "version" field
}
```

**Solution**: Add all required fields:

```json
{
  "pkgName": "my-plugin",
  "version": "1.0.0",
  "cmds": [
    {
      "name": "my-plugin",
      "type": "executable",
      "executable": "{{.PackageDir}}/bin/my-plugin"
    }
  ]
}
```

### Error: Invalid command name

**Problem**: Command name uses invalid characters.

**Common Mistakes**:

```jsonc
"name": "My-Plugin"   // ❌ Wrong - uppercase letters
"name": "my_plugin"   // ❌ Wrong - underscores not allowed
"name": "myPlugin"    // ❌ Wrong - camelCase not allowed
"name": "my plugin"   // ❌ Wrong - spaces not allowed
```

**Solution**: Use lowercase letters, numbers, and hyphens only:

```jsonc
"name": "my-plugin"   // ✅ Correct
"name": "plugin-123"  // ✅ Correct
"name": "my-tool-v2"  // ✅ Correct
```

**Allowed Pattern**: `^[a-z0-9]+(-[a-z0-9]+)*$`

### Error: Invalid command type

**Problem**: Command type is not recognized.

```jsonc
"type": "script"  // ❌ Wrong - invalid type
```

**Solution**: Use one of the valid types:

```jsonc
"type": "executable"  // ✅ For scripts/binaries
"type": "alias"       // ✅ For command aliases
"type": "starlark"    // ✅ For Starlark scripts
```

### Error: Missing executable for executable type

**Problem**: Command type is `executable` but no `executable` field provided.

```jsonc
{
  "name": "my-command",
  "type": "executable"
  // ❌ Missing "executable" field
}
```

**Solution**: Add the `executable` field:

```json
{
  "name": "my-command",
  "type": "executable",
  "executable": "{{.PackageDir}}/bin/my-command"
}
```

### Error: No manifest.mf found

**Problem**: The action can't find your manifest file.

**Common Causes**:

1. **Wrong filename**: Must be exactly `manifest.mf` (not `manifest.json`, `manifest.yaml`, etc.)
2. **Wrong location**:
   - Single-package mode: Must be at repository root
   - Multi-package mode: Must be in each plugin subdirectory
3. **Wrong directory configuration**: `packages-directory` points to wrong path

**Solution**:

Check file exists:
```bash
# Single-package
ls -la manifest.mf

# Multi-package
ls -la packages/*/manifest.mf
```

Verify workflow configuration:
```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    packages-directory: 'packages'  # Check this path is correct
```

## Packaging Failures

### Error: Package creation failed

**Problem**: The .pkg archive creation failed.

**Common Causes**:

1. **Empty plugin directory**
2. **Missing files referenced in manifest**
3. **File permission issues**

**Solution**:

Check plugin directory contents:
```bash
ls -la packages/my-plugin/
```

Verify executable exists:
```bash
# If manifest has: executable: "{{.PackageDir}}/bin/tool.sh"
# Check that file exists:
ls -la packages/my-plugin/bin/tool.sh
```

Check file permissions:
```bash
# Executables should be executable
chmod +x packages/my-plugin/bin/*.sh
```

### Error: Checksum generation failed

**Problem**: SHA256 checksum calculation failed.

**Solution**:

This usually indicates the .pkg file wasn't created. Check the logs for the packaging error first.

## OCI Push Failures

### Error: Registry authentication failed

**Problem**: Can't authenticate to OCI registry.

**Common Causes**:

1. **Invalid token**
2. **Insufficient permissions**
3. **Wrong registry URL**

**Solution**:

Verify registry URL format (no `https://` prefix):
```yaml
oci-registry: 'ghcr.io/username'  # ✅ Correct
oci-registry: 'https://ghcr.io/username'  # ❌ Wrong
```

Check token has `packages:write` permission:
```yaml
permissions:
  packages: write  # Required for OCI push
```

Verify token is passed correctly:
```yaml
oci-token: ${{ secrets.GITHUB_TOKEN }}  # GitHub token
# or
oci-token: ${{ secrets.GHCR_TOKEN }}    # Custom token
```

### Error: Package already exists

**Problem**: Version already pushed to registry.

**Behavior**: This is **not an error** - the action skips already-published versions.

**Output**:
```
⚠️  Version 1.0.0 already exists in OCI registry: ghcr.io/user/plugin:1.0.0
⚠️  Skipping push (already published)
✅ Packages processed: 1
```

**Solution**: This is expected behavior when re-running workflows. To force re-push:

1. Delete the tag from registry manually, or
2. Increment the version number in manifest.mf

### Error: Network connectivity issues

**Problem**: Can't connect to OCI registry.

**Solution**:

Check network connectivity:
```bash
curl -I https://ghcr.io
```

Verify registry is accessible from GitHub Actions:
- GitHub-hosted runners should have access
- Self-hosted runners may need proxy configuration

## GitHub Release Failures

### Error: Release already exists

**Problem**: Tag or release already exists.

**Common Causes**:

1. Re-running workflow for same version
2. Manual tag creation conflicts

**Solution**:

Use `force-release` to recreate:
```yaml
- uses: mazurov/command-launcher-package-action@v1
  with:
    force-release: 'true'  # Deletes and recreates releases
```

**Warning**: This will delete the existing release and recreate it!

Or increment the version in manifest.mf.

### Error: Insufficient permissions

**Problem**: GitHub token lacks required permissions.

**Solution**:

Add permissions to workflow:
```yaml
permissions:
  contents: write    # Required for creating releases
  packages: write    # Required for OCI registry (if used)
```

Verify token is passed:
```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Repository Mode Detection Issues

### Action detects wrong mode

**Problem**: Action treats single-package repo as multi-package or vice versa.

**Diagnosis**:

Single-package mode requires:
- `manifest.mf` at repository root
- `packages-directory` input empty (default)

Multi-package mode requires:
- `manifest.mf` in subdirectories
- No `manifest.mf` at root (or `packages-directory` set to specific path)

**Solution**:

Check your structure:
```bash
# Single-package: should show manifest at root
ls -la manifest.mf

# Multi-package: should show manifests in subdirectories
find . -name "manifest.mf" -type f
```

Explicitly set `packages-directory` if needed:
```yaml
# Force multi-package mode with specific directory
- uses: mazurov/command-launcher-package-action@v1
  with:
    packages-directory: 'packages'

# Force multi-package mode scanning root subdirectories
- uses: mazurov/command-launcher-package-action@v1
  with:
    packages-directory: '.'
```

See [Repository Modes](REPOSITORY_MODES.md) for details.

## Getting Help

If you're still experiencing issues:

1. **Check logs**: Review the full GitHub Actions logs for detailed error messages
2. **Validate manifest**: Use [Manifest Format Reference](MANIFEST.md) to verify your manifest
3. **Search issues**: Check [existing issues](https://github.com/mazurov/command-launcher-package-action/issues)
4. **Create issue**: [Report a new issue](https://github.com/mazurov/command-launcher-package-action/issues/new) with:
   - Your manifest.mf content
   - Repository structure
   - Full error logs
   - Workflow configuration

## Additional Resources

- [Main README](../README.md)
- [Manifest Format Reference](MANIFEST.md)
- [Repository Modes](REPOSITORY_MODES.md)
- [Package Installation Methods](INSTALLATION.md)
- [Command Launcher Documentation](https://criteo.github.io/command-launcher/)
