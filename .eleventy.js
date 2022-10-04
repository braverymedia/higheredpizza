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
