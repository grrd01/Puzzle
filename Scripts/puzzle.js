/*
 * grrd's Puzzle
 * Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net
 * Licensed under the MPL License
 */

/*jslint browser:true, for:true, this: true, devel: true, long: true */
/*global $ Kinetic, window, jQuery, EXIF, FileReader, Swipe, MozActivity */


(function () {
    "use strict";
    var g_canvas_supported = !!window.HTMLCanvasElement;

    var g_layer = new Kinetic.Layer({name: "g_layer"});
    var g_back_g_layer = new Kinetic.Layer({name: "g_back_g_layer"});
    var g_stage = new Kinetic.Stage({
        container: "container",
        width: document.getElementById("container").width,
        height: document.getElementById("container").height
    });
    var iOS = (!!navigator.userAgent.match(/(iPad|iPhone|iPod)/g));
    var url_param;
    var g_lang_ready = false;
    var g_mascha = 0;
    var g_imageset = 1;
    var g_theme;
    var g_last_theme;
    var g_image_path;
    var g_own_image;
    var g_image_size;
    var g_pixel_ratio;
    var g_own_orientation;
    var g_imageObj = new Image();
    var g_windows_width;
    var g_windows_height;
    var g_canvas_width;
    var g_canvas_height;
    var g_portrait = "";
    var g_last_portrait;
    var g_lock_portrait;
    var g_rows = 4;
    var g_cols = 6;
    var g_precision = 15;
    var g_set = 0;
    var g_buildPuzzle = false;
    var g_ready = false;
    var g_rotate = false;
    var g_shape = true;
    var g_back_g_grid = true;
    var g_back_g_image = true;
    var g_sound = true;
    var g_gold = false;
    var g_medal = true;
    var g_zIndex;
    var g_pieceAbsoluteRotation;
    var g_piece2AbsoluteRotation;
    var g_firstOnLoad = true;
    var g_currentPiece;
    var g_tap = false;
    var g_imgNoStroke;
    var $select_theme_img = $("#select_theme_img");
    var $b_back_g_grid = $("#b_back_g_grid");
    var $b_back_g_image = $("#b_back_g_image");
    var $b_rotate = $("#b_rotate");
    var $b_sound = $("#b_sound");
    var $container = $("#container");
    var $b_gold = $("#b_gold");
    var $b_gold_enabled = $("#b_gold_enabled");
    var $b_gold_disabled = $("#b_gold_disabled");
    var $b_prev = $("#b_prev");
    var $b_next = $("#b_next");
    var $bt_easy = $("#bt_easy");
    var $bt_med = $("#bt_med");
    var $bt_hard = $("#bt_hard");
    var $bt_close = $("#bt_close");
    var $b_image_input = $("#b_image_input");
    var $popupTheme = $("#popupTheme");
    var $popupNewTheme = $("#popupNewTheme");

    var g_img_nr;
    var g_sliderPos;
    var g_mode;

    var g_startX;
    var g_startY;
    var g_width;
    var g_height;
    var g_hvSwitch = 1;

    var g_image_slider;

    var localStorageOK = (function () {
        var mod = "modernizr";
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch (ignore) {
            return false;
        }
    }());

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("sw.js").then(function (registration) {
                // console.log("ServiceWorker registration successful with scope: ", registration.scope);
            }, function (ignore) {
                //console.log("ServiceWorker registration failed: ", err);
            });
        });
    }

    /**
     * Detecting vertical squash in loaded image.
     * Fixes a bug which squash image vertically while drawing into canvas for some images.
     */

    function detectVerticalSquash(img, ih) {
        var alpha;
        var canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = ih;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 1, ih).data;
        // search image edge pixel position in case it is squashed vertically.
        var sy = 0;
        var ey = ih;
        var py = ih;
        while (py > sy) {
            alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }
        var ratio = (py / ih);
        return (ratio === 0)
            ? 1
            : ratio;
    }

    function buildBackground(img) {
        var l_back_g_image;
        var n;
        var i;
        var back_g_grid;
        if (g_back_g_image) {
            l_back_g_image = new Kinetic.Image({
                x: 0,
                y: 0,
                width: g_canvas_width,
                height: g_canvas_height,
                Image: img,
                opacity: 0.1
            });
            g_back_g_layer.add(l_back_g_image);

            //l_back_g_image.applyFilter(Kinetic.Filters.Grayscale, null, function () {
            //    g_back_g_layer.draw();
            //});
            g_back_g_layer.draw();
        }
        if (g_back_g_grid) {
            for (n = 0; n < g_rows; n += 1) {
                for (i = 0; i < g_cols; i += 1) {
                    back_g_grid = new Kinetic.Rect({
                        x: i * g_width,
                        y: n * g_height,
                        width: g_width,
                        height: g_height,
                        stroke: "#333333",
                        strokeWidth: 2
                    });
                    g_back_g_layer.add(back_g_grid);
                }
            }
        }
        g_stage.add(g_back_g_layer);
        g_back_g_layer.moveToBottom();
    }

    function startPlay() {
        g_ready = true;
        g_buildPuzzle = false;
    }

    function displayPuzzle() {
        var tween;
        var j;
        $.mobile.hidePageLoadingMsg();
        $.mobile.changePage("#game", {transition: "slide"});
        setTimeout(function () {
            var l_allPieces = g_layer.getChildren();
            for (j = 0; j < l_allPieces.length; j += 1) {
                l_allPieces[j].setZIndex(Math.floor(Math.random() * g_cols * g_rows));
            }
            for (j = 0; j < l_allPieces.length; j += 1) {
                if (g_rotate) {
                    tween = new Kinetic.Tween({
                        node: l_allPieces[j],
                        x: Math.floor(Math.random() * g_width * (g_cols - 1)) + g_width / 2,
                        y: Math.floor(Math.random() * g_height * (g_rows - 1)) + g_height / 2,
                        rotation: Math.PI * 0.5 * Math.floor(Math.random() * 4),
                        duration: 1,
                        onFinish: startPlay()
                    });
                    tween.play();
                } else {
                    tween = new Kinetic.Tween({
                        node: l_allPieces[j],
                        x: Math.floor(Math.random() * g_width * (g_cols - 1)) + g_width / 2,
                        y: Math.floor(Math.random() * g_height * (g_rows - 1)) + g_height / 2,
                        duration: 1,
                        onFinish: startPlay()
                    });
                    tween.play();
                }
            }
        }, 2000);
    }

    function drawPiece(i, n, g_hvSwitch, img) {
        (function () {
            var piece;
            if (g_shape) {
                var piece_shape = new Kinetic.Shape({
                    drawFunc: function (context) {
                        context.beginPath();
                        context.moveTo(g_startX, g_startY); // start top left
                        //top
                        if (n === 0) {
                            context.lineTo(g_startX + g_width, g_startY);
                        } else {
                            context.bezierCurveTo(g_startX + g_width * 0.8, g_startY + g_height * 0.1 * g_hvSwitch, g_startX, g_startY - g_height * 0.25 * g_hvSwitch, g_startX + g_width / 2, g_startY - g_height * 0.25 * g_hvSwitch);
                            context.bezierCurveTo(g_startX + g_width, g_startY - g_height * 0.25 * g_hvSwitch, g_startX + g_width * 0.2, g_startY + g_height * 0.1 * g_hvSwitch, g_startX + g_width, g_startY);
                        }
                        //right
                        if (i === g_cols - 1) {
                            context.lineTo(g_startX + g_width, g_startY + g_height);
                        } else {
                            context.bezierCurveTo(g_startX + g_width + g_width * 0.1 * g_hvSwitch, g_startY + g_height * 0.8, g_startX + g_width - g_width * 0.25 * g_hvSwitch, g_startY, g_startX + g_width - g_width * 0.25 * g_hvSwitch, g_startY + g_height / 2);
                            context.bezierCurveTo(g_startX + g_width - g_width * 0.25 * g_hvSwitch, g_startY + g_height, g_startX + g_width + g_width * 0.1 * g_hvSwitch, g_startY + g_height * 0.2, g_startX + g_width, g_startY + g_height);
                        }
                        //bottom
                        if (n === g_rows - 1) {
                            context.lineTo(g_startX, g_startY + g_height);
                        } else {
                            context.bezierCurveTo(g_startX + g_width * 0.2, g_startY + g_height - g_height * 0.1 * g_hvSwitch, g_startX + g_width, g_startY + g_height + g_height * 0.25 * g_hvSwitch, g_startX + g_width / 2, g_startY + g_height + g_height * 0.25 * g_hvSwitch);
                            context.bezierCurveTo(g_startX, g_startY + g_height + g_height * 0.25 * g_hvSwitch, g_startX + g_width * 0.8, g_startY + g_height - g_height * 0.1 * g_hvSwitch, g_startX, g_startY + g_height);
                        }
                        //left
                        if (i === 0) {
                            context.lineTo(g_startX, g_startY);
                        } else {
                            context.bezierCurveTo(g_startX - g_width * 0.1 * g_hvSwitch, g_startY + g_height * 0.2, g_startX + g_width * 0.25 * g_hvSwitch, g_startY + g_height, g_startX + g_width * 0.25 * g_hvSwitch, g_startY + g_height / 2);
                            context.bezierCurveTo(g_startX + g_width * 0.25 * g_hvSwitch, g_startY, g_startX - g_width * 0.1 * g_hvSwitch, g_startY + g_height * 0.8, g_startX, g_startY);
                        }

                        context.closePath();
                        context.fillStrokeShape(this);
                    },
                    //fill: {image: img, offset: [i * g_width, n*g_height] },
                    fillPatternImage: img,
                    fillPatternOffset: [i * g_width, n * g_height],
                    stroke: "black",
                    strokeWidth: 4
                });
                piece_shape.toImage({
                    // define the size of the new image object
                    width: g_width + 0.6 * g_width,
                    height: g_height + 0.6 * g_height,
                    x: -g_width * 0.3,
                    y: -g_height * 0.3,
                    callback: function (img) {
                        // cache the image as a Kinetic.Image shape
                        piece = new Kinetic.Image({
                            image: img,
                            x: i * g_width + g_width / 2,
                            origX: i * g_width + g_width / 2,
                            y: n * g_height + g_height / 2,
                            origY: n * g_height + g_height / 2,
                            row: n,
                            col: i,
                            offset: [g_width / 2 + g_width * 0.3, g_height / 2 + g_height * 0.3],
                            draggable: true,
                            dragBoundFunc: function (pos) {
                                var newY = pos.y;
                                var newX = pos.x;
                                if (newX < 0) {
                                    newX = 0;
                                }
                                if (newX > g_canvas_width) {
                                    newX = g_canvas_width;
                                }
                                if (newY < 0) {
                                    newY = 0;
                                }
                                if (newY > g_canvas_height) {
                                    newY = g_canvas_height;
                                }
                                return {x: newX, y: newY};
                            },
                            name: "part_z" + n + "_s" + i
                        });
                        drawPiece_2(piece);
                        piece.createImageHitRegion(function () {
                            g_layer.drawHit();
                        });
                    }
                });
                piece_shape.setStrokeWidth(null);
                piece_shape.setStroke(null);

                piece_shape.toImage({
                    // define the size of the new image object
                    width: g_width + 0.6 * g_width,
                    height: g_height + 0.6 * g_height,
                    x: -g_width * 0.3,
                    y: -g_height * 0.3,
                    callback: function (img) {
                        g_imgNoStroke[n][i] = img;
                    }
                });
            } else {
                piece = new Kinetic.Image({
                    x: i * g_width + g_width / 2,
                    origX: i * g_width + g_width / 2,
                    y: n * g_height + g_height / 2,
                    origY: n * g_height + g_height / 2,
                    row: n,
                    col: i,
                    width: g_width,
                    height: g_height,
                    offset: [g_width / 2, g_height / 2],
                    crop: {
                        x: img.width / g_cols * i,
                        y: img.height / g_rows * n,
                        width: img.width / g_cols,
                        height: img.height / g_rows
                    },
                    stroke: "black",
                    strokeWidth: 4,
                    fill: "black",
                    Image: img,
                    draggable: true,
                    dragBoundFunc: function (pos) {
                        var newY = pos.y;
                        var newX = pos.x;
                        if (newX < 0) {
                            newX = 0;
                        }
                        if (newX > g_canvas_width) {
                            newX = g_canvas_width;
                        }
                        if (newY < 0) {
                            newY = 0;
                        }
                        if (newY > g_canvas_height) {
                            newY = g_canvas_height;
                        }
                        return {x: newX, y: newY};
                    },
                    name: "part_z" + n + "_s" + i
                });
                drawPiece_2(piece);
            }
        }());
    }

    function buildPuzzle() {
        var i;
        var n;
        g_imgNoStroke = [];
        for (i = 0; i < g_rows; i += 1) {
            g_imgNoStroke[i] = [];
        }
        g_set = 0;
        g_layer.removeChildren();
        g_back_g_layer.removeChildren();
        g_stage.removeChildren();
        g_stage.setWidth(g_canvas_width);
        g_stage.setHeight(g_canvas_height);
        g_startX = 0;
        g_startY = 0;
        g_width = g_canvas_width / g_cols;
        g_height = g_canvas_height / g_rows;
        g_hvSwitch = 1;
        g_stage.add(g_layer);
        var l_temp_width = g_canvas_width;
        var l_temp_height = g_canvas_height;

        if (iOS) {
            //var subSampled = detectSubSampling(g_imageObj);
            //alert("Sub-sampled: " + subSampled);
            var verticalSquashRatio = detectVerticalSquash(g_imageObj, g_imageObj.naturalHeight);
            //alert ("SquashRatio: " + verticalSquashRatio);
            l_temp_height = l_temp_height / verticalSquashRatio;
        }

        if (g_image_slider.getPos() === 0 && (g_own_orientation === 5 || g_own_orientation === 6 || g_own_orientation === 7 || g_own_orientation === 8)) {
            l_temp_width = g_canvas_height;
            l_temp_height = g_canvas_width;
        }

        var l_temp_image = new Kinetic.Image({
            width: l_temp_width,
            height: l_temp_height,
            crop: {
                x: 0,
                y: 0,
                width: g_imageObj.width,
                height: g_imageObj.height
            },
            Image: g_imageObj
        });
        if (g_image_slider.getPos() === 0 && (g_own_orientation === 5 || g_own_orientation === 6)) {
            l_temp_image.setRotationDeg(90);
            l_temp_image.setX(g_canvas_width);
        }
        if (g_image_slider.getPos() === 0 && (g_own_orientation === 3 || g_own_orientation === 4)) {
            l_temp_image.setRotationDeg(180);
            l_temp_image.setX(g_canvas_width);
            l_temp_image.setY(g_canvas_height);
        }
        if (g_image_slider.getPos() === 0 && (g_own_orientation === 7 || g_own_orientation === 8)) {
            l_temp_image.setRotationDeg(270);
            l_temp_image.setY(g_canvas_height);
        }
        l_temp_image.toImage({
            width: g_canvas_width,
            height: g_canvas_height,
            callback: function (img) {
                if (g_back_g_grid || g_back_g_image) {
                    buildBackground(img);
                }
                if (g_shape) {
                    l_temp_image.toImage({
                        width: g_canvas_width,
                        height: g_canvas_height,
                        callback: function (img) {
                            for (n = 0; n < g_rows; n += 1) {
                                for (i = 0; i < g_cols; i += 1) {
                                    if ((n % 2 !== 0 && i % 2 !== 0) || (n % 2 === 0 && i % 2 === 0)) {
                                        g_hvSwitch = 1;
                                    } else {
                                        g_hvSwitch = -1;
                                    }
                                    drawPiece(i, n, g_hvSwitch, img);
                                }
                            }
                            g_layer.draw();
                            displayPuzzle();
                        }
                    });
                } else {
                    for (n = 0; n < g_rows; n += 1) {
                        for (i = 0; i < g_cols; i += 1) {
                            if ((n % 2 !== 0 && i % 2 !== 0) || (n % 2 === 0 && i % 2 === 0)) {
                                g_hvSwitch = 1;
                            } else {
                                g_hvSwitch = -1;
                            }
                            drawPiece(i, n, g_hvSwitch, img);
                        }
                    }
                    g_layer.draw();
                    displayPuzzle();
                }
            }
        });
    }

    function loadPuzzle() {
        g_sliderPos = g_image_slider.getPos();
        g_img_nr = $("input:radio[name=image-set-" + g_sliderPos + "]:checked").val();
        if (g_buildPuzzle) {
            return;
        }
        if (g_img_nr === undefined) {
            $("#popup_choose").popup("open");
            return;
        }
        if (g_own_image === undefined && g_sliderPos === 0) {
            $("#popup_choose").popup("open");
            return;
        }
        if (g_medal && $("#image" + g_sliderPos + "-" + g_img_nr).hasClass("locked")) {
            return;
        }
        g_buildPuzzle = true;

        $.mobile.showPageLoadingMsg("a", document.webL10n.get("lb_load"), false);
        g_back_g_grid = $b_back_g_grid.val() === "on";
        g_back_g_image = $b_back_g_image.val() === "on";
        g_rotate = $b_rotate.val() === "on";
        g_sound = $b_sound.val() === "on";

        if (localStorageOK) {
            localStorage.setItem("s_back_g_grid", $b_back_g_grid.val());
            localStorage.setItem("s_backg_image", $b_back_g_image.val());
            localStorage.setItem("s_rotate", $b_rotate.val());
            localStorage.setItem("s_sound", $b_sound.val());
        }

        document.getElementById("container").width = g_windows_width;
        document.getElementById("container").height = g_windows_height;
        g_canvas_height = g_windows_height - 4;
        g_canvas_width = g_windows_width;
        g_lock_portrait = g_portrait;
        if (g_sliderPos !== 0) {
            if (window.devicePixelRatio !== undefined) {
                g_pixel_ratio = window.devicePixelRatio;
            } else {
                g_pixel_ratio = 1;
            }
            if (Math.min(g_windows_height, g_windows_width) * g_pixel_ratio <= 270) {
                g_image_size = "s";
            } else if (Math.min(g_windows_height, g_windows_width) * g_pixel_ratio > 1080) {
                g_image_size = "l";
            } else {
                g_image_size = "";
            }
            g_image_path = "Images/" + g_theme + "/image-set-" + g_sliderPos + "/sujet" + g_portrait + g_img_nr + g_image_size + ".jpg";
        } else {
            g_image_path = g_own_image;
        }

        $("#g_imageObj")
            .one("load", function () { //Set something to run when it finishes loading
                g_imageObj = document.getElementById("g_imageObj");
                buildPuzzle();
            })
            .attr("src", g_image_path) //Set the source so it begins fetching
            .each(function () {
                //Cache fix for browsers that don't trigger .load()
                if (navigator.sayswho.indexOf("MSIE") >= 0 && this.complete) {
                    $(this).trigger("load");
                }
            });
    }

    function easyClick() {
        g_mode = "1";
        if (g_windows_height > g_windows_width) {
            if (g_gold) {
                g_rows = 9;
                g_cols = 6;
            } else {
                g_rows = 3;
                g_cols = 2;
            }
        } else {
            if (g_gold) {
                g_rows = 6;
                g_cols = 9;
            } else {
                g_rows = 2;
                g_cols = 3;
            }
        }
        loadPuzzle();
    }

    function mediumClick() {
        g_mode = "2";
        if (g_windows_height > g_windows_width) {
            if (g_gold) {
                g_rows = 12;
                g_cols = 8;
            } else {
                g_rows = 6;
                g_cols = 4;
            }
        } else {
            if (g_gold) {
                g_rows = 8;
                g_cols = 12;
            } else {
                g_rows = 4;
                g_cols = 6;
            }
        }
        loadPuzzle();
    }

    function hardClick() {
        g_mode = "3";
        if (g_windows_height > g_windows_width) {
            if (g_gold) {
                g_rows = 18;
                g_cols = 12;
            } else {
                g_rows = 8;
                g_cols = 5;
            }
        } else {
            if (g_gold) {
                g_rows = 12;
                g_cols = 18;
            } else {
                g_rows = 5;
                g_cols = 8;
            }
        }
        loadPuzzle();
    }

    $container.mouseup(function () {
        if (g_currentPiece !== undefined && g_currentPiece.getParent().attrs.name !== "g_layer") {
            setTimeout(function () {
                g_currentPiece.fire("dragend");
            }, 350);
        }
    });

    $container.touchend(function () {
        if (g_currentPiece !== undefined && g_currentPiece.getParent().attrs.name !== "g_layer") {
            setTimeout(function () {
                g_currentPiece.fire("dragend");
            }, 350);
        }
    });

    function pieceToGroup(piece, piece2, l_sollX, l_sollY) {
        var j;
        var l_allPieces;
        var l_move_piece;
        var l_pieceX;
        var l_pieceY;
        var l_moveX;
        var l_moveY;
        if (piece.getParent().attrs.name === "g_layer") {
            // Piece 1 not in group
            if (piece2.getParent().attrs.name === "g_layer") {
                // Piece 2 not in group
                piece2.setX(l_sollX);
                piece2.setY(l_sollY);
                var group = new Kinetic.Group({
                    draggable: true,
                    dragBoundFunc: function (pos) {
                        var newY = pos.y;
                        var newX = pos.x;
                        if (newX < 0) {
                            newX = 0;
                        }
                        if (newX > g_canvas_width) {
                            newX = g_canvas_width;
                        }
                        if (newY < 0) {
                            newY = 0;
                        }
                        if (newY > g_canvas_height) {
                            newY = g_canvas_height;
                        }
                        return {
                            x: newX,
                            y: newY
                        };
                    }
                });
                piece.moveTo(group);
                piece2.moveTo(group);
                piece.setDraggable(false);
                piece2.setDraggable(false);
                g_layer.add(group);
            } else {
                // Piece 2 in group
                l_pieceX = piece.getX();
                l_pieceY = piece.getY();
                piece2.getParent().setX(piece2.getParent().getX() + l_sollX - piece2.getAbsolutePosition().x);
                piece2.getParent().setY(piece2.getParent().getY() + l_sollY - piece2.getAbsolutePosition().y);
                piece.moveTo(piece2.getParent());
                piece.setRotationDeg(piece2.getRotationDeg());
                l_moveX = l_pieceX - piece.getAbsolutePosition().x;
                l_moveY = l_pieceY - piece.getAbsolutePosition().y;
                if (piece.getParent().getRotationDeg() === 0) {
                    piece.setX(piece.getX() + l_moveX);
                    piece.setY(piece.getY() + l_moveY);
                }
                if (piece.getParent().getRotationDeg() === 90) {
                    piece.setY(piece.getY() - l_moveX);
                    piece.setX(piece.getX() + l_moveY);
                }
                if (piece.getParent().getRotationDeg() === 180) {
                    piece.setX(piece.getX() - l_moveX);
                    piece.setY(piece.getY() - l_moveY);
                }
                if (piece.getParent().getRotationDeg() === 270) {
                    piece.setY(piece.getY() + l_moveX);
                    piece.setX(piece.getX() - l_moveY);
                }
                piece.setDraggable(false);
            }
        } else {
            // Piece 1 in group
            if (piece2.getParent().attrs.name === "g_layer") {
                // Piece 2not in group
                piece2.moveTo(piece.getParent());
                piece2.setAbsolutePosition(l_sollX, l_sollY);
                piece2.setRotationDeg(piece.getRotationDeg());
                piece2.setDraggable(false);
            } else {
                // Piece 2 in group
                l_allPieces = piece2.getParent().getChildren();
                var l_korrX = l_sollX - piece2.getAbsolutePosition().x;
                var l_korrY = l_sollY - piece2.getAbsolutePosition().y;
                while (l_allPieces.length > 0) {

                    if (l_allPieces[0] !== undefined) {

                        l_move_piece = l_allPieces[0];

                        l_pieceX = l_move_piece.getAbsolutePosition().x;
                        l_pieceY = l_move_piece.getAbsolutePosition().y;

                        l_move_piece.moveTo(piece.getParent());
                        l_move_piece.setRotationDeg(piece.getRotationDeg());
                        l_moveX = l_pieceX - l_move_piece.getAbsolutePosition().x + l_korrX;
                        l_moveY = l_pieceY - l_move_piece.getAbsolutePosition().y + l_korrY;
                        if (piece.getParent().getRotationDeg() === 0) {
                            l_move_piece.setX(l_move_piece.getX() + l_moveX);
                            l_move_piece.setY(l_move_piece.getY() + l_moveY);
                        }
                        if (piece.getParent().getRotationDeg() === 90) {
                            l_move_piece.setY(l_move_piece.getY() - l_moveX);
                            l_move_piece.setX(l_move_piece.getX() + l_moveY);
                        }
                        if (piece.getParent().getRotationDeg() === 180) {
                            l_move_piece.setX(l_move_piece.getX() - l_moveX);
                            l_move_piece.setY(l_move_piece.getY() - l_moveY);
                        }
                        if (piece.getParent().getRotationDeg() === 270) {
                            l_move_piece.setY(l_move_piece.getY() + l_moveX);
                            l_move_piece.setX(l_move_piece.getX() - l_moveY);
                        }
                    }
                }
            }
        }

        l_allPieces = piece.getParent().getChildren();
        var l_minX = l_allPieces[0].getAbsolutePosition().x;
        var l_maxX = l_allPieces[0].getAbsolutePosition().x;
        var l_miny = l_allPieces[0].getAbsolutePosition().y;
        var l_maxy = l_allPieces[0].getAbsolutePosition().y;

        for (j = 0; j < l_allPieces.length; j += 1) {
            if (l_allPieces[j].getAbsolutePosition().x < l_minX) {
                l_minX = l_allPieces[j].getAbsolutePosition().x;
            }
            if (l_allPieces[j].getAbsolutePosition().x > l_maxX) {
                l_maxX = l_allPieces[j].getAbsolutePosition().x;
            }
            if (l_allPieces[j].getAbsolutePosition().y < l_miny) {
                l_miny = l_allPieces[j].getAbsolutePosition().y;
            }
            if (l_allPieces[j].getAbsolutePosition().y > l_maxy) {
                l_maxy = l_allPieces[j].getAbsolutePosition().y;
            }
        }
        l_pieceX = piece.getAbsolutePosition().x;
        l_pieceY = piece.getAbsolutePosition().y;

        piece.getParent().setOffset(0, 0);
        piece.getParent().setX((l_minX + l_maxX) / 2);
        piece.getParent().setY((l_miny + l_maxy) / 2);

        l_moveX = (l_pieceX - piece.getAbsolutePosition().x);
        l_moveY = (l_pieceY - piece.getAbsolutePosition().y);

        if (piece.getParent().getRotationDeg() === 0) {
            piece.getParent().setOffset(l_moveX * -1, l_moveY * -1);
        }
        if (piece.getParent().getRotationDeg() === 90) {
            piece.getParent().setOffset(l_moveY * -1, l_moveX);
        }
        if (piece.getParent().getRotationDeg() === 180) {
            piece.getParent().setOffset(l_moveX, l_moveY);
        }
        if (piece.getParent().getRotationDeg() === 270) {
            piece.getParent().setOffset(l_moveY, l_moveX * -1);
        }

        if (piece2.getParent().attrs.name === "g_layer") {
            piece2.moveToTop();
        } else {
            piece2.getParent().moveToTop();
        }
        g_layer.draw();
        if (g_sound) {
            document.getElementById("click_sound").play();
        }
    }

    function surroundingPieces(piece) {
        // stick surrounding pieces
        var n;
        var l_sollX;
        var l_sollY;
        var sfaktor = [-1, 1, 0, 0];
        var zfaktor = [0, 0, -1, 1];
        var piece2;
        if (piece.getParent().attrs.name === "g_layer") {
            g_pieceAbsoluteRotation = piece.getRotationDeg();
        } else {
            g_pieceAbsoluteRotation = (piece.getRotationDeg() + piece.getParent().getRotationDeg()) % 360;
        }
        for (n = 0; n < sfaktor.length; n += 1) {
            piece2 = g_stage.get(".part_z" + (piece.attrs.row + zfaktor[n]) + "_s" + (piece.attrs.col + sfaktor[n]));
            if (piece2.length > 0) {
                if (piece2[0].getParent().attrs.name === "g_layer") {
                    g_piece2AbsoluteRotation = piece2[0].getRotationDeg();
                } else {
                    g_piece2AbsoluteRotation = (piece2[0].getRotationDeg() + piece2[0].getParent().getRotationDeg()) % 360;
                }

                if (g_pieceAbsoluteRotation === 0) {
                    l_sollX = piece.getAbsolutePosition().x + (g_width * sfaktor[n]);
                    l_sollY = piece.getAbsolutePosition().y + (g_height * zfaktor[n]);
                }
                if (g_pieceAbsoluteRotation === 90) {
                    l_sollX = piece.getAbsolutePosition().x - (g_height * zfaktor[n]);
                    l_sollY = piece.getAbsolutePosition().y + (g_width * sfaktor[n]);
                }
                if (g_pieceAbsoluteRotation === 180) {
                    l_sollX = piece.getAbsolutePosition().x - (g_width * sfaktor[n]);
                    l_sollY = piece.getAbsolutePosition().y - (g_height * zfaktor[n]);
                }
                if (g_pieceAbsoluteRotation === 270) {
                    l_sollX = piece.getAbsolutePosition().x + (g_height * zfaktor[n]);
                    l_sollY = piece.getAbsolutePosition().y - (g_width * sfaktor[n]);
                }
                if (Math.abs(l_sollX - piece2[0].getAbsolutePosition().x) < g_precision && Math.abs(l_sollY - piece2[0].getAbsolutePosition().y) < g_precision && g_pieceAbsoluteRotation === g_piece2AbsoluteRotation && (piece.getParent().attrs.name === "g_layer" || piece2[0].getParent().attrs.name === "g_layer" || piece.getParent() !== piece2[0].getParent())) {
                    pieceToGroup(piece, piece2[0], l_sollX, l_sollY);
                }
            }
        }
    }

    function setPiece(piece) {
        if (piece === undefined) {
            return;
        }
        piece.setX(piece.attrs.origX);
        piece.setY(piece.attrs.origY);
        piece.setRotationDeg(0);
        piece.moveToBottom();
        piece.setStrokeWidth(null);
        piece.setStroke(null);
        piece.setDraggable(false);
        if (g_shape) {
            piece.setImage(g_imgNoStroke[piece.attrs.row][piece.attrs.col]);
        }
        g_layer.draw();
        if (g_shape) {
            piece.disableShadow();
        }
        if (g_sound) {
            document.getElementById("click_sound").play();
        }
        document.body.style.cursor = "default";
        setTimeout(function () {
            g_set += 1;
            if (g_set === g_cols * g_rows) {
                $bt_close.css("display", "none");
                if (g_sound) {
                    document.getElementById("ding_sound").play();
                }
            }
        }, 500);
    }

    function pieceTestTarget(piece) {
        var j;
        var l_allPieces;
        var l_move_piece;
        // Piece lies at the right place
        if (piece.getParent().attrs.name === "g_layer") {
            g_pieceAbsoluteRotation = piece.getRotationDeg();
        } else {
            g_pieceAbsoluteRotation = (piece.getRotationDeg() + piece.getParent().getRotationDeg()) % 360;
        }
        if (Math.abs(piece.getAbsolutePosition().x - piece.attrs.origX) < g_precision && Math.abs(piece.getAbsolutePosition().y - piece.attrs.origY) < g_precision && g_pieceAbsoluteRotation === 0) {
            if (piece.getParent().attrs.name === "g_layer") {
                setPiece(piece);
            } else {
                l_allPieces = piece.getParent().getChildren();
                while (l_allPieces.length > 0) {
                    l_move_piece = l_allPieces[0];
                    l_move_piece.moveTo(g_layer);
                    setPiece(l_move_piece);
                }
            }
        } else {
            if (piece.getParent().attrs.name === "g_layer") {
                surroundingPieces(piece);
            } else {
                l_allPieces = piece.getParent().getChildren();
                for (j = 0; j < l_allPieces.length; j += 1) {
                    surroundingPieces(l_allPieces[j]);
                }
            }
        }
    }

    function setGold(gold) {
        $b_gold.val(gold).slider("refresh");
        if (localStorageOK) {
            localStorage.setItem("s_gold", $b_gold.val());
        }
        if ($b_gold.val() === "on") {
            g_gold = true;
            $("#img_easy").attr("src", "Images/easy_gold.svg");
            $("#img_med").attr("src", "Images/medium_gold.svg");
            $("#img_hard").attr("src", "Images/hard_gold.svg");
        } else {
            g_gold = false;
            $("#img_easy").attr("src", "Images/easy.svg");
            $("#img_med").attr("src", "Images/medium.svg");
            $("#img_hard").attr("src", "Images/hard.svg");
        }
    }

    function setLockMedal() {
        var s;
        var n;
        var l_currentLevel;
        var $medal;
        var l_sumLevel = 0;
        for (s = 1; s < 5; s += 1) {
            for (n = 1; n < 4; n += 1) {
                //test
                //localStorage.setItem(g_theme + s + g_portrait + n,"3");
                //test
                if (localStorageOK) {
                    l_currentLevel = localStorage.getItem(g_theme + s + g_portrait + n) || 0;
                } else {
                    l_currentLevel = 0;
                }

                l_sumLevel += parseInt(l_currentLevel);
                if (!g_medal) {
                    $("#medal" + s + "-" + n).addClass("dn");
                    $("#image" + s + "-" + (n + 1)).removeClass("locked");
                    $("#lock" + s + "-" + (n + 1)).addClass("dn");
                } else if (l_currentLevel > 0) {
                    $medal = $("#medal" + s + "-" + n);
                    $medal.removeClass("dn");
                    $medal.attr("src", "Images/medal" + l_currentLevel + ".svg");
                    if (n < 3) {
                        $("#image" + s + "-" + (n + 1)).removeClass("locked");
                        $("#lock" + s + "-" + (n + 1)).addClass("dn");
                    }
                } else {
                    $("#medal" + s + "-" + n).addClass("dn");
                    if (n < 3) {
                        $("#image" + s + "-" + (n + 1)).addClass("locked");
                        $("#lock" + s + "-" + (n + 1)).removeClass("dn");
                    }
                }
            }
        }
        if (l_sumLevel === 36) {
            $b_gold_enabled.show();
            setGold("on");
            $b_gold.slider({theme: "d"}).slider("refresh");
            $b_gold_disabled.hide();
            //$b_gold.removeAttr("disabled").slider("refresh");

        } else {
            $b_gold_disabled.show();
            setGold("off");
            $b_gold.slider({theme: "d"}).slider("refresh");
            $b_gold_enabled.hide();
            //$b_gold.attr("disabled", "disabled").slider("refresh");

        }
    }

    function content_formatting() {
        var s;
        var n;
        g_windows_height = $(window).height();
        g_windows_width = $(window).width();
        g_portrait = "";
        if (g_windows_height > g_windows_width) {
            g_portrait = "p";
            $("#img_title").attr("style", "width:100%;");
            $(".image0").attr("style", "height:" + (g_windows_width / 3 - 50) * 1.5 + "px;");
            $(".lock").css({"left": "10%", "bottom": (g_windows_width - 70) / 9.8, "width": "80%"});
        } else {
            $("#img_title").attr("style", "max-height:" + (g_windows_height / 5) + "px;");
            $(".image0").attr("style", "height:" + (g_windows_width / 3 - 50) / 1.5 + "px;");
            $(".lock").css({"left": "25%", "bottom": (g_windows_width - 70) / 30, "width": "50%"});
        }
        $popupTheme.css("max-height", (g_windows_height - 10) + "px");
        $popupNewTheme.css("max-width", (g_windows_width - 10) + "px");
        $bt_easy.attr("style", "width:" + (g_windows_width / 3 - 12) + "px;");
        $bt_med.attr("style", "width:" + (g_windows_width / 3 - 12) + "px;");
        $bt_hard.attr("style", "width:" + (g_windows_width / 3 - 12) + "px;");
        if (navigator.onLine) {
            for (s = 1; s < g_imageset + 1; s += 1) {
                for (n = 1; n < 4; n += 1) {
                    $("#radio" + s + "-" + n).attr("style", "width:" + (g_windows_width / 3 - 12) + "px;");
                    $("#image" + s + "-" + n).attr("src", "Images/" + g_theme + "/image-set-" + s + "/sujet" + g_portrait + n + "s.jpg");
                }
            }
            $(".offline").hide();
            $(".online").show();
        } else {
            $(".offline").show();
            $(".online").hide();
            g_image_slider.slide(0, 0);
        }
        if (!(g_theme === g_last_theme) || !(g_portrait === g_last_portrait)) {
            g_last_theme = g_theme;
            g_last_portrait = g_portrait;
            setLockMedal();
        }
    }

    function back(success) {
        var l_currentLevel;
        $bt_close.css("display", "inline");
        if (success) {
            if (localStorageOK) {
                l_currentLevel = localStorage.getItem(g_theme + g_sliderPos + g_lock_portrait + g_img_nr) || 0;
            } else {
                l_currentLevel = 0;
            }
            if (parseInt(g_mode) > parseInt(l_currentLevel)) {
                if (localStorageOK) {
                    localStorage.setItem(g_theme + g_sliderPos + g_lock_portrait + g_img_nr, g_mode);
                }
                setLockMedal();
                if (g_sound) {
                    document.getElementById("ding_sound").play();
                }
            }
        }
        $.mobile.changePage("#title", {transition: "slide", reverse: true});
        content_formatting();
        setTimeout(function () {
            content_formatting();
        }, 500);
    }

    function drawPiece_2(piece) {
        var l_angle;
        var tween;
        piece.on("mouseover", function () {
            if ((piece.getDraggable() || piece.getParent().getDraggable()) && g_ready) {
                document.body.style.cursor = "pointer";
            }
        });

        piece.on("click tap", function () {
            if (g_tap === false) {
                return;
            }
            if ((piece.getDraggable() || piece.getParent().getDraggable()) && g_ready && g_rotate && g_zIndex === g_layer.getChildren().length - 1) {
                if (piece.getParent().attrs.name === "g_layer") {
                    l_angle = piece.getRotation();
                    g_ready = false;
                    tween = new Kinetic.Tween({
                        node: piece,
                        duration: 0.5,
                        rotation: l_angle + Math.PI / 2,
                        onFinish: function () {
                            g_ready = true;
                            if (piece.getRotationDeg() === 360) {
                                piece.setRotationDeg(0);
                            }
                            piece.fire("dragend");
                        }
                    });
                    tween.play();
                } else {
                    l_angle = piece.getParent().getRotation();
                    g_ready = false;
                    tween = new Kinetic.Tween({
                        node: piece.getParent(),
                        duration: 0.5,
                        rotation: l_angle + Math.PI / 2,
                        onFinish: function () {
                            g_ready = true;
                            if (piece.getParent().getRotationDeg() === 360) {
                                piece.getParent().setRotationDeg(0);
                            }
                            piece.fire("dragend");
                        }
                    });
                    tween.play();
                }
            } else if (g_set === g_cols * g_rows) {
                g_ready = false;
                back(true);
            } else {
                piece.fire("dragend");
            }
        });

        piece.on("mousedown touchstart", function () {
            g_tap = true;
            setTimeout(function () {
                g_tap = false;
            }, 500);
            g_currentPiece = piece;
            if ((piece.getDraggable() || piece.getParent().getDraggable()) && g_ready) {
                if (piece.getParent().attrs.name === "g_layer") {
                    g_zIndex = piece.getZIndex();
                    piece.moveToTop();
                } else {
                    g_zIndex = piece.getParent().getZIndex();
                    piece.getParent().moveToTop();
                }
            }
        });

        piece.on("dragend", function () {
            if ((piece.getDraggable() || piece.getParent().getDraggable()) && g_ready) {
                pieceTestTarget(piece);
            } else if (g_set === g_cols * g_rows) {
                // Puzzle fertig gelöst
                g_ready = false;
                back(true);
            }
        });
        piece.on("mouseout", function () {
            document.body.style.cursor = "default";
        });
        g_layer.add(piece);
        g_layer.draw();
        g_stage.draw();
    }

    function handleFileSelect(evt) {
        var f;
        if (navigator.sayswho === "Safari,5.1.7" || navigator.sayswho === "MSIE,9.0") {
            $("#popup_own_img").popup("open");
            return;
        }

        f = evt.target.files[0]; // FileList object
        if (!f.type.match("image.*")) {
            return;
        }
        var reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = (function () {
            return function (e) {
                g_own_image = e.target.result;
                EXIF.getData(evt.target.files[0], function () {
                    g_own_orientation = EXIF.getTag(this, "Orientation");
                });
                $(".image0").attr("src", g_own_image);
                content_formatting();
                setTimeout(function () {
                    content_formatting();
                }, 500);
            };
        }(f));
        reader.readAsDataURL(f);
    }

    $(".own_image").click(function () {
        if (navigator.sayswho === "Safari,5.1.7" || navigator.sayswho === "MSIE,9.0") {
            $("#popup_own_img").popup("open");
            return;
        }
        // for FirefoxOS
        if ($b_image_input.attr("type") !== "file") {
            // Web Activities are not standard _yet_, so they use the Moz prefix.
            if (window.MozActivity) {
                var activity = new MozActivity({
                    name: "pick",
                    data: {type: "image/jpeg"}
                });
                activity.onsuccess = function () {
                    g_own_image = window.URL.createObjectURL(this.result.blob);
                    $(".image0").attr("src", g_own_image);
                    content_formatting();
                    setTimeout(function () {
                        content_formatting();
                    }, 500);
                };
            }
            // any other OS
        } else {
            $b_image_input.click();
        }
    }).show();

    function setTheme(theme) {
        g_theme = theme;
        $select_theme_img.attr("src", "Images/" + g_theme + "/theme.png");
        if (g_lang_ready) {
            $("#select_theme").html(document.webL10n.get("lb_" + g_theme));
        }
        if (localStorageOK) {
            localStorage.setItem("s_theme", theme);
        }
        $select_theme_img.attr("style", "width:59px; float:left;"); // to ensure repaint on ios
        content_formatting();
        $select_theme_img.attr("style", "width:60px; float:left;"); // to ensure repaint on ios
    }

    $b_gold.on("change", function () {
        setGold($b_gold.val());
    });

    function slide() {
        if (g_image_slider.getPos() === 0) {
            $("#bullets0").attr("src", "Images/bullets1o.svg");
        } else {
            $("#bullets0").attr("src", "Images/bullets0o.svg");
        }
        if (g_image_slider.getPos() === 1) {
            $("#bullets1").attr("src", "Images/bullets1.svg");
        } else {
            $("#bullets1").attr("src", "Images/bullets0.svg");
        }
        if (g_image_slider.getPos() === 2) {
            $("#bullets2").attr("src", "Images/bullets1.svg");
        } else {
            $("#bullets2").attr("src", "Images/bullets0.svg");
        }
        if (g_image_slider.getPos() === 3) {
            $("#bullets3").attr("src", "Images/bullets1.svg");
        } else {
            $("#bullets3").attr("src", "Images/bullets0.svg");
        }
        if (g_image_slider.getPos() === 4) {
            $("#bullets4").attr("src", "Images/bullets1.svg");
        } else {
            $("#bullets4").attr("src", "Images/bullets0.svg");
        }
    }

    function urlQuery(query) {
        query = query.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var expr = "[\\?&]" + query + "=([^&#]*)";
        var regex = new RegExp(expr);
        var results = regex.exec(window.location.href);
        if (results !== null) {
            return results[1];
        } else {
            return false;
        }
    }

    window.onload = function () {
        if (g_firstOnLoad) {
            g_firstOnLoad = false;
            if (!g_canvas_supported) {
                $("#popup_canvas").popup("open");
            }
            g_image_slider = new Swipe(document.getElementById("image_slider"), {
                startSlide: 1,
                callback: function (ignore, pos) {
                    if (pos === 0) {
                        $("#bullets0").attr("src", "Images/bullets1o.svg");
                    } else {
                        $("#bullets0").attr("src", "Images/bullets0o.svg");
                    }
                    if (pos === 1) {
                        $("#bullets1").attr("src", "Images/bullets1.svg");
                    } else {
                        $("#bullets1").attr("src", "Images/bullets0.svg");
                    }
                    if (pos === 2) {
                        $("#bullets2").attr("src", "Images/bullets1.svg");
                    } else {
                        $("#bullets2").attr("src", "Images/bullets0.svg");
                    }
                    if (pos === 3) {
                        $("#bullets3").attr("src", "Images/bullets1.svg");
                    } else {
                        $("#bullets3").attr("src", "Images/bullets0.svg");
                    }
                    if (pos === 4) {
                        $("#bullets4").attr("src", "Images/bullets1.svg");
                    } else {
                        $("#bullets4").attr("src", "Images/bullets0.svg");
                    }
                }
            });
            document.getElementById("b_image_input").addEventListener("change", handleFileSelect, false);
            $b_prev.click(function (e) {
                g_image_slider.prev();
                slide();
                e.preventDefault();
            });
            $b_next.click(function (e) {
                g_image_slider.next();
                slide();
                e.preventDefault();
            });
            $bt_easy.click(function (e) {
                easyClick();
                e.preventDefault();
            });
            $bt_med.click(function (e) {
                mediumClick();
                e.preventDefault();
            });
            $bt_hard.click(function (e) {
                hardClick();
                e.preventDefault();
            });
            $bt_close.click(function (e) {
                g_ready = false;
                back(false);
                e.preventDefault();
            });
            $("#s_mascha").click(function (e) {
                g_mascha += 1;
                if (g_mascha > 2) {
                    $(".t_mascha").removeClass("dn");
                }
            });
            $popupNewTheme.click(function (e) {
                setTheme("flowers");
                $("#popupNewTheme").popup("close");
                e.preventDefault();
            });
            $popupTheme.find("a").click(function (e) {
                setTheme(this.children[0].getAttribute("alt"));
                $popupTheme.popup("close");
                e.preventDefault();
            });
            $popupTheme.css({"overflow-y": "auto", "min-width": "270px"});

            $b_gold.slider();
            if (!localStorageOK) {
                $b_back_g_grid.val("on");
                $b_back_g_image.val("on");
                $b_rotate.val("off");
                $b_sound.val("on");
                setGold("off");
                setTheme("animals");
            } else {
                //localStorage.clear();
                if (localStorage.getItem("s_back_g_grid") === null) {
                    $b_back_g_grid.val("on");
                } else {
                    $b_back_g_grid.val(localStorage.getItem("s_back_g_grid"));
                }
                if (localStorage.getItem("s_backg_image") === null) {
                    $b_back_g_image.val("on");
                } else {
                    $b_back_g_image.val(localStorage.getItem("s_backg_image"));
                }
                if (localStorage.getItem("s_rotate") === null) {
                    $b_rotate.val("off");
                } else {
                    $b_rotate.val(localStorage.getItem("s_rotate"));
                }
                if (localStorage.getItem("s_sound") === null) {
                    $b_sound.val("on");
                } else {
                    $b_sound.val(localStorage.getItem("s_sound"));
                }
                if (localStorage.getItem("s_gold") === null) {
                    setGold("off");
                } else {
                    setGold(localStorage.getItem("s_gold"));
                }
                if (localStorage.getItem("s_theme") === null) {
                    setTheme("animals");
                } else {
                    setTheme(localStorage.getItem("s_theme"));
                }
            }
            // Example usage - http://homepage.hispeed.ch/grrds_games/Puzzle/?mascha=true&theme=mascha
            url_param = urlQuery("mascha");
            if (url_param === "true") {
                $(".t_mascha").removeClass("dn");
            }
            // Example usage - http://homepage.hispeed.ch/grrds_games/Puzzle/?shrek=true&mascha=true&theme=mascha
            url_param = urlQuery("shrek");
            if (url_param === "true") {
                $(".t_shrek").removeClass("dn");
                $("#favicon").attr("href","Images/favicon_dark.ico");
            }
            // Example usage - http://homepage.hispeed.ch/grrds_games/Puzzle/?theme=mascha
            url_param = urlQuery("theme");
            if (url_param) {
                setTheme(url_param);
            }
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
                $b_prev.attr("style", "display:none;");
                $b_next.attr("style", "display:none;");
            }
            $("#popupSettings").find("label").attr("style", "display:inline;");
            content_formatting();
            setTimeout(function () {
                g_imageset = 4;
                content_formatting();
            }, 500);
        }
    };

    $(window).resize(function () {
        content_formatting();
    });

    navigator.sayswho = (function () {
        var N = navigator.appName;
        var ua = navigator.userAgent;
        var tem = ua.match(/version\/([.\d]+)/i);
        var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (M && tem !== null) {
            M[2] = tem[1];
        }
        M = M
            ? [M[1], M[2]]
            : [N, navigator.appVersion, "-?"];
        return M;
    }());

    function popupNew() {
        if (new Date("10/25/2014") > new Date() && g_theme !== "flowers" && localStorageOK && localStorage.getItem("s_new_theme") !== "flowers") {
            $popupNewTheme.popup("open");
            //localStorage.setItem("s_new_theme", "flowers");
            content_formatting();
            setTimeout(function () {
                content_formatting();
            }, 500);
        }
    }

    document.webL10n.ready(function () {
        // Example usage - http://homepage.hispeed.ch/grrds_games/Puzzle/?theme=america&lang=ru
        g_lang_ready = true;
        url_param = urlQuery("lang");
        if (url_param && url_param !== document.webL10n.getLanguage()) {
            document.webL10n.setLanguage(url_param);
            g_lang_ready = false;
        }
    });

    document.addEventListener("localized", function () {
        if (g_lang_ready) {
            $("html").attr("lang", document.webL10n.getLanguage().substr(0, 2));
            $("meta[name=description]").attr("content", document.webL10n.get("lb_desc"));
            $("link[rel=manifest]").attr("href", "Manifest/appmanifest_" + document.webL10n.getLanguage().substr(0, 2) + ".json");
            $("link[rel=canonical]").attr("href", "https://grrd01.github.io/Puzzle/?lang=" + document.webL10n.getLanguage().substr(0, 2));
            $("#select_theme").html(document.webL10n.get("lb_" + g_theme));
            $("#radio0-1").attr("title", document.webL10n.get("lb_image"));
            $("#radio-offline").attr("title", document.webL10n.get("lb_image"));
            $(".image0").attr("alt", document.webL10n.get("lb_image"));
            setTimeout(function () {
                popupNew();
            }, 500);
        }
        g_lang_ready = true;
    });

}());