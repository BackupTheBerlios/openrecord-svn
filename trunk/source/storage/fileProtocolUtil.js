/*****************************************************************************
 fileProtocolUtil.js
 
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
dojo.provide("orp.storage.fileProtocolUtil");


/**
 * This function looks at the URL value in the window.location property,
 * strips the filename off the end, appends any given path elements,
 * converts the whole thing to a format that is compatible with the 
 * local file system, and returns the new local path.
 *
 * @scope    public function
 * @return   Returns a full local pathname.
 */
orp.storage.getLocalPathFromWindowLocation = function(listOfAdditions) {
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
