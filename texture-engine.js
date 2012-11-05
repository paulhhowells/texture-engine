/*jslint indent: 2, bitwise: true, eqeq: false, sloppy: true, white: true, browser: true, devel: true */
/*globals phh, jQuery, window, location, setTimeout, clearTimeout */

/*
  style conventions

  SYMBOLIC_CONSTANTS
  variable_names
  $jquery_objects
  functionNames
  methodNames
  handlerNames
  ConstructorClassNames
  css-class-names

  i, j, k loop iterators
  x, y, z coordinates
  w, h    width, height
  o       object
  r       return object

  chain with a trailing dot
  tab = 2 spaces
  use // for comments so that slash & star can be used for debugging

*/

/*
  TO DO:

  add seeding
  add rotation to marks
  add tile and trim to canvasTools ?
  jslint
  maybe print on 9x and trim for tiling?
  add non linear compression, sine 90, sine 45, s-curve cosine 180 transfer functions
  
  document all the options and cool things
*/

(function ($) {
  $(function () { // jquery ready state
    var
      noise_engine,
      noise_array,
      noise_canvas,
      noise_data_url;
    
    /*
     * Noise Engine
     * v0.3
     */
    noise_engine = (function () {

        // make noise_engine an object with two methods:
        // array2DTools() & canvasTools()
        var engine = {

          // array2DTools v1.0
          //
          // arguments:
          //  takes an array (passed by reference) to be worked on
          //  else can generate it's own array
          // returns:
          //  this, for chaining
          //  use get() for the array
          // methods:
          //  has various methods which operate on, get or set a two dimensional array
          array2DTools : function () {
            var a = [];

            a = ((arguments.length === 1) && (arguments[0] instanceof Array)) ? arguments[0] : [];

            return {
              get : function () {
                return a;
              },
              set : function (array) {
                a = array;

                // enable method chaining
                return this;
              },
              makeNoise : function (width, height) {
                var
                  r,
                  r_array = [],
                  y_array,
                  x,
                  y,
                  rnd;

                for (x = 0; x < width; x += 1) {
                  y_array = [];
                  for (y = 0; y < height; y += 1) {
                    rnd = Math.random();
                    y_array.push(rnd);
                  }
                  r_array.push(y_array);
                }

                // delete anything in a, and put contents of r_array into a
                a.length = 0;

                // would be nice to do in one line
                //a.unshift(r_array[0], r_array[1]);

                for (r = 0; r < r_array.length; r += 1) {
                  a.push(r_array[r]);
                }

                // enable method chaining
                return this;
              },
              compress : function (compression, gain) {
                //  expects:
                //    compression and gain to be positive integers
                //    compression: 0 ~ 1
                //    gain: 0 ~ 1
                //
                //  if compression + gain > 1 then brick wall limiting will occur

                var
                  x,
                  y,
                  width,
                  height,
                  r,
                  r_array,
                  y_array,
                  i_value,
                  i_compressed,
                  _compression,
                  _gain;

                r_array = [];
                _compression = compression || 1;
                _gain = gain || 0;

                if ((_compression + _gain) > 1) {
                  console.log('peaking likely');
                }

                width = a.length;
                height = a[0].length;

                for (x = 0; x < width; x += 1) {
                  y_array = [];
                  for (y = 0; y < height; y += 1) {

                    i_value = a[x][y];
                    i_compressed = (i_value * _compression) + _gain;

                    if (i_compressed > 1) {
                      i_compressed = 1;
                    }
                    y_array.push(i_compressed);
                  }
                  r_array.push(y_array);
                }

                // delete anything in a, and put contents of r_array into a
                a.length = 0;
                // a.unshift(r_array[0], r_array[1]);

                for (r = 0; r < r_array.length; r += 1) {
                  a.push(r_array[r]);
                }

                // enable method chaining
                return this;
              },
              log : function (message) {
                var output = 'log: ';
                if (message) {
                  output = output + message;
                }
                console.log(output);
                console.log(a);

                // enable method chaining
                return this;
              }
            };
          },

          // canvasTools v1.0
          //
          // arguments:
          //
          // returns:
          //
          //
          // methods:
          //
          canvasTools : function () {
            var cvs; // canvas

            return {
              get : function () {
                return cvs;
              },
              set : function (canvas) {
                cvs = canvas;

                // enable method chaining
                return this;
              },
              makeCanvasFromArray : function () {
                // expects:
                //    array or an object as an argument
                //
                // if the argument is an array then the default 'grey' mode will be used, and each pixel will be monochrome ranging from #000 to #fff
                // if the argument is an object then 'alpha' mode will be used, and each pixel will be a solid colour with an opacity ranging from 0 to 1
                //   rgb: the object may specify the solid colour of each pixel with varying opacity
                //   mode: the object may specify a mode (although only 'grey' and 'alpha' are available so far)

                var
                  array,
                  mode,
                  rgb,
                  cxt, // context
                  img_data,
                  width,
                  height,
                  x,
                  y,
                  i_data = 0,
                  i_value,
                  i_rnd;

                if (arguments.length === 0) {
                  console.log('makeCanvasFromArray was not given any arguments');
                  return false;
                }

                if (arguments[0] instanceof Array) {
                  array = arguments[0];
                  mode = 'grey';
                } else {
                  array = arguments[0].array;

                  if (arguments[0].hasOwnProperty('mode')) {
                    mode = arguments[0].mode;
                  } else {
                    mode = 'alpha';
                  }

                  if (arguments[0].hasOwnProperty('rgb')) {
                    rgb = arguments[0].rgb;
                  } else {
                    rgb = [127, 127, 127];
                  }
                }

                // will override any preexisting cvs
                cvs = document.createElement('canvas');
                if (!cvs || !cvs.getContext) {
                  return false;
                }

                width = array.length;
                height = array[0].length;

                cvs.width = width;
                cvs.height = height;

                cxt = cvs.getContext("2d");

                img_data = cxt.createImageData(width, height);

                for (x = 0; x < width; x += 1) {
                  for (y = 0; y < height; y += 1) {

                    i_rnd = array[x][y];
                    i_value = Math.round(255 * i_rnd);

                    // print a dot
                    if (mode === 'grey') {
                     img_data.data[i_data] =     i_value; // red
                     img_data.data[i_data + 1] = i_value; // green
                     img_data.data[i_data + 2] = i_value; // blue
                     img_data.data[i_data + 3] = 255;     // alpha

                    } else if (mode === 'alpha') {
                      img_data.data[i_data] = rgb[0];
                      img_data.data[i_data + 1] = rgb[1];
                      img_data.data[i_data + 2] = rgb[2];
                      img_data.data[i_data + 3] = i_value;
                    }

                    i_data += 4;
                  }
                }

                cxt.putImageData (img_data, 0, 0);

                // enable method chaining
                return this;
              },
              addMarks : function () {
                // {
                //  canvas
                //  marks {
                //    x
                //    y
                //    }

                //  seed
                //  }

                var
                  cxt, // context
                  marks,
                  stroke_style,
                  rnd_array,
                  width,
                  height,
                  units,
                  h, // horizontal,
                  v, // vertical,
                  x,
                  y,
                  i_rnd;

                // cvs : canvas already declared by canvasTools

                // defaults to canvasTools.cvs, but if passed (by reference) an object containing a canvas this method can be self contained
                cvs = arguments[0].hasOwnProperty('canvas') ? arguments[0].canvas : cvs;
                // cvs = arguments[0].canvas || cvs;

                // check that canvas exists in canvasTools
                // it either already existed or has just been passed in as an argument
                // if it doesn't exist then exit
                if (!cvs || !cvs.getContext) {
                  return false;
                }

                // override defaults with arguments
                if (arguments[0].hasOwnProperty('marks')) {
                  marks = arguments[0].marks;
                } else {
                  marks = {
                    h : 3,  // horizontal
                    v : 3   // vertical
                  };
                }
                stroke_style = arguments[0].stroke_style || 'rgba(0, 0, 0, 0.1)';
                line_width = arguments[0].line_width || 1;

                width = cvs.width;
                height = cvs.height;

                // divide the canvas into units, as if a rectangular chessboard
                units = {
                  h : Math.round(width / marks.h),
                  v : Math.round(height / marks.v)
                };
                
                // make some noise, to randomise the marks
                rnd_array = engine.
                  array2DTools().
                  makeNoise(marks.h, marks.v).
                  get();

                cxt = cvs.getContext("2d");
                cxt.strokeStyle = stroke_style;
                cxt.lineWidth = line_width;
                cxt.lineCap = 'round'; // explore alternatives!

                for (h = 0; h < marks.h; h += 1) {
                  for (v = 0; v < marks.v; v += 1) {
                    i_rnd = rnd_array[h][v];

                    // set rotation random

                    x = h * units.h + Math.round(i_rnd * units.h);
                    y = v * units.v + Math.round(i_rnd * units.v);
                    cxt.beginPath();
                    cxt.moveTo(x, y);
                    cxt.lineTo(x + 5, y + 5);
                    cxt.stroke();
                    cxt.closePath();

                  }
                }

                return this;
              },
              getDataUrl : function () {
                return cvs.toDataURL();
              }


            };
          }
        };
        
        // this == window object, so use engine variable
        return engine;
      }());




    // you can either run array2DTools().get() and be returned an array
    // or pass an array variable in it: array2DTools(my_array_variable);
    noise_array = noise_engine.
      array2DTools().
      makeNoise(320, 240).
      //makeNoise(4, 3). // for testing
      compress(0.05, 0.5).
      get();

    /*
    noise_array = [];
    noise_engine.
      array2DTools(noise_array).
      makeNoise(320, 240).
      compress(0.05, 0.5).
      get();

    */


    /*
    noise_canvas = noise_engine.
      canvasTools().
      makeCanvasFromArray({
          array : noise_array,
          mode : 'alpha',
          rgb : [0, 0, 0]
      }).
      addMarks({
        marks : {
          h : 7,
          v : 4
        }
      }).
      get();
    */

    //$('.output').html(noise_array);

    noise_data_url = noise_engine.
      canvasTools().
      makeCanvasFromArray({
          array : noise_array,
          mode : 'alpha',
          rgb : [0, 0, 0]
      }).
      addMarks({
        marks : {
          h : 7,
          v : 4
        },
        stroke_style : 'rgba(0, 0, 0, 0.2)'
      }).
      getDataUrl();

    $('.output').css('background-image', 'url(' + noise_data_url + ')');
    
    // make a class, probably doesn't work in IE < 9
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = ".noise { background-image: url(" + noise_data_url + ")}";
    document.getElementsByTagName('head')[0].appendChild(style);
    
    // IE
    // document.styleSheets[0].addRule('.noise', "'" + noise_data_url + "'", -1);
    // new_rule = document.styleSheets[0].addRule("DIV B", "color:blue", 0);


  }); // eo:ready
}(jQuery));