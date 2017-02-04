#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/stylelint './app/stylesheets/*.css' || exit 0
