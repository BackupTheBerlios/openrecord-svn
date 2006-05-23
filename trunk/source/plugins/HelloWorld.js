// HelloWorld.js
// Written by Brian Douglas Skinner

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.HelloWorld");
dojo.require("orp.view.PluginView");

/**
 * The HelloWorld view displays a set of content items.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display this view in.
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order).
 */
orp.plugins.HelloWorld = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "HelloWorld");
};

dojo.inherits(orp.plugins.HelloWorld, orp.view.PluginView);  // makes HelloWorld be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.HelloWorld.UUID = "d53d6ce0-6b71-11da-bb5c-0011111f4abe";
orp.view.SectionView.registerPlugin(orp.plugins.HelloWorld);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.HelloWorld.getPluginItemUuid = function() {
	return orp.plugins.HelloWorld.UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.HelloWorld.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
	return [
		{	uuid: "d53d6ce1-6b71-11da-bb5c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledName(),
			value: "Hello World" },
		{	uuid: "d53d6ce2-6b71-11da-bb5c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledShortName(),
			value: "HelloWorld" },
		{	uuid: "d53d6ce3-6b71-11da-bb5c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledClassName(),
			value: "HelloWorld" },
		{	uuid: "d53d6ce4-6b71-11da-bb5c-0011111f4abe",
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
orp.plugins.HelloWorld.prototype.getClass = function() {
	return orp.plugins.HelloWorld;
};

/**
 * This method is called whenever the HelloWorld plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.HelloWorld.prototype.refresh = function() {
	var outlineDiv = this.getHtmlElement();
	outlineDiv.innerHTML = "<p>Hello World!</p>";
};

// End of file

