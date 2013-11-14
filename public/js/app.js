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
  $scope.direction = "choose a shape to use and start drawing on the canvas below"
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
      commands: $scope.commands
    }, undefined, 2);
  };
  
  $scope.mousedown = function(ev){
    console.log(ev);
    ev.originalEvent.preventDefault();
    $scope.start_point = {x: ev.offsetX, y: ev.offsetY};
  };
  
  $scope.mouseup = function(ev){
    console.log(ev);
    $scope.end_point = {x: ev.offsetX, y: ev.offsetY};
    if ($scope.movable_element === false){
      add_element();
    }else{
      move_element();
    }
  };

  $scope.mousemove = function(ev){
    console.log(ev);
    $scope.mouse_point = {x: ev.offsetX, y: ev.offsetY};
  };

  $scope.clear = function(){
    $scope.elements = [background];
    context.clearRect(0 ,0 , $scope.width, $scope.height);
  };

  var add_element = function(){
    console.log($scope);
    var elem_data = false;
    switch ($scope.mode){
      case 'rectangle':
        elem_data = {
          type: 'rectangle',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          width: $scope.end_point.x - $scope.start_point.x,
          height: $scope.end_point.y - $scope.start_point.y
        };
        if (elem_data.width == 0 || elem_data.height == 0){
          elem_data = false;
        }
        break;
      case 'circle':
        if ($scope.end_point.x - $scope.start_point.x > 0 && $scope.end_point.y - $scope.start_point.y > 0){
          elem_data = {
            type: 'circle',
            x: $scope.start_point.x,
            y: $scope.start_point.y,
            radius: Math.floor(Math.sqrt(($scope.end_point.x - $scope.start_point.x)*($scope.end_point.x - $scope.start_point.x)+($scope.end_point.y - $scope.start_point.y)*($scope.end_point.y - $scope.start_point.y)))
          };
        }
        break;
      case 'text':
        elem_data = {
          type: 'text',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          text: "",
          font_size: "20px",
          font: "Arial"
        };
        break;
      case 'img':
        elem_data = {
          type: 'img',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          url: "http://cdn.meme.li/i/pk39x.jpg",
          width: $scope.end_point.x - $scope.start_point.x,
          height: $scope.end_point.y - $scope.start_point.y
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
    diff_x = $scope.end_point.x - $scope.start_point.x;
    diff_y = $scope.end_point.y - $scope.start_point.y;
    console.log(diff_x);
    console.log(diff_y);
    $scope.elements[$scope.movable_element].x = parseInt($scope.elements[$scope.movable_element].x + diff_x, 10);
    $scope.elements[$scope.movable_element].y = parseInt($scope.elements[$scope.movable_element].y + diff_y, 10);
    $scope.draw();
  };

  var generate_commands = function(final){
    var commands = [];
    for (var i in $scope.elements){
      var elem = $scope.elements[i];
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


      switch (elem.type){
        case 'rectangle':
          commands.push("context.beginPath()");
          if (elem.fill){
            commands.push("context.fillRect(" + elem.x + "," + elem.y + "," + elem.width + "," + elem.height + ")");
          }
          if (elem.stroke){
            commands.push("context.strokeRect(" + elem.x + ", " + elem.y + ", " + elem.width + ", " + elem.height + ")");
          }
          break;
        case 'circle':
          commands.push("context.beginPath()");
          commands.push("context.arc(" + elem.x + ", " + elem.y + ", " + elem.radius + ", 0, 2*Math.PI)");
          if (elem.fill){
            commands.push("context.fill()");
          }
          if (elem.stroke){
            commands.push("context.stroke()");
          }
          break;
        case 'text':
          commands.push("context.font = '" + elem.font_size + " " + elem.font + "'");
          if (elem.fill){
            commands.push("context.fillText('" + elem.text + "', " + elem.x + ", " + elem.y + ")");
          }
          if (elem.stroke){
            commands.push("context.strokeText('" + elem.text + "', " + elem.x + ", " + elem.y + ")");
          }
          break;
        case 'img':
          commands.push("var img = new Image");
          var img_fn = "context.drawImage(img, " + elem.x + ", " + elem.y + ((elem.width == 0 || elem.height == 0) ? ")" : ", " + elem.width + ", " + elem.height + ")");
          // commands.push("img.onload = function(){" + img_fn + "}");
          commands.push("img.src = '" + elem.url + "'");
          commands.push(img_fn);
          break;
        default:
          console.log("Draw not caught");
      }
    }
    return commands;
  };

  $scope.draw = function(){
    context.clearRect(0 ,0 , $scope.width, $scope.height);
    var commands = generate_commands(false);
    eval(commands.join(';'));
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
    }else{
      $scope.movable_element = index;
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
