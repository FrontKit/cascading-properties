'use strict';

var assert = require('assert');
var domify = require('domify');
var CascadingProperties = require('..');

describe('cascading-properties', function() {

  describe('addProperties', function(){
    it('should override properties with the same name', function(){
      var properties = new CascadingProperties();
      properties.addProperties({foo:{defaultValue:true}});
      properties.addProperties({foo:{defaultValue:false}});
      assert.equal(Object.keys(properties.properties).length, 1);
      assert.equal(properties.properties.foo.defaultValue, false);
    });
  });

  describe('addRules', function(){
    it('should prepend the parent selector for nested selectors', function() {
      var properties = new CascadingProperties();
      properties.addRules({
        'h1,h2':{
          'em,strong': {
            foo: true,
            'span.icon': {
              foo: false
            }
          }
        }
      });
      assert.equal(properties.rules.length, 10);
    });
  });


  describe('getValue', function(){

    var propertyDefinitions = {
      someProperty: {
        defaultValue: 0
      },
      someOtherProperty: {
        inherited: true
      }
    };

    var rules = {
      ul:{
        someOtherProperty: true,
        yetAnotherProperty: 2,
        'li, em': {
          someProperty: 1
        }
      },
      'li:last-child': {
        someProperty: 3
      }
    };

    var ul = domify('<ul><li>Hello</li><li>World</li></ul>');

    var properties = new CascadingProperties(propertyDefinitions, rules);
    window.properties = properties;

    it('should return the existing default value when no rule was matched', function() {
      assert.equal(properties.getValue(ul, 'someProperty'), 0);
    });

    it('should return an property on a matched element', function(){
      assert.equal(properties.getValue(ul.firstChild, 'someProperty'), 1);
    });

    it('should return return a property that isn’t part of the property definitions' , function() {
      assert.equal(properties.getValue(ul, 'yetAnotherProperty'), 2);
    });

    it('should return the property with the highest specificity', function() {
      assert.equal(properties.getValue(ul.lastChild, 'someProperty'), 3);
    });

    it('should return inherited properties', function() {
      assert.equal(properties.getValue(ul.firstChild, 'someOtherProperty'), true);
    });

    it('should return null for undefined properties', function() {
      assert.equal(properties.getValue(ul, 'undefinedProperty'), null);
    });

  })
});
