/*****************************************************************************
 FileStorage.js
 
******************************************************************************
 The code in this file is a heavily modified version of code that was copied
 from the TiddlyWiki and GTDTiddlyWiki code base.
 
 The original code is Copyright (c) Osmosoft Limited.  The original copyright 
 notice is included below, along with the license conditions and disclaimer.  
 
 OpenRecord modifications by Brian Douglas Skinner <brian.skinner@gumption.org>

 For the OpenRecord modifications, the Copyright rights are relinquished under  
 the Creative Commons Public Domain Dedication:
    http://creativecommons.org/licenses/publicdomain/

******************************************************************************
TiddlyWiki 1.2.6 by Jeremy Ruston, (jeremy [at] osmosoft [dot] com)
Incorporating improvements by Isao Sonobe, http://www-gauge.scphys.kyoto-u.ac.jp/~sonobe/OgreKit/OgreKitWiki.html
GTDTiddlyWiki modification by Nathan Bowers, (wiki [at] snapgrid [dot] com)
Safari Compatability by Jonathan Paisley at http://www.dcs.gla.ac.uk/~jp/

Copyright (c) Osmosoft Limited, 14 April 2005

All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution.

Neither the name of the Osmosoft Limited nor the names of its contributors may be
used to endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*****************************************************************************/


// -------------------------------------------------------------------
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.storage.FileStorage");
dojo.require("orp.storage.Storage");
dojo.require("orp.archive.DeltaArchive");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The FileStorage class knows how to save text to a local file.
 *
 * @param    repositoryName                 // e.g. demo_page
 * @param    pathToTrunkDirectory           // Not needed if window.location.pathname is in the trunk directory.
 * @scope    public instance constructor
 */
orp.storage.FileStorage = function(repositoryName, pathToTrunkDirectory) {
  orp.storage.Storage.call(this, repositoryName, pathToTrunkDirectory);
  
  // Step 1: Build the fileUrl
  // 
  // Our saveTextToFile() method needs a fileUrl that looks like this:
  //   fileUrl = "K:\\www\\htdocs\\openrecord\\demo\\current\\trunk\\repositories\\demo_page.json";
  // 
  // We start with a value in this.getRepositoryName() that looks like this:
  //   this.getRepositoryName() == "demo_page"

  // URLs like these don't work:
  //   fileUrl = "repositories/demo_page.json";
  //   fileUrl = "repositories\\demo_page.json";
  //   fileUrl = "\\repositories\\demo_page.json";
  //   fileUrl = "K:/www/htdocs/openrecord/demo/current/trunk/repositories/demo_page.json";

  var listOfAdditions = [];
  if (pathToTrunkDirectory && pathToTrunkDirectory !== "") {
    listOfAdditions.push(pathToTrunkDirectory);
  }
  listOfAdditions.push(orp.archive.DeltaArchive.PATH_TO_REPOSITORY_DIRECTORY);
  listOfAdditions.push(this.getRepositoryName() + ".json");
  this._fileUrl = this._getLocalPathFromWindowLocation(listOfAdditions);
};

dojo.inherits(orp.storage.FileStorage, orp.storage.Storage);  // makes FileStorage be a subclass of Storage


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Appends text to a file.
 *
 * @scope    public instance method
 */
orp.storage.FileStorage.prototype.appendText = function(textToAppend) {
  var append = true;
  this._saveTextToFile(textToAppend, this._fileUrl, append);
};


/**
 * Writes text to a file, completely replacing the contents of the file.
 *
 * @scope    public instance method
 */
orp.storage.FileStorage.prototype.writeText = function(textToWrite, overwriteIfExists) {
  var append = false;
  this._saveTextToFile(textToWrite, this._fileUrl, append);
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Save the text to the file at the given URL.
 *
 * @scope    private instance method
 * @return   Returns true if the text was saved.
 */
orp.storage.FileStorage.prototype._saveTextToFile = function(text, fileUrl, append) {
  // Make sure we were loaded from a "file:" URL
  if (window.location.protocol != "file:") {
    orp.lang.assert(false, 'FileStorage.js can only be used for pages loaded from a "file:///" location');
  }

  var success = this._mozillaSaveToFile(text, fileUrl, append);
  if (!success) {
    success = this._ieSaveToFile(text, fileUrl, append);
  }
  return(success);
};


/**
 * Save the text to the file at the given filePath.
 *
 * @scope    private instance method
 * @return   Returns true if the text was saved, false if there was an error, or null if we couldn't even try.
 */
orp.storage.FileStorage.prototype._mozillaSaveToFile = function(text, filePath, append) {
  if (window.Components) {
    try {
      netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(filePath);
      if (!file.exists()) {
        // Not all JavaScript implementations  support octal literals,
        // so it's not safe to use '0664' here:
        //   file.create(0, 0664);
        //   file.permissions = 0664; // Because create ignores the permissions argument, at least on Mignon's Mac.
        file.create(0, 0x1B4);
        file.permissions = 0x1B4; // Because create ignores the permissions argument, at least on Mignon's Mac.
      }
      var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      if (append) {
        outputStream.init(file, 0x10 | 0x02, 0x0004, null);
      } else {
        outputStream.init(file, 0x20 | 0x02, 0x0004, null);
      }
      outputStream.write(text, text.length);
      outputStream.flush();
      outputStream.close();
      return true;
    }
    catch(exception) {
      alert("Exception while attempting to save\n\n" + exception);
      return false;
    }
  } else {
    alert("window.Components == null");
  }
  return null;
};


/**
 * Save the text to the file at the given filePath.
 *
 * @scope    private instance method
 * @return   Returns true if the text was saved, or false if there was an error.
 */
orp.storage.FileStorage.prototype._ieSaveToFile = function(text, filePath, append) {
  try {
    var fileSystemObject = new ActiveXObject("Scripting.FileSystemObject");
  }
  catch(exception) {
    alert("Exception while attempting to save\n\n" + exception.toString());
    return false;
  }
  if (append) {
    orp.lang.assert(false, "PENDING: still need to write code for this");
  } else {
    var file = fileSystemObject.OpenTextFile(filePath, 2, -1, 0);
  }
  file.Write(text);
  file.Close();
  return true;
};


/**
 * This method looks at the URL value in the window.location property,
 * strips the filename off the end, appends any given path elements,
 * converts the whole thing to a format that is compatible with the 
 * local file system, and returns the new local path.
 *
 * @scope    private instance method
 * @return   Returns a full local pathname.
 */
orp.storage.FileStorage.prototype._getLocalPathFromWindowLocation = function(listOfAdditions) {
  // Example location:
  //   location.href     == file:///D:/amy/openrecord/foo.html#bar
  //   location.protocol == file:
  //   location.pathname ==        /D:/amy/openrecord/foo.html
  //   location.hash     ==                                   #bar

  // Get the URL of the document
  var pathname = window.location.pathname;
  
  
  // Step 1: Make the requested additions to the pathname
  var arrayOfParts = pathname.split('/');
  arrayOfParts.pop();  // get rid of the final "/foo.html" part
  for (var i in listOfAdditions) {
    var additionalPart = listOfAdditions[i];
    arrayOfParts.push(additionalPart);
  }
  pathname = arrayOfParts.join('/');

  
  // Step 2: Figure out what type of URL we're working with
  // Constants
  var PathType = {
    LOCAL_PC:        "LOCAL_PC",          // "file:///x:/path/path..." 
    LOCAL_UNIX_MAC:  "LOCAL_UNIX_MAC",    // "file:///path/path..."
    NETWORK_PC:      "NETWORK_PC",        // "file://server/share/path/path..."
    NETWORK_FIREFOX: "NETWORK_FIREFOX" }; // "file://///server/share/path/path..."
  // "file:///x:/path/path..."             == PathType.LOCAL_PC        --> "x:\path\path..."
  // "file:///path/path..."                == PathType.LOCAL_UNIX_MAC  --> "/path/path..."
  // "file://server/share/path/path..."    == PathType.NETWORK_PC      --> "\\server\share\path\path..."
  // "file://///server/share/path/path..." == PathType.NETWORK_FIREFOX --> "\\server\share\path\path..."

  var pathType = null;
  if (pathname.charAt(2) == ":") {
    pathType = PathType.LOCAL_PC;
  } else if (pathname.indexOf("///") === 0) {
    pathType = PathType.NETWORK_FIREFOX;
  } else if (pathname.indexOf("/") === 0) {
    pathType = PathType.LOCAL_UNIX_MAC;
  } else {
    pathType = PathType.NETWORK_PC;
  }


  // Step 3: Convert the URL to a file path
  var localPath = pathname;
  switch (pathType) {
    case PathType.LOCAL_PC:
      // example: "/x:/path/path..."
      localPath = localPath.substring(1);  // get rid of initial '/'
      localPath = unescape(localPath);
      localPath = localPath.replace(new RegExp("/","g"),"\\");
      // result: "x:\path\path..."
      break;
    case PathType.LOCAL_UNIX_MAC:         
    // example: "/path/path..."
      localPath = unescape(localPath);
      // result: "/path/path..."
      break;
    case PathType.NETWORK_FIREFOX:
      // example: "///server/share/path/path..."
      localPath = localPath.substring(3);  // get rid of initial '///'
      localPath = unescape(localPath);
      localPath = localPath.replace(new RegExp("/","g"),"\\");
      localPath = "\\\\" + localPath;      
      // result: "\\server\share\path\path..."
      break;
    case PathType.NETWORK_PC:
      // example: "server/share/path/path..."
      localPath = unescape(localPath);
      localPath = localPath.replace(new RegExp("/","g"),"\\");
      localPath = "\\\\" + localPath;      
      // result: "\\server\share\path\path..."
      break;
  }

  return localPath;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
