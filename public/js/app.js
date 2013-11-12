(function($, canvio){

  var can = false;
  var params = {};
  var set_meta = function(info){
    for (var k in info){
      params[k] = info[k];
    }
    $('#meta').text(JSON.stringify(params, null, 2));
  };

  var set_dims = function(){
    var w = $('#width').val();
    var h = $('#height').val();
    $('#tag_input').height(h).width(w);
    if (can){
      can.set_dimensions({'w': w, 'h': h});
    }
  };

  $(document).ready(function(){
    set_dims();
    $('#settings_form_button').click(function(){
      set_dims();
      return false;
    });

    can = canvio('#tag_input', {
      debug: set_meta
    });

    $('#color').spectrum({
        flat: true,
        showInput: true,
        showButtons: false,
        move: function(color) {
          console.log(color.toHexString());
          can.set_color(color.toHexString());
        }
    });

    $('#mode_select button').click(function(){
      can.set_mode($(this).text());
    });

  });
})(jQuery, window.canvio);

// var canvio = angular.module('canvio', []);
// canvio.factory('Properties', function(){
//   var prop_set = {};
//   return {
//     get: function (key) {
//       return prop_set[key];
//     },
//     set: function(key, value) {
//       prop_set[key] = value;
//     }
//   };
// });

// function CanvasControl($scope, $http, Properties){
//   $scope.status = function(){
//     return true;
//   };
// }
