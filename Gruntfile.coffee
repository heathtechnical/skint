module.exports = (grunt) ->
    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        coffee:
            app:
                files:
                    'app.js': 'src/app.coffee'
            lib:
                expand: true
                cwd: 'src/lib'
                src: [ '*.coffee' ]
                dest: 'lib'
                ext: '.js'

            frontend:
                files:
                    'assets/js/skint.js': 'src/frontend/*.coffee'

            frontapp:
                expand: true
                cwd: 'src/front-app'
                src: [ '*.coffee' ]
                dest: 'assets/js'
                ext: '.js'

    grunt.loadNpmTasks "grunt-contrib-coffee"
