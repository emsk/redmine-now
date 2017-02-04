#!/usr/bin/env bash
cd $(dirname $0)/..
$(yarn bin)/eslint './{app,test}/*.js' || exit 0
