/*****************************************************************************
 item_view.js
 
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
//   complete_view.js
//   detail_layout.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// ItemView public class constants
// -------------------------------------------------------------------
ItemView.ELEMENT_ID_DETAIL_DIV_PREFIX = "detail_layout_div_for_item_";


// -------------------------------------------------------------------
// ItemView class properties
// -------------------------------------------------------------------
// none


/**
 * The CompleteView uses an instance of a ItemView to display an Item in the
 * browser window.
 *
 * @scope    public instance constructor
 * @param    inItem    The item to be displayed by this view. 
 * @param    inDivElement    The HTMLDivElement to display the HTML in. 
 * @param    inCompleteView    The CompleteView that this ItemView is nested in. 
 */
function ItemView(inItem, inDivElement, inCompleteView) {
  Util.assert(inItem instanceof Item);
  Util.assert(inDivElement instanceof HTMLDivElement);
  Util.assert(inCompleteView instanceof CompleteView);

  // instance properties
  this.myItem = inItem;
  this.myDivElement = inDivElement;
  this.myCompleteView = inCompleteView;
  this.myLayout = new DetailLayout(this);
}


/**
 * Returns the stevedore object that's supplying our data items.
 *
 * @scope    public instance method
 * @return   The stevedore object.
 */
ItemView.prototype.getStevedore = function () {
  return this.myCompleteView.getStevedore();
};


/**
 * Returns a list with a single content item in it.
 *
 * @scope    public instance method
 * @return   A list with one item in it.
 */
ItemView.prototype.getListOfContentItems = function () {
  var listOfContentItems = [];
  listOfContentItems.push(this.myItem);
  return listOfContentItems;
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
ItemView.prototype.isInEditMode = function () {
  return this.myCompleteView.isInEditMode();
};

  
/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
ItemView.prototype.getPageTitle = function () {
  return this.myItem.getShortName();
};


/**
 * Hides the ItemView by setting the div element's display style to "none".
 *
 * @scope    public instance method
 */
ItemView.prototype.hide = function () {
  Util.assert(this.myDivElement instanceof HTMLDivElement);
  this.myDivElement.style.display = "none";
};


/**
 * Re-creates all the HTML for the ItemView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
ItemView.prototype.display = function () {
  Util.assert(this.myItem instanceof Item);
  Util.assert(this.myDivElement instanceof HTMLDivElement);
  
  var listOfStrings = [];

  // add an <h1> heading with the name of the page
  listOfStrings.push("<h1 id=\"" + CompleteView.URL_ITEM_PREFIX + this.myItem.getUuid() + "\">" + this.myItem.getDisplayName() + "</h1>");

  // add a <div> element for the detail layout
  var detailDivId = ItemView.ELEMENT_ID_DETAIL_DIV_PREFIX + this.myItem.getUuid();
  listOfStrings.push("<div id=\"" + detailDivId + "\"></div>");

  // write out all the new content 
  var finalString = listOfStrings.join("");
  this.myDivElement.innerHTML = finalString;
  this.myDivElement.style.display = "block";

  // let the detailLayout add its own content
  var detailLayoutDivElement = document.getElementById(detailDivId);
  this.myLayout.setDivElement(detailLayoutDivElement);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
