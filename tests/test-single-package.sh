#!/bin/bash

echo "=== Testing Single-Package Mode ==="
echo ""

# Set GitHub Actions input environment variables
export INPUT_VALIDATE-ONLY="true"

# Test with single-package directory
echo "Testing with packages-directory='tests/single-package'"
export INPUT_PACKAGES-DIRECTORY="tests/single-package"

# Run the action
cd /Users/a.mazurov/dev/criteo/cola-plugin-action
node dist/index.js

echo ""
echo "=== Test Complete ==="
