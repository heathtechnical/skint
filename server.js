(function() {
  var Hapi, path, server;

  Hapi = require('hapi');

  path = require('path');

  server = new Hapi.Server();

  server.views({
    engines: {
      html: require('handlebars')
    },
    path: path.join(__dirname, './src/server/views')
  });

  server.connection({
    port: 3004
  });

  module.exports = server;

  server.register([
    {
      register: require('./server/public.js')
    }, {
      register: require('./server/index.js')
    }
  ], function() {
    return server.start();
  });

}).call(this);
