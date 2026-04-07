.PHONY: all build test clean build-ts build-go test-ts test-go clean-ts clean-go publish-go tags-go

all: build test

build: build-ts build-go

test: test-ts test-go

clean: clean-ts clean-go

# TypeScript
build-ts:
	npm run build

test-ts:
	npm test

clean-ts:
	rm -rf dist dist-test

# Go
build-go:
	cd go && go build ./...

test-go:
	cd go && go test ./...

clean-go:
	cd go && go clean

# Publish Go module: make publish-go V=0.1.7
publish-go: test-go
	@test -n "$(V)" || (echo "Usage: make publish-go V=x.y.z" && exit 1)
	sed -i '' 's/^const Version = ".*"/const Version = "$(V)"/' go/jsonic.go
	sed -i '' 's/^Version: .*/Version: $(V)/' go/README.md
	git add go/jsonic.go go/README.md
	git commit -m "go: v$(V)"
	git tag go/v$(V)
	git push origin main go/v$(V)
	if command -v gh >/dev/null 2>&1; then gh release create go/v$(V) --title "go/v$(V)" --notes "Go module release v$(V)"; fi

tags-go:
	git tag -l 'go/v*' --sort=-version:refname
