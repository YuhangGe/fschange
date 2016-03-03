#!/usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require('glob');
const argv = process.argv.slice(2);
const path = require('path');
const minimatch = require("minimatch");
const CWD = process.cwd();
const exec = require('child_process').exec;
const keypress = require('keypress');

function sortUniq(arr) {
  let newArr = [];
  let pre = arr[0];
  for(let i = 1; i < arr.length; i++) {
    if (arr[i] !== pre) {
      newArr.push(pre);
      pre = arr[i];
    }
  }
  newArr.push(pre);
  return newArr;
}

function getDir(dirOrFile) {
  try {
    let stat = fs.statSync(dirOrFile);
    if (stat.isDirectory()) {
      return dirOrFile;
    } else {
      return path.dirname(dirOrFile);
    }
  } catch(ex) {
    return path.dirname(dirOrFile);
  }
}


if (argv.length < 2 || argv[0] === '-h' || argv[0] === '--help') {
  console.log('Usage: fschange \'./src/**/*.js\' \'./src/*.css\' \'npm run build\'');
  process.exit(0);
}

const script = argv[argv.length - 1];
const patterns = argv.slice(0, argv.length - 1).map(p => path.resolve(CWD, p));

const dirs = sortUniq(patterns.reduce((arr, item) => {
  return arr.concat(glob.sync(item));
}, []).map(dirOrFile => getDir(dirOrFile)).sort());

let TM = null;


dirs.forEach(dir => {
  fs.watch(dir, {
    persistent: false,
    recursive: false
  }, (event, filename) => {
    let fullPath = path.join(dir, filename);
    for(let i = 0; i < patterns.length; i++) {
      if (minimatch(fullPath, patterns[i])) {
        if (TM) {
          clearTimeout(TM);
        }
        TM = setTimeout(runScript, 500);
        break;
      }
    }
  });
});

function runScript() {
  TM = null;
  console.log('fschange -> ' + script);
  exec(script, {
    cwd: CWD
  }, (err, stdout, stderr) => {
    stdout && console.log(stdout);
    stderr && console.error(stderr);
    err && console.error(err);
  });
}

if (process.stdin && process.stdin.setRawMode) {
  keypress(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (char, key) => {
    if (key && key.ctrl && (key.name === 'c' || key.name=== 'd')) {
      process.exit(0);
    }
  });
} else {
  setTimeout(loop, 10000);
}

function loop() {
  setTimeout(loop, 10000);
}