var ProgressBar = require('progress');
var chalk = require('chalk');
var _ = require('lodash');
var webpack = require('webpack');

require('object.assign').shim();

module.exports = function ProgressBarPlugin(options) {
  options = options || {};

  var stream = options.stream || process.stderr;
  var enabled = stream && stream.isTTY;

  if (!enabled) {
    return function () {};
  }

  var barLeft = chalk.bold('[');
  var barRight = chalk.bold(']');
  var preamble = chalk.cyan.bold('  build ') + barLeft;
  var barFormat = options.format || preamble + ':bar' + barRight + chalk.green.bold(' :percent');
  var summary = options.summary !== false;
  var summaryContent = options.summaryContent;
  var customSummary = options.customSummary;

  delete options.format;
  delete options.total;
  delete options.stream;
  delete options.summary;
  delete options.summaryContent;
  delete options.customSummary;

  var barOptions = Object.assign({
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100,
    clear: true
  }, options);

  var bar = new ProgressBar(barFormat, barOptions);

  var running = false;
  var startTime = 0;
  var lastPercent = 0;

  return new webpack.ProgressPlugin(function (percent) {
    if (!running && lastPercent !== 0 && !customSummary) {
      stream.write('\n');
    }

    var newPercent = Math.ceil(percent * barOptions.width);

    if (lastPercent !== newPercent) {
      bar.update(percent);
      lastPercent = newPercent;
    }

    if (!running) {
      running = true;
      startTime = new Date;
      lastPercent = 0;
    } else if (percent === 1) {
      var now = new Date;

      bar.terminate();
      
      var buildTime = (now - startTime) / 1000 + 's';
      
      if (summary) {
        stream.write(chalk.green.bold('Build completed in ' + buildTime + '\n\n'));
      } else if (summaryContent) {
        stream.write(summaryContent + '(' + buildTime + ')');
      }
      
      if (customSummary) {
        customSummary(buildTime);
      }

      running = false;
    }
  });
};
