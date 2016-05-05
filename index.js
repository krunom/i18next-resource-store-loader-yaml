/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/
var path = require("path");
var fs = require("fs");
var yaml = require("js-yaml");

var loaderUtils = require('loader-utils');

module.exports = function (indexContent) {
	this.cacheable && this.cacheable();

	var options = loaderUtils.parseQuery(this.query);

	var include;
	if (options.include) {
		include = new RegExp(options.include);
	}
	var exclude;
	if (options.exclude) {
		exclude = new RegExp(options.exclude);
	}

	var baseDirectory = path.dirname(this.resource);
	var subdirs = fs.readdirSync(baseDirectory).filter(function (file) {
		return fs.statSync(path.join(baseDirectory, file)).isDirectory();
	});

	//alls sub directories match to languages
	var resBundle = {},
			dirname, files;
	for (var i = 0, len = subdirs.length; i < len; i++) {
		//all files within the sub directory map to namespaces
		dirname = subdirs[i];
		resBundle[dirname] = {};
		//get sub files
		files = fs.readdirSync(path.join(baseDirectory, dirname)).filter(function (file) {
			return fs.statSync(path.join(baseDirectory, dirname, file)).isFile()
					&& (!include || include.test(file))
					&& (!(exclude && exclude.test(file)));
		});
		var filename, extname, basename, content, pathstring;
		for (var j = 0, len2 = files.length; j < len2; j++) {
			filename = files[j];
			pathstring = path.join(baseDirectory, dirname, filename);
			extname = path.extname(pathstring);
			basename = path.basename(pathstring, extname);
			content = fs.readFileSync(pathstring);
			resBundle[dirname][basename] = yaml.safeLoad(content); // JSON.parse(content);
			this.addDependency(pathstring);
		}
		this.addContextDependency(path.join(baseDirectory, dirname));
	}
	return "module.exports = " + JSON.stringify(resBundle);
}
