<?php
$filename = "../repositories/demo_page/2005_may_user_list.json";
$contentToWrite = "" . $HTTP_RAW_POST_DATA . "";
if (is_writable($filename)) {
  echo "$filename is writable.";
  if ($fileHandle = fopen($filename, "wb")) { /* wb == write in binary mode */
    if (fwrite($fileHandle, $contentToWrite)) {
      echo "Replaced contents of file ($filename)";
      fclose($fileHandle);
    } else {
      echo "Unable to write to file ($filename)";
      exit;
    }
  } else {
    echo "Unable to open file: $filename";
    exit("Unable to open file."); 
  }
} else {
  echo "The file $filename is not writable.";
}
?>

