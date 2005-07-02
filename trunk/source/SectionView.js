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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window, document  */
/*global Util  */
/*global Item  */
/*global RootView, PageView, TablePlugin, EntryView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// SectionView public class constants
// -------------------------------------------------------------------
SectionView.CSS_CLASS_SECTION = "section";
SectionView.CSS_CLASS_SIMPLE_TABLE = "simple_table";
SectionView.CSS_CLASS_NEW_ITEM = "newitem";
SectionView.CSS_CLASS_PLAIN = "plain";
SectionView.CSS_CLASS_LABEL = "label";
SectionView.CSS_CLASS_TITLE = "title";
SectionView.CSS_CLASS_TEXT_FIELD_IN_TABLE_CELL = "text_field_in_table_cell";
SectionView.CSS_CLASS_SELECTED = "selected";
SectionView.CSS_CLASS_MORE_LINK = "more";
SectionView.CSS_CLASS_ENTRY_VIEW = "entry_view";
SectionView.CSS_CLASS_SECTION_HEADER = "section_header";
SectionView.CSS_CLASS_SUMMARY_TEXT = "summary_text";

SectionView.ELEMENT_ID_SELECT_MENU_PREFIX = "select_menu_";

// SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER = "section_number";

SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_VIEW       = "00040101-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.UUID_FOR_ATTRIBUTE_LAYOUT_DATA       = "00040102-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.UUID_FOR_ATTRIBUTE_APPLIES_TO_PLUGIN = "00040103-ce7f-11d9-8cd5-0011113ae5d6";

SectionView.UUID_FOR_ATTRIBUTE_SECTION_THIS_LAYOUT_DATA_BELONGS_TO = "00040104-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.UUID_FOR_ATTRIBUTE_SECTION_THIS_QUERY_BELONGS_TO = "00040105-ce7f-11d9-8cd5-0011113ae5d6";
// TablePlugin.UUID_FOR_ATTRIBUTE_TABLE_COLUMNS = "0004010a-ce7f-11d9-8cd5-0011113ae5d6";

SectionView.UUID_FOR_CATEGORY_PLUGIN_VIEW        = "00040201-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.UUID_FOR_CATEGORY_LAYOUT_DATA        = "00040202-ce7f-11d9-8cd5-0011113ae5d6";


// -------------------------------------------------------------------
// SectionView class properties
// -------------------------------------------------------------------
SectionView._ourListOfRegisteredPluginClasses = [];
SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid = null;


/**
 * A PageView uses instances of a SectionViews to display the Sections 
 * of a page. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inPageView    The PageView that serves as the superview for this view. 
 * @param    inHTMLElement The HTMLElement to display the HTML in. 
 * @param    inSection    The Section item to be displayed in by this view. 
 * @param    inSectionNumber    The number of the section on the page (1, 2, 3, 4...). 
 * @syntax   var sectionView = new SectionView()
 */
SectionView.prototype = new View();  // makes SectionView be a subclass of View
function SectionView(inPageView, inHTMLElement, inSection, inSectionNumber) {
  Util.assert(inPageView instanceof PageView);
  Util.assert(inSection instanceof Item);
  
  // instance properties
  // PENDING: these should all be private
  this.setSuperview(inPageView);
  this.setHTMLElement(inHTMLElement);
  this._section = inSection;
  this._sectionNumber = inSectionNumber;

  this._pluginView = null;
  this._pluginDiv = null;
  this._sectionSummaryView = null;
  this._headerView = null;
  this._queryEditSpan = null;
  
  if (!SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid) {
    SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid = {};
    for (var key in SectionView._ourListOfRegisteredPluginClasses) {
      var pluginClass = SectionView._ourListOfRegisteredPluginClasses[key];
      var pluginItemUuid = pluginClass.getPluginItemUuid();
      SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[pluginItemUuid] = pluginClass;
    }
  }
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Given the name of a plugin ("Table", "Outline", etc.), returns a newly
 * created plugin object of that type, initialized to be the plugin for this 
 * SectionView.
 *
 * @scope    public class method
 * @param    pluginClass    A JavaScript class, such as TablePlugin. 
 * @param    pluginItemUuid    The UUID of the item representing that class of plugin. 
 */
SectionView.registerPlugin = function(pluginClass, pluginItemUuid) {
  SectionView._ourListOfRegisteredPluginClasses.push(pluginClass);
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
SectionView.prototype.getPluginInstanceFromPluginItem = function (pluginItem, pluginDiv) {
  Util.assert(pluginItem instanceof Item);
  
  var newPlugin = null;
  var pluginClass;
  pluginClass = SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[pluginItem._getUuid()];
  if (pluginClass) {
    var pluginType = this.getWorld().getItemFromUuid(pluginClass.getPluginItemUuid());
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
SectionView.prototype.getQuerySpec = function () {
  var attributeCalledQuerySpec = this.getWorld().getAttributeCalledQuerySpec();
  var queryEntry = this._section.getSingleEntryFromAttribute(attributeCalledQuerySpec);
  if (queryEntry) {
    return queryEntry.getConnectedItem(this._section);
  }
  return null;
};


/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the data, and tells the sub-views to refresh themselves too.
 *
 * @scope    public instance method
 */
SectionView.prototype.refresh = function () {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    // refresh the <h2> element with the value: this._section.getDisplayName();  
    this._refreshQueryEditSpan();
    this._sectionSummaryView.refresh();
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
SectionView.prototype.doInitialDisplay = function () {
  if (!this.getHTMLElement()) {
    return;
  }
  var attributeCalledPluginView = this.getWorld().getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_VIEW);
  var selectedPluginViewEntry = this._section.getSingleEntryFromAttribute(attributeCalledPluginView);
  var selectedPluginItem;
  var selectedPluginClass;
  if (selectedPluginViewEntry) {
    selectedPluginItem = selectedPluginViewEntry.getValue();
    selectedPluginClass = SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[selectedPluginItem._getUuid()];
  } else {
    selectedPluginClass = TablePlugin; 
  }
  
  var sectionDiv = this.getHTMLElement();
  var outerDiv = View.createAndAppendElement(sectionDiv, "div", SectionView.CSS_CLASS_SECTION);
  var headerH2 = View.createAndAppendElement(outerDiv, "h2");
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();
  this._headerView = new EntryView(this, headerH2, this._section, attributeCalledName,
    this._section.getSingleEntryFromAttribute(attributeCalledName),
    SectionView.CSS_CLASS_SECTION_HEADER);
  var summaryDiv = View.createAndAppendElement(outerDiv, "div");
  this._sectionSummaryView = new EntryView(this, summaryDiv, this._section, attributeCalledSummary,
    this._section.getSingleEntryFromAttribute(attributeCalledSummary), SectionView.CSS_CLASS_ENTRY_VIEW, true);
  View.createAndAppendElement(outerDiv, "p");

  // create the editing controls, if we're in edit mode
  var controlArea = View.createAndAppendElement(outerDiv, "p", RootView.CSS_CLASS_EDIT_MODE_ONLY_CONTROL);
  var textShowMeA = document.createTextNode("Show me a ");
  controlArea.appendChild(textShowMeA);

  // PENDING: We shouldn't call the private method _getUuid()
  var selectMenuId = SectionView.ELEMENT_ID_SELECT_MENU_PREFIX + this._section._getUuid();
  var selectElement = View.createAndAppendElement(controlArea, "select", null, selectMenuId);
  var optionElement;
  var listener;
  selectElement.setAttribute("name", selectMenuId);
  // selectElement.setAttribute(SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER, this._sectionNumber);
  for (var key in SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid) {
    var pluginClass = SectionView._ourHashTableOfPluginClassesKeyedByPluginItemUuid[key];
    optionElement = View.createAndAppendElement(selectElement, "option");
    optionElement.selected = (selectedPluginClass == pluginClass);
    optionElement.value = pluginClass.getPluginItemUuid();
    var pluginItem = this.getWorld().getItemFromUuid(pluginClass.getPluginItemUuid());
    optionElement.text = pluginItem.getDisplayString();
    listener = this; 
    Util.addEventListener(optionElement, "click", function(event) {listener.clickOnPluginSelectionMenu(event);});
  }
  
  View.createAndAppendTextNode(controlArea," of items whose ");

  this._queryEditSpan = View.createAndAppendElement(controlArea, "span");
  // this._refreshQueryEditSpan();

  View.createAndAppendTextNode(controlArea,".");

  // create a div element for the plugin class to use
  this._pluginDiv = View.createAndAppendElement(outerDiv, "div");
  this._pluginView = this.getPluginInstanceFromPluginItem(selectedPluginItem, this._pluginDiv);
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
};


/**
 * Returns layout data of this section for a particular plugin
 * Creates a the layout data item if doesn't exist
 *
 * @param    inPluginType    The name of plugin
 * @return    layout data of this section for a particular plugin
 */
SectionView.prototype._getLayoutDataForPlugin = function (inPluginType) {
  var repository = this.getWorld();
  var attrLayoutData = repository.getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_LAYOUT_DATA);
  var entriesLayoutData = this._section.getEntriesForAttribute(attrLayoutData);
  var attrAppliesToPlugin = repository.getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_APPLIES_TO_PLUGIN);
  if (entriesLayoutData) {
    for (var i=0; i < entriesLayoutData.length; ++i) {
      var layoutItem = entriesLayoutData[i].getConnectedItem(this._section);
      var entriesAppliesToPlugin = layoutItem.getEntriesForAttribute(attrAppliesToPlugin);
      Util.assert(entriesAppliesToPlugin && entriesAppliesToPlugin.length == 1);
      if (entriesAppliesToPlugin[0].getValue() == inPluginType) {
        return layoutItem;
      }
    }
  }
  
  // layoutData not found, so create the item
  var categoryCalledLayoutData = repository.getItemFromUuid(SectionView.UUID_FOR_CATEGORY_LAYOUT_DATA);
  var attributeCalledSectionThisLayoutDataBelongsTo = repository.getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_SECTION_THIS_LAYOUT_DATA_BELONGS_TO);
  repository.beginTransaction();
  layoutItem = repository.newItem("Layout data for " + inPluginType.getDisplayString() + " of " + this._section.getDisplayString());
  layoutItem.assignToCategory(categoryCalledLayoutData);
  layoutItem.addEntryForAttribute(attrAppliesToPlugin, inPluginType);
  // this._section.addEntryForAttribute(attrLayoutData, layoutItem, repository.getTypeCalledItem());
  this._section.addConnectionEntry(attrLayoutData, layoutItem, attributeCalledSectionThisLayoutDataBelongsTo);
  repository.endTransaction();
  return layoutItem;
};


/**
 * Re-creates all the HTML for the SectionView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 */
SectionView.prototype._refreshQueryEditSpan = function () {
  View.removeChildrenOfElement(this._queryEditSpan);
  
  var myQuery = this.getQuerySpec();
  var attributeCalledQueryMatchingAttribute = this.getWorld().getAttributeCalledQueryMatchingAttribute();
  var listOfMatchingAttrs = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingAttribute);
  var matchingAttribute;
  if (listOfMatchingAttrs.length === 0) {
    // by default matching attribute is category
    matchingAttribute = this.getWorld().getAttributeCalledCategory();
  }
  else {
    Util.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }
  var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
  var listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
  var hasMatchingEntries = (listOfMatchingEntries && (listOfMatchingEntries.length > 0));
  var matchingEntry = hasMatchingEntries ? listOfMatchingEntries[0] : null;
  
  var listOfAttributes = this.getWorld().getAttributes();
  var selectElement = View.createAndAppendElement(this._queryEditSpan, "select");
  for (var key in listOfAttributes) {
    var anAttribute = listOfAttributes[key];
    var optionElement = View.createAndAppendElement(selectElement, "option");
    optionElement.selected = (matchingAttribute.getDisplayString() == anAttribute.getDisplayString());
    optionElement.value = anAttribute._getUuid();
    optionElement.onclick = this.clickOnAttributeMenu.bindAsEventListener(this);
    optionElement.text = anAttribute.getDisplayString();
  }
  
  View.createAndAppendTextNode(this._queryEditSpan, " is ");
  
  var listOfPossibleEntries = this.getWorld().getSuggestedItemsForAttribute(matchingAttribute);
  var entrySpan = View.createAndAppendElement(this._queryEditSpan, "span");
  
  var entryView =  new EntryView(this, entrySpan, myQuery, attributeCalledQueryMatchingValue, matchingEntry,
    RootView.CSS_CLASS_EDIT_MODE);
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
SectionView.prototype.keyPressOnMatchingValueField = function(event, anEntryView) {
  if (event.keyCode == Util.ASCII_VALUE_FOR_RETURN) {
    anEntryView.stopEditing();
    return true;
  }
  return false;
};


/**
 * Called when the query belong to this section has changed
 *
 * @scope    public instance method
 */
SectionView.prototype.observedItemHasChanged = function(item) {
  item.removeObserver(this); //item no longer needs to be observed as query editor span is rebuilt
  var myQuery = this.getQuerySpec();
  Util.assert(item == myQuery);
  var pluginItem = this._pluginView.getPluginItem();
  this._pluginView.endOfLife();
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
SectionView.prototype.clickOnPluginSelectionMenu = function (inEventObject) {
  var eventObject = inEventObject || window.event;
  var optionElement = Util.getTargetFromEvent(eventObject);
  // PENDING: We could replace the lines above with "var optionElement = this;"
  // That would work fine in Firefox, but maybe it wouldn't work in other browsers?  
  
  var selectElement = optionElement.parentNode;
  var newChoiceUuid = optionElement.value;
  var attributeCalledPluginView = this.getWorld().getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_VIEW);
  var newPluginViewItem = this.getWorld().getItemFromUuid(newChoiceUuid);
 
  if (this._pluginView.getPluginItem() == newPluginViewItem) { 
    return;
  } else {
    this._pluginView.endOfLife();
    this._pluginView = this.getPluginInstanceFromPluginItem(newPluginViewItem, this._pluginDiv);

    var oldEntry = this._section.getSingleEntryFromAttribute(attributeCalledPluginView);
    if (oldEntry) {
      this._section.replaceEntry(oldEntry, newPluginViewItem);
    } else {
      this._section.addEntryForAttribute(attributeCalledPluginView, newPluginViewItem);
    }
    /*
    var pluginNameEntries = this._section.getEntriesForAttribute(attributeCalledPluginName);
    if (pluginNameEntries && pluginNameEntries[0]) {
      var oldEntry = pluginNameEntries[0];
      this._section.replaceEntry(oldEntry, newChoiceName);
    } else {
      this._section.addEntryForAttribute(attributeCalledPluginName, newChoiceName);
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
SectionView.prototype.clickOnAttributeMenu = function (inEventObject) {
  var eventObject = inEventObject || window.event;
  var optionElement = Util.getTargetFromEvent(eventObject);
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
  if (listOfMatchingAttrs.length === 0) {
    // by default matching attribute is category
    matchingAttribute = this.getWorld().getAttributeCalledCategory();
  }
  else {
    Util.assert(listOfMatchingAttrs.length==1, 'more than one matching attributes');
    matchingAttribute = listOfMatchingAttrs[0].getValue();
  }
  if (matchingAttribute.getDisplayString() != newChoiceName) {
    if (listOfMatchingAttrs.length === 0) {
      myQuery.addEntryForAttribute(attributeCalledQueryMatchingAttribute, newQueryMatchingAttribute);
    } else {
      myQuery.replaceEntry(listOfMatchingAttrs[0], newQueryMatchingAttribute);
    }

    /* PENDING, PROBLEM to check Can't delete entries already created by previous matching attribute */
    var attributeCalledQueryMatchingValue = this.getWorld().getAttributeCalledQueryMatchingValue();
    var listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
    for (var i in listOfMatchingEntries) {
      var anEntry = listOfMatchingEntries[i];
      anEntry.voteToDelete();
      Util.assert(anEntry.hasBeenDeleted());
    }
    listOfMatchingEntries = myQuery.getEntriesForAttribute(attributeCalledQueryMatchingValue);
    Util.assert(listOfMatchingEntries.length === 0);
    
    // I think we need these next 3 lines in to make sure the view gets updated  
    // to reflect the new query.  When we get a chance we should probably do 
    // some refactoring so that the plugin can register as an observer of the
    // query item, and then the plugin itself can know what to do when the
    // query item changes.  
    var pluginItem = this._pluginView.getPluginItem();
    this._pluginView.endOfLife();
    this._pluginView = this.getPluginInstanceFromPluginItem(pluginItem, this._pluginDiv);

    this.refresh();
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
