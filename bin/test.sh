#!/usr/bin/env bash
cd $(dirname $0)/..
if [ ! -e './dist/mac/Redmine Now.app' ]; then
  $(npm bin)/build --mac --x64
fi
$(npm bin)/mocha
