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
// Dependencies:
//   World.js
//   Util.js
//   SectionView.js
//   TextView.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// PageView public class constants
// -------------------------------------------------------------------
PageView.CSS_CLASS_PAGE_HEADER = "page_header";
PageView.UUID_FOR_ATTRIBUTE_SECTIONS_IN_PAGE = "00030000-ce7f-11d9-8cd5-0011113ae5d6";
PageView.UUID_FOR_ATTRIBUTE_PAGE_THIS_SECTION_APPEARS_ON = "00030001-ce7f-11d9-8cd5-0011113ae5d6";


/**
 * Creates a new section in the repository
 *
 * @scope    public class method
 * @param    inPage    The Page Item to insert the new section into
 */
PageView.newSection = function (repository, inPage) {
  var attributeCalledQuerySpec = repository.getAttributeCalledQuerySpec();
  var categoryCalledQuery = repository.getCategoryCalledQuery();
  var attributeCalledPluginView = repository.getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_PLUGIN_VIEW);
  var attributeCalledSectionsInPage = repository.getItemFromUuid(PageView.UUID_FOR_ATTRIBUTE_SECTIONS_IN_PAGE);
  var attributeCalledPageThisSectionAppearsOn = repository.getItemFromUuid(PageView.UUID_FOR_ATTRIBUTE_PAGE_THIS_SECTION_APPEARS_ON);
  var attributeCalledSectionThisQueryBelongsTo = repository.getItemFromUuid(SectionView.UUID_FOR_ATTRIBUTE_SECTION_THIS_QUERY_BELONGS_TO);
  var categoryCalledSection = repository.getItemFromUuid(RootView.UUID_FOR_CATEGORY_SECTION);
  var tablePluginView = repository.getItemFromUuid(TablePlugin.UUID_FOR_PLUGIN_VIEW_TABLE);
  
  repository.beginTransaction();
  var newSection = repository.newItem("New Section");
  newSection.assignToCategory(categoryCalledSection);
  inPage.addConnectionEntry(attributeCalledSectionsInPage, newSection, attributeCalledPageThisSectionAppearsOn);
  newSection.addEntryForAttribute(attributeCalledPluginView, tablePluginView);

  var newQuery = repository.newItem("New Query");
  newQuery.assignToCategory(categoryCalledQuery);
  newSection.addConnectionEntry(attributeCalledQuerySpec, newQuery, attributeCalledSectionThisQueryBelongsTo);
  repository.endTransaction();
  return newSection;
};


/**
 * The RootView uses an instance of a PageView to display a Page in the
 * browser window.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inRootView    The RootView that this PageView is nested in. 
 * @param    inHTMLElement The HTMLElement to display the HTML in. 
 * @param    inPage        The page item to be displayed by this view. 
 */
PageView.prototype = new View();  // makes PageView be a subclass of View
function PageView(inRootView, inHTMLElement, inPage) {
  Util.assert(inRootView instanceof RootView);
  Util.assert(inHTMLElement instanceof HTMLElement);
  Util.assert(inPage instanceof Item);

  // instance properties
  this.setSuperview(inRootView);
  this.setHTMLElement(inHTMLElement);
  this.myPage = inPage;
  
  this._myPageSummaryView = null;
  this._myHeaderText = null;
  this.myListOfSectionViews = [];
}


/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
PageView.prototype.getPageTitle = function () {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  var pageTitle = this.myPage.getSingleStringValueFromAttribute(attributeCalledShortName);
  if (!pageTitle) {
    pageTitle = this.myPage.getDisplayName();
  }
  return pageTitle;
};

  
/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the data, and tells the sub-views to refresh themselves too.
 *
 * @scope    public instance method
 */
PageView.prototype.refresh = function () {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    this._myHeaderText.refresh();
    this._myPageSummaryView.refresh();
    for (var key in this.myListOfSectionViews) {
      var sectionView = this.myListOfSectionViews[key];      
      sectionView.refresh();
    }
    this._refreshEditModeControls();
  }
};


/**
 * Re-creates all the HTML for the PageView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
PageView.prototype.doInitialDisplay = function () {
  Util.assert(this.getHTMLElement() instanceof HTMLElement);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();

  var pageDivElement = this.getHTMLElement();
  
  var headerElement = View.createAndAppendElement(pageDivElement, "h1");
  this._myHeaderText = new TextView(this, headerElement, this.myPage, attributeCalledName,
    this.myPage.getSingleEntryFromAttribute(attributeCalledName), PageView.CSS_CLASS_PAGE_HEADER, false);

  var summaryViewDiv = View.createAndAppendElement(pageDivElement, "div");
  this._myPageSummaryView = new TextView(this, summaryViewDiv, this.myPage, attributeCalledSummary,
    this.myPage.getSingleEntryFromAttribute(attributeCalledSummary), SectionView.CSS_CLASS_SUMMARY_TEXT, true);

  // add <div> elements for each of the sections on the page
  // and create a new SectionView for each section
  var attributeCalledSectionsInPage = this.getWorld().getItemFromUuid(PageView.UUID_FOR_ATTRIBUTE_SECTIONS_IN_PAGE);
  var listOfEntriesForSections = this.myPage.getEntriesForAttribute(attributeCalledSectionsInPage);
  
  for (var key in listOfEntriesForSections) {
    var entryForSection = listOfEntriesForSections[key];
    var section = entryForSection.getConnectedItem(this.myPage);
    if (section) {
      this._buildNewSection(section);
    }
  }
  this._wasInEditMode = this.isInEditMode();
  if (this._wasInEditMode) {this._buildEditControls();}
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
};


/**
 * Creates a new section in this page.
 *
 * @param  inSection newSection item
 * @param  inBeforeElt (optional) if specified, section view to be inserted before this elt
 * @scope    private instance method
 */
PageView.prototype._buildNewSection = function(inSection, inBeforeElt) {
  var pageDivElement = this.getHTMLElement();
  var sectionViewDiv = document.createElement("div");
  var sectionView = new SectionView(this, sectionViewDiv, inSection, this.myListOfSectionViews.length);
  if (inBeforeElt) {
    pageDivElement.insertBefore(sectionViewDiv, inBeforeElt);
  }
  else {
    pageDivElement.appendChild(sectionViewDiv);
  }
  this.myListOfSectionViews.push(sectionView);
  return sectionView;
};


/**
 * Called when the user clicks on the "New Section" button.
 *
 * @scope    private instance method
 */
PageView.prototype._addNewSection = function() {
  var newSection = PageView.newSection(this.getWorld(), this.myPage);
  this._buildNewSection(newSection, this._editModeDiv).refresh();
};


/**
 * Create the "new section" button in EditMode.
 *
 * @scope    private instance method
 */
PageView.prototype._buildEditControls = function() {
  if (!this._editModeDiv) {
    var pageDivElement = this.getHTMLElement();
    this._editModeDiv = View.createAndAppendElement(pageDivElement, "div", SectionView.ELEMENT_CLASS_SECTION);
    View.createAndAppendElement(this._editModeDiv,"br");
    var editButton = View.createAndAppendElement(this._editModeDiv, "input", 
      RootView.ELEMENT_CLASS_EDIT_MODE_ONLY_CONTROL);
    editButton.type = "Button";
    editButton.value = "New Section";
    editButton.onclick = this._addNewSection.bindAsEventListener(this);
  }
  else {
    this._editModeDiv.display = "Block";
  }
};


/**
 * Called when edit controls need to be refreshed
 *
 * @scope    private instance method
 */
PageView.prototype._refreshEditModeControls = function() {
  if (this._wasInEditMode != this.isInEditMode()) {
    this._wasInEditMode = this.isInEditMode();
    if (this.isInEditMode()) {
      this._buildEditControls();
    }
    else {
      this.getHTMLElement().removeChild(this._editModeDiv);
      // PENDING: why does hiding _editModeDiv still leave a blue line, gotta ask Brian about CSS
      this._editModeDiv = null;
    }
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
