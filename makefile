help:
	@echo "  bundle      sets up files for production"
	@echo "  sprites     create reduced in size sprites to fasten game loading"

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
	cp -R css dist sprites $@
