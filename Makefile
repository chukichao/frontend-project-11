install: deps-install
	npx simple-git-hooks

deps-update:
	npx ncu -u

deps-install:
	npm ci --legacy-peer-deps

lint:
	npx eslint .