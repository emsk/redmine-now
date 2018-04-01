#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/build --mac --win --x64 --publish never

mv './dist/Redmine Now-0.4.0.dmg' ./dist/mac/RedmineNowSetup-0.4.0.dmg
mv './dist/Redmine Now-0.4.0.dmg.blockmap' ./dist/mac
mv ./dist/latest-mac.yml ./dist/mac

mkdir -p ./dist/win
mv './dist/Redmine Now Setup 0.4.0.exe' ./dist/win/RedmineNowSetup-0.4.0.exe
mv './dist/Redmine Now Setup 0.4.0.exe.blockmap' ./dist/win
mv ./dist/latest.yml ./dist/win
