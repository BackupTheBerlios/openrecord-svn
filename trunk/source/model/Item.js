/*****************************************************************************
 Item.js
 
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
//   Util.js
//   World.js
//   Value.js
//   Entry.js
// -------------------------------------------------------------------


/**
 * Instances of the Item class know how to store and retrieve their
 * attribute values.
 *
 * WARNING: This constructor method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * If you're writing code in a view class, instead of calling this
 * constructor, call the newItem() method on World: world.newItem()
 * 
 * @scope    protected instance constructor
 * @param    inWorld    The world that this value is a part of. 
 * @param    inUuid    The UUID for this value. 
 */
Item.prototype = new Entry();  // makes Item be a subclass of Entry
function Item(inWorld, inUuid) {
  this._Entry(inWorld, inUuid);
  
  this.__myListOfValues = null;
}


/**
 * Initializes a new item that has just been created by a user action.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method is NOT used for setting the properties of values that
 * are being rehydrated from a dehydrated JSON string.  For that, you
 * need to call item.rehydrate();
 *
 * @scope    protected instance method
 * @param    inObserver    Optional. An object or method to be registered as an observer of the returned item. 
 */
Item.prototype._initialize = function (inObserver) {
  this._initializeEntry();

  this.__myListOfValues = [];
  if (inObserver) {
    this.addObserver(inObserver);
  }
};


/**
 * Sets the properties of a newly rehydrated value object.
 *
 * WARNING: This method should be called ONLY from a 
 * VirtualServer implementation.
 *
 * This method should only be called from VirtualServer code that is
 * rehydrating dehydrated value objects. 
 *
 * @scope    protected instance method
 * @param    inTimestamp    A Date object with the creation timestamp for this item. 
 * @param    inUserstamp    The user who created this item. 
 */
Item.prototype._rehydrate = function (inTimestamp, inUserstamp) {
  this._rehydrateEntry(inTimestamp, inUserstamp);
  
  this.__myListOfValues = [];
};


// -------------------------------------------------------------------
// Value adding methods
// -------------------------------------------------------------------

/**
 * Creates a new value object and adds the new value to the item's 
 * list of values.
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to associate the value with. 
 * @param    inContentData    The content data to initialize the value to.
 * @return   A value object.
 */
Item.prototype.addValue = function (inContentData) {
  return this.addAttributeValue(null, inContentData);
};


/**
 * Assigns a value to an attribute in this item.
 *
 * Given an attribute and content data, creates a value object with the 
 * content data, and sets the item's attribute to the new value.
 * For example, to make a Kermit green:
 * <pre>
 *    kermit.addAttributeValue(color, "green");
 * </pre>
 * Attributes can always have more than one assigned value, so
 * you can make Kermit be both blue and green by doing:
 * <pre>
 *    kermit.addAttributeValue(color, "green");
 *    kermit.addAttributeValue(color, "blue");
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    The attribute to assign the value to. 
 * @param    inContentData    The content data to initialize the value with.
 * @return   A value object.
 */
Item.prototype.addAttributeValue = function (inAttribute, inContentData) {
  return this.replaceValueWithAttributeValue(null, inAttribute, inContentData);
};


/**
 * Replaces an existing value with a new value.
 *
 * @scope    public instance method
 * @param    inValue    The old value to be replaced.
 * @param    inContentData    The content data to initialize the new value to.
 * @return   The new replacement value object.
 */
Item.prototype.replaceValue = function (inValue, inContentData) {
  return this.replaceValueWithAttributeValue(inValue, null, inContentData);
};


/**
 * Replaces an existing value with a new value, and assigns the new value
 * to an attribute.
 *
 * @scope    public instance method
 * @param    inValue    The old value to be replaced.
 * @param    inAttribute    The attribute to assign the value to. 
 * @param    inContentData    The content data to initialize the new value to.
 * @return   The new replacement value object.
 */
Item.prototype.replaceValueWithAttributeValue = function (inValue, inAttribute, inContentData) {
  var itemOrValue = inValue || this;
  var value = this.getWorld()._newValue(itemOrValue, inAttribute, inContentData);
  this.__myListOfValues.push(value);
  return value;
};


// -------------------------------------------------------------------
// Accessor methods where the answer depends on the retrieval filter
// -------------------------------------------------------------------

/**
 * Given an attribute, this method returns the list of all the values that 
 * have been assigned to that attribute for this item.
 *
 * For example, to find out what color Kermit is: 
 * <pre>
 *    var valueList = kermit.getValuesForAttribute(color);
 *    for (var i = 0; i < valueList.length; ++i) {
 *      alert("Kermit is " + valueList[i]);
 *    }
 * </pre>
 *
 * @scope    public instance method
 * @param    inAttribute    An attribute that we want to know the values of. 
 * @return   A list of value objects.
 */
Item.prototype.getValuesForAttribute = function (inAttribute) {
  var listOfValuesForAttribute = [];
  var listOfValues = this.getValues();
  for (var key in listOfValues) {
    var value = listOfValues[key];
    var attribute = value.getAttribute();
    if (attribute == inAttribute) {
      listOfValuesForAttribute.push(value);
    }
  }
  listOfValuesForAttribute.sort(Entry.compareOrdinals);
  return listOfValuesForAttribute;
};


/**
 * Returns a list of all the values assigned to an item.
 *
 * @scope    public instance method
 * @return   A list of value objects.
 */
Item.prototype.getValues = function () {
  var filter = this.getWorld().getRetrievalFilter();
  var listOfValues = this.__myListOfValues;
  var filteredListOfValues = [];
  var key;
  var value;
  
  switch (filter) {
    case World.RETRIEVAL_FILTER_LAST_EDIT_WINS:
      for (key in listOfValues) {
        value = listOfValues[key];
        if (!value.hasBeenReplaced() && !value.hasBeenDeleted()) {
          filteredListOfValues.push(value);
        }
      }
      break;
    case World.RETRIEVAL_FILTER_SINGLE_USER:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_DEMOCRATIC:
      // PENDING: This still needs to be implemented.
      Util.assert(false);
      break;
    case World.RETRIEVAL_FILTER_UNABRIDGED:
      filteredListOfValues = listOfValues;
      break;
    default:
      // We should never get here.  If we get here, it's an error.
      Util.assert(false);
      break;
  }
  filteredListOfValues.sort(Entry.compareOrdinals);
  return filteredListOfValues;
};


/**
 * Returns a list of all the attributes that this item has values
 * assigned to.
 *
 * @scope    public instance method
 * @return   A list of attribute items.
 */
Item.prototype.getAttributes = function () {
  var listOfAttributes = [];
  var listOfValues = this.getValues();
  for (var key in listOfValues) {
    var value = listOfValues[key];
    var attribute = value.getAttribute();
    Util.addObjectToSet(attribute, listOfAttributes);
  }
  listOfAttributes.sort(Entry.compareOrdinals);
  return listOfAttributes;
};


// -------------------------------------------------------------------
// Attribute accessor methods
// -------------------------------------------------------------------

/**
 * Returns a display name for the item.
 *
 * @scope    public instance method
 * @return   A string with a display name for the item.
 */
Item.prototype.getDisplayName = function (inDefaultString) {
  var listOfNameValues = this.getName();
  var primaryName = listOfNameValues[0];
  return primaryName.getDisplayString();
};
  

/**
 * Returns a list of the values assigned to the "name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the values assigned to the "name" attribute.
 */
Item.prototype.getName = function (inDefaultString) {
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  return this.getValuesForAttribute(attributeCalledName);
};


/**
 * Returns a list of the values assigned to the "short name" attribute.
 *
 * @scope    public instance method
 * @return   A list of the values assigned to the "short name" attribute.
 */
Item.prototype.getShortName = function (inDefaultString) {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  return this.getValuesForAttribute(attributeCalledShortName);
};


/**
 * Returns a string describing the item.
 *
 * @scope    public instance method
 * @return   A string with a description of the item.
 */
Item.prototype.toString = function () {
  var returnString = "[Item #" + this.getUniqueKeyString() + " ";
  var attributeCategory = this.getWorld().getAttributeCalledCategory();
  var listOfCategories = this.getValuesForAttribute(attributeCategory);
  for (var key in listOfCategories) {
    var category = listOfCategories[key];
    Util.assert(category instanceof Item);
    returnString += "(" + category.getDisplayName() + ")";
  }
  returnString += " \"" + this.getDisplayName() + "\"" + "]";
  return returnString; 
};


// -------------------------------------------------------------------
// Non-Attribute Accessor Methods
// -------------------------------------------------------------------

/**
 * Given a category, returns "true" if the item has been assigned to 
 * that category.
 *
 * Also returns true if the item has been assigned to some category which is in
 * turn assigned to the given category, and so on, up the chain of category 
 * assignments.
 *
 * @scope    public instance method
 * @return   A boolean.  True if the item has been assigned to the category.
 */
Item.prototype.isInCategory = function (inCategory) {
  Util.assert(inCategory instanceof Item);

  var categoryAttribute = this.getWorld().getAttributeCalledCategory();
  var valueList = this.getValuesForAttribute(categoryAttribute);
  var key;
  var value;
  
  // look at all the categories this item is assigned to, and see if one of them is "inCategory"
  for (key in valueList) {
    value = valueList[key];
    if (value.getContentData() == inCategory) {
      return true;
    }
  }
  
  // look at all the categories this item is assigned to, and see if one of them
  // is in turn in the categoery "inCategory"
  for (key in valueList) {
    value = valueList[key];
    // PENDING: 
    //   This will go into an infinite loop if there is ever a cycle in the category 
    //   assignments, like: A is in category B, and B is in C, and C is in A.
    //   We need to use a non-recursive search of the graph.
    // PENDING:
    //   Do we also need to register as an observer of something, so that if we later
    //   become a member of that category in question, then we can notify whoever
    //   is observing us?
    if ((value.getContentData() != this) && (value.getContentData().isInCategory(inCategory))) {
      return true;
    }
  }
  return false;
};
 

// -------------------------------------------------------------------
// Observer/Observable Methods
// -------------------------------------------------------------------

/**
 * Registers an object or method as an observer of this item, so that
 * the observer will be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    An object or method to be registered as an observer of the item. 
 */
Item.prototype.addObserver = function (inObserver) {
  this.getWorld().addItemObserver(this, inObserver);
};


/**
 * Removes an object or method from the set of observers of this item, so 
 * that the observer will no longer be notified when the item changes.
 *
 * @scope    public instance method
 * @param    inObserver    The object or method to be removed from the set of observers. 
 */
Item.prototype.removeObserver = function (inObserver) {
  this.getWorld().removeItemObserver(this, inObserver);
};


// -------------------------------------------------------------------
// Protected Methods
// -------------------------------------------------------------------

/**
 * Adds a new value to the item when the items and values are first
 * being loaded by the backing store.
 *
 * WARNING: This method should be called ONLY from the  
 * value._rehydrate() method.
 * 
 * @scope    protected instance method
 * @param    inValue    The value to be associated with this item. 
 */
Item.prototype._addRehydratedValue = function (inValue) {
  this.__myListOfValues.push(inValue);
};
  

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
