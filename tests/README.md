# Test Fixtures

This directory contains test fixtures for the Command Launcher Package Action.

## Structure

```
tests/
├── README.md              # This file
├── single-package/        # Single-package mode test
│   ├── manifest.mf
│   └── README.md
├── valid/                 # Valid plugin manifests (multi-package mode)
│   ├── valid-plugin/
│   │   ├── manifest.mf
│   │   └── README.md
│   └── yaml-plugin/
│       ├── manifest.mf
│       └── README.md
└── invalid/               # Invalid plugin manifests
    └── invalid-plugin/
        └── manifest.mf
```

## Test Cases

### Single-Package Mode (`tests/single-package/`)

Tests the action when `packages-directory` is empty and root contains `manifest.mf`.

**Expected behavior:**
- ✅ Action detects single-package mode
- ✅ Validation succeeds
- ✅ Packaging succeeds

### Valid Plugins (`tests/valid/`)

Tests multi-package mode with valid manifests.

- **valid-plugin** - JSON format manifest with all required fields
- **yaml-plugin** - YAML format manifest demonstrating format support

**Expected behavior:**
- ✅ Validation succeeds
- ✅ Packaging succeeds
- ✅ Documentation generation succeeds

### Invalid Plugins (`tests/invalid/`)

Tests validation failure handling.

- **invalid-plugin** - Invalid version format (`not-a-valid-version` instead of semantic versioning)

**Expected behavior:**
- ❌ Validation fails
- ❌ Packaging does not occur

## Running Tests

### Using npm (Recommended)

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Using GitHub Actions Workflow

The `.github/workflows/test.yml` workflow automatically tests:

1. **build-and-test** - Builds TypeScript and runs unit tests
2. **test-validation-valid** - Validates `tests/valid/` (should succeed)
3. **test-validation-invalid** - Validates `tests/invalid/` (should fail)
4. **test-packaging** - Packages `tests/valid/` plugins

### Using act (Local Testing)

```bash
# List all test jobs
act --list

# Run specific test
act -j test-validation-valid
act -j test-packaging
```

## Adding New Test Cases

### Adding a Valid Plugin

1. Create a new directory under `tests/valid/`:
   ```bash
   mkdir tests/valid/my-new-plugin
   ```

2. Add a valid `manifest.mf` (JSON or YAML):
   ```json
   {
     "pkgName": "my-new-plugin",
     "version": "1.0.0",
     "cmds": [
       {
         "name": "my-cmd",
         "type": "executable",
         "short": "Description",
         "executable": "{{.PackageDir}}/bin/my-cmd"
       }
     ]
   }
   ```

3. Add a `README.md` (optional but recommended)

### Adding an Invalid Plugin

1. Create a new directory under `tests/invalid/`:
   ```bash
   mkdir tests/invalid/my-invalid-plugin
   ```

2. Add an **invalid** `manifest.mf`:
   ```jsonc
   {
     "pkgName": "my-invalid-plugin",
     "version": "v1.0.0",  // ❌ Wrong - has 'v' prefix
     "cmds": []             // ❌ Wrong - empty commands
   }
   ```

3. Document what's invalid in the directory name or README

## Test Coverage

The test suite covers:

- ✅ Single-package mode detection
- ✅ Multi-package mode detection
- ✅ Valid JSON manifests
- ✅ Valid YAML manifests
- ✅ Invalid version formats
- ✅ Missing required fields
- ✅ Package creation (.pkg files)
- ✅ GitHub Release creation
- ✅ OCI registry push

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) runs on:
- Every pull request
- Every push to `main`

It uses `continue-on-error: true` for the invalid plugin test and verifies that validation correctly failed.
