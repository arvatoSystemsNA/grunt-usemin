'use strict';

const path = require('path');

exports.name = 'requirejs';

//
// Output a config for the furnished block
// The context variable is used both to take the files to be treated
// (inFiles) and to output the one(s) created (outFiles).
// It also conveys whether or not the current process is the last of the pipe
//
exports.createConfig = function (context, block) {
  const cfg = {};
  const options = {};
  const requirejs = context.options || {};
  context.outFiles = [];

  if (!block.requirejs) {
    return {};
  }

  const baseUrl = path.join(context.inDir, block.requirejs.baseUrl);
  const out = path.join(context.outDir, block.requirejs.dest);
  let cfgFile = path.join(context.inDir, block.requirejs.baseUrl, block.requirejs.name);
  if (!cfgFile.match(/\.js/)) {
    cfgFile += '.js';
  }

  options.name = block.requirejs.name;
  options.out = out;
  options.baseUrl = baseUrl;
  options.mainConfigFile = cfgFile;

  let hasTasks;
  for (const i in requirejs) {
    if (requirejs.hasOwnProperty(i)) {
      hasTasks = true;
      const task = requirejs[i];
      const opts = task.options;
      if (opts) {
        opts.name = opts.name || options.name;
        opts.out = opts.out || options.out;
        opts.baseUrl = opts.baseUrl || options.baseUrl;
        opts.mainConfigFile = opts.mainConfigFile || options.mainConfigFile;
      } else {
        task.options = options;
      }
    }
  }

  if (!hasTasks) {
    cfg['default'] = {
      options: options
    };
  }

  return cfg;
};
