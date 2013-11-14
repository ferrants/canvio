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

  $scope.width = 300;
  $scope.height = 250;
  $scope.commands = [];
  $scope.movable_element = false;
  $scope.landing_page = "http://www.dataxu.com";
  $scope.direction = "choose a shape to use and start drawing on the canvas below",
  $scope.mouse_down = false;
  $scope.times_moved = 0;

  var background = {
      name: 'background',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: $scope.width,
      height: $scope.height,
      fill: '#ffffff'
    };
  $scope.elements = [background];
  var canvas = document.getElementById('tag_output');
  var context = canvas.getContext('2d');

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
      points: {
        start_point: $scope.start_point,
        end_point: $scope.end_point,
        movable_start_point: $scope.movable_start_point
      }
    }, undefined, 2);
  };
  
  $scope.mousedown = function(ev){
    console.log(ev);
    ev.originalEvent.preventDefault();
    $scope.mouse_down = true;
    $scope.start_point = {x: ev.offsetX, y: ev.offsetY};
    $scope.end_point = false;
    $scope.times_moved = 0;
  };
  
  $scope.mouseup = function(ev){
    console.log(ev);
    $scope.mouse_down = false;
    $scope.end_point = {x: ev.offsetX, y: ev.offsetY};
    if ($scope.movable_element === false){
      if ($scope.mode == 'text'){
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
        console.log(ev);
        move_element();
      }else{
        if ($scope.mode != 'text'){
          if ($scope.times_moved > 1){
            console.log("Popping: " + $scope.times_moved);
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
    $scope.elements = [background];
    context.clearRect(0 ,0 , $scope.width, $scope.height);
    $scope.draw();
  };

  var add_element = function(end_point){
    console.log($scope);
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
          url: "http://cdn.meme.li/i/pk39x.jpg",
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
        commands.push("context.fillText('" + elem.text + "', " + elem.x + ", " + elem.y + ")");
      }
      if (elem.stroke){
        commands.push("context.strokeText('" + elem.text + "', " + elem.x + ", " + elem.y + ")");
      }
      return commands;
    },
    'img': function(elem){
      var img_fn = "context.drawImage(img, " + elem.x + ", " + elem.y + ((elem.width == 0 || elem.height == 0) ? ")" : ", " + elem.width + ", " + elem.height + ")");
      var commands = [
        "var img = new Image",
        // "img.onload = function(){" + img_fn + "}",
        "img.src = '" + elem.url + "'",
        img_fn
      ];
      return commands;
    }
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
    eval(commands.join(';'));
  };

  $scope.draw = function(){
    context.clearRect(0 ,0 , $scope.width, $scope.height);
    var commands = generate_commands();
    run_commands(commands);
    $scope.commands = commands;
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
    // r += "<html><head></head><body>";
    r += "<a target='_blank' href='"+ $scope.landing_page +"'>\n";
    r += "<canvas id='canvas' width='"+ $scope.width +"' height='"+ $scope.height +"'></canvas>\n";
    r += "</a>\n";
    r += "<script>\n";
    r += "var canvas = document.getElementById('canvas');\n";
    r += "var context = canvas.getContext('2d');\n"
    r += $scope.commands.join(';\n')
    r += "\n</script>";
    // r += "</body></html>";
    return r;
  };

  $scope.tag_preview = function(){
    return $sce.trustAsHtml($scope.generate_tag());
  };
});
