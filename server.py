from typing import cast
from flask import Flask, request, render_template, url_for, jsonify, session, redirect
from flask.json import tag
from flask_session import Session
import hydrus
import base64
import json
import os
import secrets
import sqlite3 as sql
import requests
import re

app = Flask(__name__)
SESSION_TYPE = 'filesystem'
SESSION_FILE_DIR = "hrt_session/"
app._static_folder = os.path.abspath("templates/static/")
app.secret_key = "cookiesonfire"
app.config.from_object(__name__)
Session(app)


def search_files(api_key, api_url, search_tags, inboxBool, archiveBool):
    cl = hydrus.Client(api_key, api_url)
    fids = cl.search_files(search_tags, inboxBool, archiveBool)
    return fids


def get_services(api_key, api_url):
    cl = hydrus.Client(api_key, api_url)
    return cl.get_tag_services()


def save_session(api_key, api_url, service):
    session['api_key'] = api_key
    session['api_url'] = api_url
    session['service'] = service


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


def sizeof_fmt(num, suffix='B'):
    for unit in ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)


@app.route('/index', methods=['GET', 'POST'])
def ad():
    try:
        if request.method == 'GET':
            return redirect(url_for('index'))
        try:
            session['session_id']
        except KeyError:
            generate_session_id()

        # start POST processing
        save_session(request.form.get('api_key'), request.form.get(
            'api_url'), request.form.get('service'))
        api_key = session['api_key']
        api_url = session['api_url']

        if 'archive' in request.form.getlist('location'):
            archiveBool = True
        else:
            archiveBool = False
        if 'inbox' in request.form.getlist('location'):
            inboxBool = True
        else:
            inboxBool = False

        session_id = session['session_id']
        post_tags = request.form.get('tags')
        tags = post_tags.split()
        clean_tags = []
        for tag in tags:
            clean_tags.append(tag.replace('_', ' '))
        fids = search_files(api_key, api_url, clean_tags,
                            inboxBool, archiveBool)
        total_ids = len(fids)
        save_sql(fids)

        session['appendTag'] = []
        for tag in request.form.get('appendTags').split():
            session['appendTag'].append(tag.replace('_', ' '))

        return render_template('results.html', tagrepo=get_services(api_key, api_url), ids=total_ids, tags=post_tags)
    except hydrus.InsufficientAccess:
        return render_template('index.html', error="Insufficient access to Hydrus API", namespaces=session['namespaceColors'])
    except hydrus.ServerError:
        return render_template('index.html', error="Hydrus API encountered a server error", namespaces=session['namespaceColors'])
    except hydrus.APIError:
        return render_template('index.html', error="Hydrus API encountered a server error", namespaces=session['namespaceColors'])


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
        intid = int(id)
        iid = int(fids[intid])
        nid = str(int(id) + 1)
        total_ids = len(fids)
        image = api_url+"/get_files/file?file_id=" + \
            str(int(fids[intid]))+"&Hydrus-Client-API-Access-Key="+api_key
        next_images = [api_url+"/get_files/file?file_id="+str(int(fids[intid+1]))+"&Hydrus-Client-API-Access-Key="+api_key, api_url+"/get_files/file?file_id="+str(int(fids[intid+2]))+"&Hydrus-Client-API-Access-Key=" +
                       api_key, api_url+"/get_files/file?file_id="+str(int(fids[intid+3]))+"&Hydrus-Client-API-Access-Key="+api_key, api_url+"/get_files/file?file_id="+str(int(fids[intid+4]))+"&Hydrus-Client-API-Access-Key="+api_key]
        metadata = json.loads(json.dumps(cl.file_metadata(file_ids=[iid])[0]))
        session['metadata'] = metadata
        hash = metadata['hash']
        mime = metadata['mime']
        filesize = sizeof_fmt(metadata['size'])
        known_urls = metadata['known_urls']
        # displayTags = metadata['service_names_to_statuses_to_display_tags']
        # #convert spaces to _ in tag repo name
        # tags = { x.translate({32:"_"}) : y
        #          for x, y in tags.items()}

        if request.method == 'POST':
            if request.form.get('tagrepo') != None:
                session['selectedTagRepo'] = request.form.get('tagrepo')

        def checkModifiable(tag):
            try:
                if tag in metadata['service_names_to_statuses_to_tags'][session['selectedTagRepo']]['0']:
                    return True
                else:
                    return False
            except:
                return False

        def matchNamespace(tag):
            for namespace in session['namespaceColors']:
                if re.fullmatch(namespace[1], tag):
                    return namespace[0]
            return ""

        return render_template('show-file.html', image=image, next_images=next_images, nid=nid, current_id=intid, total_ids=total_ids, mime=mime, meta=metadata, filesize=filesize, known_urls=known_urls, selectedService=session['selectedTagRepo'], checkModifiable=checkModifiable, matchNamespace=matchNamespace, namespaces=session['namespaceColors'])
    except IndexError:
        return redirect(url_for('index'))
    except KeyError: #expired session
        return redirect(url_for('index'))


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
    matchedTags = {}
    for tag in tagsToAdd:
        for namespace in session['namespaceColors']:
            if re.fullmatch(namespace[1], tag):
                matchedTags.update({tag: namespace[0]})
                break

    listOfTags = {tag_repo: {"0": tagsToAdd, "1": tagsToDel}}
    cl = hydrus.Client(session['api_key'], session['api_url'])
    cl.add_tags([hash], service_to_action_to_tags=listOfTags)
    listOfTags.update({"matches": matchedTags})
    return jsonify(listOfTags)  # updated lsit of tags


@app.route('/updatePrefs', methods=['POST'])
def updatePrefs():
    data = request.get_json()
    session['namespaceColors'] = data['namespaceColors']
    # print(session['namespaceColors'])
    return data

@app.route('/', methods=['GET'])
def index():
    try:
        session['namespaceColors']
        # print(session['namespaceColors'])
    except KeyError:
        session['namespaceColors'] = [
            # ["className","regex","hexColor"], apply top to bottom
            ["character", "^character:.*$", "#00aa00"],
            ["creator", "^creator:.*$", "#ff0000"],
            ["meta", "^meta:.*$", "#6f6f6f"],  # default #111111
            ["person", "^person:.*$", "#008000"],
            ["series", "^series:.*$", "#d200d2"],
            ["studio", "^studio:.*$", "#ff0000"],
            ["namespaced", "^.*:.*$", "#72a0c1"],
            ["unnamespaced", "^(?!.*:).*$", "#00aaff"]
        ]
    return render_template('index.html', namespaces=session['namespaceColors'])


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8243, debug=True)
