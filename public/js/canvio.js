window.canvio = function(elem, options){
  if (!('debug' in options)){
    options.debug = function(info){ console.log(info); }
  }

  console.log(elem);
  var root = $(elem);
  console.log(root);

  var canvas = $('<canvas>').appendTo(root)[0];
  canvas.height = $(root).height();
  canvas.width = (root).width();
  // $(canvas).height($(root).height()).width($(root).width());
  console.log(canvas);
  ctx = canvas.getContext("2d");



  var start = false;
  $(canvas).mousedown(function(ev){
    console.log(ev);
    options.debug({'down-x': ev.offsetX, 'down-y': ev.offsetY});
    start = {'x': ev.offsetX, 'y': ev.offsetY}
  });
  $(canvas).mouseup(function(ev){
    console.log(ev);
    options.debug({'up-x': ev.offsetX, 'up-y': ev.offsetY});
    options.debug({'diff-x': ev.offsetX - start.x, 'diff-y': ev.offsetY - start.y});

    console.log(start);

    ctx.beginPath();
    ctx.fillRect(start.x, start.y, ev.offsetX - start.x, ev.offsetY - start.y);
    ctx.stroke();
  });

  var can = {
    data: {
      elem: false,
      mode: 'rectangle'
    },
    set_elem: function(elem){
      this.data.elem = elem;
    },
    set_mode: function(mode){
      this.data.mode = mode;
    },
    set_dimensions: function(dims){
      console.log(dims);
      canvas.height = dims.h;
      canvas.width = dims.w;
    },
    set_color: function(color){
      this.data.color = color;
      ctx.fillStyle = color;
    },
    debug: function(){
      console.log(this.data);
    }
  };
  can.debug();
  can.set_elem(root);
  can.debug();

  can.set_mode('circle');
  can.debug();

  return can;

};