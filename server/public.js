(function() {
  exports.register = function(server, options, next) {
    server.route({
      method: 'GET',
      path: '/public/{param*}',
      handler: {
        directory: {
          path: "public"
        }
      }
    });
    return next();
  };

  exports.register.attributes = {
    name: 'public'
  };

}).call(this);
