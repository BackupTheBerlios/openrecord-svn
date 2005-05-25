/*****************************************************************************
 TablePlugin.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
    Chih-Chao Lam <chao@cs.stanford.edu>
  
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
//   World.js
//   SectionView.js
//   PageView.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfPluginClassesKeyedByPluginName[SectionView.PLUGIN_TABLE] = TablePlugin;


// -------------------------------------------------------------------
// TablePlugin public class constants
// -------------------------------------------------------------------
TablePlugin.ASCENDING_GIF = "ascending.gif";
TablePlugin.DESCENDING_GIF = "descending.gif";


/**
 * The TablePlugin class knows how to display a Section of a Page as an
 * HTML table.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSectionView    The SectionView that this TablePlugin will appears in. 
 * @param    inHTMLElement    The HTMLElement to display this view in. 
 */
TablePlugin.prototype = new View();  // makes TablePlugin be a subclass of View
function TablePlugin(inSectionView, inHTMLElement, inCellPrefix, inClassType, inCellClass) {
  this.setSuperview(inSectionView);
  this.setHTMLElement(inHTMLElement);  

  // PENDING should probably make this independent of sectionview
  this.myClass = inClassType || SectionView.ELEMENT_CLASS_SIMPLE_TABLE;
  this.myCellClass = inCellClass || SectionView.ELEMENT_CLASS_PLAIN;
  this.myTable = null;
  this._sortAttribute = null;
  this._ascendingOrder = true;
}


/**
 * Returns a string with the display name for this plugin.
 *
 * @scope    public instance method
 * @return   A String with a display name for this plugin. 
 */
TablePlugin.prototype.getPluginName = function () {
  return SectionView.PLUGIN_TABLE;
};


/**
 * Comparison function to sort items.
 *
 * @scope    public instance method
 * @param    itemA    One of the two items to be compared. 
 * @param    itemB    One of the two items to be compared. 
 * @return   This method returns 0 if the items are comparable. If _ascendingOrder is true, itemA is less than itemB, this method returns -1, otherwise it returns +1. 
 */
TablePlugin.prototype.compareItemByAttribute = function (itemA, itemB) {
  Util.assert(this._sortAttribute !== null);
  var strA = itemA.getSingleStringValueFromAttribute(this._sortAttribute).toLowerCase();
  var strB = itemB.getSingleStringValueFromAttribute(this._sortAttribute).toLowerCase();
  var ascendingInt = this._ascendingOrder ? -1 : 1;
  if (strA < strB) {return ascendingInt;}
  if (strA == strB) {return 0;}
  return -ascendingInt;
};


/**
 * Gets the list of content items to display.
 *
 * @scope    PENDING
 */
TablePlugin.prototype.fetchItems = function() {
  // PENDING: how do we know our superview responds to getthis._listOfItems()? 
  this._listOfItems = this.getSuperview().getListOfContentItems();
};


/**
 * Creates a hashtable containing all the attributes of the content items 
 * in this table.  Finds the union of the attribute lists of all the content items.
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildAttributeHash = function() {
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  var hashTableOfAttributes = {};
  for (var iKey in this._listOfItems) {
    var contentItem = this._listOfItems[iKey];
    var listOfAttributesForItem = contentItem.getAttributes();
    for (var attributeKey in listOfAttributesForItem) {
      var attribute = listOfAttributesForItem[attributeKey];
      if (attribute != attributeCalledCategory) {
        var attributeKeyString = attribute.getUniqueKeyString();
        hashTableOfAttributes[attributeKeyString] = attribute;
      }
    }
  }
  this._hashTableOfAttributes = hashTableOfAttributes;
};


/**
 * Inserts a table row at rowNum given contentItem
 *
 * @scope    private instance method
 */
TablePlugin.prototype._insertRow = function(contentItem, rowNum) {
  var aRow = this.myTable.insertRow(rowNum); 
  var columnCount = -1;
  for (var lKey in this._hashTableOfAttributes) {
    var attribute = this._hashTableOfAttributes[lKey];
    this._insertCell(aRow, ++columnCount, contentItem, attribute);
  }
};

/**
 * Constructs the table body 
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildTableBody = function() {  
  // add the table body rows from query
  var numRows = 0; // start from 0 to account for header row
  for (var kKey in this._listOfItems) {
    var contentItem = this._listOfItems[kKey];
    this._insertRow(contentItem,++numRows);
  }  
  
  if (this.isInEditMode()) {
    // add one more row to allow users to add a new item to the table
    var newItem = this.getWorld().newProvisionalItem();
    this._insertRow(newItem,++numRows,true);
  }
};


/**
 * Constructs the table header 
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildHeader = function() {
  // add header row
  var headerRow = this.myTable.insertRow(0);
  var numCols = 0;
  for (var jKey in this._hashTableOfAttributes) {
    var attribute = this._hashTableOfAttributes[jKey];
    if (!this._sortAttribute) {this._sortAttribute = attribute;}
    var aCell = document.createElement("th");
    var headerStr = attribute.getDisplayName();
    aCell.appendChild(document.createTextNode(headerStr));
    if (this._sortAttribute == attribute) {
      aCell.appendChild(this.getSortIcon());}
    aCell.onclick = this.clickOnHeader.bindAsEventListener(this, attribute);
    
    headerRow.appendChild(aCell);
    ++numCols;
  }
  this._numberOfColumns = numCols;
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TablePlugin.prototype.doInitialDisplay = function() {
  // get list of items and attributes
  this.fetchItems();
  this._buildAttributeHash();
  
  //create new table, remove old table if already exists
  if (this.myTable) {
    this._myHTMLElement.removeChild(this.myTable); }
  this.myTable = document.createElement("table");
  this.myTable.className = this.myClass;
  
  this._buildHeader();

  // sort the list of items. SIDE EFFECT, table header needs to be built before items are sorted
  // because default _sortAttribute is specified there if not previously specificed
  var staticThis = this;
  this._listOfItems.sort(function(a,b) {return staticThis.compareItemByAttribute(a,b);}); // need to sort after header row added because default sort attribute is set there

  this._buildTableBody();
  
  this._myHTMLElement.appendChild(this.myTable);
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TablePlugin.prototype.refresh = function () {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    var a = 1;
  // PENDING new content model with obversable queries
  }
};


/**
 * Returns an HTML image element for the header column that is being sorted.
 *
 * @scope    public instance method
 * @return   An HTML image element
 */
TablePlugin.prototype.getSortIcon = function () {
  var imageName = this._ascendingOrder ? TablePlugin.ASCENDING_GIF : TablePlugin.DESCENDING_GIF;
  var image =  Util.createImageElement(imageName);
  image.align = "middle";
  return image;
};


/**
 * Inserts a table cell into table's row & col, with data from a given item and
 * attribute. Each table cell is displayed with a TextView object.  The HTML 
 * table cell links to the TextView object with the attribute "or_textView"
 *
 * @scope    public instance method
 * @return   An HTML image element
 */
TablePlugin.prototype._insertCell = function(row, col, item, attribute) {
  var aCell = row.insertCell(col);
  aCell.className = this.myCellClass;
  var aTextView = new TextView(this, aCell, item, attribute, this.myCellClass);
  aCell.or_textView = aTextView;
  aTextView.refresh();
  if (this.isInEditMode()) {
    //aCell.onkeypress = this.keyPressOnEditField.bindAsEventListener(this, aTextView);
    var listener = this;
    aTextView.setKeyPressFunction(function (evt, aTxtView) {listener.keyPressOnEditField(evt, aTxtView);});
  }
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
TablePlugin.prototype.endOfLife = function () {
  this.getHTMLElement().innerHTML = "";
};


/**
 * Called when the user clicks on table header. Resorts table accordingly.
 * 
 * @scope    public class method
 */
TablePlugin.prototype.clickOnHeader = function (event, clickAttribute) {
  if (clickAttribute == this._sortAttribute) {
    this._ascendingOrder = !this._ascendingOrder;
  }
  else {
    this._sortAttribute = clickAttribute;
  }
  this.doInitialDisplay();
};
  

/**
 * Called when the user types a character when editing a table cell. 
 *
 * Called from an HTML "input type='text'" element within an HTML "td"
 * table cell element on the generated page.  There is no need
 * to call this method directly.
 * 
 * @scope    public class method
 * @return   Returns true if the keyPress is a letter, or false if the keyPress is an arrow key or a key that moves the cursor to another cell. 
 */
TablePlugin.prototype.keyPressOnEditField = function (inEventObject, aTextView) {
  var eventObject = inEventObject;
  var asciiValueOfKey = eventObject.keyCode;
  var shiftKeyPressed = eventObject.shiftKey;
  
  var MOVE_LEFT = "left";
  var MOVE_UP = "up";
  var MOVE_RIGHT = "right";
  var MOVE_DOWN = "down";
  
  var move = null;
  switch (asciiValueOfKey) {
    case Util.ASCII_VALUE_FOR_LEFT_ARROW:
      move = MOVE_LEFT;
      break;
    case Util.ASCII_VALUE_FOR_UP_ARROW:
      move = MOVE_UP;
      break;
    case Util.ASCII_VALUE_FOR_RIGHT_ARROW:
      move = MOVE_RIGHT;
      break;
    case Util.ASCII_VALUE_FOR_DOWN_ARROW:
      move = MOVE_DOWN;
      break;
    case Util.ASCII_VALUE_FOR_RETURN:
      move = (shiftKeyPressed) ? MOVE_UP : MOVE_DOWN;
      break;
    case Util.ASCII_VALUE_FOR_TAB:
      move = (shiftKeyPressed) ? MOVE_LEFT : MOVE_RIGHT;
      break;
    default:
      move = null;
      break;
  }
  
  if (move) {
    Util.isNumber(this._numberOfColumns);
    Util.isArray(this._listOfItems);
    var cellElement = aTextView.getHTMLElement();
    var userHitReturnInLastRow = false;
    var shiftBy;
    var numCols = this._numberOfColumns;
    var numRows = this._listOfItems.length;
    if (this.isInEditMode()) {++numRows;} // to account for extra new provisional row
    var nextCell;
    var htmlRow = cellElement.parentNode;
    
    if (move == MOVE_LEFT || move == MOVE_RIGHT) {
      shiftBy = (move == MOVE_LEFT) ? -1 : 1;
      var nextColumnNumber = (cellElement.cellIndex + shiftBy);
      if (nextColumnNumber < 0) {
        nextColumnNumber = numCols-1;
      }
      else if (nextColumnNumber >= numCols) {
        nextColumnNumber = 0;
      }
      nextCell = htmlRow.cells[nextColumnNumber];
    }
    
    if (move == MOVE_UP || move == MOVE_DOWN) {
      shiftBy = (move == MOVE_UP) ? -1 : 1;
      var nextRowNumber = htmlRow.rowIndex + shiftBy;
      // rowNumber cannot be zero which is the header row
      if (nextRowNumber < 1) {
        nextRowNumber = numRows;
      }
      else if (nextRowNumber > numRows) {
        nextRowNumber = 1;
        userHitReturnInLastRow = true;
      }
      var nextRow = this.myTable.rows[nextRowNumber];
    nextCell = nextRow.cells[cellElement.cellIndex];
    }
    
    aTextView.stopEditing();
    var nextTextView = nextCell.or_textView;
    nextTextView.startEditing();
/*    if (userHitReturnInLastRow && tablePlugin.myNewItemCreatedFlag) {
      tablePlugin.myNewItemCreatedFlag = false;
      tablePlugin.refresh();
      tablePlugin.startEditingInCellForNewItemAtColumn(cellDelegate.myColumnNumber);
    } else {
      if (nextCell) {
        TablePlugin.startEditingInCell(nextCell);
      }
    } */
  }
  return !move;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
