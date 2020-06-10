import flask
from werkzeug.security import safe_join
from PIL import Image
import requests
import io
import json
import base64
import tempfile
import traceback
import os


app = flask.Flask(__name__)


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route("/img/<fname>")
def img(fname):
    return flask.send_from_directory("temp", fname)


@app.route('/<fname>/cut')
def cut(fname):
    if fname not in os.listdir('temp'):
        return "Image not found", 404
    return flask.render_template('cut.html', url="/img/"+fname)


def make_cuts(img, cuts):
    print(cuts)
    width, height = img.size
    newimgs = []

    newcuts = []
    for l in cuts:
        x1, y1, x2, y2  = l
        # sort the two cut points
        if x1 + y1 > x2 + y2:
            newcuts.append([x1, y1, x2, y2])
        else:
            # This means that its backwards
            #  which will cause and error,
            #  so flip point 2 and point 1
            newcuts.append([x2, y2, x1, y1])
    

    for rect in cuts:
        #x1, y1, x2, y2 = rect
        im = img.crop(rect)
        im._cut_pos = rect
        newimgs.append(im)
    return newimgs


def make_data_url(img):
    with io.BytesIO() as out:
        img.save(out, format="PNG")
        return "data:image/png;base64,"+base64.b64encode(out.getvalue()).decode()


@app.route('/<fname>/textedit')
def textedit(fname):
    ipath = safe_join('temp', fname)
    if fname is None:
        return "Invalid filename"
    data = flask.request.args or {}
    cuts = data.get('cuts')
    try:
        cuts = json.loads(cuts)
    except:
        return "Can't load cuts as JSON"
    
    # make sure that we have a list of 4 int lists
    if type(cuts) != list or not \
        all(type(l) is list and len(l) == 4 and 
            all(type(e) is int for e in l) for l in cuts):
        return "Invalid cut data", 400
    try:
        img = Image.open(ipath)
    except:
        return "Image not found", 404
    
    if cuts:
        #cuts = sorted(cuts)
        new = make_cuts(img, cuts)
    else:
        new = [img]
    
    try:
        outimgs = []
        for im in new:
            outimgs.append({
                "url": make_data_url(im),
                "pos": ",".join(str(i) for i in im._cut_pos)
            })
    except Exception as e:
        try:
            estr = str(e)
        except:
            estr = "??"
        traceback.print_exc()
        return "Cut data caused error: "+estr, 400
    return flask.render_template("text.html", outimgs=outimgs, enumerate=enumerate)


@app.route("/loadimg", methods=["POST"])
def loadimg():
    args = flask.request.form or {}
    url = args.get("url")
    if not url:
        return "Invalid url"
    try:
        r = requests.get(url)#, stream=True)
        r.raise_for_status()
        with tempfile.NamedTemporaryFile(dir="./temp", delete=False) as f:
            #for chunk in r.iter_contents(size=8192):
            #    f.write(chunk)
            f.write(r.content)
            fname = f.name
    except Exception as e:
        print(f"Error loading url: {e.__class__.__name__}: {str(e)}")
        return "Error loading url"
    parts = fname.split("/")
    if parts[-2] != "temp":
        raise ValueError(f"Weird filename: {fname}")
    return flask.redirect("/"+parts[-1]+"/cut")


app.run('0.0.0.0', port=8080, debug=True, extra_files=["templates/text.html"])
