#!/usr/bin/env bash
cd $(dirname $0)/..
if [ ! -e './dist/mac/Redmine Now.app' ]; then
  $(yarn bin)/build --mac --x64 --publish never
fi
$(yarn bin)/ava
