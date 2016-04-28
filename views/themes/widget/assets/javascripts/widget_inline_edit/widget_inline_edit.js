(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node / CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {

  'use strict';

  var NAMESPACE = 'qor.widget';
  var EVENT_ENABLE = 'enable.' + NAMESPACE;
  var EVENT_DISABLE = 'disable.' + NAMESPACE;
  var EVENT_CLICK = 'click.' + NAMESPACE;
  var EDIT_WIDGET_BUTTON = '.qor-widget-button, .qor-slideout__close';
  var INLINE_EDIT_URL = "";

  function QorWidget(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, QorWidget.DEFAULTS, $.isPlainObject(options) && options);
    this.init();
  }

  QorWidget.prototype = {
    constructor: QorWidget,

    init: function () {
      this.bind();
      this.initStatus();
    },

    bind: function () {
      this.$element.on(EVENT_CLICK, $.proxy(this.click, this));
    },

    initStatus : function () {
      $("body").append('<iframe id="qor-widget-iframe" src="' + INLINE_EDIT_URL + '"></iframe>');
      $("body").append('<iframe id="qor-widget-inline-iframe" style="width:0;height:0;border:none;"></iframe>');
      $("#qor-widget-inline-iframe").load(function() {
        if($(this).attr("src")) {
          if($(this).hasClass("is-shown")) {
            parent.window.location.reload();
          } else {
            var $container = $("#qor-widget-inline-iframe").contents().find(".qor-form-container");
            $container.css("margin", 0);
            $(this).height($container.outerHeight() + 40).width("100%").css({ "border" : "1px solid #eee" });
            $("#qor-widget-inline-iframe").contents().find("header").remove();
            $("#qor-widget-inline-iframe").contents().find("body").css({ "overflow" : "hidden" });
            $("#qor-widget-inline-iframe").addClass("is-shown");
          }
        }
      });
    },

    click: function (e) {
      var $target = $(e.target);
      e.stopPropagation();

      if ($target.is(EDIT_WIDGET_BUTTON)){
        if ($target.data("is-inline-edit")) {
          $("#qor-widget-inline-iframe").attr("src", $target.data("url"));
          var $widget = $target.parents(".qor-widget");
          $widget.find("*").hide();
          $target.parents(".qor-widget").append($("#qor-widget-inline-iframe"));
        } else {
          $("#qor-widget-iframe").contents().find(".js-widget-edit-link").attr("data-url", $target.data("url"));
          $("#qor-widget-iframe").addClass("show");
          $("body").addClass("open-widget-editor");
        }
      }
    }
  };

  QorWidget.plugin = function (options) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {

        if (/destroy/.test(options)) {
          return;
        }

        $this.data(NAMESPACE, (data = new QorWidget(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.apply(data);
      }
    });
  };

  QorWidget.isScrollToBottom = function (element) {
    return element.clientHeight + element.scrollTop === element.scrollHeight;
  };

  $(function () {
    $("body").attr("data-toggle", "qor.widgets");

    // Add button to each widget
    $(".qor-widget").each(function (i, e) {
      var $wrap = $(e).find("*").eq(0);
      INLINE_EDIT_URL = $(e).data("widget-inline-edit-url");
      $wrap.css("position", "relative").addClass("qor-widget").attr("data-url", $(e).data("url")).unwrap();
      $wrap.append('<div class="qor-widget-embed-wrapper"><button data-is-inline-edit="' + $(e).data("is-inline-edit") + '" data-url=\"' + $(e).data("url") + '\" class="qor-widget-button">Edit</button></div>');
    });

    // Reload current page after close slideshow
    window.closeWidgetEditBox = function () {
      $("#qor-widget-iframe").removeClass("show");
      $("#qor-widget-iframe")[0].contentWindow.location.reload();
      $("body").removeClass("open-widget-editor");
    };

    var selector = '[data-toggle="qor.widgets"]';
    $(document).
      on(EVENT_DISABLE, function (e) {
        QorWidget.plugin.call($(selector, e.target), 'destroy');
      }).
      on(EVENT_ENABLE, function (e) {
        QorWidget.plugin.call($(selector, e.target));
      }).
      triggerHandler(EVENT_ENABLE);

  });

  return QorWidget;
});