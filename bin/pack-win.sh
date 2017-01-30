#!/usr/bin/env bash
cd $(dirname $0)/..
$(npm bin)/build --win --x64
mv './dist/win/Redmine Now Setup 0.3.0.exe' ./dist/win/RedmineNowSetup-0.3.0.exe
