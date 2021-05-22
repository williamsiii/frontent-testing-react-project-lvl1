install: install-deps

run:
	bin/index.js

install-deps:
	npm install

test-watch:
	npm run test:watch

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

publish:
	npm publish

.PHONY: test