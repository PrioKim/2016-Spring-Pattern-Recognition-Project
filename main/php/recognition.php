<?php
    // 서버에 저장될 디렉토리이름
    $uploaddir = '../img/';
    // 서버에 저장될 파일이름
    $filename = basename($_FILES['img']['name']);
    $ext = array_pop(explode(".","$filename"));

    echo '<pre>';
    if($_FILES['img']['error'] === UPLOAD_ERR_OK) {
         if(strtolower($ext) == "php") {
              echo "php file cannot be uploaded.";
         }
         else if($_FILES['img']['size'] <= 0){
             echo "File upload is failed by file size.";
         } else {
             // HTTP post로 전송된 것인지 체크합니다.
             if(!is_uploaded_file($_FILES['img']['tmp_name'])) {
                  echo "File is not uploaded by HTTP POST.";
             } else {
                  if (move_uploaded_file($_FILES['img']['tmp_name'],  $uploaddir.$filename)) {
                       echo "File upload success.\n";
                  } else {
                       echo "File upload fail.\n";
                  }
             }
         }
    } else {
         echo file_errmsg($_FILES['img']['error']);
    }
//    print_r($_FILES);

    $bazel_home = "";
    $bazel_bin = "bazel-bin/tensorflow/examples/label_image/label_image";
    $arg_graph = ' --graph=/tmp/output_graph.pb';
    $arg_labels = ' --labels=/tmp/output_labels.txt';

    $arg_output_layer = ' --output_layer=final_result';
    $arg_image = ' --image=/root/image_crawl/dir/Elephant-PNG-Image1.png';
    $tensor_result_file = "tensor_result";

    $cmd = $bazel_bin . $arg_graph . $arg_labels . $arg_output_layer . $arg_image . " &> " . $tensor_result_file;

    /*
    if(system($cmd, $output)) {
        echo "$output";
    }
    */

    if(system("ls > output", $output)) {
        echo "<br> $output <br>";
    }

//// parsing result
    $parsing_result_file = "parsing_result.txt";
    $fpr = fopen($tensor_result_file, "r") or exit("Unable to open file! tensor");
    $fpw = fopen($parsing_result_file, "w") or exit("Unable to open file! parse");

    $i = 0;
    while(!feof($fpr)) {
        $line = fgets($fpr);

        if($i > 93){
            $parse_buf = explode(" ", $line); // I tensorflow/examples/label_image/main.cc:207] dog dir (0): 0.926837
            $write_buf = $parse_buf[5];
            fputs($fpw, $write_buf);
        }
        $i++;
    }

    fclose($fpr);
    fclose($fpw);
////
    echo "<meta http-equiv='refresh' content='0; url=../index.php?#result'>";
 ?>
