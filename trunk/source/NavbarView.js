/*****************************************************************************
 NavbarView.js

******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
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
// Dependencies:
// -------------------------------------------------------------------


/**
 * The RootView uses an instance of a NavbarView to display a navigation
 * bar, with links to pages.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSuperView    The view that this LoginView is nested in. 
 * @param    inHTMLElement    The HTMLElement to display the HTML in. 
 */
NavbarView.prototype = new View();  // makes NavbarView be a subclass of View
function NavbarView(inSuperView, inHTMLElement) {
  // instance properties
  this.setSuperview(inSuperView);
  this.setHTMLElement(inHTMLElement);
}


/**
 * Re-creates all the HTML for the view, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
NavbarView.prototype.refresh = function () {
  if (!this.hasEverBeenDisplayed()) {
    this._rebuildView();
  }
};


/**
 * Re-creates the HTML for the view, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    private instance method
 */
NavbarView.prototype._rebuildView = function () {
  var divElement = this.getHTMLElement();
  
  var rootView = this.getRootView();
  var listOfPages = rootView.getPages();

  //get rid of all child nodes 
  divElement.innerHTML = '';

  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  var listOfStrings = [];

  listOfStrings.push("<ul class=\"menu\">");
  
  for (var key in listOfPages) {
    var page = listOfPages[key];
    var menuText = page.getSingleStringValueFromAttribute(attributeCalledShortName);
    var menuUrl = rootView.getUrlForItem(page);
    listOfStrings.push("<li class=\"menu_item\"><a href=\"" + menuUrl + "\" onclick=\"RootView.clickOnLocalLink(event)\">" + menuText + "</a></li>");
  }

  listOfStrings.push("</ul>");
  
  // write out the new nav bar content 
  var finalString = listOfStrings.join("");
  divElement.innerHTML = finalString;
  
  var newPageButton = View.createAndAppendElement(divElement, "input", RootView.ELEMENT_CLASS_EDIT_MODE_ONLY_CONTROL);
  newPageButton.type = "button";
  newPageButton.value = "New Page";
  newPageButton.onclick = this._clickOnNewPageButton.bindAsEventListener(this);
};


// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on the "New Page" button.
 *
 * @scope    private instance method
 */
NavbarView.prototype._clickOnNewPageButton = function(inEventObject) {
  var rootView = this.getRootView();
  var newPage = rootView.newPage();
  window.location = rootView.getUrlForItem(newPage);
  rootView.setCurrentContentViewFromUrl();
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
