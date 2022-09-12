const { DateTime } = require("luxon");
const { minify } = require("terser");
const { PurgeCSS } = require("purgecss");
const CleanCSS = require("clean-css");
const htmlmin = require("html-minifier");
const md = require("markdown-it");
const { EleventyRenderPlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyRenderPlugin);

	// only content in the `src/events/` directory
	eleventyConfig.addCollection("events", function (collection) {
		return collection.getAllSorted().filter(function (item) {
			return item.inputPath.match(/^\.\/events\//) !== null;
		});
	});
	eleventyConfig.addFilter("shortDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc'} ).toFormat("LLL dd");
	});

	eleventyConfig.addFilter("isPastDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj) < new Date();
	});

	// Minify CSS
	eleventyConfig.addFilter("cssmin", function (code) {
		return new CleanCSS({}).minify(code).styles;
	});

	// Minify JS
	eleventyConfig.addNunjucksAsyncFilter(
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
	eleventyConfig.addTransform("purge-and-inline-css", async function (content) {
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

	/* Markdown Plugins */
	let mdOpts = {
		html: true,
		breaks: true,
		linkify: true,
	};

	eleventyConfig.setLibrary("md", md(mdOpts));
	eleventyConfig.addFilter("markdown", (content) => {
		return md.render(content);
	});

	eleventyConfig.addPassthroughCopy({ "_includes/assets": "assets" });

	return {
		templateFormats: ["md", "njk", "html"],
		pathPrefix: "/",
		markdownTemplateEngine: "liquid",
		htmlTemplateEngine: "njk",
		dataTemplateEngine: "njk",
		passthroughFileCopy: true,
		dir: {
			input: ".",
			includes: "_includes",
			data: "_data",
			output: "_site",
		},
	};
};
