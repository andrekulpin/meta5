const { set, each, flattenDeep } = require('lodash');
const { join } = require('path');
const getInjector = require('./Injector');
const { readdir, stat } = require('co-fs');
const co_ = require('co-dash');

module.exports = function*( config ){

	let { coreFolder, ignoreFolders } = config;

	let injector = yield getInjector( coreFolder, ignoreFolders );

	return injector;

}