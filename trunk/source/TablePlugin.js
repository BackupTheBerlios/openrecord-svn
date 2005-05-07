/*****************************************************************************
 TablePlugin.js
 
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
//   Stevedore.js
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
  * Comparison function to sort table
  */
TablePlugin.prototype.compareItemByAttribute = function (a,b) {
  Util.assert(this._sortAttribute != null);
  var strA = a.getSingleValueFromAttribute(this._sortAttribute).toLowerCase();
  var strB = b.getSingleValueFromAttribute(this._sortAttribute).toLowerCase();
  var ascendingInt = this._ascendingOrder ? -1 : 1;
  if (strA < strB) return ascendingInt;
  if (strA == strB) return 0;
  return -ascendingInt;
}

TablePlugin.prototype.fetchItems = function() {
  // PENDING: how do we know our superview responds to getthis._listOfItems()? 
  this._listOfItems = this.getSuperview().getListOfContentItems();
}

TablePlugin.prototype._buildAttributeHash = function() {
  // find the union of the attribute lists of all the content items
  var hashTableOfAttributesKeyedByUuid = {};
  var numCols = 0;
  for (var iKey in this._listOfItems) {
    contentItem = this._listOfItems[iKey];
    var listOfAttributesForItem = contentItem.getListOfAttributeUuids();
    for (var attributeKey in listOfAttributesForItem) {
      var attributeUuid = listOfAttributesForItem[attributeKey];
      if (attributeUuid != Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY) {
        hashTableOfAttributesKeyedByUuid[attributeUuid] = this.getStevedore().getItemFromUuid(attributeUuid);
      }
    }
    numCols++;
  }
  this._attributesKeyedByUuid = hashTableOfAttributesKeyedByUuid;
  this._numberOfColumns = numCols;
}

TablePlugin.prototype._buildTableCells = function() {  
  // add all the table body rows
  var numRows = 1; // start from 1 to account for header row
  for (var kKey in this._listOfItems) {
    var contentItem = this._listOfItems[kKey];
    var aRow = this.myTable.insertRow(numRows++); 
    var columnCount = 0;
    for (var lKey in this._attributesKeyedByUuid) {
      var attribute = this._attributesKeyedByUuid[lKey];
      this._insertCell(aRow,columnCount,contentItem,attribute);
      columnCount += 1;
    }
  }  
}

TablePlugin.prototype._buildHeader = function() {
  // add header row
  var headerRow = this.myTable.insertRow(0);
  for (var jKey in this._attributesKeyedByUuid) {
    var attribute = this._attributesKeyedByUuid[jKey];
    if (!this._sortAttribute) this._sortAttribute = attribute;
    var aCell = document.createElement("th");
    var headerStr = attribute.getDisplayName();
    aCell.appendChild(document.createTextNode(headerStr));
    if (this._sortAttribute == attribute)
      aCell.appendChild(this.getSortIcon());
    aCell.onclick = this.clickOnHeader.bindAsEventListener(this, attribute);
    
    headerRow.appendChild(aCell);
  }
}

TablePlugin.prototype.doInitialDisplay = function() {
  // get list of items and attributes
  this.fetchItems();
  this._buildAttributeHash()
  
  //create new table, remove old table if already exists
  if (this.myTable != null)
    this._myHTMLElement.removeChild(this.myTable);
  this.myTable = document.createElement("table");
  this.myTable.className = this.myClass;
  
  this._buildHeader();

  // sort the list of items. SIDE EFFECT, table header needs to be built before items are sorted
  // because default _sortAttribute is specified there if not previously specificed
  var staticThis = this;
  this._listOfItems.sort(function(a,b) {return staticThis.compareItemByAttribute(a,b);}); // need to sort after header row added because default sort attribute is set there

  this._buildTableCells();
  
  this._myHTMLElement.appendChild(this.myTable);
}

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
  * returns the right image name for the header column that is being sorted
  */
TablePlugin.prototype.getSortIcon = function () {
  var imageName = this._ascendingOrder ? TablePlugin.ASCENDING_GIF : TablePlugin.DESCENDING_GIF;
  var image =  Util.getImage(imageName);
  image.align = "middle";
  return image;
}

TablePlugin.prototype._insertCell = function(row, col, item, attribute, keyFunc) {
  var aCell = row.insertCell(col);
  aCell.className = this.myCellClass;
  var aTextView = new TextView(this, aCell, item, attribute, this.myCellClass);
  aTextView.refresh();
  aCell.or_textView = aTextView;
  if (this.isInEditMode())
    aCell.onkeypress = this.keyPressOnEditField.bindAsEventListener(this, aTextView);
}

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
  };
  this.doInitialDisplay();
}
  
  
// FOLLOWING methods are no longer used

/**
 * Called when the user clicks on a table cell.
 * 
 * Called from an HTML "td" element on the generated page.  There is no need
 * to call this method directly.
 *
 * @scope    public class method
 */
TablePlugin.clickOnCell = function (inEventObject) {
  var eventObject = inEventObject;
  if (!eventObject) { eventObject = window.event; } 
  // PENDING: try this instead: var eventObject = inEventObject || window.event;
  
  var htmlElement = Util.getTargetFromEvent(eventObject);
  // PENDING: We could replace the two lines above with "var htmlElement = this;"
  // That would work fine in Firefox, but maybe it wouldn't work in other browsers?

  var currentEditField = document.getElementById(TablePlugin.ELEMENT_ID_CURRENT_EDIT_FIELD);
  if (currentEditField && (currentEditField == htmlElement)) {
    // another click in the cell we're already editing -- just ignore it
    return; 
  }
  TablePlugin.leaveEditField();
  TablePlugin.startEditingInCell(htmlElement);
};


/**
 * Called when the user first moves the cursor into one of the cells of
 * the bottom table row, which is the row used for creating new items.
 * 
 * @scope    public instance method
 * @param    inColumnNumber    An integer column number, telling which column to start editing in. 
 */
TablePlugin.prototype.startEditingInCellForNewItemAtColumn = function (inColumnNumber) {
  var rowForNewItemEntry = this.myNumRows - 1;
  var rowDelegateForNewItemEntry = this.myArrayOfRowDelegates[rowForNewItemEntry];
  var cellDelegate = rowDelegateForNewItemEntry.myArrayOfCellDelegates[inColumnNumber];
  var nextCell = document.getElementById(cellDelegate.myCellElementId);
  TablePlugin.startEditingInCell(nextCell);
};


/**
 * Given an HTML table cell element, adds a text field inside the
 * table cell, so the user can edit the cell.
 * 
 * @scope    public class method
 * @param    inCellElement    An HTMLTableCellElement. 
 */
TablePlugin.startEditingInCell = function (inCellElement) {
  Util.assert(inCellElement instanceof HTMLTableCellElement);

  var initialEditValue = inCellElement.innerHTML.replace(/"/g, "&quot");
  var editFieldString = "<input type=\"text\" class=\"" + SectionView.ELEMENT_CLASS_TEXT_FIELD_IN_TABLE_CELL + "\" id=\"" + TablePlugin.ELEMENT_ID_CURRENT_EDIT_FIELD + "\" value=\"" + initialEditValue + "\" size=\"1\"></input>";
  inCellElement.innerHTML = editFieldString;
  inCellElement.className = SectionView.ELEMENT_CLASS_SELECTED + " " + inCellElement.className;
  // var listener = this; 
  // Util.addEventListener(editField, "blur", function(event) {listener.onBlur(event);});
      
  var newEditField = document.getElementById(TablePlugin.ELEMENT_ID_CURRENT_EDIT_FIELD);
  newEditField.onkeypress = TablePlugin.keyPressOnEditField;
  newEditField.select();
  newEditField.focus();
};


/**
 * Called when the user is done editing a table cell. 
 *
 * @scope    public class method
 */
TablePlugin.leaveEditField = function () {
  var currentEditField = document.getElementById(TablePlugin.ELEMENT_ID_CURRENT_EDIT_FIELD);

  if (currentEditField) {
    var newValueString = currentEditField.value;
    var cellElement = currentEditField.parentNode;
    var cellDelegate = cellElement.mydelegate;

    // find the content item for this cell, and set the attribute to the new cell value
    var contentItem = cellDelegate.myRowDelegate.myContentItem;
    if (!contentItem) {
      var sectionView = cellDelegate.myTablePlugin.getSuperview();
      var stevedore = sectionView.getStevedore();
      contentItem = stevedore.newItem(); 
      cellDelegate.myTablePlugin.myNewItemCreatedFlag = true;
      cellDelegate.myRowDelegate.myContentItem = contentItem;
      var queryList = sectionView.mySection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY);
      if (queryList) {
        var query = queryList[0];
        // PENDING: We should NOT get a value from the item's PRIVATE _myStevedore property
        contentItem._myStevedore.setItemToBeIncludedInQueryResultList(contentItem, query);
      }
    }
    var attribute = cellDelegate.myAttribute;
    var valueList = contentItem.getValueListFromAttribute(attribute);
    var oldValueString = "";
    if (valueList) {
      oldValueString = SectionView.getStringForValue(valueList[0]);
    }
    if (oldValueString != newValueString) {
      contentItem.clear(attribute);
      contentItem.assign(attribute, newValueString);
    }
    
    // remove the edit field from the cell, and replace it with the new cell value
    valueList = contentItem.getValueListFromAttribute(attribute);
    newValueString = "";
    if (valueList) {
      newValueString = SectionView.getStringForValue(valueList[0]);
    } 
    cellElement.innerHTML = newValueString;
    var regularExpression = new RegExp(SectionView.ELEMENT_CLASS_SELECTED, "i");
    cellElement.className = cellElement.className.replace(regularExpression, "");    
  }
};


/**
 * Called when the user types a character when editing a table cell. 
 *
 * Called from an HTML "input type='text'" element within an HTML "td"
 * table cell element on the generated page.  There is no need
 * to call this method directly.
 * 
 * @scope    public class method
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
    var cellElement = aTextView.getHTMLElement();
    var userHitReturnInLastRow = false;
    var shiftBy;
    var numCols = this._numberOfColumns;
    var numRows = this._listOfItems.length;
    var nextCell;
    var htmlRow = cellElement.parentNode;
    
    if (move == MOVE_LEFT || move == MOVE_RIGHT) {
      shiftBy = (move == MOVE_LEFT) ? -1 : 1;
      var nextColumnNumber = cellElement.cellIndex + shiftBy;
      // PENDING: We should be able to do this in one line, using a modulo operator
      if (nextColumnNumber < 0) {
        nextColumnNumber = (numCols - 1);
      }
      if (nextColumnNumber >= numCols) {
        nextColumnNumber = 0;
      }
      nextCell = htmlRow.cells[nextColumnNumber];
    }
    
    if (move == MOVE_UP || move == MOVE_DOWN) {
      shiftBy = (move == MOVE_UP) ? -1 : 1;
      var nextRowNumber = htmlRow.rowIndex + shiftBy;
      if (nextRowNumber < 1) {
        nextRowNumber = numRows;
      }
      if (nextRowNumber > numRows) {
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
