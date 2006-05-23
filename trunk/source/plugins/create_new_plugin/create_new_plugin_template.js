// %(CLASS_NAME).js
// Created by %(AUTHOR)

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.%(CLASS_NAME)");
dojo.require("orp.view.PluginView");

/**
 * The %(CLASS_NAME) view displays a set of content items.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display this view in.
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order).
 */
orp.plugins.%(CLASS_NAME) = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "%(CLASS_NAME)");
};

dojo.inherits(orp.plugins.%(CLASS_NAME), orp.view.PluginView);  // makes %(CLASS_NAME) be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.%(CLASS_NAME).UUID = "%(ITEM_UUID)";
orp.view.SectionView.registerPlugin(orp.plugins.%(CLASS_NAME));


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.%(CLASS_NAME).getPluginItemUuid = function() {
	return orp.plugins.%(CLASS_NAME).UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.%(CLASS_NAME).getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
	return [
		{	uuid: "%(ENTRY_UUID_1)",
			item: pluginItem,
			attribute: world.getAttributeCalledName(),
			value: "%(DISPLAY_NAME)" },
		{	uuid: "%(ENTRY_UUID_2)",
			item: pluginItem,
			attribute: world.getAttributeCalledShortName(),
			value: "%(CLASS_NAME)" },
		{	uuid: "%(ENTRY_UUID_3)",
			item: pluginItem,
			attribute: world.getAttributeCalledClassName(),
			value: "%(CLASS_NAME)" },
		{	uuid: "%(ENTRY_UUID_4)",
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
orp.plugins.%(CLASS_NAME).prototype.getClass = function() {
	return orp.plugins.%(CLASS_NAME);
};

/**
 * This method is called whenever the %(CLASS_NAME) plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.%(CLASS_NAME).prototype.refresh = function() {
	var listOfContentItems = this.fetchItems();
	var outlineDiv = this.getHtmlElement();

	// %(AUTHOR):
	//  This is just example code.
	//  You should replace the code below with your own code.
	orp.view.View.removeChildrenOfElement(outlineDiv);
	var ulElement = orp.view.View.appendNewElement(outlineDiv, "ul");
	for (var i in listOfContentItems) {
		var contentItem = listOfContentItems[i];
		var liText = contentItem.getDisplayName("{no name}") + " ";
		var liElement = orp.view.View.appendNewElement(ulElement, "li", null, null, liText);
	}
};

// End of file
