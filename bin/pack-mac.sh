#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --mac --x64
mv './dist/Redmine Now-0.4.0.dmg' ./dist/mac/RedmineNowSetup-0.4.0.dmg
mv './dist/Redmine Now-0.4.0.dmg.blockmap' ./dist/mac
mv ./dist/latest-mac.yml ./dist/mac
