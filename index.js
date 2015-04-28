'use strict';

var matches    = require('component-matches-selector');
var specimen   = require('specimen');

// Helper function
function isDefined(variable) { return typeof variable !== 'undefined'; }

/**
 * A set of properties and rules
 *
 * @constructor
 * @param properties
 * @param rules
 */
function CascadingPropertySet(properties, rules) {

  this.properties = {};
  this.rules = [];

  this.inheritedProperties = [];
  this.propertiesWithDefaultValue = [];

  if (isDefined(properties)) {
    this.addProperties(properties);
  }

  if (isDefined(rules)) {
    this.addRules(rules);
  }
}

/**
 * Stores property definitions (overrides properties with the same name)
 * @param propertyDefinitions object
 */
CascadingPropertySet.prototype.addProperties = function(propertyDefinitions) {
  for (var propertyName in propertyDefinitions) {
    if (propertyDefinitions.hasOwnProperty(propertyName)) {
      this.properties[propertyName] = propertyDefinitions[propertyName];
    }
  }

  // Reset the cached property lists
  this.inheritedProperties = [];
  this.propertiesWithDefaultValue = [];

  for (var property in this.properties){
    if (isDefined(this.properties[property].defaultValue)){
      this.propertiesWithDefaultValue.push(property);
    }
    if (isDefined(this.properties[property].inherited) && this.properties[property].inherited){
      this.inheritedProperties.push(property);
    }
  }
};

/**
 * Stores the rules
 * @param rules An object containing the list of rules to add
 * @param parentSelector
 */
CascadingPropertySet.prototype.addRules = function(rules, parentSelector) {
  if (!isDefined(parentSelector)) {
    parentSelector = '';
  }

  // TODO: DRY
  var prependParentSelector = function(selectors, parentSelectors) {
    return selectors
      .split(',')
      .map(function(selector) {
        return parentSelectors
          .split(',')
          .map(function(parentSelector){
              return (parentSelector.trim() + ' ' + selector.trim()).trim();
            })
          .join(',');
      })
      .join(',');
  };

  var properties = {};
  for (var key in rules) {
    if (rules.hasOwnProperty(key)) {
      // If we're dealing with a nested selector, prepend the parentSelector(s)
      // and call addRules again
      if(rules[key].constructor === Object){
        this.addRules(rules[key], prependParentSelector(key, parentSelector));
      }
      // Else, we just collect the property
      else {
        properties[key] = rules[key];
      }
    }
  }

  if (properties && parentSelector !== '') {
    this.addRule(parentSelector, properties);
  }
};

/**
 * Stores individual rules along with the specificity of their selector
 * @param selectors
 * @param properties
 */
CascadingPropertySet.prototype.addRule = function(selectors, properties) {
  var selectorsArr = selectors.split(',');
  for (var i = 0, l = selectorsArr.length; i < l; i++) {
    var selector = selectorsArr[i];
    var specificity = parseInt(specimen(selector).join(''), 10);
    if (specificity) {
      this.rules.push({
        selector: selector,
        specificity: specificity,
        properties: properties
      });
    }
  }
};

/**
 * Returns a the value of a property on a given element
 * @param element
 * @param propertyName
 * @returns {*}
 */
CascadingPropertySet.prototype.getValue = function(element, propertyName) {

  var propertyDefinition = isDefined(this.properties[propertyName]) ? this.properties[propertyName] : {};

  // Default value
  var matchedProperty = {
    specificity:  0,
    value:        isDefined(propertyDefinition.defaultValue) ? propertyDefinition.defaultValue : null
  };

  // Iterate over the list of properties and return the value whose selector has the highest specificity
  for (var i = 0, l = this.rules.length; i < l; i++) {
    var rule = this.rules[i];
    if (matches(element, rule.selector)) {
      if (isDefined(rule.properties[propertyName])){
        var property = rule.properties[propertyName];
        // Store the property if its specificity is higher than or equal to the
        // specificity of the previous matchedProperty
        if (rule.specificity >= matchedProperty.specificity) {
          matchedProperty = {
            specificity: rule.specificity,
            value: property
          };
        }
      }
    }
  }

  // If no matched property was found but the property is inherited, try to get the parent's value
  if (matchedProperty.value === null && propertyDefinition.inherited && element.parentElement){
    return this.getValue(element.parentElement, propertyName);
  }

  return matchedProperty.value;
};

/**
 * Returns all the properties that were defined for an element
 */
CascadingPropertySet.prototype.getAll = function(element){

  var properties = {};

  // Keep track of the highest specificity for every property
  var highestSpecificity = {};

  // Iterate over all existing rules and store the properties along the way
  for (var i = 0, l = this.rules.length; i < l; i++) {
    var rule = this.rules[i];
    if (matches(element, rule.selector)) {
      for (var property in rule.properties) {
        if (rule.properties.hasOwnProperty(property)){
          var value = rule.properties[property];
          if (!isDefined(highestSpecificity[property]) || highestSpecificity[property] <= rule.specificity){
            highestSpecificity[property] = rule.specificity;
            properties[property] = value;
          }
        }
      }
   }
  }

  // Populate the inherited properties from the parent element for all
  // properties that weren't already defined
  for (var i = 0, l = this.inheritedProperties.length; i < l; i ++) {
    var property = this.inheritedProperties[i];
    if (!isDefined(properties[property])){
      properties[property] = this.getValue(element.parentElement, property);
    }
  }

  // Lastly, iterate over the default values and use them if no other value was found
  for (var i = 0, l = this.propertiesWithDefaultValue.length; i < l; i ++) {
    var property = this.propertiesWithDefaultValue[i];
    if (!isDefined(properties[property])){
      properties[property] = this.properties[property].defaultValue;
    }
  }

  return properties;
}


module.exports = CascadingPropertySet;
