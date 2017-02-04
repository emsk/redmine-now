#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --win --x64
mkdir -p ./dist/win
mv './dist/Redmine Now Setup 0.3.0.exe' ./dist/win/RedmineNowSetup-0.3.0.exe
mv './dist/latest.yml' ./dist/win
