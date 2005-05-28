/*****************************************************************************
 SectionView.js
 
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
//   World.js
//   Util.js
//   PageView.js
//   TablePlugin.js
//   TextView.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// SectionView public class constants
// -------------------------------------------------------------------
SectionView.PLUGIN_TABLE = "Table";
SectionView.PLUGIN_OUTLINE = "Outline";
SectionView.PLUGIN_DETAIL = "Detail";
SectionView.PLUGIN_BAR_CHART = "Bar Chart";

SectionView.ELEMENT_CLASS_SECTION = "section";
SectionView.ELEMENT_CLASS_SECTION_PLUGIN_MENU = "section_plugin_menu";
SectionView.ELEMENT_CLASS_SIMPLE_TABLE = "simple_table";
SectionView.ELEMENT_CLASS_NEW_ITEM = "newitem";
SectionView.ELEMENT_CLASS_PLAIN = "plain";
SectionView.ELEMENT_CLASS_LABEL = "label";
SectionView.ELEMENT_CLASS_TITLE = "title";
SectionView.ELEMENT_CLASS_TEXT_FIELD_IN_TABLE_CELL = "text_field_in_table_cell";
SectionView.ELEMENT_CLASS_SELECTED = "selected";
SectionView.ELEMENT_CLASS_MORE_LINK = "more";
SectionView.ELEMENT_CLASS_TEXT_VIEW = "text_view";

SectionView.ELEMENT_ID_SELECT_MENU_PREFIX = "select_menu_";
SectionView.ELEMENT_ID_SELECT_MENU_SUFFIX = "_select_menu";
SectionView.ELEMENT_ID_PLUGIN_DIV_SUFFIX = "_plugin_div";
SectionView.ELEMENT_ID_CELL_PREFIX = "section_";
SectionView.ELEMENT_ID_CELL_MIDFIX = "_cell_";
SectionView.ELEMENT_ID_SUMMARY_DIV_SUFFIX = "_summary_div";

SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER = "section_number";
SectionView.ELEMENT_ATTRIBUTE_CELL_NUMBER = "cell_number";

// SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_NAME = 113;
SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_NAME = "00000400-ce7f-11d9-8cd5-0011113ae5d6";

// -------------------------------------------------------------------
// SectionView class properties
// -------------------------------------------------------------------
SectionView.ourHashTableOfPluginClassesKeyedByPluginName = {};


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
  this.mySection = inSection;
  this.mySectionNumber = inSectionNumber;
  this.myListOfContentItems = this.getListOfContentItems();

  this._myPlugin = null;
  this._myPluginDiv = null;
  this._mySectionSummaryView = null;
  this._myHeaderView = null;
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Given a string or an item, returns a string.
 *
 * @scope    public class method
 * @param    inValue    A string or an Item. 
 * @return   A string.
 */
 /* DEPRECATED: instead use Entry.prototype.getDisplayString
SectionView.getStringForValue = function (inValue) {
  var string = "";
  if (Util.isString(inValue)) {
    string = inValue;
  }
  if (inValue instanceof Item) {
    string = inValue.getDisplayName();
  }
  return string;
};
*/

// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Given the name of a plugin ("Table", "Outline", etc.), returns a newly
 * created plugin object of that type, initialized to be the plugin for this 
 * SectionView.
 *
 * @scope    public instance method
 * @param    inPluginName    A string. One of the registered plugin names. 
 * @param    inPluginDiv    The HTMLDivElement to display the plugin in. 
 * @return   A newly created plugin object, initialized to be the plugin for this section.
 */
SectionView.prototype.getPluginFromPluginName = function (inPluginName, inPluginDiv) {
  Util.assert(Util.isString(inPluginName));
  
  var newPlugin = null;
  var pluginClass = SectionView.ourHashTableOfPluginClassesKeyedByPluginName[inPluginName];
  if (pluginClass) {
    newPlugin = new pluginClass(this, inPluginDiv, this.getQuery());
  }
  return newPlugin;
};


/**
 * Returns a list of content items to be displayed in this SectionView.
 *
 * @deprecated WILL BE REMOVED ONCE ALL PLUGINS ARE CONVERTED TO RECEIVE A QUERY
 * @scope    public instance method
 * @return   A list of content items.
 */
SectionView.prototype.getListOfContentItems = function () {
  var attributeCalledQuery = this.getWorld().getAttributeCalledQuery();
  var listOfEntries = this.mySection.getEntriesForAttribute(attributeCalledQuery);
  if (listOfEntries && listOfEntries[0]) {
    var query = listOfEntries[0].getValue();
    this.myListOfContentItems = this.getWorld().getResultItemsForQuery(query); 
  } else {
    this.myListOfContentItems = [];
  }
  return this.myListOfContentItems;
};

/**
 * Returns query associated to this section.
 *
 * @scope    public instance method
 * @return   query associated to this section.
 */
SectionView.prototype.getQuery = function () {
  var attributeCalledQuery = this.getWorld().getAttributeCalledQuery();
  var listOfEntries = this.mySection.getEntriesForAttribute(attributeCalledQuery);
  return (listOfEntries && listOfEntries[0]) ? listOfEntries[0].getValue() : null;
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
    // refresh the <h2> element with the value: this.mySection.getDisplayName();  
    this._mySectionSummaryView.refresh();
    this._myPlugin.refresh();
    this._myHeaderView.refresh();
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
  var attributeCalledPluginName = this.getWorld().getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_NAME);
  var selectedPluginName = this.mySection.getSingleStringValueFromAttribute(attributeCalledPluginName);
  this.myListOfContentItems = this.getListOfContentItems();
  if (!this.myListOfContentItems) {
    return;
  }

  var sectionDiv = this.getHTMLElement();
  var outerDiv = View.createAndAppendElement(sectionDiv, "div", SectionView.ELEMENT_CLASS_SECTION);
  var headerH2 = View.createAndAppendElement(outerDiv, "h2");
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();
  this._myHeaderView = new TextView(this, headerH2, this.mySection,
    attributeCalledName, SectionView.ELEMENT_CLASS_TEXT_VIEW);
  var summaryDiv = View.createAndAppendElement(outerDiv, "div");
  this._mySectionSummaryView = new TextView(this, summaryDiv, this.mySection,
    attributeCalledSummary, SectionView.ELEMENT_CLASS_TEXT_VIEW, true);
  View.createAndAppendElement(outerDiv, "p");

  // create the plugin editing controls, if we're in edit mode
  // PENDING: We shouldn't call the private method _getUuid()
  var selectMenuId = SectionView.ELEMENT_ID_SELECT_MENU_PREFIX + this.mySection._getUuid();
  var selectElement = View.createAndAppendElement(outerDiv, "select", SectionView.ELEMENT_CLASS_SECTION_PLUGIN_MENU, selectMenuId);
  selectElement.setAttribute("name", selectMenuId);
  selectElement.setAttribute(SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER, this.mySectionNumber);
  for (var pluginName in SectionView.ourHashTableOfPluginClassesKeyedByPluginName) {
    var optionElement = View.createAndAppendElement(selectElement, "option");
    optionElement.selected = (selectedPluginName == pluginName);
    optionElement.setAttribute("value", pluginName);
    // Util.addEventListener(optionElement, "click", SectionView.clickOnPluginSelectionMenu);
    var listener = this; 
    Util.addEventListener(optionElement, "click", function(event) {listener.clickOnPluginSelectionMenu(event);});
    optionElement.innerHTML = pluginName;
  }

  // create a div element for the plugin class to use
  this._myPluginDiv = View.createAndAppendElement(outerDiv, "div");
  this._myPlugin = this.getPluginFromPluginName(selectedPluginName, this._myPluginDiv);
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
};
  

// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

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
  var newChoiceName = optionElement.value;
  var attributeCalledPluginName = this.getWorld().getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_NAME);
 
  if (this._myPlugin.getPluginName() == newChoiceName) {
    return;
  } else {
    this._myPlugin.endOfLife();
    this._myPlugin = this.getPluginFromPluginName(newChoiceName, this._myPluginDiv);
    var pluginNameEntries = this.mySection.getEntriesForAttribute(attributeCalledPluginName);
    if (pluginNameEntries && pluginNameEntries[0]) {
      var oldEntry = pluginNameEntries[0];
      this.mySection.replaceEntry(oldEntry, newChoiceName);
    } else {
      this.mySection.addEntryForAttribute(attributeCalledPluginName, newChoiceName);
    }
    this.refresh();
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
