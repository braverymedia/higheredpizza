const { minify } = require("terser");
const { PurgeCSS } = require("purgecss");
const CleanCSS = require("clean-css");
const htmlmin = require("html-minifier");

module.exports = function (hepConfig) {
	// Minify CSS
	hepConfig.addFilter("cssmin", function (code) {
		return new CleanCSS({}).minify(code).styles;
	});

	// Minify JS
	hepConfig.addNunjucksAsyncFilter(
		"jsmin",
		async function (code, callback) {
			try {
				const minified = await minify(code);
				callback(null, minified.code);
			} catch (err) {
				console.error("Terser error: ", err);
				// Fail gracefully.
				callback(null, code);
			}
		}
	);

	/**
	 * Remove any CSS not used on the page and inline the remaining CSS in the
	 * <head>.
	 *
	 * @see {@link https://github.com/FullHuman/purgecss}
	 */
	hepConfig.addTransform("purge-and-inline-css", async function (content) {
		if (
			process.env.ELEVENTY_ENV !== "production" ||
			!this.outputPath.endsWith(".html")
		) {
			return content;
		}

		const purgeCSSResults = await new PurgeCSS().purge({
			content: [{ raw: content }],
			css: ["_site/assets/css/dough.css"],
			keyframes: true,
		});

		return content.replace(
			"<!-- INLINE CSS-->",
			"<style>" + purgeCSSResults[0].css + "</style>"
		);
	});

	hepConfig.addTransform("htmlmin", function (content) {
		if (this.outputPath.endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
			});
			return minified;
		}

		return content;
	});
    hepConfig.addPassthroughCopy({ "src/_includes": "_includes" });
    return {
        templateFormats: ["md", "njk", "html"],
        pathPrefix: "/",
        markdownTemplateEngine: "liquid",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        passthroughFileCopy: true,
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "_site",
        },
    };
}