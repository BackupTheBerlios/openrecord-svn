/*****************************************************************************
 OutlinePlugin.js
 
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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global View  */
/*global RootView  */
// -------------------------------------------------------------------



// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
OutlinePlugin.UUID_FOR_PLUGIN_VIEW_OUTLINE = "00040302-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.registerPlugin(OutlinePlugin);


/**
 * An OutlinePlugin displays a set of content items for a SectionView. 
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???. 
 * @syntax   var outline = new OutlinePlugin()
 */
OutlinePlugin.prototype = new PluginView();  // makes OutlinePlugin be a subclass of PluginView
function OutlinePlugin(superview, htmlElement, querySpec, layoutItem) {
  PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "OutlinePlugin");
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
OutlinePlugin.getPluginItemUuid = function() {
  return OutlinePlugin.UUID_FOR_PLUGIN_VIEW_OUTLINE;
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
OutlinePlugin.prototype.getClass = function() {
  return OutlinePlugin;
};


/**
 * Re-creates all the HTML for the OutlinePlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
OutlinePlugin.prototype.refresh = function() {
  var listOfContentItems = this.fetchItems();
  var outlineDiv = this.getHtmlElement();
  View.removeChildrenOfElement(outlineDiv);
  var ulElement = View.appendNewElement(outlineDiv, "ul");
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    var liText = contentItem.getDisplayName("{no name}") + " ";
    var liElement = View.appendNewElement(ulElement, "li", null, null, liText);
    // View.appendNewTextNode(liElement, contentItem.getDisplayName("{no name}") + " ");
    var anchorElement = View.appendNewElement(liElement, "a", SectionView.CSS_CLASS_MORE_LINK);

    // PENDING: 
    //  We shouldn't call the private method _getUuid()
    //  We need a better way to get the URL for a content item
    anchorElement.setAttribute("href", RootView.URL_HASH_ITEM_PREFIX + contentItem._getUuid());

    // View.appendNewTextNode(anchorElement, "(more &#8658;)");
    anchorElement.innerHTML = "(more &#8658;)";
    Util.addEventListener(anchorElement, "click", RootView.clickOnLocalLink);
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
