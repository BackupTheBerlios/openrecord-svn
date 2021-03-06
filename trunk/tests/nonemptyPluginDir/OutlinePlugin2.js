/*****************************************************************************
 OutlinePlugin2.js

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
dojo.provide("orp.plugins.OutlinePlugin2");
dojo.require("orp.view.PluginView");
dojo.require("orp.view.SectionView");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
//
/*global Util  */
/*global View  */
/*global RootView  */
// -------------------------------------------------------------------

/**
 * An OutlinePlugin2 displays a set of content items for a SectionView.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display this view in.
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???.
 * @syntax   var plugin = new orp.plugins.OutlinePlugin2()
 */
orp.plugins.OutlinePlugin2 = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "OutlinePlugin2");
};

dojo.inherits(orp.plugins.OutlinePlugin2, orp.view.PluginView);  // makes OutlinePlugin2 be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------

orp.plugins.OutlinePlugin2.UUID = "99a09d90-598a-11da-87ac-c103016080e1";

orp.view.SectionView.registerPlugin(orp.plugins.OutlinePlugin2);

// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin
 */
orp.plugins.OutlinePlugin2.getPluginItemUuid = function() {
	return orp.plugins.OutlinePlugin2.UUID;
};

orp.plugins.OutlinePlugin2.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
	return [
		{	uuid: "99a187f0-598a-11da-87ac-c103016080e1",
			item: pluginItem,
			attribute: world.getAttributeCalledName(),
			value: "Outline2 View" },
		{	uuid: "99a24b40-598a-11da-87ac-c103016080e1",
			item: pluginItem,
			attribute: world.getAttributeCalledShortName(),
			value: "Outline2" },
		{	uuid: "99a335a0-598a-11da-87ac-c103016080e1",
			item: pluginItem,
			attribute: world.getAttributeCalledClassName(),
			value: "OutlinePlugin2" },
		{	uuid: "99a3f8f0-598a-11da-87ac-c103016080e1",
			item: pluginItem,
			attribute: world.getAttributeCalledCategory(),
			inverseAttribute: world.getAttributeCalledItemsInCategory(),
			value: world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW) }
	];
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
orp.plugins.OutlinePlugin2.prototype.getClass = function() {
	return orp.plugins.OutlinePlugin2;
};

/**
 * Re-creates all the HTML for the OutlinePlugin2, and hands the HTML to the
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.plugins.OutlinePlugin2.prototype.refresh = function() {
	var listOfContentItems = this.fetchItems();
	var outlineDiv = this.getHtmlElement();
	orp.view.View.removeChildrenOfElement(outlineDiv);
	var ulElement = orp.view.View.appendNewElement(outlineDiv, "ul");
	for (var contentItemKey in listOfContentItems) {
		var contentItem = listOfContentItems[contentItemKey];
		var liText = contentItem.getDisplayName("{no name}") + " ";
		var liElement = orp.view.View.appendNewElement(ulElement, "li", null, null, liText);
		var anchorElement = orp.view.View.appendNewElement(liElement, "a", orp.view.SectionView.cssClass.MORE_LINK);

		// PENDING:
		//  We need a better way to get the URL for a content item
		anchorElement.setAttribute("href", orp.view.RootView.URL_HASH_ITEM_PREFIX + contentItem.getUuidString());

		// orp.view.View.appendNewTextNode(anchorElement, "(more &#8658;)");
		anchorElement.innerHTML = "(more &#8658;)";

		dojo.event.connect(anchorElement, "onclick", orp.view.RootView.clickOnLocalLink);
	}
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
