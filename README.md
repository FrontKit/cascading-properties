# Cascading Properties

Define virtual properties for HTML elements using CSS selectors.

## Why?

We needed a way to attach properties to HTML elements in arbitrary documents, without altering the original markup and polluting it with `data-*` attributes. CSS selectors emerged as a natural fit for this.

However, CSS Variables [aren't quite there yet](http://dev.w3.org/csswg/css-variables/) and proposals like [Cascading Attribute Sheets](https://lists.w3.org/Archives/Public/public-webapps/2012JulSep/0508.html) are primarily intended for HTML attributes therefore mutate the DOM. So we had to come up with our own solution.

## How?

Assuming we have the following HTML snippet:

```html
<ul>
  <li>Hello</li>
  <li>World</li>
</ul>
```

We initialise the object that will hold the properties and rules:

```js
var properties = new CascadingPropertySet();

// Define the properties with default values or those which are inherited
// (any properties with no default value or inheritance do not need to be explicitly defined)
properties.addProperties({
  someProperty: {
    defaultValue: 0
  },
  someOtherProperty: {
    inherited: true
  }
});

// Define the rules using a SASS-like syntax:
properties.addRules({
  'ul':{
    someOtherProperty: true,
    yetAnotherProperty: 2,
    'li': {
      someProperty: 1,
    }
  },
  'li:last-child': {
    someProperty: 3
  }
});
```

We can then retrieve the values by passing the reference to the element and the name of the property
to the `getValue` method:

```js
// Turn our HTML string into DOM elements using https://github.com/component/domify
var ul = domify('<ul><li>Hello</li><li>World</li></ul>');

properties.getValue(ul,             'someProperty')       // => 0
properties.getValue(ul.firstChild,  'someProperty')       // => 1
properties.getValue(ul,             'yetAnotherProperty') // => 2
properties.getValue(ul.lastChild,   'someProperty')       // => 3
properties.getValue(ul.firstChild,  'someOtherProperty')  // => true
properties.getValue(ul,             'undefinedProperty')  // => null
```
