<?php
$contentToWrite = "" . $HTTP_RAW_POST_DATA . "";

$url_of_this_php_script = $_SERVER['REQUEST_URI'];
$file_name_parameter = $_GET['file'];
$array_of_file_name_parameter_parts = explode("/", $file_name_parameter);
$safe_file_name_with_no_path_exploits = $array_of_file_name_parameter_parts[0];
$overwrite_parameter = $_GET['overwrite'];

$file_path = "../../repositories/"; /* relative to this php file */
$file_suffix = ".json";
$repository_file_name = $file_path . $safe_file_name_with_no_path_exploits . $file_suffix;

if ($overwrite_parameter != 'T') {
  if (file_exists($repository_file_name)) {
    exit("File $repository_file_name already exists."); 
  }
}
if ($fileHandle = fopen($repository_file_name, "wb")) { /* wb == write in binary mode */
  /* It would be nice if this could be 0664, but then it won't be openable with 'file:' protocol,
     unless the user is the same as the user of httpd (typically 'nobody').  I'm assuming chmod is 
     ignored on non-unix systems, and that this note is relevant only on unix systems.  
     Even if the user is in the same group as nobody, nsIFileOutputStream (called by 
     FileSaver._mozillaSaveToFile) still won't open the file, at least on Mignon's Mac. */
  chmod($repository_file_name, 0666);
  if (fwrite($fileHandle, $contentToWrite)) {
    fclose($fileHandle);
    exit("Wrote to file ($repository_file_name)");
  } else {
    fclose($fileHandle);
    exit("Unable to write to file ($repository_file_name)");
  }
} else {
  exit("Unable to open file: $repository_file_name"); 
}
?>

