/*
 * grrd's Puzzle
 * Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net
 * Licensed under the MPL License
 */

var g_canvasSupported = !!window.HTMLCanvasElement;
if (!g_canvasSupported) {alert("Your browser does not support HTML5. Please use a modern browser like Chrome or Firefox.");}

var g_layer = new Kinetic.Layer({name: "g_layer"});
var g_backg_layer = new Kinetic.Layer({name: "g_backg_layer"});
var g_stage = new Kinetic.Stage({
		container: "container",
		width: document.getElementById("container").width,
		height: document.getElementById("container").height
	});
var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
var firefoxOS = (!!"mozApps" in navigator && navigator.userAgent.search("Mobile") != -1);
var g_imagepath;
var g_ownimage;
var g_own_orientation;
var g_imageObj = new Image();
var g_windowswidth;
var g_windowsheight;
var g_canvaswidth;
var g_canvasheight;
var g_portrait = "";
var g_zeilen = 4;
var g_spalten = 6;
var g_genauigkeit = 15 ;
var g_gesetzt = 0;
var g_buildpuzzle = false;
var g_ready = false;
var g_rotate = true;
var g_elastic = true;
var g_shape = false;
var g_backg_grid = true;
var g_backg_image = true;
var g_sound = true;
var g_zindex;
var g_pieceAbsoluteRotation;
var g_piece2AbsoluteRotation;
var g_firstonload = true;
var g_currentpiece;
var g_tap = false;
var g_img_nostroke;

var g_startX;
var g_startY;
var g_breite;
var g_hoehe;
var g_hvswitch = 1;

var image_slider;


function easy_click() {"use strict";
	if (g_windowsheight > g_windowswidth) {
		g_zeilen = 3;
		g_spalten = 2;
	} else {
		g_zeilen = 2;
		g_spalten = 3;
	}
	load_puzzle();
}

function medium_click() {"use strict";
	if (g_windowsheight > g_windowswidth) {
		g_zeilen = 6;
		g_spalten = 4;
	} else {
		g_zeilen = 4;
		g_spalten = 6;
	}
	load_puzzle();
}

function hard_click() {"use strict";
	if (g_windowsheight > g_windowswidth) {
		g_zeilen = 8;
		g_spalten = 5;
	} else {
		g_zeilen = 5;
		g_spalten = 8;
	}
	load_puzzle();
}

function load_puzzle(){"use strict";
	if (g_buildpuzzle){return;}
	g_buildpuzzle = true;
	if (typeof $('input:radio[name=image-set-'+image_slider.getPos()+']:checked').val() === "undefined") {
		alert("Please choose a picture first.");
		return;
	}
	if (g_ownimage === undefined && image_slider.getPos() ===0) {
		alert("Please choose a picture first.");
		return;
	}
	
	$.mobile.showPageLoadingMsg("a", "loading Puzzle...", false);
	if ($('#b_backg_grid').val()==="on") {g_backg_grid=true;} else {g_backg_grid=false;}
	if ($('#b_backg_image').val()==="on") {g_backg_image=true;} else {g_backg_image=false;}
	if ($('#b_rotate').val()==="on") {g_rotate=true;} else {g_rotate=false;}
	if ($('#b_sound').val()==="on") {g_sound=true;} else {g_sound=false;}
	if ($('#b_elastic').val()==="on") {g_elastic=true;} else {g_elastic=false;}
	if ($('#b_shape').val()==="on") {g_shape=true;} else {g_shape=false;}

	if(navigator.sayswho.indexOf("MSIE") < 0) {
		localStorage.setItem('s_backg_grid', $('#b_backg_grid').val());
		localStorage.setItem('s_backg_image', $('#b_backg_image').val());
		localStorage.setItem('s_rotate', $('#b_rotate').val());
		localStorage.setItem('s_sound', $('#b_sound').val());
		localStorage.setItem('s_elastic', $('#b_elastic').val());
		localStorage.setItem('s_shape', $('#b_shape').val());
	}

	document.getElementById("container").width = g_windowswidth;
	document.getElementById("container").height = g_windowsheight;
	g_canvasheight = g_windowsheight-4;
	g_canvaswidth = g_windowswidth;
	if (image_slider.getPos()!==0) {
		g_imagepath = "Images/"+$('#select_theme').val()+"/image-set-"+image_slider.getPos()+"/sujet"+g_portrait+$('input:radio[name=image-set-'+image_slider.getPos()+']:checked').val()+".jpg";
	} else {
		g_imagepath = g_ownimage;
	}

	$("#g_imageObj").one('load', function() { //Set something to run when it finishes loading
			g_imageObj = document.getElementById("g_imageObj");
			build_puzzle();  
		})
		.attr('src', g_imagepath) //Set the source so it begins fetching
		.each(function() {
			//Cache fix for browsers that don't trigger .load()
			if(navigator.sayswho.indexOf("MSIE") >= 0 && this.complete) {$(this).trigger('load');}
	});
}

$('#container').mouseup(function() {"use strict";
		if (g_currentpiece !== undefined && g_currentpiece.getParent().attrs.name !== "g_layer") {
			setTimeout(function() {g_currentpiece.fire('dragend');},350);
		}
});
$('#container').touchend(function() {"use strict";
		if (g_currentpiece !== undefined && g_currentpiece.getParent().attrs.name !== "g_layer") {
			setTimeout(function() {g_currentpiece.fire('dragend');},350);
		}
});

function build_puzzle(){"use strict";
	g_img_nostroke = new Array(g_zeilen);
  for (var i = 0; i < g_zeilen; i++) {
    g_img_nostroke[i] = new Array(g_spalten);
  }
	var l_angle;
	g_gesetzt = 0;
	g_layer.removeChildren();
	g_backg_layer.removeChildren();
	g_stage.removeChildren();
	g_stage.setWidth(g_canvaswidth);
	g_stage.setHeight(g_canvasheight);
	g_startX = 0;
	g_startY = 0;
	g_breite = g_canvaswidth/g_spalten;
	g_hoehe = g_canvasheight/g_zeilen;
	g_hvswitch = 1;
	g_stage.add(g_layer);
	var l_temp_width = g_canvaswidth;
	var l_temp_height =  g_canvasheight;
	if (g_own_orientation === 5 || g_own_orientation === 6 || g_own_orientation === 7 || g_own_orientation === 8) {
		l_temp_width = g_canvasheight;
		l_temp_height =  g_canvaswidth;
		//if (window.devicePixelRatio === 2) {
		if (iOS) {
			l_temp_height = l_temp_height /0.75;
		}
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
	if (image_slider.getPos()===0 && (g_own_orientation === 5 || g_own_orientation === 6)) {
		l_temp_image.setRotationDeg(90);
		l_temp_image.setX(g_canvaswidth);
	}
	if (image_slider.getPos()===0 && (g_own_orientation === 3 || g_own_orientation === 4)) {
		l_temp_image.setRotationDeg(180);
			l_temp_image.setX(g_canvaswidth);
			l_temp_image.setY(g_canvasheight);
	}	
	if (image_slider.getPos()===0 && (g_own_orientation === 7 || g_own_orientation === 8)) {
		l_temp_image.setRotationDeg(270);
		l_temp_image.setY(g_canvasheight);
	}
	l_temp_image.toImage({
		width: g_canvaswidth,
		height: g_canvasheight,
		callback: function(img) {
			if (g_backg_grid || g_backg_image) {
				build_background(img);
			}
			
			if (g_shape) {
				//l_temp_image.setWidth(l_temp_image.getWidth() / window.devicePixelRatio);
				//l_temp_image.setHeight(l_temp_image.getHeight() / window.devicePixelRatio);
				//l_temp_image.setX(l_temp_image.getX() / window.devicePixelRatio);
				//l_temp_image.setY(l_temp_image.getY() / window.devicePixelRatio);

				l_temp_image.toImage({
					width: g_canvaswidth,
					height: g_canvasheight,
					callback: function(img) {
						for(var n = 0; n < g_zeilen; n++) {
							for(var i = 0; i < g_spalten; i++) {
								if ((n % 2 !== 0 && i % 2 !== 0) || (n % 2 === 0 && i % 2 === 0)) {g_hvswitch = 1;} else {g_hvswitch = -1;}
								draw_piece(i,n,g_hvswitch,img);
							}
						}
						g_layer.draw();
						display_puzzle();
					}
				});
			} else {
				for(var n = 0; n < g_zeilen; n++) {
					for(var i = 0; i < g_spalten; i++) {
						if ((n % 2 !== 0 && i % 2 !== 0) || (n % 2 === 0 && i % 2 === 0)) {g_hvswitch = 1;} else {g_hvswitch = -1;}
						draw_piece(i,n,g_hvswitch,img);
					}
				}
				g_layer.draw();
				display_puzzle();
			}
		}
	});
}

function draw_piece(i,n, g_hvswitch,img) {"use strict";
	(function() {
		if (g_shape) {
			var piece_shape =  new Kinetic.Shape({
				drawFunc: function(context) {
					context.beginPath();
					context.moveTo(g_startX, g_startY); // startpunkt ol
					//oben
					if (n===0) {
						context.lineTo(g_startX + g_breite, g_startY);
					} else {
						context.bezierCurveTo(g_startX + g_breite*0.8,g_startY + g_hoehe*0.1*g_hvswitch,g_startX,g_startY - g_hoehe*0.25*g_hvswitch,g_startX + g_breite / 2, g_startY - g_hoehe*0.25*g_hvswitch); 
						context.bezierCurveTo(g_startX + g_breite,g_startY - g_hoehe*0.25*g_hvswitch,g_startX + g_breite*0.2,g_startY + g_hoehe*0.1*g_hvswitch,g_startX + g_breite, g_startY); 
					}
					//rechts
					if (i===g_spalten-1) {
						context.lineTo(g_startX + g_breite,g_startY + g_hoehe);
					} else {
						context.bezierCurveTo(g_startX + g_breite + g_breite*0.1*g_hvswitch,g_startY+g_hoehe*0.8,g_startX + g_breite - g_breite*0.25*g_hvswitch,g_startY,g_startX + g_breite - g_breite*0.25*g_hvswitch,g_startY + g_hoehe/2); 
						context.bezierCurveTo(g_startX + g_breite - g_breite*0.25*g_hvswitch,g_startY + g_hoehe,g_startX + g_breite + g_breite*0.1*g_hvswitch,g_startY+g_hoehe*0.2,g_startX + g_breite,g_startY + g_hoehe); 
					}
					//unten
					if (n===g_zeilen-1) {
						context.lineTo(g_startX,g_startY + g_hoehe);
					} else {
						context.bezierCurveTo(g_startX + g_breite*0.2,g_startY + g_hoehe - g_hoehe*0.1*g_hvswitch,g_startX + g_breite,g_startY + g_hoehe + g_hoehe*0.25*g_hvswitch,g_startX + g_breite / 2,g_startY + g_hoehe + g_hoehe*0.25*g_hvswitch); 
						context.bezierCurveTo(g_startX,g_startY + g_hoehe + g_hoehe*0.25*g_hvswitch,g_startX + g_breite*0.8,g_startY + g_hoehe  - g_hoehe*0.1*g_hvswitch,g_startX,g_startY + g_hoehe); 
					}
					//links
					if (i===0) {
						context.lineTo(g_startX,g_startY);
					} else {
						context.bezierCurveTo(g_startX - g_breite*0.1*g_hvswitch,g_startY + g_hoehe*0.2,g_startX + g_breite*0.25*g_hvswitch,g_startY+g_hoehe,g_startX+g_breite*0.25*g_hvswitch,g_startY + g_hoehe/2); 
						context.bezierCurveTo(g_startX+g_breite*0.25*g_hvswitch,g_startY,g_startX - g_breite*0.1*g_hvswitch,g_startY+g_hoehe*0.8,g_startX,g_startY); 
					}
			
					context.closePath();
					context.fillStrokeShape(this);
				},
				//fill: {image: img, offset: [i*g_breite, n*g_hoehe] },
				fillPatternImage: img,
				fillPatternOffset: [i*g_breite, n*g_hoehe],
				stroke: 'black',
				strokeWidth: 4
			});
			piece_shape.toImage({
				// define the size of the new image object
				width: g_breite+0.6*g_breite,
				height: g_hoehe+0.6*g_hoehe,
				x: -g_breite*0.3,
				y: -g_hoehe*0.3,
				callback: function(img) {
					// cache the image as a Kinetic.Image shape
					var piece = new Kinetic.Image({
						image: img,
						x: i * g_breite + g_breite / 2,
						origx: i * g_breite + g_breite / 2,
						y: n * g_hoehe + g_hoehe / 2,
						origy: n * g_hoehe + g_hoehe / 2,
						zeile: n,
						spalte: i,
						offset: [g_breite / 2 +g_breite*0.3, g_hoehe / 2+g_hoehe*0.3],
						draggable: true,
						dragBoundFunc: function(pos) {
							var newY = pos.y;
							var newX = pos.x;
							if (newX < 0) {newX=0;}
							if (newX > g_canvaswidth) {newX=g_canvaswidth;}
							if (newY < 0) {newY=0;}
							if (newY > g_canvasheight) {newY=g_canvasheight;}
							return {x: newX,y: newY};
						},
						name: "part_z" + n + "_s" + i
					});
					draw_piece_2(piece);
					piece.createImageHitRegion(function() {
						g_layer.drawHit();
					});
				}
			});
			piece_shape.setStrokeWidth(null);
			piece_shape.setStroke(null);

			piece_shape.toImage({
				// define the size of the new image object
				width: g_breite+0.6*g_breite,
				height: g_hoehe+0.6*g_hoehe,
				x: -g_breite*0.3,
				y: -g_hoehe*0.3,
				callback: function(img) {
					g_img_nostroke[n][i] = img;
				}
			});
		} else {
			var piece = new Kinetic.Image({
				x: i * g_breite + g_breite / 2,
				origx: i * g_breite + g_breite / 2,
				y: n * g_hoehe + g_hoehe / 2,
				origy: n * g_hoehe + g_hoehe / 2,
				zeile: n,
				spalte: i,
				width: g_breite,
				height: g_hoehe,
				offset: [g_breite / 2, g_hoehe / 2],
				crop: {
					x: img.width / g_spalten * i,
					y: img.height / g_zeilen * n,
					width: img.width / g_spalten,
					height: img.height / g_zeilen
				},
				stroke: "black",
				strokeWidth: 4,
				fill: "black",
				Image: img,
				draggable: true,
				dragBoundFunc: function(pos) {
					var newY = pos.y;
					var newX = pos.x;
					if (newX < 0) {newX=0;}
					if (newX > g_canvaswidth) {newX=g_canvaswidth;}
					if (newY < 0) {newY=0;}
					if (newY > g_canvasheight) {newY=g_canvasheight;}
					return {x: newX,y: newY};
				},
				name: "part_z" + n + "_s" + i
			});
			draw_piece_2(piece);
		}
	})();
}

function draw_piece_2(piece) {"use strict";
	var l_allpieces;
	var l_angle;
	var trans = null;
	var trans2 = null;
	if (g_elastic) {
		//piece.enableShadow();
		piece.setShadowColor('black');
		piece.setShadowOffset(5); 
		piece.setShadowOpacity(0.3); 
		piece.setShadowBlur(10);
	}
	piece.on("mouseover", function() {
		if ((piece.getDraggable()||piece.getParent().getDraggable()) && g_ready) {
			document.body.style.cursor = "pointer";
		}
	});

	piece.on("click tap", function() {
		if (g_tap === false) {return;}
		if ((piece.getDraggable()||piece.getParent().getDraggable()) && g_ready && g_rotate && g_zindex === g_layer.getChildren().length - 1) {
			if (piece.getParent().attrs.name === "g_layer") {
				l_angle=piece.getRotation();
				g_ready = false;
				var tween = new Kinetic.Tween({
					node: piece,
					duration: 0.5,
					rotation: l_angle + Math.PI/2,
					onFinish: function() {
						g_ready = true;
						if(piece.getRotationDeg() === 360) {piece.setRotationDeg(0);}
						piece.fire('dragend');
					}
				});
				tween.play();
			} else {
				l_angle=piece.getParent().getRotation();
				g_ready = false;
				var tween = new Kinetic.Tween({
					node: piece.getParent(),
					duration: 0.5,
					rotation: l_angle + Math.PI/2,
					onFinish: function() {
						g_ready = true;
						if(piece.getParent().getRotationDeg() === 360) {piece.getParent().setRotationDeg(0);}
						piece.fire('dragend');
					}
				});
				tween.play();
			}
		} else if (g_gesetzt === g_spalten * g_zeilen) {
			g_ready = false;
			back();
		} else {piece.fire('dragend');}
	});

	piece.on("mousedown touchstart", function() {
		g_tap=true;
		setTimeout(function() {g_tap = false;},500);
		g_currentpiece = piece;
		if ((piece.getDraggable()||piece.getParent().getDraggable()) && g_ready) {
			if (piece.getParent().attrs.name === "g_layer") {
				g_zindex=piece.getZIndex();
				piece.moveToTop();
				if (g_elastic) {
					if(trans) {
						trans.stop();
					}
					piece.setAttrs({
						scale: {x: 1.05,y: 1.05}
					});
					piece.setShadowOffset(15); 
				}
			} else {
				g_zindex=piece.getParent().getZIndex();
				piece.getParent().moveToTop();
				if (g_elastic) {
					if(trans) {
						trans.stop();
					}
					piece.getParent().setAttrs({
						scale: {x: 1.05,y: 1.05}
					});
					l_allpieces = piece.getParent().getChildren();
					for(var j = 0; j < l_allpieces.length; j++) {
						l_allpieces[j].setShadowOffset(15);
					}
				}
			}
		}
	});

	piece.on("dragend", function() {
		if ((piece.getDraggable()||piece.getParent().getDraggable()) && g_ready) {
			if (g_elastic && piece.getParent().attrs.name === "g_layer") {
				var tween = new Kinetic.Tween({
					node: piece,
					duration: 0.5,
					easing: Kinetic.Easings.ElasticEaseOut,
					scaleX: 1,
					scaleY: 1,
					shadowOffsetX: 5,
					shadowOffsetY: 5,
					onFinish: function() {teil_zieltest (piece);}
				});
				tween.play();
			} else if (g_elastic && piece.getParent().attrs.name !== "g_layer") {
				var tween = new Kinetic.Tween({
					node: piece.getParent(),
					duration: 0.5,
					easing: Kinetic.Easings.ElasticEaseOut,
					//shadowOffset: {x: 5,y: 5},gägägä
					scaleX: 1,
					scaleY: 1,
					onFinish: function() {teil_zieltest (piece);}
				});
				tween.play();
				l_allpieces = piece.getParent().getChildren();
				for(var j = 0; j < l_allpieces.length; j++) {
					l_allpieces[j].setShadowOffset(5);
				}
				
			} else {
				teil_zieltest (piece);
			}
		} else if (g_gesetzt === g_spalten * g_zeilen) {
			g_ready = false;
			back();
		}
	});
	piece.on("mouseout", function() {
		document.body.style.cursor = "default";
	});
	g_layer.add(piece);
	g_layer.draw();
	g_stage.draw();
}

function build_background(img) {"use strict";
	if (g_backg_image) {
		var l_backg_image = new Kinetic.Image({
			x: 0,
			y: 0,
			width: g_canvaswidth,
			height: g_canvasheight,
			Image: img,
			opacity: 0.1
		});
		g_backg_layer.add(l_backg_image);
		
		l_backg_image.applyFilter(Kinetic.Filters.Grayscale, null, function() {
			g_backg_layer.draw();
		});
		g_backg_layer.draw();
	}
	if (g_backg_grid) {
		for(var n = 0; n < g_zeilen; n++) {
			for(var i = 0; i < g_spalten; i++) {
				var backg_grid = new Kinetic.Rect({
					x: i * g_breite,
					y: n * g_hoehe,
					width: g_breite,
					height: g_hoehe,
					stroke: '#333333',
					strokeWidth: 2
				});
				g_backg_layer.add(backg_grid);
			}
		}
	}
	g_stage.add(g_backg_layer);
	g_backg_layer.moveToBottom();
}

function display_puzzle(){"use strict";
	$.mobile.hidePageLoadingMsg();
	$.mobile.changePage('#container', {transition: 'slide'});
	setTimeout(function() {
		var l_allpieces = g_layer.getChildren();
		for(var j = 0; j < l_allpieces.length; j++) {
			if (g_rotate) {
				var tween = new Kinetic.Tween({
					node: l_allpieces[j],
					x: Math.floor(Math.random()*g_breite*(g_spalten-1))+ g_breite / 2,
					y: Math.floor(Math.random()*g_hoehe*(g_zeilen-1)) + g_hoehe / 2,
					rotation: Math.PI * 0.5 * Math.floor(Math.random()*4),
					duration: 1,
					onFinish: function() {
						start_play();
					}
				});
				tween.play(); 
			} else {
				var tween = new Kinetic.Tween({
					node: l_allpieces[j],
					x: Math.floor(Math.random()*g_breite*(g_spalten-1))+ g_breite / 2,
					y: Math.floor(Math.random()*g_hoehe*(g_zeilen-1)) + g_hoehe / 2,
					duration: 1,
					onFinish: function() {
						start_play();
					}
				}); 
				tween.play(); 
			}
		}
	}, 2000);
}

function start_play() {"use strict";
	g_ready = true;
	g_buildpuzzle = false;
}

function teil_zieltest (piece) {"use strict";
	var l_allpieces;
	// Teil liegt an richtiger Stelle
	if (piece.getParent().attrs.name === "g_layer") {
		g_pieceAbsoluteRotation = piece.getRotationDeg();
	} else {
		g_pieceAbsoluteRotation = (piece.getRotationDeg() + piece.getParent().getRotationDeg()) %360;
	}
	if (Math.abs(piece.getAbsolutePosition().x  - piece.attrs.origx) < g_genauigkeit 
	&& Math.abs(piece.getAbsolutePosition().y - piece.attrs.origy) < g_genauigkeit
	&& g_pieceAbsoluteRotation === 0) {
		if (piece.getParent().attrs.name === "g_layer") {
			teil_setzen(piece);
		} else {
			l_allpieces = piece.getParent().getChildren();
			while(l_allpieces.length > 0) {
				var l_move_piece = l_allpieces[0];
				l_move_piece.moveTo(g_layer);
				teil_setzen(l_move_piece);
			}
		}
	} else {
		if (piece.getParent().attrs.name === "g_layer") {
			umliegende_teile (piece);
		} else {
			l_allpieces = piece.getParent().getChildren();
			for(var j = 0; j < l_allpieces.length; j++) {
				umliegende_teile (l_allpieces[j]);
			}
		}
	}
}

function teil_setzen (piece) {"use strict";
	if (piece === undefined) {
		return;
	}
	piece.setX(piece.attrs.origx);
	piece.setY(piece.attrs.origy);
	piece.setRotationDeg(0);
	piece.moveToBottom();
	piece.setStrokeWidth(null);
	piece.setStroke(null);
	piece.setDraggable(false);
	if (g_shape) {
		piece.setImage(g_img_nostroke[piece.attrs.zeile][piece.attrs.spalte]);
	}
	g_layer.draw();
	if (g_elastic || g_shape) {
		//piece.setShadow({color: 'rgba(0, 0, 0, 0)'});
		//piece.disableShadow();
		piece.setShadowOpacity(0);
	}
	if (g_sound) {
		document.getElementById('click_sound').play();
	}
	document.body.style.cursor = "default";
	setTimeout(function() {
		g_gesetzt++;
		if (g_gesetzt === g_spalten * g_zeilen && g_sound) {
			document.getElementById('ding_sound').play();
		}
	},500);
}

function umliegende_teile (piece) {"use strict";
	// umliegende Teile ankleben
	var l_sollX;
	var l_sollY;
	var sfaktor = new Array(-1, 1, 0, 0);
	var zfaktor = new Array(0, 0, -1, 1) ;
	if (piece.getParent().attrs.name === "g_layer") {
		g_pieceAbsoluteRotation = piece.getRotationDeg();
	} else {
		g_pieceAbsoluteRotation = (piece.getRotationDeg() + piece.getParent().getRotationDeg()) %360;
	}
	for(var n = 0; n < sfaktor.length; n++) {
		var piece2 = g_stage.get('.part_z' + (piece.attrs.zeile+zfaktor[n])  + '_s' + (piece.attrs.spalte+sfaktor[n]));
		if (piece2.length > 0) {
			if (piece2[0].getParent().attrs.name === "g_layer") {
				g_piece2AbsoluteRotation = piece2[0].getRotationDeg();
			} else {
				g_piece2AbsoluteRotation = (piece2[0].getRotationDeg() + piece2[0].getParent().getRotationDeg()) %360;
			}

			if (g_pieceAbsoluteRotation === 0) {
				l_sollX = piece.getAbsolutePosition().x + (g_breite * sfaktor[n]);
				l_sollY = piece.getAbsolutePosition().y + (g_hoehe * zfaktor[n]);
			}
			if (g_pieceAbsoluteRotation === 90) {
				l_sollX = piece.getAbsolutePosition().x - (g_hoehe * zfaktor[n]);
				l_sollY = piece.getAbsolutePosition().y + (g_breite * sfaktor[n]);
			}
			if (g_pieceAbsoluteRotation ===180) {
				l_sollX = piece.getAbsolutePosition().x - (g_breite * sfaktor[n]);
				l_sollY = piece.getAbsolutePosition().y - (g_hoehe * zfaktor[n]);
			}
			if (g_pieceAbsoluteRotation ===270) {
				l_sollX = piece.getAbsolutePosition().x + (g_hoehe * zfaktor[n]);
				l_sollY = piece.getAbsolutePosition().y - (g_breite * sfaktor[n]);
			}
			if (Math.abs(l_sollX - piece2[0].getAbsolutePosition().x) < g_genauigkeit 
			&& Math.abs(l_sollY - piece2[0].getAbsolutePosition().y) < g_genauigkeit 
			&& g_pieceAbsoluteRotation === g_piece2AbsoluteRotation
			&& (piece.getParent().attrs.name === "g_layer" 
			|| piece2[0].getParent().attrs.name === "g_layer" 
			|| piece.getParent() !== piece2[0].getParent())) {
				teil_zu_gruppe (piece, piece2[0], l_sollX, l_sollY);
			}
		}
	} 
}

function teil_zu_gruppe (piece,piece2, l_sollX, l_sollY) {"use strict";
	var l_allpieces;
	var l_pieceX;
	var l_pieceY;
	var l_moveX;
	var l_moveY;
	if (piece.getParent().attrs.name === "g_layer") {
		// Teil1 nicht in Gruppe
		if (piece2.getParent().attrs.name === "g_layer") {
			// Teil2 nicht in Gruppe
			piece2.setX(l_sollX);
			piece2.setY(l_sollY);
			var group = new Kinetic.Group({
				draggable: true,
				dragBoundFunc: function(pos) {
					var newY = pos.y;
					var newX = pos.x;
					if (newX < 0) {newX=0;}
					if (newX > g_canvaswidth) {newX=g_canvaswidth;}
					if (newY < 0) {newY=0;}
					if (newY > g_canvasheight) {newY=g_canvasheight;}
					return {
					x: newX,
					y: newY
				};},
				name: "gruppe"
			});
			piece.moveTo(group);
			piece2.moveTo(group);
			piece.setDraggable(false);
			piece2.setDraggable(false);
			g_layer.add(group);
		} else {
			// Teil 2 in Gruppe
			l_pieceX = piece.getX();
			l_pieceY = piece.getY();
			piece2.getParent().setX(piece2.getParent().getX()+ l_sollX - piece2.getAbsolutePosition().x);
			piece2.getParent().setY(piece2.getParent().getY() + l_sollY - piece2.getAbsolutePosition().y);
			piece.moveTo(piece2.getParent());   
			piece.setRotationDeg(piece2.getRotationDeg());
			l_moveX= l_pieceX - piece.getAbsolutePosition().x;
			l_moveY= l_pieceY - piece.getAbsolutePosition().y;
			if (piece.getParent().getRotationDeg() === 0) {
				piece.setX(piece.getX() + l_moveX);
				piece.setY(piece.getY() + l_moveY);
			}
			if (piece.getParent().getRotationDeg() === 90) {
				piece.setY(piece.getY() - l_moveX);
				piece.setX(piece.getX() + l_moveY);
			}
			if (piece.getParent().getRotationDeg() ===180) {
				piece.setX(piece.getX() - l_moveX);
				piece.setY(piece.getY() - l_moveY);
			}
			if (piece.getParent().getRotationDeg() ===270) {
				piece.setY(piece.getY() + l_moveX);
				piece.setX(piece.getX() - l_moveY);
			}
			piece.setDraggable(false);
		}
	} else {
		// Teil1 in Gruppe
		if (piece2.getParent().attrs.name === "g_layer") {
			// Teil2 nicht in Gruppe
			piece2.moveTo(piece.getParent());
			piece2.setAbsolutePosition(l_sollX,l_sollY);
			piece2.setRotationDeg(piece.getRotationDeg());
			piece2.setDraggable(false);
		} else {
			// Teil2 in Gruppe
			l_allpieces = piece2.getParent().getChildren();
			var l_korrX = l_sollX - piece2.getAbsolutePosition().x; 
			var l_korrY = l_sollY - piece2.getAbsolutePosition().y; 
			while(l_allpieces.length > 0) {
				
				if (l_allpieces[0] !== undefined) {
					
					var l_move_piece = l_allpieces[0];
				
					l_pieceX = l_move_piece.getAbsolutePosition().x;
					l_pieceY = l_move_piece.getAbsolutePosition().y;
					
					l_move_piece.moveTo(piece.getParent());   
					l_move_piece.setRotationDeg(piece.getRotationDeg());
					l_moveX= l_pieceX - l_move_piece.getAbsolutePosition().x + l_korrX;
					l_moveY= l_pieceY - l_move_piece.getAbsolutePosition().y + l_korrY;
					if (piece.getParent().getRotationDeg() === 0) {
						l_move_piece.setX(l_move_piece.getX() + l_moveX);
						l_move_piece.setY(l_move_piece.getY() + l_moveY);
					}
					if (piece.getParent().getRotationDeg() === 90) {
						l_move_piece.setY(l_move_piece.getY() - l_moveX);
						l_move_piece.setX(l_move_piece.getX() + l_moveY);
					}
					if (piece.getParent().getRotationDeg() ===180) {
						l_move_piece.setX(l_move_piece.getX() - l_moveX);
						l_move_piece.setY(l_move_piece.getY() - l_moveY);
					}
					if (piece.getParent().getRotationDeg() ===270) {
						l_move_piece.setY(l_move_piece.getY() + l_moveX);
						l_move_piece.setX(l_move_piece.getX() - l_moveY);
					} 
				}
			}
		}
	}
 
	l_allpieces = piece.getParent().getChildren();
	var l_minx = l_allpieces[0].getAbsolutePosition().x;
	var l_maxx = l_allpieces[0].getAbsolutePosition().x;
	var l_miny = l_allpieces[0].getAbsolutePosition().y;
	var l_maxy = l_allpieces[0].getAbsolutePosition().y;
	
	for(var j = 0; j < l_allpieces.length; j++) {
		if (l_allpieces[j].getAbsolutePosition().x < l_minx) {l_minx = l_allpieces[j].getAbsolutePosition().x;}
		if (l_allpieces[j].getAbsolutePosition().x > l_maxx) {l_maxx = l_allpieces[j].getAbsolutePosition().x;}
		if (l_allpieces[j].getAbsolutePosition().y < l_miny) {l_miny = l_allpieces[j].getAbsolutePosition().y;}
		if (l_allpieces[j].getAbsolutePosition().y > l_maxy) {l_maxy = l_allpieces[j].getAbsolutePosition().y;}
	}
	l_pieceX = piece.getAbsolutePosition().x;
	l_pieceY = piece.getAbsolutePosition().y;
	
	piece.getParent().setOffset(0,0);
	piece.getParent().setX((l_minx+l_maxx)/2);
	piece.getParent().setY((l_miny+l_maxy)/2);

	l_moveX = (l_pieceX - piece.getAbsolutePosition().x);
	l_moveY = (l_pieceY - piece.getAbsolutePosition().y);

	if (piece.getParent().getRotationDeg() === 0) {
		piece.getParent().setOffset(l_moveX*-1 ,l_moveY*-1 );
	}
	if (piece.getParent().getRotationDeg() === 90) {
		piece.getParent().setOffset(l_moveY*-1 ,l_moveX );
	}
	if (piece.getParent().getRotationDeg() ===180) {
		piece.getParent().setOffset(l_moveX ,l_moveY);
	}
	if (piece.getParent().getRotationDeg() ===270) {
		piece.getParent().setOffset(l_moveY ,l_moveX*-1 );
	}
	
	if (piece2.getParent().attrs.name === "g_layer") {
		piece2.moveToTop();
	} else {
		piece2.getParent().moveToTop();
	}
	g_layer.draw();
	if (g_sound) {document.getElementById('click_sound').play();}
}

function back() {"use strict";
	//window.location = "#title";
	$.mobile.changePage('#title', {transition: 'slide', reverse: true});
	content_formatting();
	setTimeout(function() {content_formatting();},500);
}

function handleFileSelect(evt) {"use strict";
	if (navigator.sayswho == "Safari,5.1.7" || navigator.sayswho == "MSIE,9.0"){
		alert("Your browser does not support to play with your own images. Please use a modern browser like Chrome or Firefox.");
		return;
	}

	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}
		var reader = new FileReader();
		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			return function(e) {
				g_ownimage = e.target.result;
					var bin = atob(g_ownimage.split(',')[1]);
					var exif = EXIF.readFromBinaryFile(new BinaryFile(bin));
					g_own_orientation = exif.Orientation;
				$("#image0").attr("src",g_ownimage);
				content_formatting();
				setTimeout(function() {content_formatting();},500);
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

$('#image-set-0').click(function(){"use strict";
	if (navigator.sayswho == "Safari,5.1.7" || navigator.sayswho == "MSIE,9.0"){
		alert("Your browser does not support to play with your own images. Please use a modern browser like Chrome or Firefox.");
		return;
	}
	if(b_imageinput.type !== 'file') {
		// Web Activities are not standard _yet_, so they use the Moz prefix.
		// We'll make sure they exist before using them, anyway
		if(window.MozActivity) {
			var activity = new MozActivity({
				name: 'pick',
				data: {type: 'image/jpeg'}
			});
			activity.onsuccess = function() {
				g_ownimage = this.result.blob;
				//var bin = atob(g_ownimage.split(',')[1]);
				//var exif = EXIF.readFromBinaryFile(new BinaryFile(bin));
				//g_own_orientation = exif.Orientation;
				$("#image0").attr("src",g_ownimage);
				content_formatting();
				setTimeout(function() {content_formatting();},500);					
			}
			activity.onerror = function() {
				// oh no!
			}
		}
	} else {
		b_imageinput.click();
	}
}).show();

$("#select_theme").change(function(){"use strict";
	if(navigator.sayswho.indexOf("MSIE") < 0) {localStorage.setItem('s_theme', $('#select_theme').val());}
	content_formatting();
});

window.onload = function() {"use strict";
	if (g_firstonload) {  
		g_firstonload = false;
		image_slider = new Swipe(document.getElementById('image_slider'), {
			startSlide: 1,
			callback: function(e, pos) {
				if (pos === 0) {$("#bullets0").attr("src","Images/bulletso1.png");} else {$("#bullets0").attr("src","Images/bulletso0.png");}
				if (pos === 1) {$("#bullets1").attr("src","Images/bullets1.png");} else {$("#bullets1").attr("src","Images/bullets0.png");}
				if (pos === 2) {$("#bullets2").attr("src","Images/bullets1.png");} else {$("#bullets2").attr("src","Images/bullets0.png");}
				if (pos === 3) {$("#bullets3").attr("src","Images/bullets1.png");} else {$("#bullets3").attr("src","Images/bullets0.png");}
				if (pos === 4) {$("#bullets4").attr("src","Images/bullets1.png");} else {$("#bullets4").attr("src","Images/bullets0.png");}
			}
		});
		document.getElementById('b_imageinput').addEventListener('change', handleFileSelect, false);

		if(navigator.sayswho.indexOf("MSIE") >= 0) {
			$('#b_backg_grid').val("on");
			$('#b_backg_image').val("on");
			$('#b_rotate').val("off");
			$('#b_sound').val("on");
			$('#b_elastic').val("off");
			$('#b_shape').val("on");
		} else {
			//localStorage.clear();
			if (localStorage.getItem('s_backg_grid') === null)  {$('#b_backg_grid').val("on");}  else {$('#b_backg_grid').val(localStorage.getItem('s_backg_grid'));}
			if (localStorage.getItem('s_backg_image') === null) {$('#b_backg_image').val("on");} else {$('#b_backg_image').val(localStorage.getItem('s_backg_image'));}
			if (localStorage.getItem('s_rotate') === null)      {$('#b_rotate').val("off");}     else {$('#b_rotate').val(localStorage.getItem('s_rotate'));}
			if (localStorage.getItem('s_sound') === null)       {$('#b_sound').val("on");}       else {$('#b_sound').val(localStorage.getItem('s_sound'));}
			if (localStorage.getItem('s_elastic') === null)     {$('#b_elastic').val("off");}    else {$('#b_elastic').val(localStorage.getItem('s_elastic'));}
			if (localStorage.getItem('s_shape') === null)       {$('#b_shape').val("on");}       else {$('#b_shape').val(localStorage.getItem('s_shape'));}
	
			if (localStorage.getItem('s_theme') === null)       {$('#select_theme').val("Mascha");} else {$('#select_theme').val(localStorage.getItem('s_theme'));}
		}
		// Example usage - http://homepage.hispeed.ch/grrds_games/Puzzle/?theme=mascha
		var url_param = url_query('theme');
		if( url_param ) {
			$('#select_theme').val(url_param);
		}
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
			$("#bprev").attr("style","display:none;");
			$("#bnext").attr("style","display:none;");
		}
		if(! /Android/i.test(navigator.userAgent) ) {
			$("#b_imageinput").attr("style","display:none;");
			$("#b_titimageinput").attr("style","display:none;");
		}
		$("#s_shape").attr("style","display:none;");
		content_formatting();
		setTimeout(function() {content_formatting();},500);
	}
};

function content_formatting() {"use strict";
	g_windowsheight = $(window).height();
	g_windowswidth = $(window).width();
	g_portrait = "";
	if (g_windowsheight > g_windowswidth) {
		g_portrait = "p";
		$("#img_title").attr("style","width:100%;");
		$("#image0").attr("style","height:" + (g_windowswidth/3-50)*1.5 + "px;");
	} else {
		$("#img_title").attr("style","max-height:" + (g_windowsheight/5) + "px;");
		$("#image0").attr("style","height:" + (g_windowswidth/3-50)/1.5 + "px;");
	}
	$("#bteasy").attr("style","width:" + (g_windowswidth/3-12) + "px;");
	$("#btmed").attr("style","width:" + (g_windowswidth/3-12) + "px;");
	$("#bthard").attr("style","width:" + (g_windowswidth/3-12) + "px;");
	for(var s = 1; s < 5; s++) { 
		for(var n = 1; n < 4; n++) {
			$("#radio"+s+"-"+n).attr("style","width:" + (g_windowswidth/3-12) + "px;");
			$("#image"+s+"-"+n).attr("src","Images/"+$('#select_theme').val()+"/image-set-"+s+"/sujet"+g_portrait+n+"s.jpg"); 
		}
	}
}

$(window).resize( function() {"use strict";
	content_formatting();
});

function slide() {"use strict";
	if (image_slider.getPos() === 0) {$("#bullets0").attr("src","Images/bulletso1.png");} else {$("#bullets0").attr("src","Images/bulletso0.png");}
	if (image_slider.getPos() === 1) {$("#bullets1").attr("src","Images/bullets1.png");} else {$("#bullets1").attr("src","Images/bullets0.png");}
	if (image_slider.getPos() === 2) {$("#bullets2").attr("src","Images/bullets1.png");} else {$("#bullets2").attr("src","Images/bullets0.png");}
	if (image_slider.getPos() === 3) {$("#bullets3").attr("src","Images/bullets1.png");} else {$("#bullets3").attr("src","Images/bullets0.png");}
	if (image_slider.getPos() === 4) {$("#bullets4").attr("src","Images/bullets1.png");} else {$("#bullets4").attr("src","Images/bullets0.png");}
}

navigator.sayswho= (function(){
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
  return M;
})();

// Parse URL Queries
function url_query( query ) {
	query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var expr = "[\\?&]"+query+"=([^&#]*)";
	var regex = new RegExp( expr );
	var results = regex.exec( window.location.href );
	if ( results !== null ) {
		return results[1];
	} else {
		return false;
	}
}
 