VERSION ?= edge

CFLAGS = -c -g -D $(VERSION)

help:
	@echo "  deps        install dependencies"
	@echo "  test        runs tests"
	@echo "  compile     sets up your js files for production"

deps:
	npm install

test:
	npm test

sprites: materials/sprites-full-size
	cp -r materials/sprites-full-size sprites
	cd sprites && mogrify -resize 33% *.png
	# https://pngquant.org/
	cd sprites && pngquant 100 --speed 1 --force --strip --ext .png --verbose *.png

.PHONY: bundle
bundle:
	rm -rf $@
	mkdir $@
	esbuild --bundle js/main.js --target=es2017 --minify --outfile=dist/skifree.min.js
	cp index.html PlayEGI* $@
	cp -R css dist vendor sprites $@
