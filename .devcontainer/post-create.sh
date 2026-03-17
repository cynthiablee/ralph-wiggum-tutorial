#!/bin/bash
# Post-create script for devcontainer
# Runs script/setup after container creation

set -e

echo "installing copilot"
npm install -g @github/copilot

echo "Running post-create setup..."
script/setup
echo "Post-create setup complete!"
