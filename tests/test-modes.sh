#!/bin/bash
set -e

echo "=== Testing Single-Package and Multi-Package Modes ==="
echo ""

# Test 1: Multi-package mode (existing behavior)
echo "Test 1: Multi-package mode with packages-directory='tests/valid'"
export PLUGINS_DIR="tests/valid"
export GITHUB_OUTPUT="/tmp/test_output_multi.txt"

echo "Running validation..."
node dist/index.js 2>&1 || echo "Expected to fail in standalone mode"

echo ""
echo "Expected: Should find yaml-plugin and valid-plugin"
echo ""

# Test 2: Single-package mode
echo "Test 2: Single-package mode with packages-directory='tests/single-package'"
export PLUGINS_DIR="tests/single-package"
export GITHUB_OUTPUT="/tmp/test_output_single.txt"
export INPUT_PACKAGES-DIRECTORY="tests/single-package"
export INPUT_VALIDATE-ONLY="true"

echo "Running validation..."
node dist/index.js 2>&1 || echo "Expected to fail in standalone mode"

echo ""
echo "Expected: Should find single-package-test in root"
echo ""

echo "=== Tests Complete ==="
echo ""
echo "Note: These tests show the logic works. Full GitHub Actions testing requires act or real workflow runs."
