$('.imgradio').on('change', function() {
    if(!this.checked) return;

    let baseid = $(this).attr('id').replace('img', 'txt'); // imgradio-x => txtradio-x
    $(
        '#' + baseid + '-txt'
    ).remove();
    $(
        "#" + baseid + '-ocrbtn'
    ).remove();
});

$('.txtradio').on('change', function() {
    if(!this.checked) return;

    let ele = $('<textarea id="'+this.id+'-txt" rows="10" cols="40"></textarea>');
    $(this).next().after(ele);
    let ocrbtn = getOcrButton(ele);
    ocrbtn.attr("id", this.id + "-ocrbtn");
    ele.after(ocrbtn);
});

function getData() {
    let data = [];
    $('.imgcontainer').each(function(ind, ele) {
        let $ele = $(ele),
            currItem = {};
        
        // get info from radio
        let radio = $ele.find('input[type=radio]:checked');
        if (radio.length != 1) {
            throw radios.length + " are checked";
        }
        if (radio.hasClass("txtradio") && radio.hasClass("imgradio")) {
            throw "Radio is both types";
        }
        if (radio.hasClass("imgradio")) {
            currItem.type = "image";
        } else if (radio.hasClass("txtradio")) {
            currItem.type = "txt";
            txtid = '#'+radio.attr('id') + '-txt';
            console.log(txtid);
            txtarea = $(txtid);
            if (txtarea.prop("tagName").toLowerCase() != "textarea") {
                throw "Radio type is text but textarea not found (using id "+txtid+")";
            }
            currItem.txt = txtarea.val();
        } else {
            throw "Radio is neither type";
        }

        // get data from image
        let img = $ele.find('.imgpart');
        if (img.length != 1) {
            throw img.length + "images found";
        }
        let match = matchImgUrl(img);
        if (match == null) {
            throw "Invalid image src: " + img.attr("src");
        }
        //let type = match[1];
        currItem.imgdata = match[2];

        // get position
        let pos = $ele.find(".position-data");
        if (pos.length != 1) {
            throw pos.length + "positions found";
        }
        currItem.pos = pos.attr("value");

        data.push(currItem);
    });
    return data;
}

$("#open-data").click(function() {
    let data = getData();
    win = window.open('_blank');
    win.document.write("<pre>" + 
        JSON.stringify({
        images: data
    }) + "</pre>");
});

$("#copy-data").click(function() {
    let data = getData();
    copyTextToClipboard(JSON.stringify(data));
});

function matchImgUrl(img) {
    return /data:image\/([a-z]+);base64,(.*)/.exec(img.attr("src"));
}

$(document).ready(function() {
    // browser might autofill the radios, so make them update accordingly
    $(".imgradio .txtradio").trigger("change");
});
