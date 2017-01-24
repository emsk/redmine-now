#!/usr/bin/env bash
cd $(dirname $0)/..
$(npm bin)/build --mac --x64
mv './dist/mac/Redmine Now-0.2.0.dmg' ./dist/mac/RedmineNowSetup-0.2.0.dmg
