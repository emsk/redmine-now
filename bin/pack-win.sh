#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --win --x64 --publish never
mkdir -p ./dist/win
mv './dist/Redmine Now Setup 0.4.0.exe' ./dist/win/RedmineNowSetup-0.4.0.exe
mv './dist/Redmine Now Setup 0.4.0.exe.blockmap' ./dist/win
mv ./dist/latest.yml ./dist/win
