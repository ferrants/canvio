var canvio = angular.module('canvio', ['ngSanitize']);

var array_move = function (array, old_index, new_index) {
    if (new_index >= array.length) {
        var k = new_index - array.length;
        while ((k--) + 1) {
            array.push(undefined);
        }
    }
    array.splice(new_index, 0, array.splice(old_index, 1)[0]);
    return array;
};

var obj_size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var random_prop = function(obj) { var result; var count = 0; for (var prop in obj){if (Math.random() < 1/++count){result = prop;}} return result;};

canvio.directive('uiColorpicker', function() {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: false,
        replace: true,
        template: "<span><input class='input-small' /></span>",
        link: function(scope, element, attrs, ngModel) {
            var input = element.find('input');
            var options = angular.extend({
                color: ngModel.$viewValue,
                showInput: true,
                showButtons: false,
                preferredFormat: "hex",
                change: function(color) {
                    scope.$apply(function() {
                      ngModel.$setViewValue(color.toHexString());
                    });
                }
            }, scope.$eval(attrs.options));
            
            ngModel.$render = function() {
              input.spectrum('set', ngModel.$viewValue || '');
            };
            
            input.spectrum(options);
        }
    };
});

canvio.directive('uiKeydown', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: false,
    link: function(scope, elem, attrs, ngModel) {
      ngModel.$render = function() {
        console.log("HERE");
        elem.val(ngModel.$viewValue || 0);
      };

      elem.on('keydown', function(e){
        if (e.which == 38){
          ngModel.$setViewValue(parseInt(ngModel.$viewValue, 10) + 1);
          ngModel.$render();
        }else if (e.which == 40){
          ngModel.$setViewValue(parseInt(ngModel.$viewValue, 10) - 1);
          ngModel.$render();
        }
      });
    }
  };
});

canvio.directive('uiFocus', function() {
    return function(scope, element, attrs) {
       scope.$watch(attrs.uiFocus, 
         function (newValue) { 
            newValue && element.focus();
         },true);
      };    
});

canvio.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

canvio.controller('CanvasControl', function($scope, $sce){

  var canvas = document.getElementById('tag_output');
  var context = canvas.getContext('2d');

  $scope.commands = [];
  $scope.movable_element = false;
  $scope.landing_page = "http://www.dataxu.com";
  $scope.direction = "choose a shape to use and start drawing on the canvas below",
  $scope.mouse_down = false;
  $scope.times_moved = 0;
  $scope.loaded_variant = false

  $scope.templates = [
    {
      name: "Blank 300x250",
      description: "A blank 300x250 canvas",
      width: 300,
      height: 250,
      elements: [{
        name: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 300,
        height: 250,
        fill: '#ffffff'
      }]
    },
    {
      name: "Blank 728x90",
      description: "A blank 728x90 canvas",
      width: 728,
      height: 90,
      elements: [{
        name: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 728,
        height: 90,
        fill: '#ffffff'
      }]
    },
    {
      name: "Blank 300x600",
      description: "A blank 300x600 canvas",
      width: 300,
      height: 600,
      elements: [{
        name: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 300,
        height: 600,
        fill: '#ffffff'
      }]
    },
    {
      name: "Yellow Circle 300x250",
      description: "Has a yellow circle on the bottom left corner",
      width: 300,
      height: 250,
      elements: [
          {
            "name": "background",
            "type": "rectangle",
            "x": 0,
            "y": 0,
            "width": 300,
            "height": 250,
            "fill": "#ffffff",
          },
          {
            "type": "circle",
            "x": 34,
            "y": 497,
            "radius": 370,
            "fill": "#000000",
            "stroke": "#000000",
          },
          {
            "type": "circle",
            "x": 34,
            "y": 491,
            "radius": 356,
            "fill": "#e6f22c",
            "stroke": false,
          },
          {
            "type": "text",
            "x": 160,
            "y": 231,
            "text": "Buy Now!",
            "font_size": "20",
            "font": "Arial",
            "fill": "#000000",
            "stroke": false,
          }
        ]
    }
  ];

  $scope.images = [
    "https://advertisers.dataxu.com/creative-assets/0_WYTSCPpB.gif",
    "https://advertisers.dataxu.com/assets/logo-c395505ca57dd03cf5f973ee4b424350.png",
    "http://www.dataxu.com/wp-content/themes/dataxu_v2/images/header-logo.gif",
    "http://www.dataxu.com/wp-content/uploads/2012/09/slide41.jpg",
    "http://www.dataxu.com/wp-content/uploads/2012/09/slide1-new.jpg",
    "http://www.dataxu.com/wp-content/uploads/2013/01/slide22.jpg",
    "http://www.dataxu.com/wp-content/uploads/2013/01/slide31.jpg",
    "http://www.dataxu.com/wp-content/uploads/2012/09/slide51.jpg"
  ];

  $scope.products = {
    "a": {
      name: "Xenocide",
      description: "Xenocide: 3 (The Ender Quintet)",
      img_url: "http://ecx.images-amazon.com/images/I/51UvDFCDZEL._SL150_.jpg",
      selected: false
    },
    "b": {
      name: "Ender's Shadow",
      description: "Ender's Shadow: 1 (The Shadow Series)",
      img_url: "http://ecx.images-amazon.com/images/I/51xlILbZLhL._SL150_.jpg",
      selected: false
    },
    "c": {
      name: "Shadow of the Hegemon",
      description: "Shadow of the Hegemon: 2 (The Shadow Series)",
      img_url: "http://ecx.images-amazon.com/images/I/51BGg7K1UpL._SL150_.jpg",
      selected: false
    },
    "d": {
      name: "Ender in Exile",
      description: "Ender in Exile: 5 (The Ender Quintet)",
      img_url: "http://ecx.images-amazon.com/images/I/515UQMm4IEL._SL150_.jpg",
      selected: false
    }
  };

  $scope.set_loaded_image = function(image){
    $scope.loaded_image = image;
    if ($scope.images.indexOf(image) == -1){
      $scope.images.push(image);
    }
  }
  $scope.set_loaded_image($scope.images[0]);


  $scope.load_template = function(template){
    $scope.width = template.width;
    $scope.height = template.height;
    $scope.elements = template.elements.slice(0);;
    $scope.draw();
  };

  $scope.set_template = function(template){
    console.log("Setting");
    console.log(template);
    $scope.starting_template = template;
    $scope.load_template($scope.starting_template);
  };

  var directions = {
    rectangle: "click and drag between two corners",
    circle: "click the center of the circle and drag the length of the radius",
    text: "click to set the bottom-left corner of the text and begin typing",
    img: "click in one place to render the image its normal size. drag to set the size",
  };
  $scope.set_mode = function(mode){
    $scope.mode = mode;
    $scope.direction = directions[mode];
    $scope.movable_element = false;
  };

  $scope.get_elements = function(){
    return $scope.elements;
  };
  
  $scope.debug = function(){
    return JSON.stringify({
      fill_enabled: $scope.fill_enabled,
      fill_color: $scope.fill_color,
      stroke_enabled: $scope.stroke_enabled,
      stroke_color: $scope.stroke_color,
      width: $scope.width,
      height: $scope.height,
      mode: $scope.mode,
      elements: $scope.elements,
      commands: $scope.commands,
      mouse_down: $scope.mouse_down,
      products: $scope.products,
      points: {
        start_point: $scope.start_point,
        end_point: $scope.end_point,
        movable_start_point: $scope.movable_start_point
      }
    }, undefined, 2);
  };
  
  $scope.mousedown = function(ev){
    ev.originalEvent.preventDefault();
    $scope.mouse_down = true;
    $scope.start_point = {x: ev.offsetX, y: ev.offsetY};
    $scope.end_point = false;
    $scope.times_moved = 0;
  };
  
  $scope.mouseup = function(ev){
    $scope.mouse_down = false;
    $scope.end_point = {x: ev.offsetX, y: ev.offsetY};
    if ($scope.movable_element === false){
      if (['text', 'img'].indexOf($scope.mode) != -1){
        if ($scope.mode == 'img' && $scope.times_moved > 1){
          $scope.elements.pop();
        }
        add_element($scope.end_point);
      }
    }else{
      $scope.movable_start_point = {x: $scope.elements[$scope.movable_element].x, y: $scope.elements[$scope.movable_element].y};
    }
  };

  $scope.mousemove = function(ev){
    $scope.times_moved += 1;
    $scope.mouse_point = {x: ev.offsetX, y: ev.offsetY};
    if ($scope.mouse_down){
      if ($scope.movable_element !== false){
        move_element();
      }else{
        if (['text'].indexOf($scope.mode ) == -1){
          if ($scope.times_moved > 1){
            $scope.elements.pop();
          }
          add_element($scope.mouse_point);
        }
      }
    }
  };

  $scope.mouseout = function(ev){
    $scope.mouse_down = false;
  };

  $scope.clear = function(){
    $scope.load_template($scope.starting_template);
  };

  var add_element = function(end_point){
    var elem_data = false;
    switch ($scope.mode){
      case 'rectangle':
        elem_data = {
          type: 'rectangle',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          width: end_point.x - $scope.start_point.x,
          height: end_point.y - $scope.start_point.y
        };
        break;
      case 'circle':
        elem_data = {
          type: 'circle',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          radius: Math.floor(Math.sqrt((end_point.x - $scope.start_point.x)*(end_point.x - $scope.start_point.x)+(end_point.y - $scope.start_point.y)*(end_point.y - $scope.start_point.y)))
        };
        break;
      case 'text':
        elem_data = {
          type: 'text',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          text: "",
          font_size: "20",
          font: "Arial"
        };
        break;
      case 'img':
        elem_data = {
          type: 'img',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          url: $scope.loaded_image,
          width: end_point.x - $scope.start_point.x,
          height: end_point.y - $scope.start_point.y
        };
        break;
      default:
        console.log("Add element not caught");
    }
    if (elem_data){
      if ($scope.fill_enabled && $scope.fill_color){
        elem_data.fill = $scope.fill_color
      }else{
        elem_data.fill = false
      }
      if ($scope.stroke_enabled && $scope.stroke_color){
        elem_data.stroke = $scope.stroke_color
      }else{
        elem_data.stroke = false
      }
      $scope.elements.push(elem_data);
      $scope.draw();
    }
  };

  var move_element = function(){
    if ($scope.mouse_down){
      $scope.elements[$scope.movable_element].x = parseInt($scope.movable_start_point.x + $scope.mouse_point.x - $scope.start_point.x , 10);
      $scope.elements[$scope.movable_element].y = parseInt($scope.movable_start_point.y + $scope.mouse_point.y - $scope.start_point.y , 10);
    }
    $scope.draw();
  };

  var generate_shape_commands = {
    'rectangle': function(elem){
      commands = ["context.beginPath()"];
      if (elem.fill){
        commands.push("context.fillRect(" + elem.x + "," + elem.y + "," + elem.width + "," + elem.height + ")");
      }
      if (elem.stroke){
        commands.push("context.strokeRect(" + elem.x + ", " + elem.y + ", " + elem.width + ", " + elem.height + ")");
      }
      return commands;
    },
    'circle': function(elem){
      var commands = [
        "context.beginPath()",
        "context.arc(" + elem.x + ", " + elem.y + ", " + elem.radius + ", 0, 2*Math.PI)"
      ]
      if (elem.fill){
        commands.push("context.fill()");
      }
      if (elem.stroke){
        commands.push("context.stroke()");
      }
      return commands;
    },
    'text': function(elem){
      var commands = ["context.font = '" + elem.font_size + "px " + elem.font + "'"]
      if (elem.fill){
        commands.push("context.fillText(\"" + elem.text + "\", " + elem.x + ", " + elem.y + ")");
      }
      if (elem.stroke){
        commands.push("context.strokeText(\"" + elem.text + "\", " + elem.x + ", " + elem.y + ")");
      }
      return commands;
    },
    'img': function(elem){
      var img_num = Math.floor((Math.random()*100000)+1);
      var img_fn = "context.drawImage(img"+img_num+", " + elem.x + ", " + elem.y + ((elem.width == 0 || elem.height == 0) ? ")" : ", " + elem.width + ", " + elem.height + ")");
      var commands = [
        "var img"+img_num+" = new Image",
        "img"+img_num+".onload = function(){" + img_fn + "}",
        "img"+img_num+".src = '" + elem.url + "'",
        // img_fn
      ];
      return commands;
    },
    'dynamic_text': function(elem){
      var commands = ["context.font = '" + elem.font_size + "px " + elem.font + "'"]
      if (elem.fill){
        commands.push("context.fillText(chosen_variant['" + elem.dynamic_map + "'], " + elem.x + ", " + elem.y + ")");
      }
      if (elem.stroke){
        commands.push("context.strokeText(chosen_variant['" + elem.dynamic_map + "'], " + elem.x + ", " + elem.y + ")");
      }
      return commands;
    },
    'dynamic_img': function(elem){
      var img_num = Math.floor((Math.random()*100000)+1);
      var img_fn = "context.drawImage(img"+img_num+", " + elem.x + ", " + elem.y + ((elem.width == 0 || elem.height == 0) ? ")" : ", " + elem.width + ", " + elem.height + ")");
      var commands = [
        "var img"+img_num+" = new Image",
        "img"+img_num+".onload = function(){" + img_fn + "}",
        "img"+img_num+".src = chosen_variant['" + elem.dynamic_map + "']",
        // img_fn
      ];
      return commands;
    },
  };

  var generate_element_commands = function(elem){
    var commands = [];
    console.log(elem);

    if (elem.fill){
      commands.push("context.fillStyle = '" + elem.fill + "'");
    }else{
      commands.push("context.fillStyle = '#000000'");
    }

    if (elem.stroke){
      commands.push("context.strokeStyle = '" + elem.stroke + "'");
    }else{
      commands.push("context.strokeStyle = '#000000'");
    }

    commands = commands.concat(generate_shape_commands[elem.type](elem));

    return commands;
  };

  var generate_commands = function(){
    var commands = [];
    for (var i in $scope.elements){
      commands = commands.concat(generate_element_commands($scope.elements[i]));
    }
    return commands;
  };

  var run_commands = function(commands){
    try {
      eval(commands.join(';'));
    } catch(err) {
      $scope.description = "there is an error, not drawing";
    }
    
  };

  $scope.draw = function(){
    context.clearRect(0 ,0 , $scope.width, $scope.height);
    var commands = generate_commands();
    $scope.commands = commands;
    run_commands(commands);
  };

  $scope.remove_element = function(index){
    $scope.elements.splice(index, 1);
    if (index === $scope.movable_element){
      $scope.movable_element = false;
    }
    $scope.draw();
  };

  $scope.move_back_element = function(index){
    $scope.elements = array_move($scope.elements, index, index - 1);
    $scope.draw();
  };

  $scope.move_up_element = function(index){
    $scope.elements = array_move($scope.elements, index, index + 1);
    $scope.draw();
  };

  $scope.toggle_movable = function(index){
    if (index === $scope.movable_element){
      $scope.movable_element = false;
      $scope.movable_start_point = false;
    }else{
      $scope.movable_element = index;
      $scope.movable_start_point = {x: $scope.elements[$scope.movable_element].x, y: $scope.elements[$scope.movable_element].y}
    }
  };

  $scope.generate_tag = function(){
    var r = "";
    var selected_products = $scope.get_selected_products();
    // r += "<html><head></head><body>";
    r += "<a target='_blank' href='"+ $scope.landing_page +"'>\n";
    r += "<canvas id='canvas' width='"+ $scope.width +"' height='"+ $scope.height +"'></canvas>\n";
    r += "</a>\n";
    r += "<script>\n";
    r += "var canvas = document.getElementById('canvas');\n";
    r += "var context = canvas.getContext('2d');\n";
    if (obj_size(selected_products) > 0){
      r += "var buster = Math.floor((Math.random()*100000)+1);\n";
      r += "dx_cookies='';\n";
      r += "document.write('<scr' + 'ipt src=\"http://w55c.net/ct/get_cookies.js?' + buster + '\"></scr' + 'ipt>');\n";
      r += "window.onload = function(){\n"
      r += "  var cookies = dx_cookies.split('; ');\n";
      r += "  var chosen_variant_key = false;\n";
      r += "  for (var i in cookies){\n";
      r += "    var c_v = cookies[i].split('=')\n";
      r += "    if (c_v[0].indexOf('variant') == 0){ chosen_variant_key = c_v[1]};\n";
      r += "  }\n";
      r += "  var variants = " + JSON.stringify(selected_products) + ";\n";
      r += "  if (chosen_variant_key in variants){\n";
      r += "    chosen_variant = variants[chosen_variant_key];\n";
      r += "  }else{\n";
      // r += "    chosen_variant = variants['a'];\n";
      r += "    var random_prop = function(obj) { var result; var count = 0; for (var prop in obj){if (Math.random() < 1/++count){result = prop;}} return result;};\n";
      r += "    chosen_variant = variants[random_prop(variants)];\n";
      r += "  }\n";
      r += $scope.commands.join(';\n');
      r += "}\n";
    }else{
      r += $scope.commands.join(';\n');
    }
    
    
    r += "\n</script>";
    // r += "</body></html>";
    return r;
  };

  $scope.tag_preview = function(){
    return $sce.trustAsHtml($scope.generate_tag());
  };

  $scope.get_templates = function(){
    return $scope.templates;
  };

  $scope.get_images = function(){
    return $scope.images;
  };

  $scope.get_products = function(){
    return $scope.products;
  };

  $scope.get_selected_products = function(){
    var selected = {};
    for (var i in $scope.products){
      if ($scope.products[i].selected){
        selected[i] = $scope.products[i];
      }
    }
    return selected;
  };

  $scope.insert_product_tags = function(){
    $scope.elements.push({
      name: 'Dynamic Image',
      type: 'dynamic_img',
      dynamic_map: 'img_url',
      x: 20,
      y: 20,
      width: 0,
      height: 0
    });
    $scope.elements.push({
      name: 'Dynamic Description',
      type: 'dynamic_text',
      dynamic_map: 'description',
      x: 20,
      y: 20,
      font_size: "20",
      font: "Arial",
      fill: ($scope.fill_enabled && $scope.fill_color) ? $scope.fill_color : false,
      stroke: ($scope.stroke_enabled && $scope.stroke_color) ? $scope.stroke_color : false
    });
    $scope.elements.push({
      name: 'Dynamic Name',
      type: 'dynamic_text',
      dynamic_map: 'name',
      x: 20,
      y: 20,
      font_size: "26",
      font: "Arial",
      fill: ($scope.fill_enabled && $scope.fill_color) ? $scope.fill_color : false,
      stroke: ($scope.stroke_enabled && $scope.stroke_color) ? $scope.stroke_color : false
    });
    chosen_variant = $scope.products[random_prop($scope.get_selected_products())];
    $scope.draw();
  };

  $scope.starting_template = $scope.templates[0];
  $scope.load_template($scope.starting_template);
});
