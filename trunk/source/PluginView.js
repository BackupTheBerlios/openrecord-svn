/*****************************************************************************
 PluginView.js

******************************************************************************
 Written in 2005 by 
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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global View  */
// -------------------------------------------------------------------


/**
 * A PluginView displays one or more content items. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???. 
 * @syntax   var PluginView = new PluginView()
 */
PluginView.prototype = new View();  // makes PluginView be a subclass of View
function PluginView(superview, htmlElement, querySpec, layoutItem, cssClassName) {
  if (!superview) {return;} // initial call that subclasses of PluginViews make without parameters

  View.call(this, superview, htmlElement, cssClassName);

  this._querySpec = querySpec;
  this._queryRunner = this.getWorld().newQueryRunner(this._querySpec, this);
  this._layout = layoutItem;
  this._pluginItem = null;
}


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the registered name of this PluginView.
 *
 * @scope    public instance method
 * @return   A string.
 */
PluginView.prototype.getPluginItem = function() {
  if (!this._pluginItem) {
    var pluginClass = this.getClass();
    // alert(pluginClass);
    var pluginItemUuid = pluginClass.getPluginItemUuid();
    this._pluginItem = this.getWorld().getItemFromUuid(pluginItemUuid);
  }
  return this._pluginItem;
};


/**
 * Gets the list of content items to display.
 *
 * @scope    PENDING
 */
PluginView.prototype.fetchItems = function() {
  this._listOfItems = this._queryRunner.getResultItems();
  return this._listOfItems;
};


/**
 * Returns the query spec item used to populate this plugin view.
 *
 * @scope    public instance method
 * @return   A query spec item.
 */
PluginView.prototype.getQuerySpec = function() {
  return this._querySpec;
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
PluginView.prototype.endOfLife = function() {
  View.removeChildrenOfElement(this.getHtmlElement());
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
