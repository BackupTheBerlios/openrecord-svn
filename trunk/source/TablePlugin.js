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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.TablePlugin");
dojo.require("orp.view.PluginView");
dojo.require("orp.view.RootView");
dojo.require("orp.view.SectionView");
dojo.require("orp.view.MultiEntriesView");
dojo.require("orp.model.Item");
dojo.require("orp.util.CsvParser");
dojo.require("orp.lang.Lang");
dojo.require("dojo.event.*");
dojo.require("dojo.dnd.*");
dojo.require("dojo.widget.*");
dojo.require("dojo.widget.Menu2");
dojo.require("dojo.widget.ComboBox");
dojo.require("dojo.widget.html.ComboBox");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
//
/*global window, document, HTMLTableRowElement  */
/*global Util  */
/*global Item  */
/*global CsvParser  */
/*global View, MultiEntriesView, EntryView, RootView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
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
orp.TablePlugin = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "TablePlugin");

	// PENDING should probably make this independent of sectionview
	this._cssClassForTable = orp.view.SectionView.cssClass.SIMPLE_TABLE;
	this._table = null;
	this._sortAttribute = null;
	this._ascendingOrder = true;
};

dojo.inherits(orp.TablePlugin, orp.view.PluginView);  // makes TablePlugin be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.TablePlugin.UUID = {
	PLUGIN_VIEW_TABLE: "00040301-ce7f-11d9-8cd5-0011113ae5d6" };

// FIXME:
// orp.view.SectionView.registerPlugin(orp.TablePlugin);


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.TablePlugin.ICON = {
	ASCENDING: "ascending.png",
	DESCENDING: "descending.png" };


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin
 */
orp.TablePlugin.getPluginItemUuid = function() {
	return orp.TablePlugin.UUID.PLUGIN_VIEW_TABLE;
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
orp.TablePlugin.prototype.getClass = function() {
	return orp.TablePlugin;
};


/**
 * Comparison function to sort items.
 *
 * @scope    public instance method
 * @param    itemA    One of the two items to be compared.
 * @param    itemB    One of the two items to be compared.
 * @return   This method returns 0 if the items are comparable. If _ascendingOrder is true, itemA is less than itemB, this method returns -1, otherwise it returns +1.
 */
orp.TablePlugin.prototype.compareItemsBySortAttribute = function(itemA, itemB) {
	orp.lang.assert(this._sortAttribute !== null);
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
orp.TablePlugin.prototype._getListOfColumns = function() {
	var world = this.getWorld();
	var useSavedListOfColumns = false;
	var displayAttributes = [];
	var anAttribute;

	var layoutItem = this.getLayoutItem();
	if (layoutItem) {
		var attributeCalledSelectedAttributes = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
		var listOfTableColumnEntries = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttributes);
		if (listOfTableColumnEntries.length > 0) {
			useSavedListOfColumns = true;
		}
	}
	if (useSavedListOfColumns) {
		// If we get here, it means this table has a saved list of user-selected
		// columns, and we just want to use that list.
		for (var i in listOfTableColumnEntries) {
			anAttribute = listOfTableColumnEntries[i].getValue();
			orp.lang.assert(anAttribute instanceof orp.model.Item);
			displayAttributes.push(anAttribute);
		}
	} else {
		// If we get here, it means this table did not have a saved list of
		// user-selected columns, so we need to come up with a list.
		// We will build a list of display attributes by looking at all the items in
		// the table and finding the union of all the attributes of those items.
		var attributeCalledCategory = world.getAttributeCalledCategory();
		var hashTableOfAttributesKeyedByUuid = {};
		var attributeUuid;
		for (var j in this._listOfItems) {
			var contentItem = this._listOfItems[j];
			var listOfAttributesForItem = contentItem.getAttributes();
			for (var k in listOfAttributesForItem) {
				var attribute = listOfAttributesForItem[k];
				if (attribute != attributeCalledCategory) {
					attributeUuid = attribute.getUuid();
					hashTableOfAttributesKeyedByUuid[attributeUuid] = attribute;
				}
			}
		}

		if (orp.util.lengthOfHashTable(hashTableOfAttributesKeyedByUuid) < 1) {
			// If we have not yet identified any display attributes to use as
			// column headers, then we'll just use the "Name" attribute so that
			// our table will have at least one column.
			var attributeCalledName = world.getAttributeCalledName();
			attributeUuid = attributeCalledName.getUuid();
			hashTableOfAttributesKeyedByUuid[attributeUuid] = attributeCalledName;
		}
		for (attributeUuid in hashTableOfAttributesKeyedByUuid) {
			anAttribute = hashTableOfAttributesKeyedByUuid[attributeUuid];
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
orp.TablePlugin.prototype._buildAddColumnControl = function(headerRow) {
	var cssClass = "add_column" + " " + orp.view.RootView.cssClass.EDIT_TOOL;
	var headerCell = orp.view.View.appendNewElement(headerRow, "th", cssClass);
	headerCell.superView = this;

	var listOfAttributes = this.getWorld().getAttributes();
	var comboData = new Array();
	var j = 0;
	for (var i = 0; i < listOfAttributes.length; ++i) {
		var attribute = listOfAttributes[i];
		if (!orp.util.isObjectInSet(attribute, this._displayAttributes)) {
			comboData[j] = new Array(listOfAttributes[i].getDisplayName(), listOfAttributes[i].getUuidString());
			++j;
		}
	}
	var comboBox = dojo.widget.createWidget("ComboBox", {}, headerCell, "last");
	var provider = comboBox.dataProvider;
	provider.setData(comboData);

	var _this = this;
	headerCell.onComboBoxKeyUp = function(evt) {
		if (evt.keyCode != orp.util.ASCII.RETURN) {
			return;
		}
		var attribute = orp.TablePlugin.getAttributeFromComboBoxValue(evt.target.value, this.superView.getWorld());
		_this._addOrRemoveOneColumn(attribute);
	};
	dojo.event.connect(comboBox, "onKeyUp", headerCell, "onComboBoxKeyUp");
	headerCell.selectOption = function(evt) {
		if (evt && evt.type == "click" && evt.target && evt.target.textContent) {
			var attribute = orp.TablePlugin.getAttributeFromComboBoxValue(evt.target.textContent, this.superView.getWorld());
			_this._addOrRemoveOneColumn(attribute);
		}
	};
	dojo.event.connect(comboBox, "selectOption", headerCell, "selectOption");
};

/**
 * Builds UI widgets to let the user import a CSV data file into the table.
 *
 * @scope    private instance method
 */
orp.TablePlugin.prototype._buildFileImportTool = function() {
	var htmlElement = this.getHtmlElement();
	if (window.location.protocol == "file:") {
		var importDiv = orp.view.View.appendNewElement(htmlElement, "div", orp.view.RootView.cssClass.EDIT_TOOL);
		orp.view.View.appendNewTextNode(importDiv, " Import Data:");
		this._fileImportButton = orp.view.View.appendNewElement(importDiv, "input");
		this._fileImportButton.type = "file";

		dojo.event.connect(this._fileImportButton, "onchange", this, "_importData");
	}
};


/**
 * Inserts a table row at rowNum given contentItem
 *
 * @scope    private instance method
 */
orp.TablePlugin.prototype._insertRow = function(contentItem, rowNum) {
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
orp.TablePlugin.prototype._buildTableBody = function() {
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
		// observedItemHasChanged() to _provisionalItemJustBecameReal()
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
orp.TablePlugin.prototype._provisionalItemJustBecameReal = function(item) {
	this.getWorld().setItemToBeIncludedInQueryResultList(item, this.getQuerySpec());
};


/**
 * PENDING:
 * This method observedItemHasChanged() was written back before we
 * wrote the method above this one, _provisionalItemJustBecameReal().
 * Now we've got things set up so that the EntryView will call
 * our _provisionalItemJustBecameReal() method when the user first
 * makes a change that causes the provisional item to become real.
 * Now that we have _provisionalItemJustBecameReal(), we might
 * want to move all the code from observedItemHasChanged() over
 * into _provisionalItemJustBecameReal(), and then we could get
 * rid of this method.  HOWEVER, moving the code might cause bugs,
 * because this observedItemHasChanged() method is probably
 * called slightly later than the _provisionalItemJustBecameReal()
 * method above.  The _provisionalItemJustBecameReal() is called
 * DURING the transaction, whereas observedItemHasChanged() is,
 * in theory, called after the transaction.
 */
orp.TablePlugin.prototype.observedItemHasChanged = function(item) {
	// called when a provisional item becomes a real item
	item.removeObserver(this); //now that provisional item is real, we stop observing it
	this._listOfItems.push(item); // moving this line affects code below

	// tell provisional item views they are no longer provisional
	var oldProvisionalRow = this._table.rows[this._listOfItems.length];
	for (var i=0; i < oldProvisionalRow.cells.length; ++i) {
		var aCell = oldProvisionalRow.cells[i];
		aCell.orp_entriesView.noLongerProvisional();
	}

	// create new provisional item now that old one has become real
	var newItem = this.getWorld().newProvisionalItem(this);
	var aRow = this._insertRow(newItem, this._listOfItems.length+1, true);
};


/**
 *
 */
orp.TablePlugin.prototype._handleDrop = function(elementThatWasDragged) {
	var i;

	// First figure out which column header was dragged (indexOfDraggedAttribute)
	// and where it landed (indexOfDraggedElement).
	var world = this.getWorld();
	var draggedUuid = elementThatWasDragged.dragObject.domNode.getAttribute('uuid');
	var draggedAttribute = world.getItemFromUuid(draggedUuid);
	var indexOfDraggedAttribute = orp.util.getArrayIndex(this._displayAttributes, draggedAttribute);
	var oldIndexOfDraggedColumn = indexOfDraggedAttribute;
	var headerRow = this._table.rows[0];
	var headerCells = headerRow.getElementsByTagName("th");

	var indexOfDraggedElement = -1;
	for (i = 0; i < headerCells.length; ++i) {
		if (headerCells[i].getAttribute('uuid') == draggedUuid) {
			indexOfDraggedElement = i;
			break;
		}
	}
	orp.lang.assert(indexOfDraggedElement >= 0);
	var newIndexOfDraggedColumn = indexOfDraggedElement;

	var indexOfSpecialColumnAtFarRight = headerCells.length - 1;
	var indexOfRightmostDataColumn = headerCells.length - 2;

	if (newIndexOfDraggedColumn == indexOfSpecialColumnAtFarRight) {
		// If the user dropped the column all the way to the right, past even the
		// special column at the far right (the column with the "Add column"
		// control), then we'll pretend that they dropped the column just to
		// the left of the special last column
		newIndexOfDraggedColumn = newIndexOfDraggedColumn - 1;
	}


	// If the user dragged a column header and dropped it on the same column
	// header, then we don't need to change the column order.
	if (oldIndexOfDraggedColumn == newIndexOfDraggedColumn) {
		return;
	}

	// Now we need to save the new column order to the repository.
	var attributeCalledSelectedAttributes = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
	world.beginTransaction();
	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
	var listOfTableColumnEntries = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttributes);

	// alert("this._displayAttributes.length == " + this._displayAttributes.length);
	// alert("listOfTableColumnEntries.length == " + listOfTableColumnEntries.length);
	// alert("headerCells.length == " + headerCells.length);

	if (listOfTableColumnEntries.length > 0) {
		// If we get here, it means this table has a saved list of user-selected
		// columns, and we just want to re-order that list.
		orp.lang.assert(this._displayAttributes.length == listOfTableColumnEntries.length);

		// Figure out which entry is being reordered between which two entries.
		var draggedEntry = listOfTableColumnEntries[oldIndexOfDraggedColumn];
		var noPreviousEntry = (newIndexOfDraggedColumn === 0);
		var noFollowingEntry = (newIndexOfDraggedColumn == indexOfRightmostDataColumn);
		var draggedLeft = oldIndexOfDraggedColumn > newIndexOfDraggedColumn;
		var entryBeforeDroppedOnEntry = null;
		if (!noPreviousEntry) {
			var beforeIndex = draggedLeft? newIndexOfDraggedColumn - 1 : newIndexOfDraggedColumn;
			entryBeforeDroppedOnEntry = listOfTableColumnEntries[beforeIndex];
		}
		var entryAfterDroppedOnEntry = null;
		if (!noFollowingEntry) {
			var afterIndex = draggedLeft? newIndexOfDraggedColumn : newIndexOfDraggedColumn + 1;
			entryAfterDroppedOnEntry = listOfTableColumnEntries[afterIndex];
		}
		draggedEntry.reorderBetween(entryBeforeDroppedOnEntry, entryAfterDroppedOnEntry);
	} else {
		// If we get here, it means we need to save a newly created list of
		// user-selected columns.
		this._displayAttributes.splice(oldIndexOfDraggedColumn, 1);
		this._displayAttributes.splice(newIndexOfDraggedColumn, 0, draggedAttribute);
		for (i in this._displayAttributes) {
			var attribute = this._displayAttributes[i];
			layoutItem.addEntry({attribute:attributeCalledSelectedAttributes, value:attribute});
		}
	}
	world.endTransaction();
	this.refresh();
};

// Called when the user clicks the "Remove" menu item on the context menu.
orp.TablePlugin.prototype._contextMenuRemove = function(evt) {
	// alert("not actually removing anything, just a test! " + this._contextMenuForColumnAttribute.getDisplayString());
	this._addOrRemoveOneColumn(this._contextMenuForColumnAttribute);
};

// Called at the moment a conext menu is opened, just after the user right clicks.
// All we do here is make a note of which column/attribute the user clicked on.
orp.TablePlugin.prototype._contextMenuWasOpened = function(columnAttribute) {
	this._contextMenuForColumnAttribute = columnAttribute;
};

/**
 * Constructs the table header row
 *
 * @scope    private instance method
 */
orp.TablePlugin.prototype._buildHeader = function() {
	var menuItemRemove = dojo.widget.createWidget("MenuItem2", {caption: "Remove"}, null);
	var menuItemPaste  = dojo.widget.createWidget("MenuItem2", {caption: "Paste"}, null);
	var contextMenu = dojo.widget.createWidget("PopupMenu2", {}, null);
	dojo.event.connect(menuItemRemove, "onClick", this, "_contextMenuRemove");
	contextMenu.addChild(menuItemRemove);
	// contextMenu.addChild(menuItemPaste);

	// add header row
	var headerRow = this._table.insertRow(0);
	var numCols = 0;
	for (var i in this._displayAttributes) {
		var attribute = this._displayAttributes[i];
		if (!this._sortAttribute) {this._sortAttribute = attribute;}
		var headerCell = orp.view.View.appendNewElement(headerRow, "th", null, {uuid: attribute.getUuidString()});
		var headerCellContentSpan = orp.view.View.appendNewElement(headerCell, "span", "headerCellContentSpan", {uuid: attribute.getUuidString()});
		var textSpan = orp.view.View.appendNewElement(headerCellContentSpan, "span", null, null, attribute.getDisplayString());
		if (this._sortAttribute == attribute) {
			headerCellContentSpan.appendChild(this.getSortIcon());
		}
		var FIXME_renderDatatype = true;
		if (attribute == this.getWorld().getAttributeCalledName()) {
			// This is a special case, partly because the expected type of 'Name' SHOULD be text, and
			// partly because it's very confusing in a new empty table to have the expected type field under 'Name'.
			FIXME_renderDatatype = false;
		}
		if (FIXME_renderDatatype) {
			var br = orp.view.View.appendNewElement(headerCell, "br");
			var outerSpan = orp.view.View.appendNewElement(headerCell, "span", orp.view.RootView.cssClass.EDIT_TOOL);
			var datatypeSpan = orp.view.View.appendNewElement(outerSpan, "span");
			var attributeCalledExpectedType = this.getWorld().getAttributeCalledExpectedType();
			var listOfMatchingEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
			var hasMatchingEntries = (listOfMatchingEntries && (listOfMatchingEntries.length > 0));
			var matchingEntry = hasMatchingEntries ? listOfMatchingEntries[0] : null;

			var listOfPossibleEntries = this.getWorld().getSuggestedItemsForAttribute(attributeCalledExpectedType);

			var entryView = new orp.view.EntryView(this, datatypeSpan, attribute, attributeCalledExpectedType, matchingEntry);
			entryView.alwaysUseEditField();
			entryView.setSuggestions(listOfPossibleEntries);
			entryView.setAutoWiden(true);
			var listOfExpectedTypeEntries = attributeCalledExpectedType.getEntriesForAttribute(attributeCalledExpectedType);
			entryView.setExpectedTypeEntries(listOfExpectedTypeEntries);

			entryView.refresh();
			var listener = this;
			// entryView.setKeyPressFunction(function (evt, entryView) {return listener.keyPressOnDatatypeField(evt, entryView);});
		}
		dojo.event.connect(headerCellContentSpan, "onclick", orp.lang.bind(this, "clickOnHeader", attribute));
		dojo.event.connect(headerCell, "oncontextmenu", orp.lang.bind(this, "_contextMenuWasOpened", attribute));
		dojo.event.connect(headerCell, "oncontextmenu", contextMenu, "onOpen");

		if (this.isInEditMode()) {
			new dojo.dnd.HtmlDragSource(headerCell, "headerCell");
		}
		++numCols;
	}
	this._numberOfColumns = numCols;

	this._buildAddColumnControl(headerRow);

	if (this.isInEditMode()) {
		var dropTarget = new dojo.dnd.HtmlDropTarget(headerRow, ["headerCell"]);
		dojo.event.connect(dropTarget, "onDrop", this, "_handleDrop");
	}
};

orp.TablePlugin.getAttributeFromComboBoxValue = function(comboBoxValue, world) {
	var listOfAttributes = world.getAttributes();
	var attribute;
	for (var i = 0; i < listOfAttributes.length; ++i) {
		if (listOfAttributes[i].getDisplayName() == comboBoxValue) {
			attribute = listOfAttributes[i];
			break;
		}
	}
	if (i == listOfAttributes.length) {
		attribute = world.newAttribute(comboBoxValue);
		var attributeCalledExpectedType = world.getAttributeCalledExpectedType();
		var typeCalledText = world.getTypeCalledText();
		attribute.addEntry({attribute: attributeCalledExpectedType, value: typeCalledText});
	}
	return attribute;
};

/*
orp.TablePlugin.prototype.keyPressOnDatatypeField = function(event, anEntryView) {
	if (event.keyCode == orp.util.ASCII.RETURN) {
		anEntryView.stopEditing();
		return true;
	}
	return false;
};
*/

/**
 * Re-creates all the HTML for the TablePlugin, and hands the HTML to the
 * browser to be re-drawn.
 *
 * @param    doNotRebuildHash    If true, this method does not refetch query and rebuild attribute hash table
 * @scope    public instance method
 */
orp.TablePlugin.prototype._buildTable = function(doNotRebuildHash) {
	// get list of items and attributes
	if (!doNotRebuildHash) {
		this.fetchItems();
		this._displayAttributes = this._getListOfColumns();
	}

	//create new table, remove old table if already exists
	var viewDivElement = this.getHtmlElement();
	orp.view.View.removeChildrenOfElement(viewDivElement);

	// We could do use View.appendNewElement() here, but we seem to get a 20%
	// speed improvement by instead using View.newElement() and then making our
	// own call to viewDivElement.appendChild(this._table) 10 lines further down.
	// If there is a real 20% speed-up, it's probably because we prevent the
	// browser from trying to re-render the table until we call appendChild()
	//
	// this._table = View.appendNewElement(viewDivElement, "table", this._cssClassForTable);
	this._table = orp.view.View.newElement("table", this._cssClassForTable);

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
orp.TablePlugin.prototype.refresh = function() {
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
orp.TablePlugin.prototype.getSortIcon = function() {
	var imageName = this._ascendingOrder ? orp.TablePlugin.ICON.ASCENDING : orp.TablePlugin.ICON.DESCENDING;
	var image =  orp.util.createImageElement(imageName);
	//image.align = "right";
	return image;
};


/**
 * Inserts a table cell into table's row & col, with data from a given item and
 * attribute. Each table cell is displayed with a EntryView object.  The HTML
 * table cell links to the EntryView object with the attribute "orp_entryView"
 *
 * @scope    private instance method
 * @return   An HTML image element
 */
orp.TablePlugin.prototype._insertCell = function(row, col, item, attribute) {
	if (orp.view.EntryView._PENDING_temporaryHackToDecreaseLayoutTime) {
		if (this._listOfItems.length > 20) {
			orp.view.EntryView._PENDING_enableDragging = false;
		} else {
			var listOfEntries = item.getEntriesForAttribute(attribute);
			orp.view.EntryView._PENDING_enableDragging = (listOfEntries.length < 10);
		}
	}

	var aCell = row.insertCell(col);
	var multiEntriesView = new orp.view.MultiEntriesView(this, aCell, item, attribute);
	aCell.orp_entriesView = multiEntriesView;
	multiEntriesView.refresh();
	if (this.isInEditMode()) {
		var listener = this;
		multiEntriesView.setKeyPressFunction(function (evt, entryView) {return listener.keyPressOnEditField(evt, entryView);});
	}

	if (orp.view.EntryView._PENDING_temporaryHackToDecreaseLayoutTime) {
		orp.view.EntryView._PENDING_enableDragging = true;
	}
};


/**
 * Called when the user clicks on table header. Resorts table accordingly.
 *
 * @scope    public instance method
 */
orp.TablePlugin.prototype.clickOnHeader = function(clickAttribute) {
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
orp.TablePlugin.prototype.selectRow = function(rowElement) {
	orp.lang.assert(rowElement instanceof HTMLTableRowElement);
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
orp.TablePlugin.prototype._importData = function(eventObject) {
	var listOfAttributes = this._displayAttributes;
	var startTime = new Date();

	// var fileContents = orp.util.getStringContentsOfFileAtURL('file://' + this._fileImportButton.value);
	var fileContents = dojo.hostenv.getText('file://' + this._fileImportButton.value);
	var csvParser = new orp.util.CsvParser();
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
			alert("CSV record #" + (i+1) + " has no fields.\n" + "I'm giving up on importing any records.");
			return;
		}
	}

	var world = this.getWorld();
	var attributeCalledExpectedType = world.getAttributeCalledExpectedType();
	var attributeCalledInverseAttribute = world.getAttributeCalledInverseAttribute();

	var hashTableOfTypesKeyedByAttributeUuid = {};
	for (i in listOfAttributes) {
		var attribute = listOfAttributes[i];
		var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
		var listOfTypes = [];
		for (j in listOfExpectedTypeEntries) {
			var entry = listOfExpectedTypeEntries[j];
			listOfTypes.push(entry.getValue());
		}
		hashTableOfTypesKeyedByAttributeUuid[attribute.getUuid()] = listOfTypes;
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
		orp.lang.assert(listOfFields.length == listOfAttributes.length);
		var newItem = world.newItem();
		world.setItemToBeIncludedInQueryResultList(newItem, this.getQuerySpec());
		for (j in listOfAttributes) {
			attribute = listOfAttributes[j];
			var value = listOfFields[j];
			if (value !== "") {
				listOfTypes = hashTableOfTypesKeyedByAttributeUuid[attribute.getUuid()];
				value = world.transformValueToExpectedType(value, listOfTypes);
				var inverseAttribute = attribute.getSingleValueFromAttribute(attributeCalledInverseAttribute);
				newItem.addEntry({
					attribute:attribute,
					value:value,
					inverseAttribute:inverseAttribute });
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


// Add a column to the table, or remove a column from the table.
orp.TablePlugin.prototype._addOrRemoveOneColumn = function(attribute) {
	var changedAttribute = attribute;
	var world = this.getWorld();
	world.beginTransaction();

	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);

	var attributeCalledSelectedAttributes = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
	var listOfTableColumnEntries = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttributes);
	var noStoredColumns = (listOfTableColumnEntries.length === 0);
	// var changedAttribute = this.getWorld().getItemFromUuid(attributeUuid);
	var removeAttribute = orp.util.removeObjectFromSet(changedAttribute, this._displayAttributes);
	var typeCalledItem = world.getTypeCalledItem();
	if (removeAttribute) {
		for (var i in listOfTableColumnEntries) {
			if (changedAttribute == listOfTableColumnEntries[i].getValue()) {
				listOfTableColumnEntries[i].voteToDelete();
				break;
			}
		}
	} else {
		this._displayAttributes.push(changedAttribute);
	}
	if (noStoredColumns) {
		for (i in this._displayAttributes) {
			var anAttribute = this._displayAttributes[i];
			layoutItem.addEntry({attribute:attributeCalledSelectedAttributes, value:anAttribute, type:typeCalledItem});
		}
	} else {
		if (!removeAttribute) {
			layoutItem.addEntry({attribute:attributeCalledSelectedAttributes, value:changedAttribute, type:typeCalledItem});
		}
	}
	world.endTransaction();

	this._buildTable(true);
};


/**
 *
orp.TablePlugin.prototype._handleClick = function(eventObject, anEntryView) {
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
orp.TablePlugin.prototype.keyPressOnEditField = function(eventObject, anEntryView) {
	var asciiValueOfKey = eventObject.keyCode;
	var shiftKeyPressed = eventObject.shiftKey;

	var MOVE_LEFT = "left";
	var MOVE_UP = "up";
	var MOVE_RIGHT = "right";
	var MOVE_DOWN = "down";

	var move = null;
	switch (asciiValueOfKey) {
		case orp.util.ASCII.LEFT_ARROW:
			move = MOVE_LEFT;
			break;
		case orp.util.ASCII.UP_ARROW:
			move = MOVE_UP;
			break;
		case orp.util.ASCII.RIGHT_ARROW:
			move = MOVE_RIGHT;
			break;
		case orp.util.ASCII.DOWN_ARROW:
			move = MOVE_DOWN;
			break;
		case orp.util.ASCII.RETURN:
			move = (shiftKeyPressed) ? MOVE_UP : MOVE_DOWN;
			break;
		case orp.util.ASCII.TAB:
			move = (shiftKeyPressed) ? MOVE_LEFT : MOVE_RIGHT;
			break;
		default:
			move = null;
			break;
	}

	if (move) {
		orp.lang.assertType(this._numberOfColumns, Number);
		orp.lang.assertType(this._listOfItems, Array);

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

		var nextMultiEntryView = nextCell.orp_entriesView;
		nextMultiEntryView.select(move != MOVE_LEFT);
	}
	return move;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
