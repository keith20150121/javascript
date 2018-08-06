var WebSocketServer = require('websocket').server;
var http = require('http');
const url = require('url');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(8140, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

String.prototype.format = function(args) {
    var result = this;
    if (arguments.length < 1) {
        return result;
    }
    var data = arguments;        
    if (arguments.length == 1 && typeof (args) == "object") {
        data = args;
    }
    for (var key in data) {
        var value = data[key];
        if (undefined != value) {
            result = result.replace("{" + key + "}", value);
        }
    }
    return result;
}

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const wget = path.join(__dirname, 'wget') + ' -O {path} {url}';
const pattern = /[^_.a-zA-Z0-9]/g;
const path_prefix = process.argv[2] ? process.argv[2].replace(/\"/ig, '') : cwd;
var folder = 1;
var path_now = path.join(path_prefix, folder.toString());

function create_dir_err(err) {
  console.log(err);
}

function mkdirs(dirpath, callback) {
    fs.access(dirpath, fs.constants.F_OK, function(err) {
        if (!err) {
          callback(dirpath);
        } else {
          mkdirs(path.dirname(dirpath), function(){
                  fs.mkdir(dirpath, callback);
          });
        }
    });
};

mkdirs(path_now, create_dir_err);

function wgetFile(url) {
  if (!url) {return;}
  let name = url.split('/').pop();
  if (!name) {
    console.log('name is null?');
    return;
  }
  name = name.replace(pattern, '_'); 
  let cmd = wget.format({'path': path.join(path_now, name), 'url': url});
  exec(cmd, (err, stdout, stderr) => {
      console.log(err);
      console.log(stdout);
  })
}

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      // process WebSocket message
      console.log(message.utf8Data);
      let strUrl = message.utf8Data;
      let u = url.parse(strUrl);
      if (u.protocol === 'cs:') {
        if (u.host === 'next-album') {
          ++folder;
          path_now = path.join(path_prefix, folder.toString());
          mkdirs(path_now, create_dir_err);
          console.log('create folder:' + path_now);
        }
      } else { // http(s)
        wgetFile(strUrl);
      }
    }
  });

  connection.on('close', function(connection) {
    // close user connection
    console.log('close');
  });
});