var $ = [], //resembles the *
    output = 0, //translation of pointer - start partition?!?!?
    range = 255,
    bottom = 0,
    bit_count = 24;

function add_one_to_output(q){
  while($[--q] == 255) $[q] = 0;
  ++$[q];
}


function write_bool(prob, bool_value){
  var split = 1 + (((range - 1) * prob) >> 8);
  if(value){
    bottom += split;
    range -= split;
  }else{
    range = split;
  }
  while(range < 128){
    range <<= 1;
    if(bottom & (1 << 31)) add_one_to_output(output);
    bottom <<= 1;
    if(!--bit_count){
        //increment pointer?!?!
        output[ptr++] = bottom >> 24;
        bottom &= (1 << 24) -1;
        bit_count = 8
    }
  }
}

function flush_bool_encoder(){
  var c = bit_count;
  var v = bottom;
  if(v & (1 << (32 - c))) add_one_to_output(output);
  v <<= c & 7;
  c >>= 3;
  while(--c >= 0) v <<= 8;
  c = 4;
  while(--c >= 0){
    $[output++] = v >> 24;
    v <<= 8
  }
}



//////////////////decoder///////////////////


var $ = [],
    input = 0,
    range = 0,
    value = 0,
    bit_count = 0;










var range //128 <= range <= 255
$ = []
output 
bottom //minimum value of remaining output
bit_count

function init(){
    range = 255;
    bottom = 0;
    bit_count = 24;
}

function write_bool(prob, value){
    var split = 1 + (((range - 1) * prob) >> 8);
    if(value){
        bottom += split;
        range -= split;
    }else{
        range = split;
    }
    while(range < 128){
        range <<= 1;
        if(bottom & (1 << 31)) add_one_to_output(output);
        bottom <<= 1;
        if(!--bit_count){
            //increment pointer?!?!
            output[ptr++] = bottom >> 24;
            bottom &= (1 << 24) -1;
            bit_count = 8
        }
        
}

