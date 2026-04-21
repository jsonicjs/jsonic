#!/usr/bin/env bash
# plugins-parity.sh
#
# Builds this jsonic checkout (TS + Go), then for every sibling plugin
# project in ~/Projects/jsonicjs with a Makefile (excluding jsonic itself),
# temporarily links the plugin against this local jsonic and runs
# `make test` so both the TS and Go sides exercise the current fix.
#
# TS side: node_modules/jsonic is replaced with a symlink to $JSONIC_DIR.
# Go side: a `replace github.com/jsonicjs/jsonic/go => $JSONIC_DIR/go`
# directive is added via `go mod edit` to each plugin's go.mod.
#
# Both overrides are reverted after each plugin runs, whether the test
# passed, failed, or was interrupted. Plugins without an installed
# node_modules get `npm install` run on demand.
#
# Usage:
#   bash test/plugins-parity.sh              # run all plugins
#   bash test/plugins-parity.sh expr path    # run named plugins only
#   bash test/plugins-parity.sh --list       # list discovered plugins
#
# Exit status: 0 if every plugin's `make test` succeeded, 1 otherwise.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSONIC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
JSONICJS_DIR="$(cd "$JSONIC_DIR/.." && pwd)"

JSONIC_MOD="github.com/jsonicjs/jsonic/go"

log()  { printf '\033[1;34m[parity]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[parity]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[parity]\033[0m %s\n' "$*"; }

# Discover every sibling project with a Makefile (excluding jsonic itself).
discover_plugins() {
  local d name
  for d in "$JSONICJS_DIR"/*/; do
    name="$(basename "$d")"
    [ "$name" = "jsonic" ] && continue
    [ -f "$d/Makefile" ] || continue
    printf '%s\n' "$name"
  done
}

ensure_jsonic_built() {
  log "building jsonic (TS)"
  ( cd "$JSONIC_DIR" && npm run build ) >/dev/null || {
    fail "jsonic TS build failed"
    return 1
  }
  log "building jsonic (Go)"
  ( cd "$JSONIC_DIR/go" && go build ./... ) || {
    fail "jsonic Go build failed"
    return 1
  }
}

# Replace node_modules/jsonic with a symlink to our local checkout.
# Saves a non-link original under .jsonic.parity-bak so it can be restored.
link_ts() {
  local dir=$1
  local nm="$dir/node_modules"
  if [ ! -d "$nm" ]; then
    log "  npm install (no node_modules)"
    ( cd "$dir" && npm install --no-audit --no-fund --silent ) || {
      warn "  npm install failed — skipping ts link"
      return 1
    }
  fi
  if [ -e "$nm/jsonic" ] && [ ! -L "$nm/jsonic" ]; then
    mv "$nm/jsonic" "$nm/.jsonic.parity-bak"
  else
    rm -rf "$nm/jsonic"
  fi
  ln -s "$JSONIC_DIR" "$nm/jsonic"
}

unlink_ts() {
  local dir=$1
  local nm="$dir/node_modules"
  [ -d "$nm" ] || return 0
  if [ -L "$nm/jsonic" ]; then
    rm -f "$nm/jsonic"
  fi
  if [ -e "$nm/.jsonic.parity-bak" ]; then
    mv "$nm/.jsonic.parity-bak" "$nm/jsonic"
  fi
}

# Add a `replace` for the local jsonic Go module in the plugin's go.mod.
link_go() {
  local dir=$1
  [ -f "$dir/go/go.mod" ] || return 0
  ( cd "$dir/go" && go mod edit "-replace=$JSONIC_MOD=$JSONIC_DIR/go" )
}

unlink_go() {
  local dir=$1
  [ -f "$dir/go/go.mod" ] || return 0
  ( cd "$dir/go" && go mod edit "-dropreplace=$JSONIC_MOD" ) 2>/dev/null || true
}

# Called on EXIT/INT/TERM. Restores every plugin we've touched.
TOUCHED=()
cleanup() {
  local p
  for p in "${TOUCHED[@]+"${TOUCHED[@]}"}"; do
    unlink_ts "$JSONICJS_DIR/$p"
    unlink_go "$JSONICJS_DIR/$p"
  done
}
trap cleanup EXIT INT TERM

# Run `make test` for one plugin under the linked local jsonic.
# Echoes " pass" or " fail <rc>" on the accumulator FD (3) so the caller
# can collect results without parsing stdout.
run_plugin() {
  local plugin=$1
  local dir="$JSONICJS_DIR/$plugin"
  log "=== $plugin ==="
  TOUCHED+=("$plugin")

  link_ts "$dir" || { printf '%s fail link-ts\n' "$plugin" >&3; return 1; }
  link_go "$dir"

  local rc=0
  ( cd "$dir" && make test ) || rc=$?

  unlink_ts "$dir"
  unlink_go "$dir"

  # Drop from TOUCHED once cleanly unlinked so cleanup doesn't double-unlink.
  local i new=()
  for i in "${TOUCHED[@]}"; do
    [ "$i" = "$plugin" ] || new+=("$i")
  done
  TOUCHED=("${new[@]+"${new[@]}"}")

  if [ "$rc" -eq 0 ]; then
    printf '%s pass\n' "$plugin" >&3
  else
    printf '%s fail %d\n' "$plugin" "$rc" >&3
  fi
  return "$rc"
}

main() {
  if [ "${1-}" = "--list" ]; then
    discover_plugins
    exit 0
  fi

  local plugins=()
  if [ "$#" -gt 0 ]; then
    plugins=("$@")
  else
    while IFS= read -r p; do plugins+=("$p"); done < <(discover_plugins)
  fi

  if [ "${#plugins[@]}" -eq 0 ]; then
    fail "no plugins discovered in $JSONICJS_DIR"
    exit 1
  fi

  ensure_jsonic_built || exit 1

  local results_file
  results_file="$(mktemp)"
  exec 3>"$results_file"

  local overall=0
  local p
  for p in "${plugins[@]}"; do
    run_plugin "$p" || overall=1
  done

  exec 3>&-

  echo
  log "summary"
  printf '  %-14s  %s\n' PLUGIN RESULT
  printf '  %-14s  %s\n' -------------- ------
  while read -r line; do
    set -- $line
    printf '  %-14s  %s\n' "$1" "${2}${3:+ ($3)}"
  done <"$results_file"
  rm -f "$results_file"

  exit "$overall"
}

main "$@"
