///CHANGE THESE TO YOUR USERNAME AND REPO/////
const username = "JakobPaulsson";           //
const repository = "Hackathon";             //
const mainBranch = "main";                  //
//////////////////////////////////////////////

const https = require("https");

var totalLineCount = 0;

const repoPath = `/${username}/${repository}/`;
checkFiles(repoPath, mainBranch);
setTimeout(() => {
   console.log("Total line count: " + totalLineCount);
}, 5000);

function countLines(data) {
  var i = 1;
  while (1) {
    var regex = new RegExp('"L' + i + '"');
    if (regex.test(data)) {
      i++;
    } else {
      return i - 1;
    }
  }
  return 0;
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
  var options = {
    host: "github.com",
    path: pathToFile,
    method: "GET",
  };
  var request = https.request(options, function (res) {
    var data = "";
    res.on("data", function (chunk) {
      data += chunk;
    });
    res.on("end", function () {
      console.log(pathToFile);
      totalLineCount += countLines(data);
    });
  });

  request.on("error", function (e) {
    console.log(e.message);
  });
  request.end();
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

function checkFiles(path, branch) {
  var options = {
    host: "github.com",
    path: path,
    method: "GET",
  };

  var request = https.request(options, function (res) {
    var data = "";
    res.on("data", function (chunk) {
      data += chunk;
    });
    res.on("end", function () {
      var files = getFiles(data);
      if (!files) return null;
      for (var i = 0; i < files.files.length; i++) {
        countLinesForFile(path.replace("tree", "blob") + files.files[i]);
      }
      for (var i = 0; i < files.folders.length; i++) {
        if (!path.includes(`tree/${branch}/`)) path = path + `tree/${branch}/`;
        checkFiles(path + files.folders[i] + "/");
      }
    });
  });

  request.on("error", function (e) {
    console.log(e.message);
  });
  request.end();
}
