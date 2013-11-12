var canvio = angular.module('canvio', []);

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

canvio.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

canvio.controller('CanvasControl', function($scope){

  $scope.elements = [];
  var canvas = document.getElementById('tag_output');
  var context = canvas.getContext('2d');

  $scope.set_mode = function(mode){
    console.log(mode);
    $scope.mode = mode;
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
      elements: $scope.elements
    }, undefined, 2);
  };
  
  $scope.mousedown = function(ev){
    console.log(ev);
    $scope.start_point = {x: ev.offsetX, y: ev.offsetY};
  };
  
  $scope.mouseup = function(ev){
    console.log(ev);
    $scope.end_point = {x: ev.offsetX, y: ev.offsetY};
    add_element();
  };

  $scope.clear = function(){
    $scope.elements = [];
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
        break;
      case 'circle':
        elem_data = {
          type: 'circle',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          radius: Math.floor(Math.sqrt(($scope.end_point.x - $scope.start_point.x)*($scope.end_point.x - $scope.start_point.x)+($scope.end_point.y - $scope.start_point.y)*($scope.end_point.y - $scope.start_point.y)))
        };
        break;
      case 'text':
        elem_data = {
          type: 'text',
          x: $scope.start_point.x,
          y: $scope.start_point.y,
          text: "Insert Text",
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

  $scope.draw = function(){
    context.clearRect(0 ,0 , $scope.width, $scope.height);
    for (var i in $scope.elements){
      var elem = $scope.elements[i];
      console.log(elem);

      if (elem.fill){
        context.fillStyle = elem.fill;
      }else{
        context.fillStyle = '#000000';
      }

      if (elem.stroke){
        context.strokeStyle = elem.stroke;
      }else{
        context.strokeStyle = '#000000';
      }


      switch (elem.type){
        case 'rectangle':
          context.beginPath();
          if (elem.fill){
            context.fillRect(elem.x, elem.y, elem.width, elem.height);
          }
          if (elem.stroke){
            context.strokeRect(elem.x, elem.y, elem.width, elem.height);
          }
          break;
        case 'circle':
          context.beginPath();
          context.arc(elem.x, elem.y, elem.radius, 0, 2*Math.PI);
          if (elem.fill){
            context.fill();
          }
          if (elem.stroke){
            context.stroke();
          }
          break;
        case 'text':
          context.font = elem.font_size + " " + elem.font;
          if (elem.fill){
            context.fillText(elem.text, elem.x, elem.y);
          }
          if (elem.stroke){
            context.strokeText(elem.text, elem.x, elem.y);
          }
          break;
        case 'img':
          var img = new Image;
          img.onload = function(){
            context.drawImage(img, elem.x, elem.y, elem.width, elem.height);
          };
          img.src = elem.url;
          context.drawImage(img, elem.x, elem.y, elem.width, elem.height);

          break;
        default:
          console.log("Draw not caught");
      }
    }
  };

  $scope.remove_element = function(index){
    console.log(index);
    $scope.elements.splice(index, 1);
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
});
