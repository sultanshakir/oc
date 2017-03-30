'use strict';

var async = require('async');
var format = require('stringformat');
var fs = require('fs-extra');
var minifyFile = require('./minify-file');
var nodeDir = require('node-dir');
var path = require('path');
var _ = require('underscore');

var strings = require('../../../resources');

var copyDir = function(params, cb){
  var staticPath = path.join(params.componentPath, params.staticDir),
      exists = fs.existsSync(staticPath),
      isDir = exists && fs.lstatSync(staticPath).isDirectory();

  if(!exists){
    return cb(format(strings.errors.cli.FOLDER_NOT_FOUND, staticPath));
  } else if(!isDir){
    return cb(format(strings.errors.cli.FOLDER_IS_NOT_A_FOLDER, staticPath));
  } else {

    nodeDir.paths(staticPath, function(err, res){
      _.forEach(res.files, function(filePath){
    
        var fileName = path.basename(filePath),
            fileExt = path.extname(filePath).toLowerCase(),
            fileRelativePath = path.relative(staticPath, path.dirname(filePath)),
            fileDestinationPath = path.join(params.publishPath, params.staticDir, fileRelativePath),
            fileDestination = path.join(fileDestinationPath, fileName);

        fs.ensureDirSync(fileDestinationPath);

        if(params.minify && params.ocOptions.minify !== false && (fileExt === '.js' || fileExt === '.css')){
          var fileContent = fs.readFileSync(filePath).toString(),
              minified = minifyFile(fileExt, fileContent);

          fs.writeFileSync(fileDestination, minified);
        } else {
          fs.copySync(filePath, fileDestination);
        }
      });
      cb(null, 'ok');
    });
  }
};

module.exports = function(params, callback){

  var staticList = params.ocOptions.files.static;

  if(staticList.length === 0){
    return callback(null, 'ok');
  }

  async.eachSeries(staticList, function(staticDir, cb){
    copyDir(_.extend(params, { staticDir: staticDir }), cb);
  }, function(errors){
    if(errors){ return callback(errors); }
    callback(null, 'ok');
  });
};