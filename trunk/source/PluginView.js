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
// Dependencies:
//   World.js
//   Util.js
// -------------------------------------------------------------------




/**
 * A PluginView display one or more content items. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSuperView    The superview for this view. 
 * @param    inHTMLElement    The HTMLElement to display this view in. 
 * @param    inQuery  Query that produces the items for this PluginView to display
 * @syntax   var PluginView = new PluginView()
 */
PluginView.prototype = new View();  // makes PluginView be a subclass of View
function PluginView(inSuperView, inHTMLElement,inQuery, inLayout) {
  if (!inSuperView) {return;} // initial call that subclasses of PluginViews make without parameters
  this.setSuperview(inSuperView);
  this.setHTMLElement(inHTMLElement);
  this._query = inQuery;
  this._layout = inLayout;
}


/**
 * Gets the list of content items to display.
 *
 * @scope    PENDING
 */
PluginView.prototype.fetchItems = function() {
  if (Util.isArray(this._query)) {
    //PENDING hack to allow Plugin to support list of items or query
    this._listOfItems = this._query;
  }
  else {
    this._listOfItems = this._query ? this.getWorld().getResultItemsForQuery(this._query) : [];
  }
  return this._listOfItems;
};

/**
 * Returns the registered name of this PluginView.
 *
 * @scope    public instance method
 * @return   A string.
 */
PluginView.prototype.getPluginName = function () {
  Util.assert(false);
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
PluginView.prototype.endOfLife = function () {
  this.getHTMLElement().innerHTML = "";
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
