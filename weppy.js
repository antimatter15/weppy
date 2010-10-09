/*
  Copyright (c) 2010 antimatter15 (antimatter15@gmail.com)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

var WebP = (function(){
  //parse a RIFF encoded media file such as WebP
  function parseRIFF(string){
    var offset = 0;
    var chunks = {};
    while(offset < string.length){
      var id = string.substr(offset, 4);
      var len = parseInt(string.substr(offset+4, 4).split('').map(function(i){
        var unpadded = i.charCodeAt(0).toString(2);
        return (new Array(8 - unpadded.length + 1)).join('0') + unpadded
      }).join(''),2);
      var data = string.substr(offset + 4 + 4, len);
      offset += 4 + 4 + len;
      chunks[id] = chunks[id] || [];
      if(id == 'RIFF'){
        chunks[id].push(parseRIFF(data));
      }else if(id == 'LIST'){
        chunks[id].push(parseRIFF(data));
      }else{
        chunks[id].push(data)
      }
      
    }
    return chunks
  }

  //Converting between a string of 0010101001's and binary back and forth is probably inefficient
  //TODO: get rid of this function
  function toBinStr(bits){
    var data = '';
    var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
    bits = pad + bits;
    for(var i = 0; i < bits.length; i+= 8){
      data += String.fromCharCode(parseInt(bits.substr(i,8),2))
    }
    return data;
  }

  function parseWebP(riff){
    var VP8 = riff.RIFF[0].WEBP[0];
    var frame_start = VP8.indexOf('\x9d\x01\x2a'); //A VP8 keyframe starts with the 0x9d012a header
    for(var i = 0, c = []; i < 4; i++) c[i] = VP8.charCodeAt(frame_start + 3 + i);
    
    var width, horizontal_scale, height, vertical_scale, tmp;
    
    //the code below is literally copied verbatim from the bitstream spec
    tmp = (c[1] << 8) | c[0];
    width = tmp & 0x3FFF;
    horizontal_scale = tmp >> 14;
    tmp = (c[3] << 8) | c[2];
    height = tmp & 0x3FFF;
    vertical_scale = tmp >> 14;
    return {
      width: width,
      height: height,
      data: VP8,
      riff: riff
    }
  }


  //this is a smaller version of http://github.com/antimatter15/js-ebml
  
  function generateEBML(json){
    var ebml = '';
    for(var i = 0; i < json.length; i++){
      var data = json[i].data;

      if(typeof data == 'object') data = generateEBML(data);
      
      var len = data.length;
      var zeroes = Math.ceil(Math.ceil(Math.log(len)/Math.log(2))/8);
      var size_str = len.toString(2);
      var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
      var size = (new Array(zeroes)).join('0') + '1' + padded;
      

      var element = '';
      element += toBinStr(parseInt(json[i].hex, 16).toString(2));
      element += toBinStr(size);
      
      element += data;
      ebml += element;
      
    }
    return ebml;
  }

  function toWebM(image){

var EBML = [
  {
    "data": [
      {
        "data": "\u0001",
        "name": "EBMLVersion",
        "hex": "4286"
      },
      {
        "data": "\u0001",
        "name": "EBMLReadVersion",
        "hex": "42f7"
      },
      {
        "data": "\u0004",
        "name": "EBMLMaxIDLength",
        "hex": "42f2"
      },
      {
        "data": "\u0008",
        "name": "EBMLMaxSizeLength",
        "hex": "42f3"
      },
      {
        "data": "webm",
        "name": "DocType",
        "hex": "4282"
      },
      {
        "data": "\u0002",
        "name": "DocTypeVersion",
        "hex": "4287"
      },
      {
        "data": "\u0002",
        "name": "DocTypeReadVersion",
        "hex": "4285"
      }
    ],
    "name": "EBML",
    "hex": "1a45dfa3"
  },
  {
    "data": [
      {
        "data": [
          {
            "data": "\u000fB@",
            "name": "TimecodeScale",
            "hex": "2ad7b1"
          },
          {
            "data": "Lavf52.79.0",
            "name": "MuxingApp",
            "hex": "4d80"
          },
          {
            "data": "Lavf52.79.0",
            "name": "WritingApp",
            "hex": "5741"
          },
          {
            "data": "T«h¿Y¬+ùRö\u000fö×C",
            "name": "SegmentUID",
            "hex": "73a4"
          },
          {
            "data": "@D\u0000\u0000\u0000\u0000\u0000\u0000",
            "name": "Duration",
            "hex": "4489"
          }
        ],
        "name": "Info",
        "hex": "1549a966"
      },
      {
        "data": [
          {
            "data": [
              {
                "data": "\u0001",
                "name": "TrackNumber",
                "hex": "d7"
              },
              {
                "data": "\u0001",
                "name": "TrackUID",
                "hex": "73c5"
              },
              {
                "data": "\u0000",
                "name": "FlagLacing",
                "hex": "9c"
              },
              {
                "data": "und",
                "name": "Language",
                "hex": "22b59c"
              },
              {
                "data": "V_VP8",
                "name": "CodecID",
                "hex": "86"
              },
              {
                "data": "\u0001",
                "name": "TrackType",
                "hex": "83"
              },
              {
                "data": "\u0002bZ\u0000",
                "name": "DefaultDuration",
                "hex": "23e383"
              },
              {
                "data": [
                  {
                    "data": toBinStr(image.width.toString(2)),
                    "name": "PixelWidth",
                    "hex": "b0"
                  },
                  {
                    "data": toBinStr(image.height.toString(2)),
                    "name": "PixelHeight",
                    "hex": "ba"
                  }
                ],
                "name": "Video",
                "hex": "e0"
              }
            ],
            "name": "TrackEntry",
            "hex": "ae"
          }
        ],
        "name": "Tracks",
        "hex": "1654ae6b"
      },
      {
        "data": [
          {
            "data": "\u0000",
            "name": "Timecode",
            "hex": "e7"
          },
          {
            "data": '\x81\x00\x00\x80'+image.data.substr(4),
            "name": "SimpleBlock",
            "hex": "a3"
          }
        ],
        "name": "Cluster",
        "hex": "1f43b675"
      }
    ],
    "name": "Segment",
    "hex": "18538067"
  }
];

return generateEBML(EBML);


  }

  function toDataURL(webm){
    return 'data:video/webm,' + escape(webm); 
  }


  //from http://diveintohtml5.org/everything.html
  function canPlayWebM(){
    var v = document.createElement('video');
    return !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8"').replace(/no/, ''));
  }
  
  
  var supportsWebP = 0; //0 = UNKNOWN. 1 = YAY. -1 = BOO.
  var supportsCallback = function(){};
  
  var Tester = new Image();
  Tester.onload = function(){
    if(Tester.width == 4 && Tester.height == 4){
      supportsWebP = 1;
    }else{ 
      supportsWebP = -1;
    }
    supportsCallback();
  }
  
  Tester.onerror = function(){
    supportsWebP = -1;
    supportsCallback();
  }
  var WebPTest = 'UklGRkYAAABXRUJQVlA4IDoAAABwAgCdASoEAAQAAYcIhYWIhYSIiQIADAzdrBLeABAAAAEAAAEAAPKn5Nn/0v8//Zxn/6H3QAAAAAA=';
                  //Sample 4x4 black and white WebP image.
  Tester.src = 'data:image/webp;base64,' + WebPTest;
  

  function renderWebP(url, callback){
    //TODO: find out if a browser supports WebP. Currently none do, so how does one test this?
  
    //if it can't play webM what's the point?
    if(!canPlayWebM()){
      var img = document.createElement('img'); //maybe i sould be using new Image
      img.src = 'http://www.motifake.com/image/demotivational-poster/0902/urine-urine-pee-cheap-demotivational-poster-1234913145.jpg';
      return callback(img);
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined'); //binary XHR FTW? Probably XHR2 has binary xhr powers


    xhr.onload = function(){
      var binary = xhr.responseText.split('').map(function(e){return String.fromCharCode(e.charCodeAt(0) & 0xff)}).join('');
      var webP = parseWebP(parseRIFF(binary));
      
      var video = document.createElement('video');
      //var canvas = document.createElement('canvas');
      //document.body.appendChild(canvas);
      //video.style.display = 'none';
      //document.body.appendChild(video); //probably dont need to do this, but chrome always crashes otherwise
      
      //var context = canvas.getContext('2d');
      //canvas.width = webP.width;
      //canvas.height = webP.height;
      video.width = webP.width;
      video.height = webP.height;

      var src = toDataURL(toWebM(webP));

      //video.addEventListener('progress', function(){
        //context.drawImage(video, 0, 0, webP.width, webP.height);
        //callback(canvas.toDataURL('image/png'));
        //firefox throws a security exception :(
        //callback(canvas);
        //setTimeout(function(){document.body.removeChild(video)}, 100);
      //}, false);
      
      video.src = src;
      
      callback(video);
    }
    xhr.send(null);
  }

  function renderImage(image, callback){
    renderWebP(image.src, function(canvas){
      var result = null;
      if(callback) result = callback(image, canvas);
      
      if(image.parentNode && result !== false){
        for(var i = 0; i < image.attributes.length; i++){
          canvas.setAttribute(image.attributes[i].name, image.attributes[i].value)
        }
        image.parentNode.replaceChild(canvas, image);
      }
    })
  }

  function processImages(callback){
    var origin = location.protocol+'//'+location.host; //must check for same origin in order to be xhr'able
    for(var i = document.images, l = i.length; l--;){ //maybe we could get rid of the check and use CORS
      if(i[l].src.indexOf(origin) == 0 && /\.webp$/.test(i[l].src)){ //a nicer test would be good, but we dont have other options.
        renderImage(i[l],callback);
      }
    }
  }



  if(document && document.addEventListener){
    document.addEventListener("DOMContentLoaded", function(){
      supportsCallback = function(){
        if(supportsCallback == -1){ //only do it once youre certain that the browser does not support it
          processImages();
        }
      }
      supportsCallback();
    } ,false);
  }
  
  return {
    supportsWebP: function(){
      return supportsWebP;
    },
    renderImage: renderImage,
    renderWebP: renderWebP
  }
  
})();
