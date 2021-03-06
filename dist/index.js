'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      MIT License http://www.opensource.org/licenses/mit-license.php
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Author Tobias Koppers @sokra
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ConstDependency = require('webpack/lib/dependencies/ConstDependency');

var _ConstDependency2 = _interopRequireDefault(_ConstDependency);

var _NullFactory = require('webpack/lib/NullFactory');

var _NullFactory2 = _interopRequireDefault(_NullFactory);

var _MissingLocalizationError = require('./MissingLocalizationError');

var _MissingLocalizationError2 = _interopRequireDefault(_MissingLocalizationError);

var _MakeLocalizeFunction = require('./MakeLocalizeFunction');

var _MakeLocalizeFunction2 = _interopRequireDefault(_MakeLocalizeFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 * @param {object|function} localization
 * @param {object|string} Options object or obselete functionName string
 * @constructor
 */
var I18nPlugin = function () {
  function I18nPlugin(localization, options, failOnMissing) {
    _classCallCheck(this, I18nPlugin);

    // Backward-compatiblility
    if (typeof options === 'string') {
      options = {
        functionName: options
      };
    }

    if (typeof failOnMissing !== 'undefined') {
      options.failOnMissing = failOnMissing;
    }

    this.options = options || {};
    this.localization = localization ? typeof localization === 'function' ? localization : (0, _MakeLocalizeFunction2.default)(localization, !!this.options.nested) : null;
    this.functionName = this.options.functionName || '__';
    this.failOnMissing = !!this.options.failOnMissing;
    this.hideMessage = this.options.hideMessage || false;
    this.locale = this.options.locale;
  }

  _createClass(I18nPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var localization = this.localization,
          failOnMissing = this.failOnMissing,
          hideMessage = this.hideMessage,
          locale = this.locale; // eslint-disable-line no-unused-vars

      var name = this.functionName;

      try {
        _fs2.default.unlinkSync(`./translations/${locale}-missing.csv`);
      } catch (e) {
        //
      }

      compiler.plugin('compilation', function (compilation, params) {
        // eslint-disable-line no-unused-vars
        compilation.dependencyFactories.set(_ConstDependency2.default, new _NullFactory2.default());
        compilation.dependencyTemplates.set(_ConstDependency2.default, new _ConstDependency2.default.Template());
      });

      compiler.plugin('compilation', function (compilation, data) {
        data.normalModuleFactory.plugin('parser', function (parser, options) {
          // eslint-disable-line no-unused-vars
          // should use function here instead of arrow function due to save the Tapable's context
          parser.plugin(`call ${name}`, function i18nPlugin(expr) {
            var param = void 0;
            var defaultValue = void 0;
            switch (expr.arguments.length) {
              case 3:
              case 2:
                param = this.evaluateExpression(expr.arguments[0]);
                if (!param.isString()) return;
                param = param.string;
                defaultValue = this.evaluateExpression(expr.arguments[1]);
                if (!defaultValue.isString()) return;
                defaultValue = defaultValue.string;
                break;
              case 1:
                param = this.evaluateExpression(expr.arguments[0]);
                if (!param.isString()) return;
                defaultValue = param = param.string;
                break;
              default:
                return;
            }
            var result = localization ? localization(param) : defaultValue;

            if (typeof result === 'undefined') {
              var error = this.state.module[__dirname];
              if (!error) {
                error = new _MissingLocalizationError2.default(this.state.module, param, defaultValue);
                this.state.module[__dirname] = error;

                if (failOnMissing) {
                  this.state.module.errors.push(error);
                } else if (!hideMessage) {
                  this.state.module.warnings.push(error);
                }
              } else if (!error.requests.includes(param)) {
                error.add(param, defaultValue);
              }
              result = defaultValue;

              _fs2.default.appendFileSync(`./translations/${locale}-missing.csv`, `"${param}","${defaultValue.replace(/\r?\n|\r/g, '').replace(/"/g, '""').replace(/\s{2,}/g, ' ')}"\r\n`);
            }

            var dep = new _ConstDependency2.default(JSON.stringify(result.replace(/\\n/g, ' ')), expr.range);
            dep.loc = expr.loc;
            this.state.current.addDependency(dep);
            return true;
          });
        });
      });
    }
  }]);

  return I18nPlugin;
}();

exports.default = I18nPlugin;