<?php
$contentToWrite = "" . $HTTP_RAW_POST_DATA . "";

$url_of_this_php_script = $_SERVER['REQUEST_URI'];
$array_of_url_parts = explode("?", $url_of_this_php_script);
$search_part = $array_of_url_parts[1];
$array_of_search_parts = explode("=", $search_part);
$file_name_parameter = $array_of_search_parts[1];
$array_of_file_name_parameter_parts = explode("/", $file_name_parameter);
$safe_file_name_with_no_path_exploits = $array_of_file_name_parameter_parts[0];

$file_path = "../../repositories/";
$file_suffix = ".json";
$repository_file_name = $file_path . $safe_file_name_with_no_path_exploits . $file_suffix;

if (is_writable($repository_file_name)) {
  echo "$repository_file_name is writable.";
  if ($fileHandle = fopen($repository_file_name, "ab")) { /* ab == append in binary mode */
    if (fwrite($fileHandle, $contentToWrite)) {
      fclose($fileHandle);
      echo "Appended to file ($repository_file_name)";
    } else {
      echo "Unable to write to file ($repository_file_name)";
      exit;
    }
  } else {
    echo "Unable to open file: $repository_file_name";
    exit("Unable to open file."); 
  }
} else {
  echo "The file $repository_file_name is not writable.";
}
?>

