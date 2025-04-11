#!/bin/bash -x
[ ! -d '/tmp/cache' ] && mkdir -p /tmp/cache
[ ! -d '/tmp/.npm' ] && mkdir -p /tmp/.npm
export HOME=/tmp
export npm_config_cache=/tmp/.npm
exec node server.js