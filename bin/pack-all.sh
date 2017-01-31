#!/usr/bin/env bash
cd $(dirname $0)/..
$(npm bin)/build --mac --win --x64
mv './dist/mac/Redmine Now-0.3.0.dmg' ./dist/mac/RedmineNowSetup-0.3.0.dmg
mv './dist/win/Redmine Now Setup 0.3.0.exe' ./dist/win/RedmineNowSetup-0.3.0.exe
