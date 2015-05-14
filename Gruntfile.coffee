
module.exports = (grunt) ->
    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        coffeelint:
          server: [ 'src/server/*.coffee' ]

        coffee:
            server:
                files:
                    'server.js': 'src/server/server.coffee'
                    'server/public.js': 'src/server/public.coffee'
                    'server/index.js': 'src/server/index.coffee'

            frontend:
                expand: true
                cwd: 'src/frontend'
                src: [ '*.coffee' ]
                dest: 'public/js/skint'
                ext: '.js'

            lib:
                expand: true
                cwd: 'src/lib'
                src: [ '*.coffee' ]
                dest: 'server/lib'
                ext: '.js'


    grunt.loadNpmTasks "grunt-contrib-coffee"
    grunt.loadNpmTasks "grunt-coffeelint"
