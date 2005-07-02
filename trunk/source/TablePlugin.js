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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window, document, HTMLTableRowElement  */
/*global Util  */
/*global Item  */
/*global View, MultiEntriesView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
TablePlugin.UUID_FOR_PLUGIN_VIEW_TABLE = "00040301-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.registerPlugin(TablePlugin);


// -------------------------------------------------------------------
// TablePlugin public class constants
// -------------------------------------------------------------------
TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS = "0004010a-ce7f-11d9-8cd5-0011113ae5d6";
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
TablePlugin.prototype = new PluginView();  // makes TablePlugin be a subclass of View
function TablePlugin(inSectionView, inHTMLElement, inQuery, inLayout) {
  PluginView.call(this, inSectionView, inHTMLElement, inQuery, inLayout);

  // PENDING should probably make this independent of sectionview
  this._cssClass = SectionView.CSS_CLASS_SIMPLE_TABLE;
  this._cellClass = SectionView.CSS_CLASS_PLAIN;
  this._table = null;
  this._sortAttribute = null;
  this._ascendingOrder = true;
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin
 */
TablePlugin.getPluginItemUuid = function () {
  return TablePlugin.UUID_FOR_PLUGIN_VIEW_TABLE;
};


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the class of this instance.
 *
 * @scope    public instance method
 * @return   A JavaScript class. 
 */
TablePlugin.prototype.getClass = function () {
  return TablePlugin;
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
 * Creates an array containing all the attributes of the content items 
 * in this table.  Populates list of suggested items for relevant attributes
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildAttributes = function() {
  var repository = this.getWorld();
  var attrTableColumns = repository.getItemFromUuid(TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS);
  var entriesTableColumns = this._layout.getEntriesForAttribute(attrTableColumns);
  var displayAttrs = [];
  var anAttribute;
  if (entriesTableColumns.length > 0) {
    this._hashTableOfEntries = {};
    for (var i=0;i<entriesTableColumns.length;++i) {
      anAttribute = entriesTableColumns[i].getValue();
      Util.assert(anAttribute instanceof Item);
      displayAttrs.push(anAttribute);
      this._hashTableOfEntries[anAttribute.getUniqueKeyString()] =
        this.getWorld().getSuggestedItemsForAttribute(anAttribute);
    }
  }
  else {
    var hashTableOfAttributes = this._buildAttributeHashFromScratch();
    for (var key in hashTableOfAttributes) {
      anAttribute = hashTableOfAttributes[key];
      displayAttrs.push(anAttribute);
    }
  }
  this._displayAttributes = displayAttrs;
};


/**
 *
 */
TablePlugin.prototype._buildAttributeHashFromScratch = function() {
  // var PENDING__JUNE_1_EXPERIMENT_BY_BRIAN = true;
  var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
  var hashTableOfAttributes = {};
  var hashTableOfEntries = {};
  for (var iKey in this._listOfItems) {
    var contentItem = this._listOfItems[iKey];
    var listOfAttributesForItem = contentItem.getAttributes();
    for (var attributeKey in listOfAttributesForItem) {
      var attribute = listOfAttributesForItem[attributeKey];
      if (attribute != attributeCalledCategory) {
        var attributeKeyString = attribute.getUniqueKeyString();
        hashTableOfAttributes[attributeKeyString] = attribute;
        hashTableOfEntries[attributeKeyString] = this.getWorld().getSuggestedItemsForAttribute(attribute);
      }
    }
  }
  
  this._hashTableOfEntries = hashTableOfEntries;
  if (Util.lengthOfHashTable(hashTableOfAttributes) < 1) {
    var attributeCalledName = this.getWorld().getAttributeCalledName();
    var key = attributeCalledName.getUniqueKeyString();
    hashTableOfAttributes[key] = attributeCalledName;
  }
  return hashTableOfAttributes;
};


/**
 * Builds editor to add/remove attribute columns of table
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildAttributeEditor = function() {
  var htmlElement = this.getHTMLElement();
  View.createAndAppendElement(htmlElement, "br");
  var selectElt = View.createAndAppendElement(htmlElement, "select", RootView.CSS_CLASS_EDIT_TOOL);
  var listOfAttributes = this.getWorld().getAttributes();
  var optionElt = View.createAndAppendElement(selectElt, "option");
  optionElt.text = "Add new attribute:";
  for (var key in listOfAttributes) {
    var attribute = listOfAttributes[key];
    optionElt = View.createAndAppendElement(selectElt, "option");
    if (Util.isObjectInSet(attribute, this._displayAttributes)) {
      optionElt.text = '* ';
    }
    optionElt.text += attribute.getDisplayString();
    optionElt.value = attribute.getUniqueKeyString();
    optionElt.onclick = this._attributeEditorChanged.bindAsEventListener(this);
  }
  this._selectElement = selectElt;
  /*View.createAndAppendTextNode(htmlElement, " Import Data:");
  var importButton = View.createAndAppendElement(htmlElement,"input");
  importButton.type = "file";
  importButton.onchange = this._importData.bindAsEventListener(this, importButton);*/
};


/**
 * Inserts a table row at rowNum given contentItem
 *
 * @scope    private instance method
 */
TablePlugin.prototype._insertRow = function(contentItem, rowNum) {
  var aRow = this._table.insertRow(rowNum); 
  var columnCount = -1;
  for (var i=0;i<this._displayAttributes.length;++i) {
    var attribute = this._displayAttributes[i];
    this._insertCell(aRow, ++columnCount, contentItem, attribute);
  }
  return aRow;
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
    this._insertRow(contentItem, ++numRows);
  }  
  
  if (this.isInEditMode()) {
    // add one more row to allow users to add a new item to the table
    var observer = this; 
    // PENDING: 
    // no need to register an observer here, if we move code from
    // observedItemHasChanged() to _provisionalItemJustBecomeReal()
    var newItem = this.getWorld().newProvisionalItem(observer);
    this._insertRow(newItem, ++numRows, true);
  }
};



/**
 * This method will only ever be called by one of our MultiEntriesView 
 * subviews.  The MultiEntriesView will call this method during the 
 * transaction in which the first Entry for a provisional item is being
 * created, causing the provisional item to become "real".
 * 
 * @scope    package instance method
 * @param    item      The Item which just became real. 
 */
TablePlugin.prototype._provisionalItemJustBecomeReal = function(item) {
  this.getWorld().setItemToBeIncludedInQueryResultList(item, this.getQuerySpec());
};


/**
 * PENDING: 
 * This method observedItemHasChanged() was written back before we 
 * wrote the method above this one, _provisionalItemJustBecomeReal().
 * Now we've got things set up so that the EntryView will call
 * our _provisionalItemJustBecomeReal() method when the user first
 * makes a change that causes the provisional item to become real.
 * Now that we have _provisionalItemJustBecomeReal(), we might 
 * want to move all the code from observedItemHasChanged() over
 * into _provisionalItemJustBecomeReal(), and then we could get
 * rid of this method.  HOWEVER, moving the code might cause bugs,
 * because this observedItemHasChanged() method is probably 
 * called slightly later than the _provisionalItemJustBecomeReal()
 * method above.  The _provisionalItemJustBecomeReal() is called
 * DURING the transaction, whereas observedItemHasChanged() is,
 * in theory, called after the transaction.
 */
TablePlugin.prototype.observedItemHasChanged = function(item) {
  // called when a provisional item becomes a real item
  item.removeObserver(this); //now that provisional item is real, we stop observing it
  this._listOfItems.push(item); // moving this line affects code below
  
  // tell provisional item views they are no longer provisional
  var oldProvisionalRow = this._table.rows[this._listOfItems.length];
  for (var i=0; i < oldProvisionalRow.cells.length; ++i) {
    var aCell = oldProvisionalRow.cells[i];
    aCell.or_entriesView.noLongerProvisional();
  }

  // create new provisional item now that old one has become real
  var newItem = this.getWorld().newProvisionalItem(this);
  var aRow = this._insertRow(newItem, this._listOfItems.length+1, true);
};


/**
 * Constructs the table header 
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildHeader = function() {
  // add header row
  var headerRow = this._table.insertRow(0);
  var numCols = 0;
  for (var i=0; i<this._displayAttributes.length; ++i) {
    var attribute = this._displayAttributes[i];
    if (!this._sortAttribute) {this._sortAttribute = attribute;}
    var aCell = document.createElement("th");
    var headerString = attribute.getDisplayString();
    aCell.appendChild(document.createTextNode(headerString));
    if (this._sortAttribute == attribute) {
      aCell.appendChild(this.getSortIcon());
    }
    aCell.onclick = this.clickOnHeader.bindAsEventListener(this, attribute);
    
    headerRow.appendChild(aCell);
    ++numCols;
  }
  this._numberOfColumns = numCols;
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 * @param inDontRebuildHas, if true does not refetch query and rebuild attribute hash table
 * @scope    public instance method
 */
TablePlugin.prototype._buildTable = function(inDontRebuildHash) {
  // get list of items and attributes
  if (!inDontRebuildHash) {
    this.fetchItems();
    this._buildAttributes();
  }
  
  //create new table, remove old table if already exists
  View.removeChildrenOfElement(this.getHTMLElement());
  this._table = document.createElement("table");
  this._table.className = this._cssClass;
  
  this._buildHeader();

  // sort the list of items. SIDE EFFECT, table header needs to be built before items are sorted
  // because default _sortAttribute is specified there if not previously specificed
  var staticThis = this;
  this._listOfItems.sort(function(a,b) {return staticThis.compareItemByAttribute(a,b);}); // need to sort after header row added because default sort attribute is set there

  this._buildTableBody();
  
  this.getHTMLElement().appendChild(this._table);
  
  // if (this.isInEditMode()) {this._buildAttributeEditor();}
  this._buildAttributeEditor();
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TablePlugin.prototype.refresh = function () {
  // PENDING new table is constantly rebuilt currently
  // PENDING new content model with observable queries
  this._buildTable();
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
 * attribute. Each table cell is displayed with a EntryView object.  The HTML 
 * table cell links to the EntryView object with the attribute "or_entryView"
 *
 * @scope    public instance method
 * @return   An HTML image element
 */
TablePlugin.prototype._insertCell = function(row, col, item, attribute) {
  var aCell = row.insertCell(col);
  aCell.className = this._cellClass;
  var multiEntriesView = new MultiEntriesView(this, aCell, item, attribute, this._cellClass);
  aCell.or_entriesView = multiEntriesView;
  multiEntriesView.refresh();
  if (this.isInEditMode()) {
    multiEntriesView.setSuggestions(this._hashTableOfEntries[attribute.getUniqueKeyString()]);
    var listener = this;
    multiEntriesView.setKeyPressFunction(function (evt, entryView) {return listener.keyPressOnEditField(evt, entryView);});
    multiEntriesView.setClickFunction(function (evt, entryView) {return listener._handleClick(evt, entryView);});
  }
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
  this._buildTable();
};


/**
 * Called when the user clicks on table header. Resorts table accordingly.
 * 
 * @scope    public class method
 */
TablePlugin.prototype.selectRow = function (rowElement) {
  Util.assert(rowElement instanceof HTMLTableRowElement);
  if (rowElement != this._lastSelectedRow) {
    if (this._lastSelectedRow) {
      //this._lastSelectedRow.style.background = "";
      this._lastSelectedRow.className = "";
    }
    this._lastSelectedRow = rowElement;
    //rowElement.style.background = "rgb(100%,100%,0%)"; // PENDING: need to css-ify this selection
    rowElement.className = "selected"; 
    return true;
  }
  return false;
};
 

/**
 * 
 */
TablePlugin.prototype._importData = function (inEventObject, fileButton) {
  // Returns null if it can't do it, false if there's an error, or a string of the content if successful
/*  function mozillaLoadFile(filePath)
  {
      if(window.Components)
          try 
              {
              netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
              var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
              file.initWithPath(filePath);
              if (!file.exists())
                  return(null);
              var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
              inputStream.init(file, 0x01, 00004, null);
              var sInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
              sInputStream.init(inputStream);
              return(sInputStream.read(sInputStream.available()));
              }
          catch(e)
              {
              alert("Exception while attempting to load\n\n" + e);
              return(false);
              }
      return(null);
  }
  
  function readFile (fileName) {
      netscape.security.PrivilegeManager.enablePrivilege('UniversalFileRead');
      var bfr = new java.io.BufferedReader(new java.io.FileReader(fileName));
      var line;
      var content = '';
      while ((line = bfr.readLine()) != null)
        content += line + java.lang.System.getProperty('line.separator');
      return content;
    }*/
  window.open('file://'+fileButton.value,'preview');   
};


/**
 * Called when the user clicks on attribute editor item, either to add or remove attribute column
 * 
 * @scope    private class method
 */
TablePlugin.prototype._attributeEditorChanged = function (inEventObject) {
  var attributeUuid = inEventObject.target.value;
  if (attributeUuid) {
    var repository = this.getWorld();
    var attrTableColumns = repository.getItemFromUuid(TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS);
    var entriesTableColumns = this._layout.getEntriesForAttribute(attrTableColumns);
    var noStoredColumns = entriesTableColumns.length === 0;
    var changedAttribute = this.getWorld().getItemFromUuid(attributeUuid);
    var removeAttribute = Util.removeObjectFromSet(changedAttribute,this._displayAttributes);
    var typeCalledItem = repository.getTypeCalledItem();
    if (removeAttribute) {
      for (var i=0;i < entriesTableColumns.length;++i) {
        if (changedAttribute == entriesTableColumns[i].getValue()) {
          entriesTableColumns[i].voteToDelete();
          break;
        }
      }
      delete this._hashTableOfEntries[attributeUuid];
    }
    else {
      this._displayAttributes.push(changedAttribute);
      this._hashTableOfEntries[attributeUuid] = this.getWorld().getSuggestedItemsForAttribute(changedAttribute);
    }
    if (noStoredColumns) {
      for (i=0;i<this._displayAttributes.length;++i) {
        var anAttribute = this._displayAttributes[i];
        this._layout.addEntryForAttribute(attrTableColumns,anAttribute,typeCalledItem);
      }
    }
    else {
      this._layout.addEntryForAttribute(attrTableColumns,changedAttribute,typeCalledItem);
    }
    this._buildTable(true);
  }
};
 

/**
 * 
 */
TablePlugin.prototype._handleClick = function (inEventObject, anEntryView) {
  var rowElement = anEntryView.getSuperview().getHTMLElement().parentNode; // entryView -> multiEntriesView -> cellElment -> rowElement
  return this.selectRow(rowElement);
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
TablePlugin.prototype.keyPressOnEditField = function (inEventObject, anEntryView) {
  var eventObject = inEventObject;
  var asciiValueOfKey = eventObject.keyCode;
  var shiftKeyPressed = eventObject.shiftKey;
  
  var MOVE_LEFT = "left";
  var MOVE_UP = "up";
  var MOVE_RIGHT = "right";
  var MOVE_DOWN = "down";
  
  var move = null;
  switch (asciiValueOfKey) {
/*    case Util.ASCII_VALUE_FOR_LEFT_ARROW:
      move = MOVE_LEFT;
      break;*/
    case Util.ASCII_VALUE_FOR_UP_ARROW:
      move = MOVE_UP;
      break;
/*    case Util.ASCII_VALUE_FOR_RIGHT_ARROW:
      move = MOVE_RIGHT;
      break;*/
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
    
    // line below needs to be called here i.e. early because stopping an edit may change a provisional item
    // to become a "real" one thereby  creating new row for the next provisional item, e.g. this._listOfItems changes
    anEntryView.stopEditing();

    var cellElement = anEntryView.getSuperview().getHTMLElement(); // entryView's multiEntriesView's
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
      var nextRow = this._table.rows[nextRowNumber];
      this.selectRow(nextRow);
      nextCell = nextRow.cells[cellElement.cellIndex];
    }
    
    var nextMultiEntryView = nextCell.or_entriesView;
    nextMultiEntryView.select(move != MOVE_LEFT);
  }
  return !move;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
