// OpenRecord 2005 JavaScript Coding Conventions
/*
-----------------------------------------------------------------------------
Dojo Conventions

  The OpenRecord coding conventions are almost identical to the Dojo 
  JavaScript conventions, listed here:
     http://www.dojotoolkit.org/js_style_guide.html

Differences

  Here's a list of the six OpenRecord conventions that differ from the Dojo conventions:
  
  + constants
     + Dojo uses either UpperLower or UPPER_UPPER capitalization
     + OpenRecord always uses UPPER_UPPER capitalization
     + for an example, see orp.util.DateValue.Month in DateValue.js 
  
  + private class variables (instance variables)
     + Dojo says private class variables (instance variables) MAY have a leading underscore
     + OpenRecord always uses a leading underscore.  For example: this._foo = 3;
  
  + class-per-file
     + Dojo says "Class or object-per-file guidelines are not yet determined"
     + OpenRecord strives to have a one-to-one mapping between classes and files
     
  + tabs and spaces
     + Dojo uses tab characters for indentation, with tabs set to four spaces
     + OpenRecord uses spaces for indentation, with two spaces per indentation level.
     + In OpenRecord, tabs are forbidden, and files with tabs will not pass the unit tests.
     
  + incomplete lines
     + Dojo offers these examples:
       var someExpression = Expression1
           + Expression2
           + Expression3 ;
       var o = someObject.get(
               Expression1,
               Expression2,
               Expression3
           );
     + OpenRecord does it slightly differently, so as to pass the JSLint tests:
       var someExpression = Expression1 + 
           Expression2 + 
           Expression3 ;
       var o = someObject.get(
               Expression1,
               Expression2,
               Expression3 );
     
  + for loops
     + Dojo tends to use this style:  for (var i=0; i < bar.length; i++)
     + OpenRecord tends to do this:   for (var i in bar)
     
Additions

  OpenRecord has a number of additional conventions.  See below...
   


-----------------------------------------------------------------------------
OpenRecord Conventions

+ jslint approved
   + jslint should return "ok" when it looks at the code (with strictest settings)
   + do not use "with"
   + do not use "new Function"
   + use ++i and --i instead of i++ and i-- (prefix instead of postfix)

+ naming conventions
   + capitalization
      + classes are initial caps (CamelCaps): "Rectangle", "FillPattern"
      + all variable names and methods names are mixedCaps: "fillPattern"
      + acronyms appear in initial caps: "htmlString", not "HTMLString"
        (see http://www.dojotoolkit.org/pipermail/dojo-interest/2005-July/000534.html
        (see http://www.dojotoolkit.org/pipermail/dojo-interest/2005-July/000535.html)
      + constants are all caps, with underscores: FILL_PATTERN_SOLID
   + file names
      + each file has just one public class
      + file names exactly match the name of the class they contain: "Rectangle.js", "FillPattern.js"
      + directories are all lower case, with underscores: "basic_shapes"
   + unit tests
      + a JavaScript code file typically has two associated unit test files
      + the unit test files have the suffix "Test"
      + example: Book.js has unit test files BookTest.html and BookTest.js
   + variable scoping prefixes
      + class variables are prefixed with "our"
      + global variables are prefixed with "window.global"
      + locally scoped variables are not prefixed
      + non-public variables and methods are prefixed with "_" (use "_" for private, protected, or package)
   + array variables are prefixed with "listOf" or "hashTableOf" or "arrayOf"
      + var listOfBooks = []; <-- a "List" has only values, no keys ["Apple", "Orange", "Banana"]
      + var hashTableOfBooksKeyedByTitle = {}; <-- a "HashTable" is an associative array with key-value pairs
      + var arrayOfBooks = new Array(); <-- an "Array" has values that are indexed by number arrayOfFruit[23] = "Apple"
   + accessor methods are prefixed with "get" or "is" -- e.g. oval.getArea(), oval.isCircle()
      + any method that returns a value and does not change an object's state should be a "get" or "is" method
      + any method that does change an object's state should be a "set" method
   + problems are marked with "PENDING"

+ compatiblity with other browsers and other JavaScript libraries 
   + use "get" and "set" accessors -- do *not* assign Mozilla "getter" and "setter" methods
   + add methods in your own namespace -- do *not* extend built-in objects: String.prototype.toEsperanto = function ...
   + do *not* extend Object.prototype
     (see http://erik.eae.net/archives/2005/06/06/22.13.54/)
     (see http://sourceforge.net/forum/forum.php?thread_id=1315559&forum_id=379297)

+ indenting, tabs, and line ending characters
   + 2-space indenting
   + only spaces, no tabs
   + Unix style line endings: just \n -- not \r or \r\n

+ file header and footer conventions
   + file name is given
   + copyright and license statements are included
   + file dependencies are listed
   + sections for: class constants, class properties, constructor, instance methods
   + "End of file" ending

+ scoping
   + locally scoped variables are declared before being used: "var foo", not "foo"
   + global variables are not used, except for class names
   + instance methods are defined on the prototype -- see getArea()
   + accessor methods never have side-effects

+ PENDING
   + private instance properties?
   + private instance methods?
   + class methods?
*/
