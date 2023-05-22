VERSION ?= edge

CFLAGS = -c -g -D $(VERSION)

help:
	@echo "  deps        install dependencies"
	@echo "  bundle      sets up your js files for production"

deps:
	npm install

sprites: materials/sprites-full-size
	cp -r materials/sprites-full-size sprites
	cd sprites && mogrify -resize 33% *.png # Should be equal to config.spriteSizeReduction
	cd sprites && pngquant 100 --speed 1 --force --strip --ext .png --verbose *.png

.PHONY: bundle
bundle:
	rm -rf $@
	mkdir $@
	esbuild --bundle src/main.ts --target=es2017 --minify --outfile=dist/skifree.min.js
	cp index.html PlayEGI* $@
	cp -R css dist vendor sprites $@
