const arguments = process.argv.slice(2);
const username = arguments[0];
const repository = arguments[1];
const mainBranch = arguments[2];             

const axios = require('axios');
var totalLineCount = 0;
var numberOfFiles = 0;
var countedFiles = 0;

main();

async function main() {
  const repoPath = `/${username}/${repository}/`;
  await countFiles(repoPath, mainBranch);
  checkFiles(repoPath, mainBranch, numberOfFiles);
}

function printLines() {
  console.log("Total line count: " + totalLineCount);
}

function countLines(data) {
  for (var i = 1;; i++) {
    var regex = new RegExp('"L' + i + '"');
    if (regex.test(data)) {
      i++;
    } else {
      countedFiles++;
      printLines();
      return i - 1;
    }
  }
}

function isFolder(path) {
  if (!path) return false;
  if (path[path.length - 1] === "/") path = path.slice(0, path.length - 1);
  var paths = path.split("/");
  path = paths[paths.length - 1];
  var regex = /^[a-zA-Z0-9-.,]+\.[a-zA-Z0-9]+$/;
  return !regex.test(path);
}

async function countLinesForFile(pathToFile) {
  try {
    var response = await axios.get(`https://github.com${pathToFile}`)
    console.log(pathToFile.slice(1));
      totalLineCount += countLines(response.data);
  } catch (error) {
    console.log(error);
  }
}


function getFiles(data) {
  var regex = /[a-zA-Z-" .]+(?=data-pjax=\"#repo-content-pjax-container\")/g;
  var matches = [...data.matchAll(regex)];
  var allFolders = [];
  var allFiles = [];
  for (var i = 0; i < matches.length; i++) {
    var currentMatch = matches[i][0].split('"')[1].trim();
    if (isFolder(currentMatch)) allFolders.push(currentMatch);
    else allFiles.push(currentMatch);
  }
  return { folders: allFolders, files: allFiles };

}

async function checkFiles(path, branch, numberOfFiles) {
    try {
      var response = await axios.get(`https://github.com${path}`)
      var files = getFiles(response.data);

      for (var i = 0; i < files.files.length; i++) {
        var filePath = "";
        if(!path.includes("tree") || !path.includes("tree")) filePath = path + "blob/main/" + files.files[i];
        else filePath = path.replace("tree", "blob") + files.files[i];
        countLinesForFile(filePath);
      }
      for (var i = 0; i < files.folders.length; i++) {
        if (!path.includes(`tree/${branch}/`)) {
          path = path + `tree/${branch}/`;
        }
        await checkFiles(path + files.folders[i] + "/", branch, numberOfFiles);
      }
    } catch (error) {
      console.log(error);
    }
}

async function countFiles(path,branch) {
  try {
    var response = await axios.get(`https://github.com${path}`)
    var files = getFiles(response.data);

    for (var i = 0; i < files.files.length; i++) {
      numberOfFiles++;
    }
    for (var i = 0; i < files.folders.length; i++) {
      if (!path.includes(`tree/${branch}/`)) {
        path = path + `tree/${branch}/`;
      }
      await countFiles(path + files.folders[i] + "/", branch);
    }
  } catch (error) {
    console.log(error);
  }
}