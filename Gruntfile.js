

module.exports = function (grunt) {


  grunt.initConfig({
    clean: {
      dist: ['dist/*'],
      demo: ['demo/**']
    },
    preprocessor: {
      options: {
        root: 'src',
        context: {

        }
      },
      template: {
        files: {
          'dist/fluid.js': 'template/fluid.js'
        }
      }
    },
    assemble: {
      demo: {
        options: {
          engine: 'Handlebars',
          layout: 'demoSrc/page.hbs',
        },
        files: {
          "demo/index.html": "demoSrc/index.hbs"
        }
      }
    },
    less: {
      demo: {
        files: {
          "demo/demo.css": "demoSrc/demo.less"
        }
      }
    },
    connect: {
      options: {
        port: 4444,
        livereload: 35729,
      },
      demo: {
        options: {
          open: true,
          base: [
            'dist',
            'demo'
          ]
        }
      }
    },
    watch: {
      options: {
        livereload: '<%= connect.options.livereload %>'
      },
      src: {
        files: [ 'src/**' ],
        tasks: [ 'preprocessor' ]
      },
      demoSrc: {
        files: [ 'demoSrc/** '],
        tasks: [ 'less:demo','assemble:demo' ]
      }
    }
  });
  
  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-preprocessor');

  grunt.registerTask( 'default', ['clean:dist', 'preprocessor'] );
  grunt.registerTask( 'demo', [
    'clean', 
    'preprocessor',
    'assemble:demo',
    'less:demo',
    'connect:demo',
    'watch'
  ] );
}