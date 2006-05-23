/*****************************************************************************
 SectionView.js

******************************************************************************
 Written in 2005 by
		Brian Douglas Skinner <brian.skinner@gumption.org>
		Chih-Chao Lam <chao@cs.stanford.edu>
		Mignon Belongie

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
dojo.provide("orp.view.SectionView");
dojo.require("orp.TablePlugin");
dojo.require("orp.view.View");
dojo.require("orp.view.RootView");
dojo.require("orp.model.Item");
dojo.require("orp.lang.Lang");
dojo.require("orp.storage.directoryList");
dojo.require("dojo.event.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
//
/*global window, document  */
/*global Util  */
/*global Item  */
/*global RootView, PageView, TablePlugin, EntryView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * A PageView uses instances of SectionViews to display the Sections
 * of a page.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display the HTML in.
 * @param    sectionItem    The Section item to be displayed by this view.
 * @syntax   var sectionView = new orp.view.SectionView()
 */
orp.view.SectionView = function(superview, htmlElement, sectionItem) {
	orp.view.View.call(this, superview, htmlElement, "SectionView");

	// instance properties
	orp.lang.assert(sectionItem instanceof orp.model.Item);
	this._section = sectionItem;

	this._pluginView = null;
	this._pluginDiv = null;
	// this._sectionSummaryView = null;
	this._headerView = null;
	this._queryEditSpan = null;

	if (orp.view.SectionView._ourListOfRegisteredPluginClasses.length === 0) {
		var categoryCalledPlugin = this.getWorld().getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW);
		var listOfItems = this.getWorld().getItemsInCategory(categoryCalledPlugin);
		var attributeCalledClassName = this.getWorld().getAttributeCalledClassName();
		for (var key in listOfItems) {
			var item = listOfItems[key];
			var entry = item.getSingleEntryFromAttribute(attributeCalledClassName);
			if (!entry) {
				alert("Item '" + item.getDisplayName() + "' in category PluginView has no entry for attribute 'Class Name', and will be skipped.");
				continue;
			}
			var className = entry.getValue();

			// This deals with any plugins which are already loaded.  Such pre-loaded plugins could not
			// self-register when they loaded, because of the order in which files are loaded, so we register them here.
			// Currently, TableView and DetailView are the only plugins which should already be loaded.
			if (orp[className]) {
				orp.view.SectionView.registerPlugin(orp[className]);
				continue;
			}

			var sourceUrl = orp.storage.Storage.prototype.getCurrentLocationDirectory() + '/';
			if (orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION) {
				sourceUrl += orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION + '/';
			}
			sourceUrl += orp.view.PluginView.PATH_TO_CORE_PLUGIN_DIRECTORY_FROM_TRUNK +
										"/" + className + ".js";
			var success = orp.view.SectionView._loadUri(sourceUrl);
			if (!success) {
				sourceUrl = orp.storage.Storage.prototype.getCurrentLocationDirectory() + '/';
				if (orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION) {
					sourceUrl += orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION + '/';
				}
				sourceUrl += orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK +
										 "/" + className + ".js";
				success = orp.view.SectionView._loadUri(sourceUrl);
				if (!success) {
					throw new Error(sourceUrl + " not found.");
				}
			}
		}

		orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid = {};
		for (key in orp.view.SectionView._ourListOfRegisteredPluginClasses) {
			var pluginClass = orp.view.SectionView._ourListOfRegisteredPluginClasses[key];
			var pluginItemUuid = pluginClass.getPluginItemUuid();
			orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[pluginItemUuid] = pluginClass;
		}

		var pathToPluginDirectoryFromWindowLocation = "";
		if (orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION) {
			pathToPluginDirectoryFromWindowLocation += orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION + '/';
		}
		pathToPluginDirectoryFromWindowLocation += orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK;

		var dirList = orp.storage.getDirList(pathToPluginDirectoryFromWindowLocation, "js");
		for (var i = 0; i < dirList.length; ++i) {
			var filenameWithoutExtension = (dirList[i].split('.'))[0];
			var correspondingClassDefined = orp.plugins && orp.plugins[filenameWithoutExtension];
			if (!correspondingClassDefined) {
				sourceUrl = orp.storage.Storage.prototype.getCurrentLocationDirectory() + '/';
				if (orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION) {
					sourceUrl += orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION + '/';
				}
				sourceUrl += orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK +
										 '/' + dirList[i];
				this._installPlugin(sourceUrl);
			}
		}
	}
};

dojo.inherits(orp.view.SectionView, orp.view.View);  // makes SectionView be a subclass of View


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.SectionView.cssClass = {
	// ENTRY_VIEW: "entry_view",
	SECTION: "SectionView",
	SIMPLE_TABLE: "simple_table",
	NEW_ITEM: "newitem",
	PLAIN: "plain",
	LABEL: "label",
	TITLE: "title",
	TEXT_FIELD_IN_TABLE_CELL: "text_field_in_table_cell",
	SELECTED: "selected",
	MORE_LINK: "more" };

// TablePlugin.UUID.ATTRIBUTE_TABLE_COLUMNS  = "0004010a-ce7f-11d9-8cd5-0011113ae5d6";
// orp.view.EntryView.UUID.ATTRIBUTE_NOT_LOZENGE      = "0004010f-ce7f-11d9-8cd5-0011113ae5d6";
orp.view.SectionView.UUID = {
	ATTRIBUTE_PLUGIN_VIEW:       "00040101-ce7f-11d9-8cd5-0011113ae5d6",
	ATTRIBUTE_LAYOUT_DATA:       "00040102-ce7f-11d9-8cd5-0011113ae5d6",
	ATTRIBUTE_APPLIES_TO_PLUGIN: "00040103-ce7f-11d9-8cd5-0011113ae5d6",

	ATTRIBUTE_SECTION_THIS_LAYOUT_DATA_BELONGS_TO: "00040104-ce7f-11d9-8cd5-0011113ae5d6",
	ATTRIBUTE_SECTION_THIS_QUERY_BELONGS_TO: "00040105-ce7f-11d9-8cd5-0011113ae5d6",

	CATEGORY_PLUGIN_VIEW:        "00040201-ce7f-11d9-8cd5-0011113ae5d6",
	CATEGORY_LAYOUT_DATA:        "00040202-ce7f-11d9-8cd5-0011113ae5d6" };


// -------------------------------------------------------------------
// Class properties
// -------------------------------------------------------------------
orp.view.SectionView._ourListOfRegisteredPluginClasses = [];
orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid = null;


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * @scope    public class method
 * @param    pluginClass    A JavaScript class, such as TablePlugin.
 */
orp.view.SectionView.registerPlugin = function(pluginClass) {
	orp.view.SectionView._ourListOfRegisteredPluginClasses.push(pluginClass);
};

/**
 * @scope    public class method
 * @return   number of plugins
 */
orp.view.SectionView.getNumPlugins = function() {
	return orp.view.SectionView._ourListOfRegisteredPluginClasses.length;
};

// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Given an item representing a class of plugin view, this method returns a
 * newly created plugin view object of that class, initialized to be the plugin
 * for this SectionView.
 *
 * @scope    public instance method
 * @param    pluginItem    An item representing a class of plugin view.
 * @param    pluginDiv    The HTMLDivElement to display the plugin in.
 * @return   A newly created plugin object, initialized to be the plugin for this section.
 */
orp.view.SectionView.prototype.getPluginInstanceFromPluginItem = function(pluginItem, pluginDiv) {
	orp.lang.assert(pluginItem instanceof orp.model.Item);

	var newPlugin = null;
	var pluginClass;
	pluginClass = orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[pluginItem.getUuid()];
	if (pluginClass) {
		var pluginType = this.getWorld().getItemFromUuid(pluginClass.getPluginItemUuid());

orp.lang.assert(pluginItem == pluginType); // This seems to be true, so why not just use pluginItem?

		var layoutData = this._getLayoutDataForPlugin(pluginType);
		newPlugin = new pluginClass(this, pluginDiv, this.getQuerySpec(), layoutData);
	}
	return newPlugin;
};


/**
 * Returns query associated to this section.
 *
 * @scope    public instance method
 * @return   query associated to this section.
 */
orp.view.SectionView.prototype.getQuerySpec = function() {
	var attributeCalledQuerySpec = this.getWorld().getAttributeCalledQuerySpec();
	return this._section.getSingleValueFromAttribute(attributeCalledQuerySpec);
};


/**
 * Updates the HTML elements in this view to reflect any changes in
 * the data, and tells the sub-views to refresh themselves too.
 *
 * @scope    public instance method
 */
orp.view.SectionView.prototype.refresh = function() {
	if (!this._myHasEverBeenDisplayedFlag) {
		this.doInitialDisplay();
	} else {
		// refresh the <h2> element with the value: this._section.getDisplayName();
		this._refreshQueryEditSpan();
		// this._sectionSummaryView.refresh();
		this._pluginView.refresh();
		this._headerView.refresh();
	}
};


/**
 * Re-creates all the HTML for the SectionView, and hands the HTML to the
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.SectionView.prototype.doInitialDisplay = function() {
	if (!this.getHtmlElement()) {
		return;
	}
	var attributeCalledPluginView = this.getWorld().getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_PLUGIN_VIEW);
	var selectedPluginViewEntry = this._section.getSingleEntryFromAttribute(attributeCalledPluginView);
	var selectedPluginItem;
	var selectedPluginClass;
	if (selectedPluginViewEntry) {
		selectedPluginItem = selectedPluginViewEntry.getValue();
		selectedPluginClass = orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[selectedPluginItem.getUuid()];
	} else {
		selectedPluginClass = orp.TablePlugin;
		//  This will result in an error when calling this.getPluginInstanceFromPluginItem(selectedPluginItem, this._pluginDiv)
		//  below, because selectedPluginItem will be undefined.
	}

	var sectionDiv = this.getHtmlElement();
	var headerH2 = orp.view.View.appendNewElement(sectionDiv, "h2", null, {'id':this._section.getUuidString()});
	var attributeCalledName = this.getWorld().getAttributeCalledName();
	// var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();
	this._headerView = new orp.view.EntryView(
	                       this, headerH2, this._section, attributeCalledName,
	                       this._section.getSingleEntryFromAttribute(attributeCalledName));
	// var summaryDiv = orp.view.View.appendNewElement(sectionDiv, "div");
	// this._sectionSummaryView = new orp.view.EntryView(this, summaryDiv, this._section, attributeCalledSummary,
	//   this._section.getSingleEntryFromAttribute(attributeCalledSummary), true);
	// orp.view.View.appendNewElement(sectionDiv, "p");

	// create the editing controls, if we're in edit mode
	var controlArea = orp.view.View.appendNewElement(sectionDiv, "p", orp.view.RootView.cssClass.EDIT_TOOL, null, "Show me a ");
	var selectElement = orp.view.View.appendNewElement(controlArea, "select");
	var listener;
	for (var key in orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid) {
		var pluginClass = orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[key];
		var optionElement = orp.view.View.appendNewElement(selectElement, "option");
		optionElement.selected = (selectedPluginClass == pluginClass);
		optionElement.value = pluginClass.getPluginItemUuid();
		var pluginItem = this.getWorld().getItemFromUuid(pluginClass.getPluginItemUuid());
		optionElement.text = pluginItem.getDisplayName();
		dojo.event.connect(optionElement, "onclick", this, "clickOnPluginSelectionMenu");
	}
	orp.view.View.appendNewElement(controlArea,"br");
	orp.view.View.appendNewTextNode(controlArea,"Include items whose ");
	this._queryEditSpan = orp.view.View.appendNewElement(controlArea, "span");
	// orp.view.View.appendNewTextNode(controlArea,".");

	// create a div element for the plugin class to use
	this._pluginDiv = orp.view.View.appendNewElement(sectionDiv, "div");
	this._pluginView = this.getPluginInstanceFromPluginItem(selectedPluginItem, this._pluginDiv);
	this._myHasEverBeenDisplayedFlag = true;
	this.refresh();
};


/**
 * Returns a layout item for this section for a particular plugin.
 *
 * @param    pluginTypeItem    An item representing a class of plugin
 * @return    layout data of this section for a particular plugin
 */
orp.view.SectionView.prototype._getLayoutDataForPlugin = function(pluginTypeItem) {
	var world = this.getWorld();
	var attributeLayoutData = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_LAYOUT_DATA);
	var entriesLayoutData = this._section.getEntriesForAttribute(attributeLayoutData);
	var attributeAppliesToPlugin = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_APPLIES_TO_PLUGIN);
	if (entriesLayoutData) {
		for (var i=0; i < entriesLayoutData.length; ++i) {
			var layoutItem = entriesLayoutData[i].getValue();
			var entriesAppliesToPlugin = layoutItem.getEntriesForAttribute(attributeAppliesToPlugin);
			orp.lang.assert(entriesAppliesToPlugin && entriesAppliesToPlugin.length == 1);
			if (entriesAppliesToPlugin[0].getValue() == pluginTypeItem) {
				return layoutItem;
			}
		}
	}
	return null;
};


/**
 * Creates a layout item for this section for a particular plugin.
 *
 */
orp.view.SectionView.prototype.createLayoutItemForPluginView = function(pluginView) {
	var world = this.getWorld();
	var pluginTypeItem = pluginView.getPluginItem();

	var categoryCalledLayoutData = world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_LAYOUT_DATA);
	var attributeCalledSectionThisLayoutDataBelongsTo = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SECTION_THIS_LAYOUT_DATA_BELONGS_TO);
	var attributeAppliesToPlugin = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_APPLIES_TO_PLUGIN);
	var attributeLayoutData = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_LAYOUT_DATA);
	world.beginTransaction();
	layoutItem = world.newItem("Layout data for " + pluginTypeItem.getDisplayString() + " of " + this._section.getDisplayString());
	layoutItem.assignToCategory(categoryCalledLayoutData);
	layoutItem.addEntry({attribute:attributeAppliesToPlugin, value:pluginTypeItem});
	this._section.addEntry({
		attribute: attributeLayoutData,
		value: layoutItem,
		inverseAttribute: attributeCalledSectionThisLayoutDataBelongsTo });
	world.endTransaction();
	return layoutItem;
};


/**
 * Re-creates all the HTML for the SectionView, and hands the HTML to the
 * browser to be re-drawn.
 *
 */
orp.view.SectionView.prototype._refreshQueryEditSpan = function() {
	orp.view.View.removeChildrenOfElement(this._queryEditSpan);

	var myQuery = this.getQuerySpec();
	var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
	var listOfMatchingAttrs = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
	var matchingAttribute;
	if (listOfMatchingAttrs.length === 0) {
		// by default matching attribute is category
		matchingAttribute = this.getWorld().getAttributeCalledCategory();
	} else {
		orp.lang.assert(listOfMatchingAttrs.length == 1, 'more than one matching attributes');
		matchingAttribute = listOfMatchingAttrs[0].getValue();
	}
	var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
	var listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
	var hasMatchingEntries = (listOfMatchingEntries && (listOfMatchingEntries.length > 0));
	var matchingEntry = hasMatchingEntries ? listOfMatchingEntries[0] : null;

	var listOfAttributes = this.getWorld().getAttributes();
	var selectElement = orp.view.View.appendNewElement(this._queryEditSpan, "select");
	for (var key in listOfAttributes) {
		var anAttribute = listOfAttributes[key];
		var optionElement = orp.view.View.appendNewElement(selectElement, "option");
		optionElement.selected = (matchingAttribute.getDisplayString() == anAttribute.getDisplayString());
		optionElement.value = anAttribute.getUuidString();
		dojo.event.connect(optionElement, "onclick", this, "clickOnAttributeMenu");
		optionElement.text = anAttribute.getDisplayString();
	}

	orp.view.View.appendNewTextNode(this._queryEditSpan, " is ");

	var listOfPossibleEntries = this.getWorld().getSuggestedItemsForAttribute(matchingAttribute);
	var entrySpan = orp.view.View.appendNewElement(this._queryEditSpan, "span");

	var entryView = new orp.view.EntryView(this, entrySpan, myQuery, attributeCalledQueryMatchingValue, matchingEntry);
	entryView.setSuggestions(listOfPossibleEntries);
	entryView.alwaysUseEditField();
	entryView.setAutoWiden(true);
	var attributeCalledExpectedType = this.getWorld().getAttributeCalledExpectedType();
	var listOfExpectedTypeEntries = matchingAttribute.getEntriesForAttribute(attributeCalledExpectedType);
	entryView.setExpectedTypeEntries(listOfExpectedTypeEntries);
	entryView.refresh();
	var listener = this;
	entryView.setKeyPressFunction(function (evt, entryView) {return listener.keyPressOnMatchingValueField(evt, entryView);});
	myQuery.addObserver(this);
};

/**
 * Stores a new item representing a plugin class, with associated entries, as
 * specified in the source code for the plugin.
 *
 * @scope    private instance method
 * @param    world             An object of class World.
 * @param    newPluginClass    A JavaScript class, such as TablePlugin.
 */
orp.view.SectionView.prototype._addNewItemForNewPluginClass = function(world, newPluginClass) {
	var pluginItemUuid = newPluginClass.getPluginItemUuid();
	var existingItem = world.getItemFromUuid(pluginItemUuid);
	if (existingItem) {
		return existingItem;
	}
	world.beginTransaction();
	var newItem = world.importItem(newPluginClass.getPluginItemUuid());
	var entries = newPluginClass.getEntriesForItemRepresentingPluginClass(newItem, world);
	for (var i in entries) {
		world.importEntry(entries[i]);
	}
	world.endTransaction();
	return newItem;
};

/* FIXME: This is a hack.  Undoubtedly there is a more elegant way to accomplish
	 this using dojo, but I don't understand dojo well enough yet to find it.
*/
orp.view.SectionView._loadUri = function(sourceUrl) {
	var success = false;
	try {
		if (dojo.hostenv.oldLoadUri) {
			success = dojo.hostenv.oldLoadUri(sourceUrl, null, true);
		}
		else {
			success = dojo.hostenv.loadUri(sourceUrl, null, true);
		}
	}
	catch (e) {
		success = false;
	}
	return success;
};

// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when user is editing the matching value edit field.
 * We want to trap a "return" key
 *
 * @scope    public instance method
 * @return   Returns true if the user pressed the return key, or false otherwise.
 */
orp.view.SectionView.prototype.keyPressOnMatchingValueField = function(event, anEntryView) {
	if (event.keyCode == orp.util.ASCII.RETURN) {
		anEntryView.stopEditing();
		return true;
	}
	return false;
};


/**
 * Called when the query belonging to this section has changed
 *
 * @scope    public instance method
 */
orp.view.SectionView.prototype.observedItemHasChanged = function(item) {
	item.removeObserver(this); //item no longer needs to be observed as query editor span is rebuilt
	var myQuery = this.getQuerySpec();
	orp.lang.assert(item == myQuery);
	var pluginItem = this._pluginView.getPluginItem();
	this._pluginView.destroy();
	this._pluginView = this.getPluginInstanceFromPluginItem(pluginItem, this._pluginDiv);
	this.refresh();
};


/**
 * Called when the user clicks on any of the plugin option-select controls.
 * Called from an HTML option element within an HTML select element.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object.
 */
orp.view.SectionView.prototype.clickOnPluginSelectionMenu = function(eventObject) {
	eventObject = eventObject || window.event;
	var optionElement = orp.util.getTargetFromEvent(eventObject);
	// PENDING: We could replace the lines above with "var optionElement = this;"
	// That would work fine in Firefox, but maybe it wouldn't work in other browsers?

	var selectElement = optionElement.parentNode;
	var newChoiceUuid = optionElement.value;
	var attributeCalledPluginView = this.getWorld().getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_PLUGIN_VIEW);
	var newPluginViewItem = this.getWorld().getItemFromUuid(newChoiceUuid);

	if (this._pluginView.getPluginItem() == newPluginViewItem) {
		return;
	} else {
		this._pluginView.destroy();
		this._pluginView = this.getPluginInstanceFromPluginItem(newPluginViewItem, this._pluginDiv);

		var oldEntry = this._section.getSingleEntryFromAttribute(attributeCalledPluginView);
		this._section.addEntry({
			previousEntry:oldEntry,
			attribute:attributeCalledPluginView,
			value:newPluginViewItem});
/*  if (oldEntry) {
			this._section.replaceEntry({previousEntry:oldEntry, value:newPluginViewItem});
		} else {
			this._section.addEntry({attribute:attributeCalledPluginView, value:newPluginViewItem});
		}
*/
		this.refresh();
	}
};


/**
 * Called when the user clicks on a control for selecting a category for a query.
 * Called from an HTML option element within an HTML select element.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object.
 */
orp.view.SectionView.prototype.clickOnAttributeMenu = function(eventObject) {
	eventObject = eventObject || window.event;
	var optionElement = orp.util.getTargetFromEvent(eventObject);
	// PENDING: We could replace the lines above with "var optionElement = this;"
	// That would work fine in Firefox, but maybe it wouldn't work in other browsers?

	var selectElement = optionElement.parentNode;
	var newChoiceUuid = optionElement.value;
	var newQueryMatchingAttribute = this.getWorld().getItemFromUuid(newChoiceUuid);
	var newChoiceName = newQueryMatchingAttribute.getDisplayString();

	var myQuery = this.getQuerySpec();
	var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
	var listOfMatchingAttrs = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
	var matchingAttribute;
	var entryToBeReplaced = null;
	if (listOfMatchingAttrs.length === 0) {
		// by default matching attribute is category
		matchingAttribute = this.getWorld().getAttributeCalledCategory();
	} else {
		orp.lang.assert(listOfMatchingAttrs.length == 1, 'more than one matching attributes');
		entryToBeReplaced = listOfMatchingAttrs[0];
		matchingAttribute = listOfMatchingAttrs[0].getValue();
	}
	if (matchingAttribute.getDisplayString() != newChoiceName) {
		myQuery.addEntry({
			previousEntry:entryToBeReplaced,
			attribute:attributeCalledQueryMatchingAttribute,
			value:newQueryMatchingAttribute});
/*  if (listOfMatchingAttrs.length === 0) {
			myQuery.addEntry({attribute:attributeCalledQueryMatchingAttribute, value:newQueryMatchingAttribute});
		} else {
			myQuery.replaceEntry({previousEntry:entryToBeReplaced, value:newQueryMatchingAttribute});
		}
*/

		/* PENDING, PROBLEM to check Can't delete entries already created by previous matching attribute */
		var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
		var listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
		for (var i in listOfMatchingEntries) {
			var anEntry = listOfMatchingEntries[i];
			anEntry.voteToDelete();
			orp.lang.assert(anEntry.hasBeenDeleted());
		}
		listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
		orp.lang.assert(listOfMatchingEntries.length === 0);

		// I think we need these next 3 lines in to make sure the view gets updated
		// to reflect the new query.  When we get a chance we should probably do
		// some refactoring so that the plugin can register as an observer of the
		// query item, and then the plugin itself can know what to do when the
		// query item changes.
		var pluginItem = this._pluginView.getPluginItem();
		this._pluginView.destroy();
		this._pluginView = this.getPluginInstanceFromPluginItem(pluginItem, this._pluginDiv);

		this.refresh();
	}
};

/**
 * Loads the JavaScript code for a plugin.
 *
 * @scope    private instance method
 * @param    pluginUrl    Location of JavaScript file defining a plugin.
 */
orp.view.SectionView.prototype._installPlugin = function(pluginUrl) {
	var numPluginsRegisteredBefore = orp.view.SectionView._ourListOfRegisteredPluginClasses.length;
	var success = orp.view.SectionView._loadUri(pluginUrl);
	if (!success) {
		throw new Error("Error loading " + pluginUrl);
	}
	var numPluginsRegistered = orp.view.SectionView._ourListOfRegisteredPluginClasses.length;
	orp.lang.assert(numPluginsRegistered == numPluginsRegisteredBefore + 1);
	var newestPluginClass = orp.view.SectionView._ourListOfRegisteredPluginClasses[numPluginsRegistered - 1];
	var newPluginViewItem = this._addNewItemForNewPluginClass(this.getWorld(), newestPluginClass);
	var uuidOfNewPlugin = newPluginViewItem.getUuid();
	orp.view.SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[uuidOfNewPlugin] = newestPluginClass;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
