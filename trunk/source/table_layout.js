/*****************************************************************************
 table_layout.js
 
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
//   repository.js
//   section_view.js
//   page_view.js
//   util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this layout type in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[SectionView.LAYOUT_TABLE] = TableLayout;


// -------------------------------------------------------------------
// TableLayout public class constants
// -------------------------------------------------------------------
TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD = "current_edit_field";


/**
 * When the TableLayout creates an HTML table, it sets up each HTML "td" table 
 * cell element in the table to point to a corresponding CellDelegate instance.
 *
 * PROBLEM: This CellDelegate class should be privately owned by the
 * TableLayout class.
 *
 * @scope    public instance constructor
 */
function _CellDelegate(inRowDelegate, inCellElementId, inCellCount, inColumnNumber, inAttribute, inTableLayout) {
  Util.assert(inRowDelegate instanceof _RowDelegate);
  Util.assert(inAttribute instanceof Item);
  Util.assert(inTableLayout instanceof TableLayout);

  this.myRowDelegate = inRowDelegate;
  this.myCellElementId = inCellElementId;
  this.myCellCount = inCellCount;
  this.myColumnNumber = inColumnNumber;
  this.myAttribute = inAttribute;
  this.myTableLayout = inTableLayout;
}


/**
 * When the TableLayout creates an HTML table, it sets up each HTML "tr" table
 * row element in the table to point to a corresponding RowDelegate instance.
 *
 * PROBLEM: This RowDelegate class should be privately owned by the
 * TableLayout class.
 *
 * @scope    public instance constructor
 */
function _RowDelegate(inContentItem, inRowNumber) {
  Util.assert((inContentItem == null) || (inContentItem instanceof Item));

  this.myContentItem = inContentItem;
  this.myRowNumber = inRowNumber;
  this.myArrayOfCellDelegates = new Array();
}


/**
 * The TableLayout class knows how to display a Section of a Page as an
 * HTML table.
 *
 * @scope    public instance constructor
 * @param    inSectionView    The SectionView that this TableLayout will appears in. 
 */
function TableLayout(inSectionView) {
  Util.assert(inSectionView instanceof SectionView);

  this.mySectionView = inSectionView;
  this.myDivElement = null;
  this.myNumColumns = null;
  this.myNumRows = null;
  this.myArrayOfRowDelegates = new Array();
  this.myNewItemCreatedFlag = false;
}


/**
 * Returns a string with the display name for this type of layout.
 *
 * @scope    public instance method
 * @return   A String with a display name for this type of layout. 
 */
TableLayout.prototype.getLayoutName = function () {
  return SectionView.LAYOUT_TABLE;
};

  
/**
 * Gives the TableLayout a place on the page to put HTML code, allowing
 * the TableLayout to display itself.
 *
 * @scope    public instance method
 * @param    inDivElement    The HTMLDivElement that this layout should display itself in. 
 */
TableLayout.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);

  this.myDivElement = inDivElement;
  this.display();
};


/**
 * Re-creates all the HTML for the TableLayout, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TableLayout.prototype.display = function () {
  var listOfStrings = [];
  var hashTableOfAttributesKeyedByUuid = {};
  var hashTableOfCellDelegatesKeyedByElementId = {};
  var attribute = null;
  var attributeUuid = null;
  var contentItem = null;
  var columnCount = 0;
  
  // find the union of the attribute lists of all the content items
  var listOfContentItems = this.mySectionView.getListOfContentItems();
  for (var iKey in listOfContentItems) {
    contentItem = listOfContentItems[iKey];
    var listOfAttributesForItem = contentItem.getListOfAttributeUuids();
    for (var attributeKey in listOfAttributesForItem) {
      attributeUuid = listOfAttributesForItem[attributeKey];
      if (attributeUuid != Stevedore.UUID_FOR_ATTRIBUTE_CATEGORY) {
        hashTableOfAttributesKeyedByUuid[attributeUuid] = this.mySectionView.getStevedore().getItemFromUuid(attributeUuid);
      }
    }
  }

  // add the table header row
  listOfStrings.push("<table class=\"" + SectionView.ELEMENT_CLASS_SIMPLE_TABLE + "\">");
  listOfStrings.push("<tr>");
  this.myNumColumns = 0;
  for (var jKey in hashTableOfAttributesKeyedByUuid) {
    attribute = hashTableOfAttributesKeyedByUuid[jKey];
    this.myNumColumns += 1;
    listOfStrings.push("<th>" + attribute.getDisplayName() + "</th>");
  }
  listOfStrings.push("</tr>");
  
  // add all the table body rows
  var cellCount = 0;
  var cellIdPrefix = this.mySectionView.myDivElement.id + SectionView.ELEMENT_ID_CELL_MIDFIX;
  var cellId = "";
  this.myNumRows = 0;
  for (var kKey in listOfContentItems) {
    contentItem = listOfContentItems[kKey];
    listOfStrings.push("<tr>");
    var rowDelegate = new _RowDelegate(contentItem, this.myNumRows);
    this.myArrayOfRowDelegates[this.myNumRows] = rowDelegate;
    this.myNumRows += 1;
    columnCount = 0;
    for (var lKey in hashTableOfAttributesKeyedByUuid) {
      attribute = hashTableOfAttributesKeyedByUuid[lKey];
      cellCount += 1;
      cellId = cellIdPrefix + cellCount;
      var valueList = contentItem.getValueListFromAttribute(attribute);
      var string = "";
      if (valueList) {
        string = SectionView.getStringForValue(valueList[0]);
      }
      if (this.mySectionView.myPageView.isInEditMode()) {
        listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_PLAIN + "\" id=\"" + cellId + "\" " + SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER + "=\"" + this.mySectionView.mySectionNumber + "\" " + SectionView.ELEMENT_ATTRIBUTE_CELL_NUMBER + "=\"" + cellCount + "\" onclick=\"TableLayout.clickOnCell(event)\">" + string + "</td>");
        var cellDelegate = new _CellDelegate(rowDelegate, cellId, cellCount, columnCount, attribute, this);
        rowDelegate.myArrayOfCellDelegates[columnCount] = cellDelegate;
        hashTableOfCellDelegatesKeyedByElementId[cellId] = cellDelegate;
      } else {
        // if (columnCount == 0) {
        //   string = "<a href=\"" + CompleteView.URL_HASH_ITEM_PREFIX + contentItem.getUuid() + "\" onclick=\"CompleteView.clickOnLocalLink(event)\">" + string + "</a>";
        // }
        listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_PLAIN + "\">" + string + "</td>");
      }
      columnCount += 1;
    }
    listOfStrings.push("</tr>");
  }  

  // if we're in edit mode, add a row at the bottom of the table for entering new items
  var firstCell = true;
  var lastRowDelegate = new _RowDelegate(null, this.myNumRows);
  this.myArrayOfRowDelegates[this.myNumRows] = lastRowDelegate;
  this.myNumRows += 1;
  if (this.mySectionView.myPageView.isInEditMode()) {
    listOfStrings.push("<tr>");
    columnCount = 0;
    for (var mKey in hashTableOfAttributesKeyedByUuid) {
      attribute = hashTableOfAttributesKeyedByUuid[mKey];
      var contentString = (firstCell) ? "&gt;" : "";
      firstCell = false;
      cellCount += 1;
      cellId = cellIdPrefix + cellCount;
      listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_NEW_ITEM + "\" id=\"" + cellId + "\" " + SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER + "=\"" + this.mySectionView.mySectionNumber + "\" " + SectionView.ELEMENT_ATTRIBUTE_CELL_NUMBER + "=\"" + cellCount + "\" onclick=\"TableLayout.clickOnCell(event)\">" + contentString + "</td>");
      var lastRowCellDelegate = new _CellDelegate(lastRowDelegate, cellId, cellCount, columnCount, attribute, this);
      lastRowDelegate.myArrayOfCellDelegates[columnCount] = lastRowCellDelegate;
      hashTableOfCellDelegatesKeyedByElementId[cellId] = lastRowCellDelegate;
      columnCount += 1;
    }
    listOfStrings.push("</tr>");
  }


  listOfStrings.push("</table>");
  
  // write out all the new content   
  var finalString = listOfStrings.join("");
  this.myDivElement.innerHTML = finalString;
  
  // attach back-pointers to the newly created UI elements
  for (var elementId in hashTableOfCellDelegatesKeyedByElementId) {
    var aCellDelegate = hashTableOfCellDelegatesKeyedByElementId[elementId];
    var cellElement = document.getElementById(elementId);
    cellElement.mydelegate = aCellDelegate;
  }
};
  

/**
 * Called when the user clicks on a table cell.
 * 
 * Called from an HTML "td" element on the generated page.  There is no need
 * to call this method directly.
 *
 * @scope    public class method
 */
TableLayout.clickOnCell = function (inEventObject) {
  var eventObject = inEventObject;
  if (!eventObject) { eventObject = window.event; } 
  // PROBLEM: try this instead: var eventObject = inEventObject || window.event;
  
  var htmlElement = Util.getTargetFromEvent(eventObject);
  // PROBLEM: We could replace the two lines above with "var htmlElement = this;"
  // That would work fine in Firefox, but maybe it wouldn't work in other browsers?

  var currentEditField = document.getElementById(TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD);
  if (currentEditField && (currentEditField == htmlElement)) {
    // another click in the cell we're already editing -- just ignore it
    return; 
  }
  TableLayout.leaveEditField();
  TableLayout.startEditingInCell(htmlElement);
};


/**
 * Called when the user first moves the cursor into one of the cells of
 * the bottom table row, which is the row used for creating new items.
 * 
 * @scope    public instance method
 * @param    inColumnNumber    An integer column number, telling which column to start editing in. 
 */
TableLayout.prototype.startEditingInCellForNewItemAtColumn = function (inColumnNumber) {
  var rowForNewItemEntry = this.myNumRows - 1;
  var rowDelegateForNewItemEntry = this.myArrayOfRowDelegates[rowForNewItemEntry];
  var cellDelegate = rowDelegateForNewItemEntry.myArrayOfCellDelegates[inColumnNumber];
  var nextCell = document.getElementById(cellDelegate.myCellElementId);
  TableLayout.startEditingInCell(nextCell);
};


/**
 * Given an HTML table cell element, adds a text field inside the
 * table cell, so the user can edit the cell.
 * 
 * @scope    public class method
 * @param    inCellElement    An HTMLTableCellElement. 
 */
TableLayout.startEditingInCell = function (inCellElement) {
  Util.assert(inCellElement instanceof HTMLTableCellElement);

  var initialEditValue = inCellElement.innerHTML.replace(/"/g, "&quot");
  var editFieldString = "<input type=\"text\" class=\"" + SectionView.ELEMENT_CLASS_TEXT_FIELD_IN_TABLE_CELL + "\" id=\"" + TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD + "\" value=\"" + initialEditValue + "\" size=\"1\"></input>";
  inCellElement.innerHTML = editFieldString;
  inCellElement.className = SectionView.ELEMENT_CLASS_SELECTED + " " + inCellElement.className;
  
  var newEditField = document.getElementById(TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD);
  newEditField.onkeypress = TableLayout.keyPressOnEditField;
  newEditField.select();
  newEditField.focus();
};


/**
 * Called when the user is done editing a table cell. 
 *
 * @scope    public class method
 */
TableLayout.leaveEditField = function () {
  var currentEditField = document.getElementById(TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD);

  if (currentEditField) {
    var newValueString = currentEditField.value;
    var cellElement = currentEditField.parentNode;
    var cellDelegate = cellElement.mydelegate;

    // find the content item for this cell, and set the attribute to the new cell value
    var contentItem = cellDelegate.myRowDelegate.myContentItem;
    if (!contentItem) {
      var sectionView = cellDelegate.myTableLayout.mySectionView;
      var stevedore = sectionView.getStevedore();
      contentItem = stevedore.newItem(); 
      cellDelegate.myTableLayout.myNewItemCreatedFlag = true;
      cellDelegate.myRowDelegate.myContentItem = contentItem;
      var queryList = sectionView.mySection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY);
      if (queryList) {
        var query = queryList[0];
        // PROBLEM: We should NOT get a value from the item's PRIVATE _myStevedore property
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
TableLayout.keyPressOnEditField = function (inEventObject) {
  var eventObject = inEventObject;
  if (!eventObject) { eventObject = window.event; }
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
    var currentEditField = document.getElementById(TableLayout.ELEMENT_ID_CURRENT_EDIT_FIELD);
    Util.assert(currentEditField == Util.getTargetFromEvent(eventObject));

    var cellElement = currentEditField.parentNode;
    var cellDelegate = cellElement.mydelegate;
    var tableLayout = cellDelegate.myTableLayout;
    var sectionView = tableLayout.mySectionView;
    var userHitReturnInLastRow = false;
    var nextCellDelegate = null;
    var shiftBy;
    
    if (move == MOVE_LEFT || move == MOVE_RIGHT) {
      shiftBy = (move == MOVE_LEFT) ? -1 : 1;
      var nextColumnNumber = cellDelegate.myColumnNumber + shiftBy;
      // PROBLEM: We should be able to do this in one line, using a modulo operator
      if (nextColumnNumber < 0) {
        nextColumnNumber = (tableLayout.myNumColumns - 1);
      }
      if (nextColumnNumber >= tableLayout.myNumColumns) {
        nextColumnNumber = 0;
      }
      nextCellDelegate = cellDelegate.myRowDelegate.myArrayOfCellDelegates[nextColumnNumber];
    }
    
    if (move == MOVE_UP || move == MOVE_DOWN) {
      shiftBy = (move == MOVE_UP) ? -1 : 1;
      var nextRowNumber = cellDelegate.myRowDelegate.myRowNumber + shiftBy;
      if (nextRowNumber < 0) {
        nextRowNumber = (tableLayout.myNumRows - 1);
      }
      if (nextRowNumber >= tableLayout.myNumRows) {
        nextRowNumber = 0;
        userHitReturnInLastRow = true;
      }
      var nextRowDelegate = tableLayout.myArrayOfRowDelegates[nextRowNumber];
      nextCellDelegate = nextRowDelegate.myArrayOfCellDelegates[cellDelegate.myColumnNumber];
    }
    
    var nextCellId = nextCellDelegate.myCellElementId;    
    var nextCell = document.getElementById(nextCellId);
    TableLayout.leaveEditField();
    if (userHitReturnInLastRow && tableLayout.myNewItemCreatedFlag) {
      tableLayout.myNewItemCreatedFlag = false;
      tableLayout.display();
      tableLayout.startEditingInCellForNewItemAtColumn(cellDelegate.myColumnNumber);
    } else {
      if (nextCell) {
        TableLayout.startEditingInCell(nextCell);
      }
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
