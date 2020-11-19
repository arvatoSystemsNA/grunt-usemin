'use strict';

module.exports = function (grunt) {
  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      gruntfile: {
        src: 'Gruntfile.js',
      },
      core: {
        src: ['lib/**/*.js', 'tasks/*.js']
      },
      test: {
        src: ['test/**/*.js', '!test/temp/**/*.js', '!test/fixtures/*.js']
      }
    },

    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      gruntfile: {
        src: '<%= jshint.gruntfile.src %>'
      },
      core: {
        src: '<%= jshint.core.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      }
    },

    mochacli: {
      all: ['test/test-*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['jshint', 'eslint', 'mochacli']);
  grunt.registerTask('test', 'default');
};
