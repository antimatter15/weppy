var webm_template = "\x1aE\xdf\xa3\x40\x20B\x86\x81\x01B\xf7\x81\x01B\xf2\x81\x04B\xf3\x81\x08B\x82\x40\x04webmB\x87\x81\x02B\x85\x81\x02\x18S\x80g\x40e\x16T\xaek\x40I\xae\x40F\xd7\x81\x01c\xc5\x81\x01\x9c\x81\x00\x22\xb5\x9c\x40\x03und\x86\x40\x05V_VP8\x83\x81\x01\x23\xe3\x83\x40\x04\x02bZ\x00\xe0\x40\x1d\xb0\x40\x0bPIXEL_WIDTH\xba\x40\x0cPIXEL_HEIGHT\x1fC\xb6u\x40\x10\xe7\x81\x00\xa3\x40\x0aIMAGE_DATA";
var image_header = '\x81\x00\x00\x80';

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
    //console.log(id, len, data);
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



function encode_64(input) {
	var output = "", i = 0, l = input.length,
	key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
	chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	while (i < l) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) enc3 = enc4 = 64;
		else if (isNaN(chr3)) enc4 = 64;
		output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
	}
	return output;
}


function parseWebP(string){
  var riff = parseRIFF(string);
  var VP8 = riff.RIFF[0].WEBP[0];

  var frame_start = VP8.indexOf('\x9d\x01\x2a')

  for(var i = 0, c = []; i < 4; i++) c[i] = VP8.charCodeAt(frame_start + 3 + i);
  
  var width, horizontal_scale, height, vertical_scale, tmp;
  tmp = (c[1] << 8) | c[0];
  width = tmp & 0x3FFF;
  horizontal_scale = tmp >> 14;
  tmp = (c[3] << 8) | c[2];
  height = tmp & 0x3FFF;
  vertical_scale = tmp >> 14;
  
  console.log(width, height);
  return {
    width: width,
    height: height,
    data: VP8,
    riff: riff
  }
}


function toWebM(image){
  var webm = webm_template
    .replace('PIXEL_HEIGHT', image.height)
    .replace('PIXEL_WIDTH', image.width)
    .replace('IMAGE_DATA', '\x81\x00\x00\x80' + image.data.substr(4));
  return webm;
}

function toDataURL(webm){
  return 'data:video/webm;base64,' + encode_64(webm);
}


