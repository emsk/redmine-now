#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --mac --x64
mv './dist/mac/Redmine Now-0.3.0.dmg' ./dist/mac/RedmineNowSetup-0.3.0.dmg
