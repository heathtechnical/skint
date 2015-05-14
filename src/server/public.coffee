exports.register = (server, options, next) ->
  server.route
    method: 'GET',
    path: '/public/{param*}',
    handler: directory: path: "public"

  next()

exports.register.attributes = {
  name: 'public'
}
