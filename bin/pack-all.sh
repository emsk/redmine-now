#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --mac --win --x64

mv './dist/mac/Redmine Now-0.3.0.dmg' ./dist/mac/RedmineNowSetup-0.3.0.dmg

mkdir -p ./dist/win
mv './dist/Redmine Now Setup 0.3.0.exe' ./dist/win/RedmineNowSetup-0.3.0.exe
mv './dist/latest.yml' ./dist/win
