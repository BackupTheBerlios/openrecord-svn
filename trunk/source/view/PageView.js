/*****************************************************************************
 PageView.js
 
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
dojo.provide("orp.view.PageView");
dojo.require("orp.view.View");
dojo.require("orp.view.RootView");
dojo.require("orp.view.SectionView");
dojo.require("orp.view.EntryView");
dojo.require("orp.model.Item");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document, HTMLElement  */
/*global Util  */
/*global Item  */
/*global RootView, SectionView, TablePlugin, EntryView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The RootView uses an instance of a PageView to display a Page in the
 * browser window.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    pageItem        The page item to be displayed by this view. 
 */
orp.view.PageView = function(superview, htmlElement, pageItem) {
  orp.util.assert(htmlElement instanceof HTMLElement);
  orp.util.assert(pageItem instanceof orp.model.Item);

  orp.view.View.call(this, superview, htmlElement, "PageView");

  // instance properties
  this._pageItem = pageItem;
  
  this._pageSummaryView = null;
  this._headerText = null;
  this._listOfSectionViews = [];
};

dj_inherits(orp.view.PageView, orp.view.View);  // makes PageView be a subclass of View


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.PageView.UUID = {
  ATTRIBUTE_SECTIONS_IN_PAGE:             "00030000-ce7f-11d9-8cd5-0011113ae5d6",
  ATTRIBUTE_PAGE_THIS_SECTION_APPEARS_ON: "00030001-ce7f-11d9-8cd5-0011113ae5d6" };


// -------------------------------------------------------------------
// Class methods
// -------------------------------------------------------------------

/**
 * Creates a new section in the repository
 *
 * @scope    public class method
 * @param    inPage    The Page Item to insert the new section into
 */
orp.view.PageView.newSection = function(repository, inPage) {
  var attributeCalledQuerySpec = repository.getAttributeCalledQuerySpec();
  var categoryCalledQuery = repository.getCategoryCalledQuery();
  var attributeCalledPluginView = repository.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_PLUGIN_VIEW);
  var attributeCalledSectionsInPage = repository.getItemFromUuid(orp.view.PageView.UUID.ATTRIBUTE_SECTIONS_IN_PAGE);
  var attributeCalledPageThisSectionAppearsOn = repository.getItemFromUuid(orp.view.PageView.UUID.ATTRIBUTE_PAGE_THIS_SECTION_APPEARS_ON);
  var attributeCalledSectionThisQueryBelongsTo = repository.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SECTION_THIS_QUERY_BELONGS_TO);
  var categoryCalledSection = repository.getItemFromUuid(orp.view.RootView.UUID.CATEGORY_SECTION);
  var tablePluginView = repository.getItemFromUuid(orp.TablePlugin.UUID.PLUGIN_VIEW_TABLE);
  
  repository.beginTransaction();
  var newSection = repository.newItem("New Section");
  newSection.assignToCategory(categoryCalledSection);
  inPage.addConnectionEntry(attributeCalledSectionsInPage, newSection, attributeCalledPageThisSectionAppearsOn);
  newSection.addEntry({attribute:attributeCalledPluginView, value:tablePluginView});

  var newQuery = repository.newItem("New Query");
  newQuery.assignToCategory(categoryCalledQuery);
  newSection.addConnectionEntry(attributeCalledQuerySpec, newQuery, attributeCalledSectionThisQueryBelongsTo);
  repository.endTransaction();
  return newSection;
};


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
orp.view.PageView.prototype.getPageTitle = function() {
  var pageTitle = this._pageItem.getDisplayString();
  return pageTitle;
};

  
/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the data, and tells the sub-views to refresh themselves too.
 *
 * @scope    public instance method
 */
orp.view.PageView.prototype.refresh = function() {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    this._headerText.refresh();
    this._pageSummaryView.refresh();
    for (var key in this._listOfSectionViews) {
      var sectionView = this._listOfSectionViews[key];      
      sectionView.refresh();
    }
  }
};


/**
 * Re-creates all the HTML for the PageView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.PageView.prototype.doInitialDisplay = function() {
  orp.util.assert(this.getHtmlElement() instanceof HTMLElement);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();

  var pageDivElement = this.getHtmlElement();
  
  var headerElement = orp.view.View.appendNewElement(pageDivElement, "h1");
  this._headerText = new orp.view.EntryView(this, headerElement, this._pageItem, attributeCalledName,
    this._pageItem.getSingleEntryFromAttribute(attributeCalledName), false);

  var summaryViewDiv = orp.view.View.appendNewElement(pageDivElement, "div");
  this._pageSummaryView = new orp.view.EntryView(this, summaryViewDiv, this._pageItem, attributeCalledSummary,
    this._pageItem.getSingleEntryFromAttribute(attributeCalledSummary), true);

  // add <div> elements for each of the sections on the page
  // and create a new SectionView for each section
  var attributeCalledSectionsInPage = this.getWorld().getItemFromUuid(orp.view.PageView.UUID.ATTRIBUTE_SECTIONS_IN_PAGE);
  var listOfEntriesForSections = this._pageItem.getEntriesForAttribute(attributeCalledSectionsInPage);
  
  // PENDING: 
  // Turn off the links-to-sections table-of-contents feature until
  // we have the bugs worked out.
  // See: http://lists.berlios.de/pipermail/openrecord-dev/2005-August/000208.html
  var PENDING_include_links_to_sections = false; 
  
  if (PENDING_include_links_to_sections) {
    var sectionNavigatorDiv = null;
    if (listOfEntriesForSections.length > 1 ) {
      sectionNavigatorDiv = orp.view.View.appendNewElement(pageDivElement, "div", null, null, "Sections: ");
    }
  }
   
  for (var key in listOfEntriesForSections) {
    var entryForSection = listOfEntriesForSections[key];
    var section = entryForSection.getConnectedItem(this._pageItem);
    if (section) {
      if (PENDING_include_links_to_sections && sectionNavigatorDiv) {
        orp.view.View.appendNewElement(sectionNavigatorDiv, "a", null, {'href' : '#' + section.getUuidString()}, section.getDisplayName());
        orp.view.View.appendNewTextNode(sectionNavigatorDiv, " ");
      }
      this._buildNewSection(section);
    }
  }

  this._buildEditControls();
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
};


/**
 * Creates a new section in this page.
 *
 * @scope    private instance method
 * @param    sectionItem    newSection item
 * @param    insertBeforeElement    Optional. The HTML element that this new section view should come before on the page.
 */
orp.view.PageView.prototype._buildNewSection = function(sectionItem, insertBeforeElement) {
  var pageDivElement = this.getHtmlElement();
  var sectionViewDiv = document.createElement("div");
  var sectionView = new orp.view.SectionView(this, sectionViewDiv, sectionItem);
  if (insertBeforeElement) {
    pageDivElement.insertBefore(sectionViewDiv, insertBeforeElement);
  }
  else {
    pageDivElement.appendChild(sectionViewDiv);
  }
  this._listOfSectionViews.push(sectionView);
  return sectionView;
};


/**
 * Called when the user clicks on the "New Section" button.
 *
 * @scope    private instance method
 */
orp.view.PageView.prototype._addNewSection = function() {
  var newSection = orp.view.PageView.newSection(this.getWorld(), this._pageItem);
  this._buildNewSection(newSection, this._editModeDiv).refresh();
};


/**
 * Create the "new section" button in EditMode.
 *
 * @scope    private instance method
 */
orp.view.PageView.prototype._buildEditControls = function() {
  if (!this._editModeDiv) {
    var pageDivElement = this.getHtmlElement();
    var cssClass = orp.view.SectionView.cssClass.SECTION + " " + orp.view.RootView.cssClass.EDIT_TOOL;
    this._editModeDiv = orp.view.View.appendNewElement(pageDivElement, "div", cssClass);
    orp.view.View.appendNewElement(this._editModeDiv, "br");
    var editButton = orp.view.View.appendNewElement(this._editModeDiv, "input");
    editButton.type = "Button";
    editButton.value = "New Section";
    editButton.onclick = this._addNewSection.orpBindAsEventListener(this);
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
