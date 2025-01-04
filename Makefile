install: deps-install
	npx simple-git-hooks

deps-update:
	npx ncu -u

deps-install:
	npm ci --legacy-peer-deps

develop:
	npx webpack serve

build:
	NODE_ENV=production npx webpack

lint:
	npx eslint .