/*****************************************************************************
 FileProtocolStorage.js
 
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
dojo.provide("orp.storage.FileProtocolStorage");
dojo.require("orp.storage.Storage");
dojo.require("orp.storage.fileProtocolUtil");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The FileProtocolStorage class knows how to save text to a local file.
 *
 * @param    repositoryName                 // e.g. demo_page
 * @param    pathToTrunkDirectory           // Not needed if window.location.pathname is in the trunk directory.
 * @scope    public instance constructor
 */
orp.storage.FileProtocolStorage = function(repositoryName, repositoryDirectoryName, pathToTrunkDirectory) {
  orp.storage.Storage.call(this, repositoryName, repositoryDirectoryName, pathToTrunkDirectory);
  
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
  listOfAdditions.push(this._repositoryDirectoryName);
  listOfAdditions.push(this.getRepositoryName() + ".json");
  this._fileUrl = orp.storage.getLocalPathFromWindowLocation(listOfAdditions);
};

dojo.inherits(orp.storage.FileProtocolStorage, orp.storage.Storage);  // makes FileProtocolStorage be a subclass of Storage


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Appends text to a file.
 *
 * @scope    public instance method
 */
orp.storage.FileProtocolStorage.prototype.appendText = function(textToAppend) {
  var append = true;
  this._saveTextToFile(textToAppend, this._fileUrl, append);
};


/**
 * Writes text to a file, completely replacing the contents of the file.
 *
 * @scope    public instance method
 */
orp.storage.FileProtocolStorage.prototype.writeText = function(textToWrite, overwriteIfExists) {
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
orp.storage.FileProtocolStorage.prototype._saveTextToFile = function(text, fileUrl, append) {
  // Make sure we were loaded from a "file:" URL
  if (window.location.protocol != "file:") {
    orp.lang.assert(false, 'FileProtocolStorage.js can only be used for pages loaded from a "file:///" location');
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
orp.storage.FileProtocolStorage.prototype._mozillaSaveToFile = function(text, filePath, append) {
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
    } catch(exception) {
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
orp.storage.FileProtocolStorage.prototype._ieSaveToFile = function(text, filePath, append) {
  try {
    var fileSystemObject = new ActiveXObject("Scripting.FileSystemObject");
  } catch(exception) {
    alert("Exception while attempting to save\n\n" + exception.toString());
    return false;
  }
  if (append) {
    orp.lang.assert(false, "FIXME: still need to write code for this");
  } else {
    var file = fileSystemObject.OpenTextFile(filePath, 2, -1, 0);
  }
  file.Write(text);
  file.Close();
  return true;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
