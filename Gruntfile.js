module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        terser: {
            one: {
                options: {
                    compress: true,
                    mangle: true,
                    output: {
                        comments: 'some'
                    }
                },
                files: {
                    'dist/Scripts/puzzle.js': ['Scripts/puzzle.js']
                }
            }
        },
        uglify: {
            one: {
                options: {
                    banner: "/*\n* grrd's Puzzle\n* Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net\n* Licensed under the MPL License\n*/\n",
                    mangle: true,
                    compress: true
                },
                files: {
                    'dist/sw.js': ['sw.js']
                }
            },
            two: {
                options: {
                    banner: "/*\n* Copyright (c) 2011-2013 Fabien Cazenave, Mozilla.\n*/\n",
                    mangle: true,
                    compress: true
                },
                files: {
                    'dist/Scripts/l10n.js': ['Scripts/l10n.js']
                }
            },
            three: {
                options: {
                    banner: "/*\n* Javascript EXIF Reader 0.1.4\n* Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/\n* Licensed under the MIT License (MIT) [https://github.com/exif-js/exif-js/blob/master/LICENSE.md]\n*/\n",
                    mangle: true,
                    compress: true
                },
                files: {
                    'dist/Scripts/exif.js': ['Scripts/exif.js']
                }
            }
        },
        svgmin: {
            options: {
                plugins: [
                    {removeUnknownsAndDefaults: false},
                    {removeViewBox: false}
                ]
            },
            dist: {
                files: [
                    {'dist/Images/4inarow.svg': 'Images/4inarow.svg'},
                    {'dist/Images/bullets0.svg': 'Images/bullets0.svg'},
                    {'dist/Images/bullets0o.svg': 'Images/bullets0o.svg'},
                    {'dist/Images/bullets1.svg': 'Images/bullets1.svg'},
                    {'dist/Images/bullets1o.svg': 'Images/bullets1o.svg'},
                    {'dist/Images/dice.svg': 'Images/dice.svg'},
                    {'dist/Images/down.svg': 'Images/down.svg'},
                    {'dist/Images/easy.svg': 'Images/easy.svg'},
                    {'dist/Images/easy_gold.svg': 'Images/easy_gold.svg'},
                    {'dist/Images/escfullscreen.svg': 'Images/escfullscreen.svg'},
                    {'dist/Images/fullscreen.svg': 'Images/fullscreen.svg'},
                    {'dist/Images/hard.svg': 'Images/hard.svg'},
                    {'dist/Images/hard_gold.svg': 'Images/hard_gold.svg'},
                    {'dist/Images/info.svg': 'Images/info.svg'},
                    {'dist/Images/loading.svg': 'Images/loading.svg'},
                    {'dist/Images/lock.svg': 'Images/lock.svg'},
                    {'dist/Images/mail.svg': 'Images/mail.svg'},
                    {'dist/Images/medal1.svg': 'Images/medal1.svg'},
                    {'dist/Images/medal2.svg': 'Images/medal2.svg'},
                    {'dist/Images/medal3.svg': 'Images/medal3.svg'},
                    {'dist/Images/medium.svg': 'Images/medium.svg'},
                    {'dist/Images/medium_gold.svg': 'Images/medium_gold.svg'},
                    {'dist/Images/memo.svg': 'Images/memo.svg'},
                    {'dist/Images/next.svg': 'Images/next.svg'},
                    {'dist/Images/ok.svg': 'Images/ok.svg'},
                    {'dist/Images/photo.svg': 'Images/photo.svg'},
                    {'dist/Images/piece_gold.svg': 'Images/piece_gold.svg'},
                    {'dist/Images/prev.svg': 'Images/prev.svg'},
                    {'dist/Images/puzzle.svg': 'Images/puzzle.svg'},
                    {'dist/Images/reversi.svg': 'Images/reversi.svg'},
                    {'dist/Images/settings.svg': 'Images/settings.svg'},
                    {'dist/Images/tictactoe.svg': 'Images/tictactoe.svg'},
                    {'dist/Images/x.svg': 'Images/x.svg'}
                ]
            }
        },
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 5
                },
                files: [{
                    expand: true,
                    cwd: 'Images',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'dist/Images/'
                }]
            },
            dist2: {
                options: {
                    optimizationLevel: 5
                },
                files: [{
                    expand: true,
                    cwd: 'Scripts/images',
                    src: ['*.{png,jpg,gif}'],
                    dest: 'dist/Scripts/images/'
                }]
            }
        },
        cssmin: {
            dist: {
                options: {
                    banner: "/*\n* grrd's Puzzle\n* Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net\n* Licensed under the MPL License\n*/\n"
                },
                files: {
                    'dist/Scripts/puzzle.css': ['Scripts/puzzle.css']
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [{
                    expand: true,
                    src: 'index.html',
                    dest: 'dist'
                }]
            }
        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: /\<\!DOCTYPE html\>/g,
                            replacement: function () {
                                return "<!DOCTYPE html>\n<!-- \n* grrd's Puzzle \n* Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net \n* Licensed under the MPL License\n-->\n";
                            }
                        }
                    ]
                },
                files: [
                    {expand: true, flatten: true, src: ['dist/index.html'], dest: 'dist/'}
                ]
            },
            dist2: {
                options: {
                    patterns: [
                        {
                            match: /select-button dn/g,
                            replacement: 'select-button'
                        },
                        {
                            match: /t_mascha dn/g,
                            replacement: 't_mascha'
                        },
                        {
                            match: /favicon.ico/g,
                            replacement: 'favicon_dark.ico'
                        },
                        {
                            match: /apple-touch-icon-/g,
                            replacement: 'apple-dark-icon-'
                        },
                        {
                            // <link rel="alternate" hreflang="en" href="https://grrd01.github.io/Puzzle/?lang=en" />
                            match: /\<link\srel="alternate"\shreflang=".."\shref="https:\/\/grrd01\.github\.io\/Puzzle\/\?lang=.."\>/g,
                            replacement: function () {
                                return "";
                            }
                        },
                        {
                            // <link rel="canonical" href="https://grrd01.github.io/Puzzle/?lang=en" />
                            match: /\<link\srel="canonical"\shref="https:\/\/grrd01\.github\.io\/Puzzle\/\?lang=.."\>/g,
                            replacement: function () {
                                return "";
                            }
                        }
                    ]
                },
                files: [
                    {expand: true, flatten: true, src: ['dist/index.html'], dest: 'dist/',
                        rename: function(dest, src) {
                            return dest + src.replace('index.html','shrek.html');
                        }
                    }
                ]
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, src: ['Locales/**'], dest: 'dist/'},
                    {expand: true, flatten: true, src: ['Manifest/*'], dest: 'dist/Manifest/'},
                    {expand: true, flatten: true, src: ['Images/*.ico'], dest: 'dist/Images/'},
                    {expand: true, flatten: true, src: ['Scripts/swipe*.*'], dest: 'dist/Scripts/'},
                    {expand: true, flatten: true, src: ['Scripts/kinetic*.*'], dest: 'dist/Scripts/'},
                    {expand: true, flatten: true, src: ['Sounds/*'], dest: 'dist/Sounds/'},
                    {expand: true, flatten: true, src: ['**.txt'], dest: 'dist/'},
                    {expand: true, flatten: true, src: ['**.md'], dest: 'dist/'},
                    {expand: true, flatten: true, src: ['CNAME'], dest: 'dist/'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [
        'terser',
        'uglify',
        'svgmin',
        //'imagemin',
        'cssmin',
        'htmlmin',
        'replace',
        'copy'
    ]);


};
