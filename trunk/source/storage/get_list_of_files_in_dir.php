<?php
$url_of_this_php_script = $_SERVER['REQUEST_URI'];
$dir = $_GET['dir'];
$suffix_specified = array_key_exists('suffix', $_GET);
if ($suffix_specified) {
  $suffix = $_GET['suffix'];
}
if (!file_exists($dir)) {
  exit("$dir not found."); 
}
;
if (!($dh = opendir($dir))) {
  exit("Could not open $dir."); 
}
while (false !== ($filename = readdir($dh))) {
  if ($filename == "." || $filename == "..") {
    continue;
  }
  $array_of_file_name_parts = explode(".", $filename);
  if (!$suffix_specified || $array_of_file_name_parts[1] == $suffix) {
    $array_js[] = "\"" . $filename . "\"";
  }
}
echo "[" . implode(',', $array_js) . "]";
?>
