#!/usr/bin/env bash
cd $(dirname $0)/..
$(npm bin)/eslint './{app,test}/*.js' || exit 0
