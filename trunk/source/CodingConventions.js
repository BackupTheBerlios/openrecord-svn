// -------------------------------------------------------------------
// OpenRecord 2005 JavaScript Coding Conventions
//
// + jslint approved
//    + jslint should return "ok" when it looks at the code (with strictest settings)
//    + do not use "with"
//    + do not use "new Function"
//    + use ++i and --i instead of i++ and i-- (prefix instead of postfix)
// 
// + naming conventions
//    + capitalization
//       + classes are initial caps (CamelCaps): "Rectangle", "FillPattern"
//       + all variable names and methods names are mixedCaps: "fillPattern"
//       + acronyms appear in initial caps: "htmlString", not "HTMLString"
//         (see http://www.dojotoolkit.org/pipermail/dojo-interest/2005-July/000534.html
//         (see http://www.dojotoolkit.org/pipermail/dojo-interest/2005-July/000535.html)
//       + constants are all caps, with underscores: FILL_PATTERN_SOLID
//    + file names
//       + each file has just one public class
//       + file names exactly match the name of the class they contain: "Rectangle.js", "FillPattern.js"
//       + directories are all lower case, with underscores: "basic_shapes"
//    + unit tests
//       + a JavaScript code file typically has two associated unit test files
//       + the unit test files have the suffix "Test"
//       + example: Book.js has unit test files BookTest.html and BookTest.js
//    + variable scoping prefixes
//       + class variables are prefixed with "our"
//       + [DEPRECATED: instance variables are prefixed with "my"]
//       + global variables are prefixed with "window.global"
//       + locally scoped variables are not prefixed
//       + non-public variables and methods are prefixed with "_" (use "_" for private, protected, or package)
//       + [DEPRECATED: function input parameters are prefixed with "in"]
//       + [DEPRECATED: private variables and methods are prefixed with "__"]
//       + [DEPRECATED: protected variables and methods are prefixed with "_"]
//    + class constants are prefixed with the type of the constant -- see LAYOUT_PORTRAIT
//    + array variables are prefixed with "listOf" or "hashTableOf" or "arrayOf"
//       + var listOfBooks = []; <-- a "List" has only values, no keys ["Apple", "Orange", "Banana"]
//       + var hashTableOfBooksKeyedByTitle = {}; <-- a "HashTable" is an associative array with key-value pairs
//       + var arrayOfBooks = new Array(); <-- an "Array" has values that are indexed by number arrayOfFruit[23] = "Apple"
//    + accessor methods are prefixed with "get" or "is" -- e.g. oval.getArea(), oval.isCircle()
//       + any method that returns a value and does not change an object's state should be a "get" or "is" method
//       + any method that does change an object's state should be a "set" method
//    + problems are marked with "PENDING"
//
// + compatiblity with other browsers and other JavaScript libraries 
//    + use "get" and "set" accessors -- do *not* assign Mozilla "getter" and "setter" methods
//    + [DEPRECATED: add methods in your own namespace -- do *not* extend built-in objects: String.prototype.toEsperanto = function ...]
//
// + indenting, tabs, and line ending characters
//    + 2-space indenting
//    + only spaces, no tabs
//    + Unix style line endings: just \n -- not \r or \r\n
//
// + file header and footer conventions
//    + file name is given
//    + copyright and license statements are included
//    + file dependencies are listed
//    + sections for: class constants, class properties, constructor, instance methods
//    + "End of file" ending
//
// + scoping
//    + locally scoped variables are declared before being used: "var foo", not "foo"
//    + global variables are not used, except for class names
//    + instance methods are defined on the prototype -- see getArea()
//    + accessor methods never have side-effects
//
// + PENDING
//    + private instance properties?
//    + private instance methods?
//    + class methods?
// -------------------------------------------------------------------
