/*****************************************************************************
 HttpStorage.js
  
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
dojo.provide("orp.storage.HttpStorage");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The HttpStorage class knows how to save content to a server by using
 * XMLHttpRequest to call a PHP script.
 *
 * @param    repositoryName                         // e.g. demo_page
 * @param    pathToTrunkDirectoryFromWindowLocation // Not needed if window location is at the root of the trunk directory.
 * @scope    public instance constructor
 */
orp.storage.HttpStorage = function(repositoryName, pathToTrunkDirectoryFromWindowLocation) {
  this._repositoryName = repositoryName;
  var thisUrl = window.location.pathname; //e.g. /openrecord/trunk/demo_page.html or /openrecord/trunk/source/model/TestRepositoryWriting.html.
  var arrayOfPathComponents = thisUrl.split('/');
  arrayOfPathComponents.pop();
  var thisDirectory = arrayOfPathComponents.join('/'); //e.g. /openrecord/trunk or /openrecord/trunk/source/model
  if (pathToTrunkDirectoryFromWindowLocation) {
    this._completePathToTrunkDirectory = thisDirectory + '/' + pathToTrunkDirectoryFromWindowLocation;
  } else {
    this._completePathToTrunkDirectory = thisDirectory;
  }
};


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 */
orp.storage.HttpStorage.prototype.appendText = function(textToAppend) {
  var url = this._completePathToTrunkDirectory;
  url += "/source/model/append_to_repository_file.php?file=" + this._repositoryName;
  
  // PENDING: 
  // It might be more efficient to re-use the XMLHttpRequestObject,
  // rather than creating a new one for new request.  But re-using 
  // them is complicated, because the requests are asynchronous, so
  // we need to check to see if the last request is done before we 
  // can start a new request.
  var newXMLHttpRequestObject = this._newXMLHttpRequestObject();
  var asynchronous = true;
  newXMLHttpRequestObject.open("POST", url, asynchronous);
  newXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
  newXMLHttpRequestObject.send(textToAppend);
};


/**
 */
orp.storage.HttpStorage.prototype.writeText = function(textToWrite, overwriteIfExists) {
  var url = this._completePathToTrunkDirectory;
  url += "/source/model/write_to_repository_file.php?file=" + this._repositoryName;
  if (overwriteIfExists) {
    url += "&overwrite=T";
  }
  var newXMLHttpRequestObject = this._newXMLHttpRequestObject();
  var asynchronous = true;
  newXMLHttpRequestObject.open("POST", url, asynchronous);
  newXMLHttpRequestObject.setRequestHeader("Content-Type", "text/plain");
  newXMLHttpRequestObject.send(textToWrite);
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Returns a newly created XMLHttpRequest object.
 *
 * @scope    private instance method
 * @return   A newly created XMLHttpRequest object. 
 */
orp.storage.HttpStorage.prototype._newXMLHttpRequestObject = function() {
  var newXMLHttpRequestObject = null;
  if (window.XMLHttpRequest) {
    newXMLHttpRequestObject = new XMLHttpRequest();
  } else {
    if (window.ActiveXObject) {
      newXMLHttpRequestObject = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  if (newXMLHttpRequestObject) {
    newXMLHttpRequestObject.onreadystatechange = function() {
      var statusText = newXMLHttpRequestObject.statusText;
      if (statusText != "OK") {
        window.alert("onreadystatechange:\n" +
          "readyState: " + newXMLHttpRequestObject.readyState + "\n" +
          "status: " + newXMLHttpRequestObject.status + "\n" +
          "statusText: " + newXMLHttpRequestObject.statusText + "\n" +
          "responseText: " + newXMLHttpRequestObject.responseText + "\n");
      }
    };
  }
  return newXMLHttpRequestObject;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
