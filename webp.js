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

var WebM = (function(){

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
  //the full version requires a massive schema json document and everything
  //is sort of array-ish. This is simpler and more associative.

  //in case you're wondering why I didn't just pre-render stuff and substitute
  //with a .replace, it's because ebml sections require a length, and it gets
  //hard to maintain that. easier jsut to do this.
  
  function generateEBML(json){
    var ebml = '';
    for(var i in json){
      var data = json[i];
      var hexid = i;
      if(typeof data == 'object'){
        data = generateEBML(data);
      }else if(typeof data == 'number'){
        data = toBinStr(data.toString(2));
      }

      var len = data.length;
      var zeroes = Math.ceil(Math.ceil(Math.log(len)/Math.log(2))/8);
      //(zeroes + 1) * 8 - (zeroes + 1) = zeroes * 7 - 7 = needed size
      var size_str = len.toString(2);
      var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
      var size = (new Array(zeroes + 1)).join('0') + '1' + padded;
      ebml += toBinStr(parseInt(hexid, 16).toString(2));
      ebml += toBinStr(size);
      ebml += data;
    }
    return ebml;
  }


  /*
    this is the below with the hex element ids replaced with the matroska element names
    {
      "EBML": [
        {
          "EBMLVersion": 1,
          "EBMLReadVersion": 1,
          "EBMLMaxIDLength": 4,
          "EBMLMaxSizeLength": 8,
          "DocType": "webm",
          "DocTypeVersion": 2,
          "DocTypeReadVersion": 2
        }
      ],
      "Segment": [
        {
          "Tracks": [
            {
              "TrackEntry": [
                {
                  "TrackNumber": 1,
                  "TrackUID": 1,
                  "FlagLacing": 0,
                  "Language": "und",
                  "CodecID": "V_VP8",
                  "TrackType": 1,
                  "DefaultDuration": 40000000,
                  "Video": {
                    "PixelWidth": "PIXEL_WIDTH",
                    "PixelHeight": "PIXEL_HEIGHT"
                  }
                }
              ]
            }
          ],
          "Cluster": [
            {
              "Timecode": 0,
              "SimpleBlock": [
                "IMAGE_DATA"
              ]
            }
          ]
        }
      ]
    }
  */
  function toWebM(image){

    //converted using JSON.stringify(EBML,null,'  ').replace(/\w+/g,function(b){return nameHexMap[b]||b})

    var EBML = {
      "18538067": {
        "1654ae6b": {
          "ae": {
              "d7": 1,
              "63c5": 1,
              "9c": 0,
              "22b59c": "und",
              "86": "V_VP8",
              "83": 1,
              "23e383": 40000000,
              "e0": {
                "b0": image.width,
                "ba": image.height
              }
            }
          },
          "1f43b675": {
            "e7": 0,
            "a3": '\x81\x00\x00\x80' + image.data.substr(4)
          }
      }
    };
    
    //the EBML header is not present because of sorting issues, it doesn't always end up the first
    //so the precomputed header is there. on the bottom as a string.
    return "\x1aE\xdf\xa3\x40\x20B\x82\x40\x04webmB\x85\x81\x02B\x86\x81\x01B\x87\x81\x02B\xf7\x81\x01B\xf2\x81\x04B\xf3\x81\x08" + generateEBML(EBML);
  }

  function toDataURL(webm){
    return 'data:video/webm,' + escape(webm);
  }


  //from http://diveintohtml5.org/everything.html
  function canPlayWebM(){
    var v = document.createElement('video');
    return !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''));
  }


  function renderWebP(url, callback){
    //if it can't play webM what's the point?
    if(!canPlayWebM()) return callback('http://www.motifake.com/image/demotivational-poster/0902/urine-urine-pee-cheap-demotivational-poster-1234913145.jpg');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    
    video.style.display = 'none';
    document.body.appendChild(video); //probably dont need to do this, but chrome always crashes otherwise
    
    
    var context = canvas.getContext('2d');
        
    xhr.onreadystatechange = function(){
      if(xhr.status == 200 && xhr.readyState == 4){
        var binary = xhr.responseText.split('').map(function(e){return String.fromCharCode(e.charCodeAt(0) & 0xff)}).join('');
        var webP = parseWebP(parseRIFF(binary));
        canvas.width = webP.width;
        canvas.height = webP.height;
        var src = toDataURL(toWebM(webP));

        video.addEventListener('progress', function(){
          context.drawImage(video, 0, 0, webP.width, webP.height);
          callback(canvas.toDataURL('image/png'));
          
          setTimeout(function(){document.body.removeChild(video)}, 100);
          
        }, false);
        
        video.src = src;
      }
    }
    xhr.send(null);
  }

  function renderImage(image){
    renderWebP(image.src, function(src){
      image.src = src;
    })
  }

  function processImages(){
    var origin = location.protocol+'//'+location.host;
    for(var i = document.images, l = i.length; l--;){
      if(i[l].src.indexOf(origin) == 0 && /\.webp$/.test(i[l].src)){
        renderImage(i[l]);
      }
    }
  }


  return {
    processImages: processImages,
    renderImage: renderImage,
    renderWebP: renderWebP
  }
})();
