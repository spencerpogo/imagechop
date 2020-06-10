$("#setocrkey").click(function() {
    let $keyinp = $("#ocrkeyinp");
    let key = $keyinp.val();
    if (!key) {
        alert("Please enter a key");
        return;
    }
    localStorage.setItem("ocrkey", key);
    $keyinp.val("");
    setTimeout(function() {
        alert("Key set successfully");
    }, 10); // let browser repaint and clear box first
});


function getOcrApiKey() {
    let key = localStorage.getItem("ocrkey");
    if (!key) {
        alert("Please set the api key using the form at the top of the page first");
        return null;
    }
    return key;
}


function processText(text) {
    return text//.replace(/[\n\r]/g, " ") // change newlines to space
               .replace(/[ ]{2,}/g, " "); // change duplicate spaces to just one space
}


function getOcrButton(txtarea) {
    //let btn = $('<button class="ocrbtn">Use OCR</button>');
    let btn = $('<img class="ocrbtn" src="/static/ocricon.png" height="40">');
    btn.click(function() {
        let $this = $(this);
        $this.hide();
        let $loading = $('<img class="loading" src="/static/loading.gif" height="40">');
        $this.after($loading);

        let key = getOcrApiKey();
        if (!key) return; // the user was already shown an error
        img = txtarea.parent().parent().find('.imgpart');
        if (img.length != 1) {
            throw new Error("Found " + img.length + " images");
        }
        btn.prop("disabled", true);
        var formData = new FormData();
        formData.append("base64image", img.attr('src'));
        //formData.append("filetype", "PNG");
        formData.append("language", "eng");
        formData.append("apikey", key);
        formData.append("isOverlayRequired", false);
        $.ajax({
            type: "POST",
            url: "https://api.ocr.space/parse/image",
            dataType: 'json',
            processData: false,
            contentType: false,
            
            data: formData
        }).done(function (data) {
            btn.prop("disabled", false);
            if (data["ErrorMessage"]) {
                alert("ocr.space error message: " + data["ErrorMessage"].join(""));
                return;
            }
            if (data["ParsedResults"]) {
                let text = "";
                $.each(data["ParsedResults"], function (ind, result) {
                    if (result["ErrorMessage"]) {
                        alert("ocr.space error message: " + JSON.stringify(result["ErrorMessage"]));
                        return false; // stop foreach
                    }
                    if (result["ParsedText"]) {
                        text += result["ParsedText"];
                    }
                });
                text = processText(text)
                console.log(text);
                $loading.remove();
                $this.show();
                txtarea.val(text);
            }
        });
    });
    return btn;
}
