#!/usr/bin/env bash
cd $(dirname $0)/..
$(npm bin)/build --win --x64
mv './dist/win/Redmine Now Setup 0.2.0.exe' ./dist/win/RedmineNowSetup-0.2.0.exe
