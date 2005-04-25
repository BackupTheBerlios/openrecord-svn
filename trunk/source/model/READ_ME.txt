=================================
Experimental Data Model Framework
=================================

This directory, named "model", contains 8 or 10 JavaScript classes.  Together these JavaScript classes form an experimental data model framework.  

This isn't a finished product, just a sort of experimental prototype, or maybe an extreme progamming "spike solution".  Right now this is still a work in progress.  The code doesn't run yet, it doesn't pass its unit tests, and it isn't as clean and tidy as I would like it to be.  But all the pieces are in place, and there's enough detail here to give you a good sense of what this solution would look like.


---------------------------------
Terminology
---------------------------------
Here's a quick overview of the terminology and concepts...

Item -- items have attribute values
Value -- an attribute value attached to an item
  
Entry -- the abstract superclass for Item and Value
Ordinal -- keeps track of where an Entry should appear in a list
Vote -- keeps track of who thinks an Entry should be replaced/deleted
Record -- an Item, Value, Ordinal, or Vote -- things that have to be recorded

World -- a set of items, like the "OpenAgenda" world or the "CoolChaser" world
Server -- server-side code to run queries and deliver items to the browser
VirtualServer -- client-side proxy, by which a World talks to a Server
StubVirtualServer -- a simple VirtualServer which doesn't even talk to a Server
BigLumpVirtualServer -- a simple VirtualServer that transfers data in big lumps


---------------------------------
Client API
---------------------------------
Here's a quick overview of the Data Model API that's available for people who are writing view code which allows users to view and edit items.

Item methods --------------------

  item.addAttributeValue()
  item.addValue()
  item.replaceValue()
  item.replaceValueWithAttributeValue()
  
  item.getAttributes()
  item.getValuesForAttribute()
  item.getValues()
  
  item.getDisplayName()
  item.getName()
  item.getShortName()
  
  item.isInCategory()
  item.reorderBetween()
  
  item.hasBeenDeleted()
  item.voteToDelete()
  item.voteToRetain()
  
  item.addObserver()
  item.removeObserver()

  
Value methods ------------------- 

  value.hasBeenReplaced()
  value.getPreviousValue()
  value.getAttribute()
  value.getItem()
  value.getContentData()

  
World methods ------------------- 

  world.login()
  world.logout()
  
  world.getUsers()
  world.getCurrentUser()
  world.newUser()
  
  world.newItem()
  world.getListOfItemsInCategory()
  world.getListOfResultItemsForQuery()
  world.setItemToBeIncludedInQueryResultList()
  world.removeObserverOfList()
  
  world.beginTransaction()
  world.endTransaction()


