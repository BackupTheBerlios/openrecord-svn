// -------------------------------------------------------------------
// Brian's 2005 JavaScript Coding Conventions
//
// + jslint approved
//    + jslint returns "ok" when it looks at the code (with strictest settings)
//    + do not use "with"
//    + do not use "new Function"
//    + do not use ++ and --
// 
// + naming conventions
//    + capitalization
//       + classes are initial caps (CamelCaps): "Rectangle", "FillPattern"
//       + all variable names and methods names are mixedCaps: "fillPattern"
//       + acronyms appear in initial caps: "myHtmlString", not "myHTMLString"
//       + file names are the all lower case version of the class name, with underscores: "rectangle", "fill_pattern"
//       + directories should be all lower case, with underscores: "basic_shapes"
//       + constants are all caps, with underscores: FILL_PATTERN_SOLID
//    + variable scoping prefixes
//       + class variables are prefixed with "our"
//       + instance variables are prefixed with "my"
//       + global variables are prefixed with "window.global"
//       + locally scoped variables are not prefixed
//       + function input parameters are prefixed with "in"
//       + private variables are prefixed with "_"
//    + class constants are prefixed with the type of the constant -- see LAYOUT_PORTRAIT
//    + array variables are prefixed with "ListOf" or "HashTableOf" or "ArrayOf"
//       + var myListOfBooks = []; <-- a "List" has only values, no keys ["Apple", "Orange", "Banana"]
//       + var myHashTableOfBooksKeyedByTitle = {}; <-- a "HashTable" is an associative array with key-value pairs
//       + var myArrayOfBooks = new Array(); <-- an "Array" has values that are indexed by number array[23] = "Apple"
//    + accessor methods are prefixed with "get" or "is" -- e.g. oval.getArea(), oval.isCircle()
//       + any method that returns a value and does not change an object's state should be a "get" or "is" method
//       + any method that does change an object's state should be a "set" method
//    + problems are marked with PENDING
//
// + compatiblity with other browsers and other JavaScript libraries 
//    + use "get" and "set" accessors -- do *not* assign Mozilla "getter" and "setter" methods
//    + add methods in your own namespace -- do *not* extend built-in objects: String.prototype.toEsperanto = function ...
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
//    + locally scoped variables are declared before being used: "var foo", not "foo
//    + global variables are not used, except for class names
//    + instance methods are defined on the prototype -- see getArea()
//    + accessor methods never have side-effects
//
// + PENDING
//    + private instance properties?
//    + private instance methods?
//    + class methods?
// -------------------------------------------------------------------




/*****************************************************************************
 rectangle.js
 
******************************************************************************
 Written in 2005 by Brian Douglas Skinner <brian.skinner@gumption.org>
  
 Copyright rights relinquished under the Creative Commons  
 Public Domain Dedication:
    http://creativecommons.org/licenses/publicdomain/
  
 You can copy freely from this file.  This work may be freely reproduced, 
 distributed, transmitted, used, modified, built upon, or otherwise exploited
 by anyone for any purpose.
  
 This work is provided on an "AS IS" basis, without warranties or conditions 
 of any kind, either express or implied, including, without limitation, any 
 warranties or conditions of title, non-infringement, merchantability, or 
 fitness for a particular purpose. You are solely responsible for determining 
 the appropriateness of using or distributing the work and assume all risks 
 associated with use of this work, including but not limited to the risks and 
 costs of errors, compliance with applicable laws, damage to or loss of data 
 or equipment, and unavailability or interruption of operations.

 In no event shall the authors or contributors have any liability for any 
 direct, indirect, incidental, special, exemplary, or consequential damages,
 however caused and on any theory of liability, whether in contract, strict 
 liability, or tort (including negligence), arising in any way out of or in 
 connection with the use or distribution of the work.
*****************************************************************************/


// -------------------------------------------------------------------
// Dependencies:
//   line.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Rectangle public class constants
// -------------------------------------------------------------------
Rectangle.LAYOUT_PORTRAIT = "Portrait";
Rectangle.LAYOUT_LANDSCAPE = "Landscape";

Rectangle.FILL_SOLID = "Solid";
Rectangle.FILL_EMPTY = "Empty";


// -------------------------------------------------------------------
// Rectangle class properties
// -------------------------------------------------------------------
Rectangle.ourHashTableOfColorsKeyedBySize = new Array();


/**
 * Each Rectangle instances represents a single rectangle.
 *
 * @scope    public instance constructor
 * @syntax   var rect = new Rectangle()
 */
function Rectangle() {
  // instance properties
  this.myWidth = null;
  this.myHeight = null;
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Given two Rectangle object, returns new Rectangle large enough
 * to encompass both of the given Rectangles.
 *
 * @scope    public class method
 * @param    inRectOne    A Rectangle object. 
 * @param    inRectTwo    A Rectangle object. 
 * @return   A newly created Rectangle object.
 */
Rectangle.union = function (inRectOne, inRectTwo) {
  Util.assert(inRectOne instanceof Rectangle);
  Util.assert(inRectTwo instanceof Rectangle);

  var newRectangle = new Rectangle();
  newRectangle.myWidth = Math.max(inRectOne.myWidth, inRectTwo.myWidth);
  newRectangle.myHeight = Math.max(inRectOne.myHeight, inRectTwo.myHeight);
  return newRectangle;
};


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the area of the rectangle.
 *
 * @scope    public instance method
 * @return   A number.
 */
Rectangle.prototype.getArea = function () {
  var area = this.myWidth * this.myHeight;
  return area;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
