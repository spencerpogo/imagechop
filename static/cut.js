'use strict'
let img
let xMin, xMax, yMin, yMax
let parentCuts = new Set()
let lineWhite = false
let cuts = []
let buttons = []
let c
let canvasPos


class YCut {
    constructor (y) {
        this.pos = y
        this.xCuts = []
    }

    getLinePoints() {
        return [0, this.pos, img.width, this.pos]
    }
    
    getPrevious() {
        let i = cuts.indexOf(this)
        if (i < 1) {
            return new YCut(0)
        } else {
            return cuts[i - 1]
        }
    }

    getBounds() {
        let lowBound = this.getPrevious().pos,
            highBound = this.pos
        return [lowBound, highBound]
    }
}


class XCut {
    constructor (parent, x) {
        this.parent = parent
        this.pos = x
    }

    getLinePoints() {
        //return [this.pos, 0, this.pos, img.height]
        if (!this.parent instanceof YCut) {
            throw new Error("this.parent is not a YCut")
        }
        let [lowBound, highBound] = this.parent.getBounds()
        return [this.pos, lowBound, this.pos, highBound]
    }
}


function preload() {
    img = loadImage(URL)
}

function addInitialCut() {
    cuts.push(new YCut(img.height))
}

function setup() {
    let can = createCanvas(img.width, img.height)
    can.mouseClicked(canvasMouseClicked)
    addInitialCut()
    updateButtons()
}


function isValidYPos(pos) {
    return pos > 0 && pos < img.height
}


function isValidChildPos(pos) {
    return pos > 0 && pos < img.width
}


function sortCuts(l=null) {
    l = (l==null)? cuts : l
    l.sort(function (a, b) {
        return a.pos - b.pos
    })
    return l
}

function addNewMarker(cut1, cut2, i, can, canPos) {
    if (cut2.pos < cut1.pos) {
        console.error("cut1:", cut1.pos, "cut2", cut2.pos)
        throw new Error("Cut2 above cut 1")
    }

    let marker = document.createElement('div')
    marker.classList.add("cut-marker")
    marker.style.top = canPos.top + cut1.pos + 'px'
    marker.style.left = width + (i-1)*15 + 'px'
    marker.style.width = (i*15) + 'px'
    marker.style.height = cut2.pos - cut1.pos - 4 + 'px'
    marker.onclick = function() {
        // toggle this cut:
        // if its already set
        if (parentCuts.has(cut2)) {
            removeParent(cut2)
            marker.classList.remove("selected")
        } else {
            addParent(cut2)
            marker.classList.add("selected")
        }
    }
    can.after(marker)
    console.log('cut1', cut1.pos, 'cut2', cut2.pos, 'm', marker)
}

function addParent(pcut) {
    parentCuts.add(pcut)
    $("#remove-parent").show()
}

function removeParent(pcut) {
    parentCuts.delete(pcut)
    if (!parentCuts.size) {
        $("#remove-parent").hide()
    }
}

function updateButtons() {
    let can = $(canvas),
        canPos = can.position()

    //buttons.forEach(function (b) {b.remove()})
    $('.cut-marker').remove()

    if (cuts.length < 1) return

    if (cuts.length > 1) {
        cuts.forEach(function (cut2, i) {
            console.log(cut2)
            let cut1
            if (i < 1) {
                cut1 = {pos: 0}
            } else {
                cut1 = cuts[i - 1]
            }

            addNewMarker(cut1, cut2, 1, can, canPos)
        })
    }
}


function addCut() {
    let pos, newCut, b
    if (!parentCuts.size) {
        pos = mouseY
        if (isValidYPos(pos)) {
            newCut = new YCut(pos)
            cuts.push(newCut)
            sortCuts()
            updateButtons()
        }
    } else {
        pos = mouseX
        if (isValidChildPos(pos)) {
            //parentCut.xCuts.push(new XCut(parentCut, pos))
            parentCuts.forEach((pcut) => {
                pcut.xCuts.push(new XCut(pcut, pos))
            })
        }
    }
}


function canvasMouseClicked() {
    addCut()
}


/*
function getHighContrast(r, g, b) {
    // sets to black or white, whichever is best contrast
    // definitely not copied from stackoverflow
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? 
            color(0) : color(255)
}


function highContrastLine(x1, y1, x2, y2) {
    let currPix, min, max, i, x, y, r, g, b, a
    if (x1 == x2) { // vertical line
        currPix = function(i) {return [x1, i]}
        min = y1, max = y2
    } else if (y1 == y2) { // horizontal line
        currPix = function(i) {return [i, y1]}
        min = x1, max = x2
    } else {
        throw new Error("Straight lines only rn")
    }
    for (i = min; i < max; i++) {
        [x, y] = currPix(i)
        [r, g, b, a] = get(x, y)
        set(x, y, getHighContrast(r, g, b))
    }
    updatePixels()
}
*/

function clearCuts() {
    cuts = []
    addInitialCut()
    updateButtons()
    parentCuts = new Set()
    onParentRemoved()
}


function clearLast() {
    cuts = cuts.slice(0, -1)
    updateButtons()
}

function drawCutLine(cut) {
    line(...cut.getLinePoints())
    //highContrastLine(...cut.getLinePoints())
}

function draw() {
    //background(220)
    image(img, 0, 0)
    let m
    if (!parentCuts.size) {
        m = mouseY
        if (isValidYPos(m)){
            drawCutLine(new YCut(m))
        }
    } else {
        m = mouseX
        if (isValidChildPos(m)) {
            parentCuts.forEach((pcut) => {
                drawCutLine(new XCut(pcut, m))
            })
        }
    }
    cuts.forEach(function (cut) {
        drawCutLine(cut)
        if (cut.xCuts) {
            cut.xCuts.forEach(function (sub) {
                drawCutLine(sub)
            })
        }
    })
}


function keyPressed() {
    if ((keyIsDown(CONTROL) && key == 'z') || keyCode == BACKSPACE || keyCode == DELETE) {
        clearLast()
        return false
    }
}

// End p5, begin jQuery

function makeCutRects() {
    sortCuts()
    let cutRects = []
    cuts.forEach(function (cut) {
        let prev = cut.getPrevious(), 
            lastSubPos, newR, widthCut
        if (cut.xCuts.length > 0) {
            // add a final rectangle that stretches to the end (if not already there)
            widthCut = new XCut(cut, img.width)
            if (cut.xCuts.indexOf(widthCut) == -1) {
                cut.xCuts.push(widthCut)
            }
            sortCuts(cut.xCuts)
            lastSubPos = 0
            cut.xCuts.forEach(function (sub) {
                newR = [lastSubPos, prev.pos, sub.pos, cut.pos]
                console.log(sub, newR)
                cutRects.push(newR)
                lastSubPos = sub.pos
            })
        } else {
            if (prev.pos == cut.pos) {
                console.log("prev", prev.pos, "==", cut.pos, "skipping")
                return
            }
            newR = [0, prev.pos, img.width, cut.pos]
            console.log("[no xcuts]", newR)
            cutRects.push(newR)
        }
    })
    return cutRects
}

$("#submit").click(function() {
    let cutRects = makeCutRects()

    // assume the location is in the form of
    //  /<filename>/somepath
    let base = location.href.split('/')
                .slice(0, -1) // cut out somepath
                .join("/"),
        cs = JSON.stringify(cutRects),
        url = base + "/textedit?cuts=" + encodeURIComponent(cs)
    console.log(cs, url)
    window.open(url)
    /* // lol not sure why I did this when I could use above method
    form = $('<form action="'+base+'/textedit" method="GET">' + 
    '<input type="hidden" name="cuts" value=\''+cs+'\'>' + 
    '</form>')
    $(document.body).append(form)
    form.submit()
    */
})

// these functions don't take any args so they'll 
//  ignore the event argument they get
$("#clearcuts").click(clearCuts)

$("#clearlast").click(clearLast)

$("#toggleline").click(function () {
    lineWhite = !lineWhite
    stroke(lineWhite ? 255 : 0)
})

function onParentRemoved() {
    $("#remove-parent").hide()
}

$("#remove-parent").click(function () {
    parentCuts = new Set()
    onParentRemoved()
})
