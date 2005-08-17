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
/*global Draggable, Droppables,  */
/*global Util  */
/*global Item  */
/*global CsvParser  */
/*global View, MultiEntriesView, EntryView, RootView  */
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
TablePlugin.ASCENDING_GIF = "ascending.png";
TablePlugin.DESCENDING_GIF = "descending.png";


/**
 * The TablePlugin class knows how to display a Section of a Page as an
 * HTML table.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???. 
 */
TablePlugin.prototype = new PluginView();  // makes TablePlugin be a subclass of PluginView
function TablePlugin(superview, htmlElement, querySpec, layoutItem) {
  PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "TablePlugin");

  // PENDING should probably make this independent of sectionview
  this._cssClassForTable = SectionView.CSS_CLASS_SIMPLE_TABLE;
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
TablePlugin.getPluginItemUuid = function() {
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
TablePlugin.prototype.getClass = function() {
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
TablePlugin.prototype.compareItemsBySortAttribute = function(itemA, itemB) {
  Util.assert(this._sortAttribute !== null);
  var strA = itemA.getSingleStringValueFromAttribute(this._sortAttribute).toLowerCase();
  var strB = itemB.getSingleStringValueFromAttribute(this._sortAttribute).toLowerCase();
  var ascendingInt = this._ascendingOrder ? -1 : 1;
  if (strA < strB) {return ascendingInt;}
  if (strA == strB) {return 0;}
  return -ascendingInt;
};


/**
 * Returns a list of all the attributes that this table should have columns for.
 *
 * @scope    private instance method
 */
TablePlugin.prototype._getListOfColumns = function() {
  var world = this.getWorld();
  var attributeTableColumns = world.getItemFromUuid(TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS);
  var listOfTableColumnEntries = this._layout.getEntriesForAttribute(attributeTableColumns);
  var displayAttributes = [];
  var anAttribute;
  if (listOfTableColumnEntries.length > 0) {
    // If we get here, it means this table has a saved list of user-selected
    // columns, and we just want to use that list.
    for (var i in listOfTableColumnEntries) {
      anAttribute = listOfTableColumnEntries[i].getValue();
      Util.assert(anAttribute instanceof Item);
      displayAttributes.push(anAttribute);
    }
    /*
    var PENDING_debug = false;
    if (PENDING_debug) {
      var string = "";
      for (i in listOfTableColumnEntries) {
        string += listOfTableColumnEntries[i]._getUuid() + '\n';
      }
      alert(listOfTableColumnEntries.length + " columns\n" + string);
    }
    */
  } else {
    // If we get here, it means this table did not have a saved list of 
    // user-selected columns, so we need to come up with a list.
    // We will build a list of display attributes by looking at all the items in 
    // the table and finding the union of all the attributes of those items.
    var attributeCalledCategory = this.getWorld().getAttributeCalledCategory();
    var hashTableOfAttributes = {};
    for (var j in this._listOfItems) {
      var contentItem = this._listOfItems[j];
      var listOfAttributesForItem = contentItem.getAttributes();
      for (var k in listOfAttributesForItem) {
        var attribute = listOfAttributesForItem[k];
        if (attribute != attributeCalledCategory) {
          var attributeKeyString = attribute.getUniqueKeyString();
          hashTableOfAttributes[attributeKeyString] = attribute;
        }
      }
    }
    
    if (Util.lengthOfHashTable(hashTableOfAttributes) < 1) {
      // If we have not yet identified any display attributes to use as
      // column headers, then we'll just use the "Name" attribute so that
      // our table will have at least one column.
      var attributeCalledName = this.getWorld().getAttributeCalledName();
      var keyString = attributeCalledName.getUniqueKeyString();
      hashTableOfAttributes[keyString] = attributeCalledName;
    }
    for (var key in hashTableOfAttributes) {
      anAttribute = hashTableOfAttributes[key];
      displayAttributes.push(anAttribute);
    }
  }
  return displayAttributes;
};


/**
 * Builds editor to add/remove attribute columns of table.
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildAttributeEditor = function() {
  var htmlElement = this.getHtmlElement();
  var selectElt = View.appendNewElement(htmlElement, "select", RootView.CSS_CLASS_EDIT_TOOL);
  var listOfAttributes = this.getWorld().getAttributes();
  var optionElt = View.appendNewElement(selectElt, "option");
  optionElt.text = "Add new attribute:";
  for (var key in listOfAttributes) {
    var attribute = listOfAttributes[key];
    optionElt = View.appendNewElement(selectElt, "option");
    if (Util.isObjectInSet(attribute, this._displayAttributes)) {
      optionElt.text = '* ';
    }
    optionElt.text += attribute.getDisplayString();
    optionElt.value = attribute.getUniqueKeyString();
    optionElt.onclick = this._attributeEditorChanged.bindAsEventListener(this);
  }
  this._selectElement = selectElt;
  
};

/**
 * Builds UI widgets to let the user import a CSV data file into the table.
 *
 * @scope    private instance method
 */
TablePlugin.prototype._buildFileImportTool = function() {
  var htmlElement = this.getHtmlElement();
  if (window.location.protocol == "file:") {
    var importDiv = View.appendNewElement(htmlElement, "div", RootView.CSS_CLASS_EDIT_TOOL);
    View.appendNewTextNode(importDiv, " Import Data:");
    var importButton = View.appendNewElement(importDiv, "input");
    importButton.type = "file";
    importButton.onchange = this._importData.bindAsEventListener(this, importButton);
  }
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
 *
 */
TablePlugin.prototype._handleDrop = function(elementThatWasDragged, droppableObject) {
  // First figure out what column header was dropped where
  var world = this.getWorld();
  var draggedUuid = elementThatWasDragged.getAttribute('uuid');
  var draggedAttribute = world.getItemFromUuid(draggedUuid);
  var headerCellElement = droppableObject.element;
  var headerCellUuid = headerCellElement.getAttribute('uuid');
  var droppedOnAttribute = world.getItemFromUuid(headerCellUuid);
  var indexOfDraggedAttribute = Util.getArrayIndex(this._displayAttributes, draggedAttribute);
  var indexOfDroppedOnAttribute = Util.getArrayIndex(this._displayAttributes, droppedOnAttribute);

  // If the user dragged a column header and dropped it on the same column 
  // header, then we don't need to change the column order.
  if (indexOfDraggedAttribute == indexOfDroppedOnAttribute) {
    return;
  }

  // This is a little hack that accesses instance variables of the "Draggable"
  // object in the script.aculo.us dragdrop.js library.
  // We set "revert" to false to prevent the UI animation where the dragged 
  // column header goes "flying" home again
  var draggable = elementThatWasDragged.or_draggable;
  draggable.options.revert = false;

  // Now we need to save the new column order to the repository.
  var attributeTableColumns = world.getItemFromUuid(TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS);
  var listOfTableColumnEntries = this._layout.getEntriesForAttribute(attributeTableColumns);
  if (listOfTableColumnEntries.length > 0) {
    // If we get here, it means this table has a saved list of user-selected
    // columns, and we just want to re-order that list.
    Util.assert(this._displayAttributes.length == listOfTableColumnEntries.length);
    var draggedEntry = listOfTableColumnEntries[indexOfDraggedAttribute];
    var droppedOnEntry = listOfTableColumnEntries[indexOfDroppedOnAttribute];
    if (indexOfDraggedAttribute > indexOfDroppedOnAttribute) {
      // the user dragged the column to the left
      var entryBeforeDroppedOnEntry = null;
      if (indexOfDroppedOnAttribute > 0) {
        entryBeforeDroppedOnEntry = listOfTableColumnEntries[indexOfDroppedOnAttribute-1];
      }
      draggedEntry.reorderBetween(entryBeforeDroppedOnEntry, droppedOnEntry);
    }
    if (indexOfDraggedAttribute < indexOfDroppedOnAttribute) {
      // the user dragged the column to the right
      var entryAfterDroppedOnEntry = null;
      if (indexOfDroppedOnAttribute < (listOfTableColumnEntries.length - 1)) {
        entryAfterDroppedOnEntry = listOfTableColumnEntries[indexOfDroppedOnAttribute+1];
      }
      draggedEntry.reorderBetween(droppedOnEntry, entryAfterDroppedOnEntry);
    }
  } else {
    // If we get here, it means we need to save a newly created list of
    // user-selected columns.
    this._displayAttributes.splice(indexOfDraggedAttribute, 1);
    if (indexOfDraggedAttribute > indexOfDroppedOnAttribute) {
      // the user dragged the column to the left
      this._displayAttributes.splice(indexOfDroppedOnAttribute, 0, draggedAttribute);
    }
    if (indexOfDraggedAttribute < indexOfDroppedOnAttribute) {
      // the user dragged the column to the right
      this._displayAttributes.splice(indexOfDroppedOnAttribute, 0, draggedAttribute);
    }
    world.beginTransaction();
    // alertString = "";
    for (var i in this._displayAttributes) {
      var attribute = this._displayAttributes[i];
      this._layout.addEntryForAttribute(attributeTableColumns, attribute);
      // alertString += attribute.getDisplayString() + '\n';
    }
    // alert(alertString);
    world.endTransaction();
  }
  this.refresh();
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
  for (var i in this._displayAttributes) {
    var attribute = this._displayAttributes[i];
    if (!this._sortAttribute) {this._sortAttribute = attribute;}
    var headerCell = View.appendNewElement(headerRow, "th", null, {uuid: attribute._getUuid()});
    var headerCellContentSpan = View.appendNewElement(headerCell, "span", "headerCellContentSpan", {uuid: attribute._getUuid()});
    var textSpan = View.appendNewElement(headerCellContentSpan, "span", null, null, attribute.getDisplayString());
    if (this._sortAttribute == attribute) {
      headerCellContentSpan.appendChild(this.getSortIcon());
    }
    Event.observe(headerCell, "click", this.clickOnHeader.bindAsEventListener(this, attribute));
    if (this.isInEditMode()) {
      var listener = this;
      var draggable = new Draggable(headerCellContentSpan, {revert:true});
      headerCellContentSpan.or_draggable = draggable;
      Droppables.add(headerCell, {
        accept: "headerCellContentSpan",
        hoverclass: 'drophover',
        onDrop: function(element, droppableObject) {listener._handleDrop(element, droppableObject);}});   
    }
    ++numCols;
  }
  this._numberOfColumns = numCols;
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @param    doNotRebuildHash    If true, this method does not refetch query and rebuild attribute hash table
 * @scope    public instance method
 */
TablePlugin.prototype._buildTable = function(doNotRebuildHash) {
  // get list of items and attributes
  if (!doNotRebuildHash) {
    this.fetchItems();
    this._displayAttributes = this._getListOfColumns();
  }
 
  //create new table, remove old table if already exists
  var viewDivElement = this.getHtmlElement();
  View.removeChildrenOfElement(viewDivElement);
  this._buildAttributeEditor();
  
  // We could do use View.appendNewElement() here, but we seem to get a 20%
  // speed improvement by instead using View.newElement() and then making our 
  // own call to viewDivElement.appendChild(this._table) 10 lines further down.
  // If there is a real 20% speed-up, it's probably because we prevent the 
  // browser from trying to re-render the table until we call appendChild()
  // 
  // this._table = View.appendNewElement(viewDivElement, "table", this._cssClassForTable);
  this._table = View.newElement("table", this._cssClassForTable);
  
  this._buildHeader();

  // sort the list of items. SIDE EFFECT, table header needs to be built before items are sorted
  // because default _sortAttribute is specified there if not previously specificed
  var staticThis = this;
  this._listOfItems.sort(function(a,b) {return staticThis.compareItemsBySortAttribute(a,b);}); // need to sort after header row added because default sort attribute is set there

  this._buildTableBody();
  viewDivElement.appendChild(this._table);
  
  this._buildFileImportTool();
};


/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TablePlugin.prototype.refresh = function() {
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
TablePlugin.prototype.getSortIcon = function() {
  var imageName = this._ascendingOrder ? TablePlugin.ASCENDING_GIF : TablePlugin.DESCENDING_GIF;
  var image =  Util.createImageElement(imageName);
  //image.align = "right";
  return image;
};


/**
 * Inserts a table cell into table's row & col, with data from a given item and
 * attribute. Each table cell is displayed with a EntryView object.  The HTML 
 * table cell links to the EntryView object with the attribute "or_entryView"
 *
 * @scope    private instance method
 * @return   An HTML image element
 */
TablePlugin.prototype._insertCell = function(row, col, item, attribute) {
  if (EntryView._PENDING_temporaryHackToDecreaseLayoutTime) {
    if (this._listOfItems.length > 20) {
      EntryView._PENDING_enableDragging = false;
    } else {
      var listOfEntries = item.getEntriesForAttribute(attribute);
      EntryView._PENDING_enableDragging = (listOfEntries.length < 10);
    }
  } 
  
  var aCell = row.insertCell(col);
  var multiEntriesView = new MultiEntriesView(this, aCell, item, attribute);
  aCell.or_entriesView = multiEntriesView;
  multiEntriesView.refresh();
  if (this.isInEditMode()) {
    var listener = this;
    multiEntriesView.setKeyPressFunction(function (evt, entryView) {return listener.keyPressOnEditField(evt, entryView);});
  }
  
  if (EntryView._PENDING_temporaryHackToDecreaseLayoutTime) {
    EntryView._PENDING_enableDragging = true;
  }
};


/**
 * Called when the user clicks on table header. Resorts table accordingly.
 * 
 * @scope    public instance method
 */
TablePlugin.prototype.clickOnHeader = function(event, clickAttribute) {
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
 * @scope    public instance method
 */
TablePlugin.prototype.selectRow = function(rowElement) {
  Util.assert(rowElement instanceof HTMLTableRowElement);
  if (rowElement != this._lastSelectedRow) {
    if (this._lastSelectedRow) {
      this._lastSelectedRow.className = "";
    }
    this._lastSelectedRow = rowElement;
    rowElement.className = "selected"; 
    return true;
  }
  return false;
};
 

/**
 * Reads from a CSV format data file and creates items and entries that
 * correspond to the rows and fields in the CSV file.
 * 
 * @scope    private instance method
 */
TablePlugin.prototype._importData = function(eventObject, fileButton) {
  var listOfAttributes = this._displayAttributes;
  var startTime = new Date();
  
  var fileContents = Util.getStringContentsOfFileAtURL('file://' + fileButton.value);
  var csvParser = new CsvParser();
  var listOfRecords = csvParser.getStringValuesFromCsvData(fileContents);
  if (!listOfRecords) {
    return;
  }
  alert("Importing " + listOfRecords.length + " records...");
  
  var listOfFields;
  var i, j;

  // First do some minimal error checking
  for (i in listOfRecords) {
    listOfFields = listOfRecords[i];
    if (listOfFields.length != listOfAttributes.length) {
      alert(listOfFields.join('\n'));
      alert("CSV record #" + (i+1) + " has " + listOfFields.length + " fields, but the table has " + listOfAttributes.length + " columns.\n" +
            "I'm giving up on importing any records.");
      return;
    }
    var valueFound = false;
    for (j in listOfFields) {
      var field = listOfFields[j];
      if (field !== "") {
        valueFound = true;
      }
    }
    if (!valueFound) {
      alert("CSV record #" + (i+1) + " has no fields.\n" +
            "I'm giving up on importing any records.");
      return;
    }
  }
  
  var world = this.getWorld();
  var attributeCalledExpectedType = world.getAttributeCalledExpectedType();
  var attributeCalledInverseAttribute = world.getAttributeCalledInverseAttribute();

  var hashTableOfTypesKeyedByAttribute = {};
  for (i in listOfAttributes) {
    var attribute = listOfAttributes[i];
    var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
    var listOfTypes = [];
    for (j in listOfExpectedTypeEntries) {
      var entry = listOfExpectedTypeEntries[j];
      listOfTypes.push(entry.getValue());
    }
    var attributeKeyString = attribute.getUniqueKeyString();
    hashTableOfTypesKeyedByAttribute[attributeKeyString] = listOfTypes;
  }
  world.beginTransaction();
  var count = 0;
  for (i in listOfRecords) {
    count += 1;
    if ((count % 200) === 0) {
      world.endTransaction();
      world.beginTransaction();
    }
    listOfFields = listOfRecords[i];
    Util.assert(listOfFields.length == listOfAttributes.length);
    var newItem = world.newItem();
    world.setItemToBeIncludedInQueryResultList(newItem, this.getQuerySpec());
    for (j in listOfAttributes) {
      attribute = listOfAttributes[j];
      var value = listOfFields[j];
      if (value !== "") {
        listOfTypes = hashTableOfTypesKeyedByAttribute[attribute.getUniqueKeyString()];
        value = EntryView._transformValueToExpectedType(world, value, listOfTypes);
        var inverseAttributeEntry = attribute.getSingleEntryFromAttribute(attributeCalledInverseAttribute);
        if (inverseAttributeEntry) {
          var inverseAttribute = inverseAttributeEntry.getValue(attribute);
          newItem.addConnectionEntry(attribute, value, inverseAttribute);
        } else {
          newItem.addEntryForAttribute(attribute, value);
        }
      }
    }
  }
  world.endTransaction();
  var endTime = new Date();
  var seconds = 0;
  var milliseconds = endTime.valueOf() - startTime.valueOf();
  if (milliseconds !== 0) {
    seconds = milliseconds / 1000;
  }
  alert("Imported " + listOfRecords.length + " records\n" +
        "in " + seconds + " seconds.");

  // PENDING: This is a hack.
  // When showToolsMode to false, EntryView will not make the lozenges
  // be draggable.  Setting up the draggable stuff takes longer than all
  // the other refresh code put together, so to make the screen redraw 
  // faster, we just set the showToolsMode to false.
  this.getRootView().setShowToolsMode(false);        
  this.refresh();
};


/**
 * Called when the user clicks on attribute editor item, either to add or 
 * remove attribute column
 * 
 * @scope    private class method
 */
TablePlugin.prototype._attributeEditorChanged = function(eventObject) {
  var attributeUuid = eventObject.target.value;
  if (attributeUuid) {
    var repository = this.getWorld();
    var attributeTableColumns = repository.getItemFromUuid(TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS);
    var entriesTableColumns = this._layout.getEntriesForAttribute(attributeTableColumns);
    var noStoredColumns = (entriesTableColumns.length === 0);
    var changedAttribute = this.getWorld().getItemFromUuid(attributeUuid);
    var removeAttribute = Util.removeObjectFromSet(changedAttribute,this._displayAttributes);
    var typeCalledItem = repository.getTypeCalledItem();
    if (removeAttribute) {
      for (var i in entriesTableColumns) {
        if (changedAttribute == entriesTableColumns[i].getValue()) {
          entriesTableColumns[i].voteToDelete();
          break;
        }
      }
    } else {
      this._displayAttributes.push(changedAttribute);
    }
    if (noStoredColumns) {
      for (i in this._displayAttributes) {
        var anAttribute = this._displayAttributes[i];
        this._layout.addEntryForAttribute(attributeTableColumns,anAttribute,typeCalledItem);
      }
    } else {
      if (!removeAttribute) {
        this._layout.addEntryForAttribute(attributeTableColumns,changedAttribute,typeCalledItem);
      }
    }
    this._buildTable(true);
  }
};
 

/**
 * 
TablePlugin.prototype._handleClick = function(eventObject, anEntryView) {
  var rowElement = anEntryView.getSuperview().getHtmlElement().parentNode; // entryView -> multiEntriesView -> cellElment -> rowElement
  return this.selectRow(rowElement);
};
*/


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
TablePlugin.prototype.keyPressOnEditField = function(eventObject, anEntryView) {
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
    
    // line below needs to be called here i.e. early because stopping an edit may change a provisional item
    // to become a "real" one thereby  creating new row for the next provisional item, e.g. this._listOfItems changes
    anEntryView.stopEditing();

    var cellElement = anEntryView.getSuperview().getHtmlElement(); // entryView's multiEntriesView's
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
      //this.selectRow(nextRow);
      nextCell = nextRow.cells[cellElement.cellIndex];
    }
    
    var nextMultiEntryView = nextCell.or_entriesView;
    nextMultiEntryView.select(move != MOVE_LEFT);
  }
  return move;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
