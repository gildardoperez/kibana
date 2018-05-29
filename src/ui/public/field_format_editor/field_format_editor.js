/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './pattern/pattern';
import './samples/samples';
import _ from 'lodash';
import $ from 'jquery';
import { uiModules } from '../modules';
import { RegistryFieldFormatEditorsProvider } from '../registry/field_format_editors';

uiModules
  .get('app/management')
  .directive('fieldFormatEditor', function (Private, $compile) {
    const fieldFormatEditors = Private(RegistryFieldFormatEditorsProvider);

    return {
      restrict: 'A',
      scope: {
        getField: '&field',
        getFormatParams: '&formatParams'
      },
      controllerAs: 'editor',
      controller: function ($scope) {
        const self = this;

        // bind the scope values to the controller, down with $scope.values
        $scope.editor = this;
        $scope.$bind('editor.field', 'getField()', $scope);
        $scope.$bind('editor.formatParams', 'getFormatParams()', $scope);

        /**
       * Retrieve editor directive def object from registry and convert it into
       * a "pseudoDirective". For clarity I'm reusing the directive def
       * object api, but for simplicity not implementing the entire thing.
       *
       * directive def object, with support for the following opts:
       *   - template
       *   - compile or link
       *   - scope (creates isolate, reads from parent scope, not attributes)
       *   - controller
       *   - controllerAs
       *
       * @param  {object} directiveDef - the directive definition object
       * @return {undefined}
       */
        $scope.$watch('editor.field.format.type', function (FieldFormat) {
          const fieldFormatEditor = FieldFormat && fieldFormatEditors.getEditor(FieldFormat.id);

          if (!fieldFormatEditor) {
            delete self.$$pseudoDirective;
            return;
          }

          self.$$pseudoDirective = {
            template: fieldFormatEditor.template,
            compile: fieldFormatEditor.compile || function () {
              return fieldFormatEditor.link;
            },
            scope: fieldFormatEditor.scope || false,
            controller: fieldFormatEditor.controller,
            controllerAs: fieldFormatEditor.controllerAs
          };
        });

      },
      link: function ($scope, $el) {
        const scopesToTeardown = [];

        function setupScope(opts) {
          if (typeof opts !== 'object') {
            return scopesToTeardown[scopesToTeardown.push($scope.$new()) - 1];
          }

          const isolate = scopesToTeardown[scopesToTeardown.push($scope.$new(true)) - 1];
          _.forOwn(opts, function (from, to) {
            isolate.$bind(to, from, $scope);
          });
          return isolate;
        }

        $scope.$watch('editor.$$pseudoDirective', function (directive) {
          $el.empty();
          _.invoke(scopesToTeardown.splice(0), '$destroy');

          if (!directive) return $el.hide();
          else $el.show();

          const askedForChild = !!directive.scope;
          const reuseScope = !askedForChild && !directive.controller;

          const $formatEditor = $('<div>').html(directive.template);
          const $formatEditorScope = reuseScope ? $scope : setupScope(directive.scope);

          if (directive.controller) {
          // bind the controller to the injected element
            const cntrlAs = (directive.controllerAs ? ' as ' + directive.controllerAs : '');
            $formatEditorScope.Controller = directive.controller;
            $formatEditor.attr('ng-controller', 'Controller' + cntrlAs);
          }

          const attrs = {};
          let linkFns = directive.compile && directive.compile($el, attrs);
          if (!linkFns || _.isFunction(linkFns)) {
            linkFns = {
              pre: _.noop,
              post: linkFns || _.noop
            };
          }

          $el.html($formatEditor);
          linkFns.pre($formatEditorScope, $formatEditor, attrs);
          $compile($formatEditor)($formatEditorScope);
          linkFns.post($formatEditorScope, $formatEditor, attrs);
        });

      }
    };
  });
