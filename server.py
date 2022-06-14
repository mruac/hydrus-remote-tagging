from flask import Flask, request, render_template, url_for, jsonify, session, redirect, make_response
from flask.json import tag
from flask_session import Session
import hydrus_api as hydrus
import json
import os
import secrets
import sqlite3 as sql
import re

app = Flask(__name__)
SESSION_TYPE = 'filesystem'
SESSION_FILE_DIR = "hrt_session/"
app._static_folder = os.path.abspath("templates/static/")
app.secret_key = "cookiesonfire"
app.config.from_object(__name__)
Session(app)

def search_files(api_key, api_url, search_tags, fileSort, fileOrder):
    cl = hydrus.Client(api_key, api_url)
    fids = cl.search_files(tags=search_tags, file_service_name="my files", tag_service_name="all known tags", file_sort_asc=fileOrder, file_sort_type=fileSort)
    return fids


def get_services(api_key, api_url):
    cl = hydrus.Client(api_key, api_url)
    return cl.get_services()


def save_session(api_key, api_url, tags):
    session['api_key'] = api_key
    session['api_url'] = api_url
    session['tags'] = tags


def generate_session_id():
    session['session_id'] = secrets.token_hex(10)


def save_sql(fids):
    session_id = session['session_id']
    fids = ','.join(str(e) for e in fids)
    with sql.connect("session.db") as con:
        cur = con.cursor()
        cur.execute("REPLACE INTO session (session_id, file_ids) VALUES (?,?)", (str(
            session_id), str(fids)))
        con.commit()


def get_fids_from_sql():
    session_id = session['session_id']
    with sql.connect("session.db") as con:
        cur = con.cursor()
        cur.execute(
            "SELECT file_ids FROM session WHERE session_id IS (?)", (str(session_id),))
        fids = cur.fetchone()
    return fids

@app.route('/index', methods=['GET', 'POST'])
def ad():
    try:
        if request.method == 'GET':
            return redirect(url_for('index'))
        try:
            session['session_id']
        except KeyError:
            generate_session_id()
        
        if request.form.getlist("fileOrder") == "true":
            isAscending = True
        else:
            isAscending = False

        # start POST processing
        save_session(request.form.get('api_key'), request.form.get(
            'api_url'), request.form.get('tags'))
        api_key = session['api_key']
        api_url = session['api_url']
        session_id = session['session_id']
        post_tags = request.form.get('tags')
        tags = post_tags.split()
        clean_tags = []
        for tag in tags:
            clean_tags.append(tag.replace('_', ' '))
        fids = search_files(api_key, api_url, clean_tags, int(request.form.getlist("fileSort")[0]), isAscending)
        total_ids = len(fids)
        save_sql(fids)

        session['appendTag'] = []
        for tag in request.form.get('appendTags').split():
            session['appendTag'].append(tag.replace('_', ' ').lower())

        return render_template('results.html', tagrepo=get_services(api_key, api_url), ids=total_ids, tags=post_tags)
    except hydrus.InsufficientAccess:
        return render_template('index.html', error="Insufficient access to Hydrus API")
    except hydrus.ServerError:
        return render_template('index.html', error="Hydrus API encountered a server error")
    except hydrus.APIError:
        return render_template('index.html', error="Hydrus API encountered an API error")


@app.route('/show-file/<id>', methods=['GET', 'POST'])
def ads(id):
    try:
        session['appendTagIsSet'] = False
        api_key = session['api_key']
        if session['api_url'].endswith('/'):
            api_url = session['api_url'][:-1]
        else:
            api_url = session['api_url']
        cl = hydrus.Client(api_key, api_url)
        fids = get_fids_from_sql()
        fids = list(fids)[0].split(',')
        intid = int(id) - 1
        iid = int(fids[intid])
        nid = str(int(id) + 1)
        total_ids = len(fids)
        image = api_url+"/get_files/file?file_id=" + \
            str(int(fids[intid]))+"&Hydrus-Client-API-Access-Key="+api_key
        next_images = []
        i = 1
        while i < 4 and intid+i < total_ids:
            next_images.append(api_url+"/get_files/file?file_id="+str(int(fids[intid+i]))+"&Hydrus-Client-API-Access-Key="+api_key)
            i += 1
        metadata = json.loads(json.dumps(cl.get_file_metadata(file_ids=[iid])[0]))
        session['metadata'] = metadata
        if request.method == 'POST':
            if request.form.get('tagrepo') != None:
                session['selectedTagRepo'] = request.form.get('tagrepo')

        # prevent browser from loading cached page to force re-fetch tags when navigating back and forth
        response = make_response(render_template('show-file.html', image=image, next_images=next_images, nid=nid, current_id=id, total_ids=total_ids, meta=metadata, selectedService=session['selectedTagRepo']))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate" # HTTP 1.1.
        response.headers["Pragma"] = "no-cache" # HTTP 1.0.
        response.headers["Expires"] = "0" # Proxies.
        return response

    except IndexError:
        return redirect(url_for('index'))
    except KeyError:  # expired session
        return redirect(url_for('index'))
    except hydrus.MissingParameter: #TESTME:
        return render_template('index.html', error="Search query expired - Please try again.")

@app.route('/updateTags', methods=['POST'])
def ajaxUpdate():
    data = request.get_json()
    tagsToAdd = data['add']
    tagsToDel = data['del']
    hash = data['hash']
    tag_repo = session['selectedTagRepo']

    if not session['appendTagIsSet']:
        try:
            if not all(tag in session['metadata']['service_names_to_statuses_to_tags'][tag_repo]['0'] for tag in session['appendTag']):
                for tag in session['appendTag']:
                    if tag not in session['metadata']['service_names_to_statuses_to_tags'][tag_repo]['0'] and tag not in tagsToAdd:
                        tagsToAdd.append(tag)
                        session['appendTagIsSet'] = True
        except KeyError:
            session['appendTagIsSet'] = True
            for tag in session['appendTag']:
                tagsToAdd.append(tag)

    listOfTags = {tag_repo: {"0": tagsToAdd, "1": tagsToDel}}
    cl = hydrus.Client(session['api_key'], session['api_url'])
    cl.add_tags([hash], service_names_to_actions_to_tags=listOfTags)
    # listOfTags.update({"matches": matchedTags})
    return jsonify(listOfTags)  # updated lsit of tags

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8243, debug=True)
