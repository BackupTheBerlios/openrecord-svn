/*****************************************************************************
 ItemView.js

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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.view.ItemView");
dojo.require("orp.view.View");
dojo.require("orp.view.RootView");
dojo.require("orp.model.Item");
dojo.require("orp.DetailPlugin");
dojo.require("orp.lang.Lang");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
//
/*global document, HTMLElement  */
/*global Util  */
/*global Item  */
/*global DetailPlugin  */
/*global RootView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The RootView uses an instance of a ItemView to display an Item in the
 * browser window.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display the HTML in.
 * @param    item    The item to be displayed by this view.
 */
orp.view.ItemView = function(superview, htmlElement, item) {
	orp.lang.assert(htmlElement instanceof HTMLElement);
	orp.lang.assert(item instanceof orp.model.Item);

	orp.view.View.call(this, superview, htmlElement, "ItemView");

	// instance properties
	this._item = item;
	this._pluginView = null;
};

dojo.inherits(orp.view.ItemView, orp.view.View);  // makes ItemView be a subclass of View


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
orp.view.ItemView.prototype.getPageTitle = function() {
	var pageTitle = this._item.getDisplayString();
	return pageTitle;
};


/**
 * Re-creates all the HTML for the ItemView, and hands the HTML to the
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.ItemView.prototype.refresh = function() {
	orp.lang.assert(this._item instanceof orp.model.Item);
	orp.lang.assert(this.getHtmlElement() instanceof HTMLElement);


	var itemDivElement = this.getHtmlElement();
	orp.view.View.removeChildrenOfElement(itemDivElement);
	var headerElement = orp.view.View.appendNewElement(itemDivElement, "h1", null, null, this._item.getDisplayName());
	var detailPluginElement = orp.view.View.appendNewElement(itemDivElement, "div");

	this._pluginView = new orp.DetailPlugin(this, detailPluginElement, [this._item]);
	this._pluginView.refresh();
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
