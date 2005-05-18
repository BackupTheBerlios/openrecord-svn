<?php
$datastoreFilename = "../repositories/demo_page/2005_april_chronological_lump.json";
$contentToWrite = "" . $HTTP_RAW_POST_DATA . "";
/* 
$contentToWrite = "start " . $_POST["foo"] . " middle " . $_POST["foo"] . " end";
*/
if (is_writable($datastoreFilename)) {
  echo "$datastoreFilename is writable.";
  if ($fileHandle = fopen($datastoreFilename, "wb")) {
    if (fwrite($fileHandle, $contentToWrite)) {
      echo "Wrote to file ($datastoreFilename)";
    } else {
      echo "Unable to write to file ($datastoreFilename)";
      exit;
    }
  } else {
    echo "Unable to open file: $datastoreFilename";
    exit("Unable to open file."); 
  }
} else {
  echo "The file $datastoreFilename is not writable.";
}
?>

