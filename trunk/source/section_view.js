/*****************************************************************************
 section_view.js
 
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
//   util.js
//   page_view.js
//   table_layout.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// SectionView public class constants
// -------------------------------------------------------------------
SectionView.LAYOUT_TABLE = "Table";
SectionView.LAYOUT_OUTLINE = "Outline";
SectionView.LAYOUT_DETAIL = "Detail";
SectionView.LAYOUT_BAR_CHART = "Bar Chart";

SectionView.ELEMENT_CLASS_SECTION = "section";
SectionView.ELEMENT_CLASS_SECTION_LAYOUT_MENU = "section_layout_menu";
SectionView.ELEMENT_CLASS_SIMPLE_TABLE = "simple_table";
SectionView.ELEMENT_CLASS_NEW_ITEM = "newitem";
SectionView.ELEMENT_CLASS_PLAIN = "plain";
SectionView.ELEMENT_CLASS_LABEL = "label";
SectionView.ELEMENT_CLASS_TITLE = "title";
SectionView.ELEMENT_CLASS_TEXT_FIELD_IN_TABLE_CELL = "text_field_in_table_cell";
SectionView.ELEMENT_CLASS_SELECTED = "selected";
SectionView.ELEMENT_CLASS_MORE_LINK = "more";
SectionView.ELEMENT_CLASS_TEXT_VIEW = "text_view";

SectionView.ELEMENT_ID_SELECT_MENU_SUFFIX = "_select_menu";
SectionView.ELEMENT_ID_LAYOUT_DIV_SUFFIX = "_layout_div";
SectionView.ELEMENT_ID_CELL_MIDFIX = "_cell_";
SectionView.ELEMENT_ID_SUMMARY_DIV_SUFFIX = "_summary_div";

SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER = "section_number";
SectionView.ELEMENT_ATTRIBUTE_CELL_NUMBER = "cell_number";


// -------------------------------------------------------------------
// SectionView class properties
// -------------------------------------------------------------------
SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName = {};


/**
 * A PageView uses instances of a SectionViews to display the Sections 
 * of a page. 
 *
 * @scope    public instance constructor
 * @param    inPageView    The PageView that serves as the superview for this view. 
 * @param    inSection    The Section item to be displayed in by this view. 
 * @param    inSectionNumber    The number of the section on the page (1, 2, 3, 4...). 
 * @syntax   var sectionView = new SectionView()
 */
function SectionView(inPageView, inSection, inSectionNumber) {
  Util.assert(inPageView instanceof PageView);
  Util.assert(inSection instanceof Item);
  
  // instance properties
  // PROBLEM: these should all be private
  this.myPageView = inPageView;
  this.mySection = inSection;
  this.mySectionNumber = inSectionNumber;
  var query = inSection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY)[0];
  this.myListOfContentItems = this.getStevedore().getListOfResultItemsForQuery(query); 
  this.myDivElement = null;
  var layoutName = inSection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_LAYOUT_NAME)[0];
  this.myLayout = this.getLayoutFromLayoutName(layoutName);
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


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the Stevedore instance that this SectionView is using.
 *
 * @scope    public instance method
 * @return   A Stevedore object.
 */
SectionView.prototype.getStevedore = function () {
  return this.myPageView.myCompleteView.getStevedore();
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
SectionView.prototype.isInEditMode = function () {
  return this.myPageView.isInEditMode();
};

  
/**
 * Given the name of a layout ("Table", "Outline", etc.), returns a newly
 * created layout object of that type, initialized to be the layout for this 
 * section
 *
 * @scope    public instance method
 * @param    inLayoutName    A string. One of the registered layout names. 
 * @return   A newly created layout object, initialized to be the layout for this section.
 */
SectionView.prototype.getLayoutFromLayoutName = function (inLayoutName) {
  Util.assert(Util.isString(inLayoutName));
  
  var newLayout = null;
  // for (var layoutName in SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName) {
  //   var layoutClass = SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[layoutName];
  //   if (inLayoutName == layoutName) {
  //     newLayout = new layoutClass(this);
  //   }
  // }
  var layoutClass = SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[inLayoutName];
  if (layoutClass) {
    newLayout = new layoutClass(this);
  }
  return newLayout;
};


/**
 * Tells the SectionView what HTMLDivElement to display the Section in.
 *
 * @scope    public instance method
 * @param    inDivElement    The HTMLDivElement to display the Section in. 
 */
SectionView.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);

  this.myDivElement = inDivElement;
  this.display();
};



/**
 * Returns a list of content items to be displayed in this SectionView.
 *
 * @scope    public instance method
 * @return   A list of content items.
 */
SectionView.prototype.getListOfContentItems = function () {
  var query = this.mySection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY)[0];
  this.myListOfContentItems = this.getStevedore().getListOfResultItemsForQuery(query); 
  return this.myListOfContentItems;
};



/**
 * Re-creates all the HTML for the SectionView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
SectionView.prototype.display = function () {
  if (!this.myDivElement) {
    return;
  }
  var query = this.mySection.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_QUERY)[0];
  this.myListOfContentItems = this.getStevedore().getListOfResultItemsForQuery(query); 
  if (!this.myListOfContentItems) {
    return;
  }

  var listOfStrings = [];

  // create the opening <div> for the section
  listOfStrings.push("<div class=\"" + SectionView.ELEMENT_CLASS_SECTION + "\">");
  listOfStrings.push("<h2>" + this.mySection.getDisplayName() + "</h2>");

  var summaryDivId = this.myDivElement.id + SectionView.ELEMENT_ID_SUMMARY_DIV_SUFFIX;
  listOfStrings.push("<div id=\"" + summaryDivId + "\"></div>");
  
  // create the layout editing controls, if we're in edit mode
  var selectMenuId = this.myDivElement.id + SectionView.ELEMENT_ID_SELECT_MENU_SUFFIX;
  if (this.myPageView.isInEditMode()) {
    listOfStrings.push("<select id=\"" + selectMenuId + "\" class=\"" + SectionView.ELEMENT_CLASS_SECTION_LAYOUT_MENU + "\" name=\"" + selectMenuId + "\" " + SectionView.ELEMENT_ATTRIBUTE_SECTION_NUMBER + "=\"" + this.mySectionNumber + "\">");
    for (var layoutName in SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName) {
      listOfStrings.push("<option " + ((this.myLayout.getLayoutName() == layoutName) ? "selected" : "") + " value=\"" + layoutName + "\" onclick=\"SectionView.clickOnLayoutSelectionMenu(event)\">" + layoutName + "</option>:");
    }
    listOfStrings.push("</select>");
  }
  
  // create a div element for the layout class to use
  var layoutDivId = this.myDivElement.id + SectionView.ELEMENT_ID_LAYOUT_DIV_SUFFIX;
  listOfStrings.push("<div id=\"" + layoutDivId + "\"></div>");
  
  // create the closing </div> for the section
  listOfStrings.push("</div>");
  
  // write out all the new content 
  var finalString = listOfStrings.join("");
  this.myDivElement.innerHTML = finalString;

  // attach back-pointers to the newly created UI elements
  if (this.myPageView.isInEditMode()) {
    var selectElement = document.getElementById(selectMenuId);
    selectElement.mysectionview = this;
  }
  
  // set up the summary text view
  var summaryElement = document.getElementById(summaryDivId);
  new MultiLineTextView(this, this.mySection, Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY, summaryElement, SectionView.ELEMENT_CLASS_TEXT_VIEW);
  
  var layoutDivElement = document.getElementById(layoutDivId);
  this.myLayout.setDivElement(layoutDivElement);
};
  

// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on any of the layout option-select controls.
 * Called from an HTML option element within an HTML select element.
 *
 * @scope    public class method
 * @param    inEventObject    An event object. 
 */
SectionView.clickOnLayoutSelectionMenu = function (inEventObject) {
  var eventObject = inEventObject;
  if (!eventObject) { eventObject = window.event; }
  var optionElement = Util.getTargetFromEvent(eventObject);
  // PROBLEM: We could replace the lines above with "var optionElement = this;"
  // That would work fine in Firefox, but maybe it wouldn't work in other browsers?  
  
  var selectElement = optionElement.parentNode;
  var newChoiceName = optionElement.value;
  
  var sectionView = selectElement.mysectionview;
  
  if (sectionView.myLayout.getLayoutName() == newChoiceName) {
    // alert("line 213");
    return;
  } else {
    // alert("line 216");
    sectionView.myLayout = sectionView.getLayoutFromLayoutName(newChoiceName);
    sectionView.mySection.clear(Stevedore.UUID_FOR_ATTRIBUTE_LAYOUT_NAME);
    sectionView.mySection.assign(Stevedore.UUID_FOR_ATTRIBUTE_LAYOUT_NAME, newChoiceName);
  
    sectionView.display();
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
