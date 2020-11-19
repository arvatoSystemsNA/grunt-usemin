'use strict';
const path = require('path');
const pathExists = require('path-exists');
const _ = require('lodash');

exports.name = 'concat';

//
// Output a config for the furnished block
// The context variable is used both to take the files to be treated
// (inFiles) and to output the one(s) created (outFiles).
// It also conveys whether or not the current process is the last of the pipe
//
exports.createConfig = function (context, block) {
  const cfg = {
    files: []
  };
  // FIXME: check context has all the needed info
  const outfile = path.join(context.outDir, block.dest);

  // Depending whether or not we're the last of the step we're not going to output the same thing
  const files = {};
  files.dest = outfile;
  files.src = [];

  context.inFiles.forEach(function (f) {
    if (_.isArray(context.inDir)) {
      context.inDir.every(function (d) {
        const joinedPath = path.join(d, f);
        const joinedPathExists = pathExists.sync(joinedPath);
        if (joinedPathExists) {
          files.src.push(joinedPath);
        }
        return !joinedPathExists;
      });
    } else {
      files.src.push(path.join(context.inDir, f));
    }
  });

  cfg.files.push(files);
  context.outFiles = [block.dest];
  return cfg;
};
