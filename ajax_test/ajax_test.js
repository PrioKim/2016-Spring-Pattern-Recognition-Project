var httpRequest=null;

function getHttpRequest() {
    var httpReq = null;

    try {
        var httpReq = new XMLHttpRequest();
    } catch(err) {
        httpReq = null;
    }
    return httpReq;
}

function reqHttpData(url, callback) {
    if( httpRequest == null ) {
        httpRequest = getHttpRequest();
        if( httpRequest == null )
        return;
    }

    httpRequest.open("GET", url,true);
    httpRequest.onreadystatechange = callback;
    httpRequest.send(null);
}

function buttonReadFile() {
    reqHttpData("text.txt", onLoadHttpData);
}

function onLoadHttpData() {
    if( httpRequest.readyState != 4 ||httpRequest.status != 200 ) {
        var message = "Status - ReadyState:" + httpRequest.readyState
            + " / Status: " +httpRequest.status;

            $("#message").text(message);
        return;

    }
    var fileText = httpRequest.responseText;
    var probability = [];

    alert(fileText);
    probability = fileText.split('\n');

    for(i = 0;i < 5; i++){
        alert(probability[i]);
    }
    $("#textFile").val(fileText);
}
