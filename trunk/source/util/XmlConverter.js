/*****************************************************************************
 XmlConverter.js
 
******************************************************************************
 Written in 2005 by Mignon Belongie
  
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
dojo.provide("orp.util.XmlConverter");
dojo.require("orp.util.Util");
// dojo.provide("orp.util.XmlTextNodeToAttributeSpecifier");
// dojo.provide("orp.util.XmlAttributeToAttributeSpecifier");

/**
 * @param    tagPath    A sequence of nested XML tags (relative to an 'item-element'; see below).
 * @param    attribute  Will be assigned a value for every text node whose path equals the tag path.
 *
 * @scope    public instance constructor
 */
orp.util.XmlTextNodeToAttributeSpecifier = function(tagPath, attribute) {
  orp.util.assert(tagPath instanceof Array);
  orp.util.assert(attribute instanceof Item);
  this._tagPath = tagPath;
  this._attribute = attribute;
  var attributeCalledExpectedType = attribute.getWorld().getAttributeCalledExpectedType();
  var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
  this._listOfTypes = [];
  for (j in listOfExpectedTypeEntries) {
    var entry = listOfExpectedTypeEntries[j];
    this._listOfTypes.push(entry.getValue());
  }
  var attributeCalledInverseAttribute = attribute.getWorld().getAttributeCalledInverseAttribute();
  var inverseAttributeEntry = attribute.getSingleEntryFromAttribute(attributeCalledInverseAttribute);
  this._inverseAttribute = inverseAttributeEntry? inverseAttributeEntry.getValue(attribute) : null;
};


/**
 * @param    xmlAttributeName    Each value corresponding to the xmlAttributeName will be converted an entry of the current item.
 * @param    attribute           The attribute of the created entries.
 *
 * @scope    public instance constructor
 */
orp.util.XmlAttributeToAttributeSpecifier = function(xmlAttributeName, attribute) {
  orp.util.assert(attribute instanceof Item);
  this._xmlAttributeName = xmlAttributeName;
  this._attribute = attribute;
  var attributeCalledExpectedType = attribute.getWorld().getAttributeCalledExpectedType();
  var listOfExpectedTypeEntries = attribute.getEntriesForAttribute(attributeCalledExpectedType);
  this._listOfTypes = [];
  for (j in listOfExpectedTypeEntries) {
    var entry = listOfExpectedTypeEntries[j];
    this._listOfTypes.push(entry.getValue());
  }
  var attributeCalledInverseAttribute = attribute.getWorld().getAttributeCalledInverseAttribute();
  var inverseAttributeEntry = attribute.getSingleEntryFromAttribute(attributeCalledInverseAttribute);
  this._inverseAttribute = inverseAttributeEntry? inverseAttributeEntry.getValue(attribute) : null;
};


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The XmlConverter class knows how to load an XML file and make items
 * out of specified parts of the data.
 *
 * @scope    public instance constructor
 * @param    world             
 * @param    url                                (of an XML file)
 * @param    nameSpace                          If null, the name of the file will be used.
 * @param    itemTagName                        Items will be made from elements with this tag name.
 * @param    itemCategory                       If null, a new category is created from 'namespace' and 'itemTagName'.
 */
orp.util.XmlConverter = function(world, url, nameSpace, itemTagName, itemCategory) {
  orp.util.assert(world instanceof World);
  var urlSeparators = new RegExp("\\.|\\/");
  var urlParts = url.split(urlSeparators);
  var len = urlParts.length;
  orp.util.assert(urlParts[len-1] == "xml");
  if (!nameSpace) {
    nameSpace = urlParts[len-2];
  }
  orp.util.assert(orp.util.isString(itemTagName));

  var xmlDoc = document.implementation.createDocument("", "doc", null);
  var objXMLHTTP = new XMLHttpRequest();
  objXMLHTTP.open("GET", url, false);
  objXMLHTTP.send(null);
  xmlDoc = objXMLHTTP.responseXML;
  this._itemElements = xmlDoc.getElementsByTagName(itemTagName);
  if (itemCategory) {
    this._itemCategory = itemCategory;
  } else {
    var itemCategoryName = nameSpace + ":" + itemTagName;
    this._itemCategory = world.newCategory(itemCategoryName);
  }
  this._world = world;
  this._nameSpace = nameSpace;
};


/**
 * Returns the category that new items are assigned to.
 * 
 * @scope    public instance method
 * @return   Returns the category that new items are assigned to.
 */
orp.util.XmlConverter.prototype.getItemCategory = function() {
  return this._itemCategory;
};


/**
 * Given the URL of an XML file, a tag name used in the file, and optionally
 * a list of tag paths, items are created from the elements with the given
 * tag name ('item-elements') with attributes corresponding to the tag paths.  
 * If no tag paths are specified, attributes will come from all direct children
 * of item-elements with nodeType TEXT_NODE.  A category named nameSpace:itemTagName
 * will be created and the new items assigned to it.
 * 
 * For example, if file.xml contains the following:
 *
 * <Food_Glossary>
 * <Record id="22">
 * <name>carrot</name><color>orange</color><flavor>sweet</flavor><vitamins><A>lots</A><C>lots</C></vitamins>
 * </Record>
 * <Record id="33">
 * <name>cheese puff</name><color>orange</color><flavor>salty</flavor><vitamins><A>0.0</A><C>0.0</C></vitamins>
 * </Record>
 * <Record id="44">
 * <name>radish</name><color>red</color><flavor>hot</flavor><vitamins><A>maybe</A><C>some</C></vitamins>
 * </Record>
 * </Food_Glossary>
 * 
 * then makeItemsFromXmlFile("file:.../file.xml", "food", "Record") would result
 * in three items each with attributes called 'food:name', 'food:color' and 'food:flavor',
 * while makeItemsFromXmlFile("file:.../file.xml", "food", "Record", [["name"], ["vitamins", "C"]) 
 *                            [new orp.util.XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()),
 *                             new orp.util.XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C"))],
 *                             new orp.util.XmlAttributeToAttributeSpecifier("id", world.newAttribute("Food ID"));
 * would result in three items each with attributes called 'name', 'Vitamin C' and 'Food ID'.
 * In both cases, the three items are assigned to the category food:Record.
 *
 * @scope    public instance method
 * @param    xmlToAttributeSpecifiers           Array of type orp.util.XmlTextNodeToAttributeSpecifier
 * @param    xmlAttributeToAttributeSpecifiers  Array of type orp.util.XmlAttributeToAttributeSpecifier
 *
 * @return   Returns an array of created items.
 */
orp.util.XmlConverter.prototype.makeItemsFromXmlFile = function(xmlToAttributeSpecifiers, xmlAttributeToAttributeSpecifiers) {
  world.beginTransaction();
  var listOfOutputItems = [];
  if (!xmlToAttributeSpecifiers) {
    listOfOutputItems = this._doDefaultConversion(this._world, this._nameSpace, this._itemElements, this._itemCategory);
  }
  else {
    orp.util.assert(xmlToAttributeSpecifiers instanceof Array);
    orp.util.assert(xmlToAttributeSpecifiers[0] instanceof orp.util.XmlTextNodeToAttributeSpecifier);
    for (var i = 0; i < this._itemElements.length; ++i) {
      var newItem = world.newItem();
      newItem.assignToCategory(this._itemCategory);
      for (var j in xmlToAttributeSpecifiers) {
        var tagPath = xmlToAttributeSpecifiers[j]._tagPath;
        this._processElementTree(0, tagPath.length, this._itemElements[i], newItem, xmlToAttributeSpecifiers[j]);
      }
      if (xmlAttributeToAttributeSpecifiers) {
        for (j in xmlAttributeToAttributeSpecifiers) {
          var xmlAttributeName = xmlAttributeToAttributeSpecifiers[j]._xmlAttributeName;
          var xmlAttributeValue = this._itemElements[i].getAttribute(xmlAttributeName);
          if (xmlAttributeValue !== "") {
            newItem.addEntry({attribute:xmlAttributeToAttributeSpecifiers[j]._attribute, value:xmlAttributeValue});
          }
        }
      }
      listOfOutputItems.push(newItem);
    }
  }
  world.endTransaction();
  return listOfOutputItems;
};


/**
 * @scope    public instance method
 * @param    equalitySpecifier                  type orp.util.XmlTextNodeToAttributeSpecifier or orp.util.XmlAttributeToAttributeSpecifier
 * @param    xmlToAttributeSpecifiers           Array of type orp.util.XmlTextNodeToAttributeSpecifier
 * @param    xmlAttributeToAttributeSpecifiers  Array of type orp.util.XmlAttributeToAttributeSpecifier
 *
 * @return   Returns an array of modified or created items.
 */
orp.util.XmlConverter.prototype.makeOrModifyItemsFromXmlFile = function(equalitySpecifier, xmlToAttributeSpecifiers, xmlAttributeToAttributeSpecifiers) {
  var matchXmlAttribute;
  if (equalitySpecifier instanceof orp.util.XmlAttributeToAttributeSpecifier) {
    matchXmlAttribute = true;
    var xmlAttributeToMatch = equalitySpecifier._xmlAttributeName;
  } else {
    orp.util.assert(equalitySpecifier instanceof orp.util.XmlTextNodeToAttributeSpecifier,
                "equalitySpecifier should be of type orp.util.XmlTextNodeToAttributeSpecifier or orp.util.XmlAttributeToAttributeSpecifier.");
    matchXmlAttribute = false;
    var xmlTagPathToMatch = equalitySpecifier._tagPath;
  }
  world.beginTransaction();
  var itemsInItemCategory = this._world.getItemsInCategory(this._itemCategory);
  var hash = {};
  var matchString;
  for (var j in itemsInItemCategory) {
    matchString = itemsInItemCategory[j].getSingleEntryFromAttribute(equalitySpecifier._attribute);
    if (matchString) {
      hash[matchString.getValue()] = itemsInItemCategory[j];
    }
  }
  var listOfOutputItems = [];
  for (var i = 0; i < this._itemElements.length; ++i) {
    itemElement = this._itemElements[i];
    if (matchXmlAttribute) {
      matchString = itemElement.getAttribute(xmlAttributeToMatch);
    } else {
      matchString = this._getTextForTagPath(itemElement, xmlTagPathToMatch);
    }
    var item;
    if (hash[matchString]) {
      item = hash[matchString];
    } else {
      item = world.newItem();
      item.assignToCategory(this._itemCategory);
      item.addEntry({attribute:equalitySpecifier._attribute, value:matchString});
    }
    for (j in xmlToAttributeSpecifiers) {
      var tagPath = xmlToAttributeSpecifiers[j]._tagPath;
      this._processElementTree(0, tagPath.length, this._itemElements[i], item, xmlToAttributeSpecifiers[j]);
    }
    if (xmlAttributeToAttributeSpecifiers) {
      for (j in xmlAttributeToAttributeSpecifiers) {
        var xmlAttributeName = xmlAttributeToAttributeSpecifiers[j]._xmlAttributeName;
        var xmlAttributeValue = this._itemElements[i].getAttribute(xmlAttributeName);
        if (xmlAttributeValue !== "") {
          item.addEntry({attribute:xmlAttributeToAttributeSpecifiers[j]._attribute, value:xmlAttributeValue});
        }
      }
    }
    listOfOutputItems.push(item);
  }
  world.endTransaction();
  return listOfOutputItems;
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * @scope    private instance method
 */
orp.util.XmlConverter.prototype._doDefaultConversion = function(world, nameSpace, itemElements, itemCategory) {
  var listOfOutputItems = [];
  var hashTableOfAttributesKeyedByName = [];
  for (var i = 0; i < itemElements.length; ++i) {
    var newItem = world.newItem();
    newItem.assignToCategory(itemCategory);
    e = itemElements[i];
    for (var j = 0; j < e.childNodes.length; ++j) {
      var node = e.childNodes[j];
      if (node.nodeType == Node.ELEMENT_NODE && node.firstChild && node.firstChild.nodeType == Node.TEXT_NODE) {
        var attrName = nameSpace + ":" + node.tagName;
        var attr = hashTableOfAttributesKeyedByName[attrName];
        if (!attr) {
          attr = world.newAttribute(attrName);
          hashTableOfAttributesKeyedByName[attrName] = attr;
        }
        newItem.addEntry({attribute:attr, value:node.firstChild.nodeValue});
      }
    }
    listOfOutputItems.push(newItem);
  }
  return listOfOutputItems;
};


/**
 * @scope    private instance method
 */
orp.util.XmlConverter.prototype._processElementTree = function(level, maxLevel, node, newItem, xmlToAttributeSpecifier) {
  if (level == maxLevel) {
    if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].nodeType == Node.TEXT_NODE) {
      value = EntryView._transformValueToExpectedType(world, node.childNodes[0].nodeValue, xmlToAttributeSpecifier._listOfTypes);
      if (xmlToAttributeSpecifier._inverseAttribute) {
        newItem.addConnectionEntry(xmlToAttributeSpecifier._attribute, value, xmlToAttributeSpecifier._inverseAttribute);
      } else {
        newItem.addEntry({attribute:xmlToAttributeSpecifier._attribute, value:value});
      }
    }
    return;
  }
  var tagName = xmlToAttributeSpecifier._tagPath[level];
  var matchingElements = node.getElementsByTagName(tagName);
  if (!matchingElements) {
    return;
  }
  for (i in matchingElements) {
    if (matchingElements[i].childNodes && matchingElements[i].childNodes.length > 0) {
      this._processElementTree(level + 1, maxLevel, matchingElements[i], newItem, xmlToAttributeSpecifier);
    }
  }
};


/**
 * @scope    private instance method
 */
orp.util.XmlConverter.prototype._getTextForTagPath = function(itemElement, xmlTagPathToMatch) {
  var node = itemElement;
  for (var i in xmlTagPathToMatch) {
    var tagName = xmlTagPathToMatch[i];
    var matchingElements = node.getElementsByTagName(tagName);
    if (!matchingElements) {
      return null;
    }
    node = matchingElements[0];
  }
  if (node.childNodes && node.childNodes.length > 0 && node.childNodes[0].nodeType == Node.TEXT_NODE) {
    return node.childNodes[0].nodeValue;
  } else {
    return null;
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
