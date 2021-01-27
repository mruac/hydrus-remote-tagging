from flask import Flask, request, render_template, url_for, jsonify, session, redirect
import hydrus
import base64
import json
import os
import secrets
import sqlite3 as sql
import requests

app = Flask(__name__)
app._static_folder = os.path.abspath("templates/static/")
app.secret_key = "lolicatgirls"

def search_files(api_key, api_url, search_tags):
    cl = hydrus.Client(api_key, api_url)
    fids = cl.search_files(search_tags, True)
    return fids

def archive_file(api_key, api_url, hash):
    requests.post(api_url+"/add_files/undelete_files", headers={"Hydrus-Client-API-Access-Key":api_key}, json={"hash": hash}) # undelete file first if in trash
    requests.post(api_url+"/add_files/archive_files", headers={"Hydrus-Client-API-Access-Key": api_key}, json={"hash": hash})

def delete_file(api_key, api_url, hash):
    requests.post(api_url+"/add_files/delete_files", headers={"Hydrus-Client-API-Access-Key":api_key}, json={"hash": hash})

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
        cur.execute("REPLACE INTO session (session_id, file_ids) VALUES (?,?)",(str(session_id), str(fids)))
        con.commit()

def get_fids_from_sql():
    session_id = session['session_id']
    with sql.connect("session.db") as con:
        cur = con.cursor()
        cur.execute("SELECT file_ids FROM session WHERE session_id IS (?)", (str(session_id),))
        fids = cur.fetchone();
    return fids

def sizeof_fmt(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)

@app.route('/archive-delete', methods=['GET', 'POST'])
def ad():
    try:
        if request.method == 'GET':
            return redirect(url_for('index'))
        try:
            session['session_id']
        except KeyError:
            generate_session_id()
        save_session(request.form.get('api_key'), request.form.get('api_url'), request.form.get('service'))
        api_key = session['api_key']
        api_url = session['api_url']
        post_tags = request.form.get('tags')
        session_id = session['session_id']
        tags = post_tags.split()
        clean_tags = []
        for tag in tags:
            clean_tags.append(tag.replace('_',' '))
        fids = search_files(api_key, api_url, clean_tags)
        total_ids = len(fids)
        save_sql(fids)
        return render_template('archive-delete.html', ids = total_ids, tags = post_tags)
    except hydrus.InsufficientAccess:
        return render_template('index.html', error="Insufficient access to Hydrus API")
    except hydrus.ServerError:
        return render_template('index.html', error="Hydrus API encountered a server error")

@app.route('/archive-delete/<id>', methods=['GET', 'POST'])
def ads(id):
    try:
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
        image = api_url+"/get_files/file?file_id="+str(int(fids[intid]))+"&Hydrus-Client-API-Access-Key="+api_key
        next_images = [api_url+"/get_files/file?file_id="+str(int(fids[intid+1]))+"&Hydrus-Client-API-Access-Key="+api_key,api_url+"/get_files/file?file_id="+str(int(fids[intid+2]))+"&Hydrus-Client-API-Access-Key="+api_key,api_url+"/get_files/file?file_id="+str(int(fids[intid+3]))+"&Hydrus-Client-API-Access-Key="+api_key,api_url+"/get_files/file?file_id="+str(int(fids[intid+4]))+"&Hydrus-Client-API-Access-Key="+api_key]
        metadata = json.loads(json.dumps(cl.file_metadata(file_ids=[iid])[0]))
        hash = metadata['hash']
        mime = metadata['mime']
        filesize = sizeof_fmt(metadata['size'])
        known_urls = metadata['known_urls']
        tags = metadata['service_names_to_statuses_to_tags']
        tags.pop('all known tags')
        tags = { x.translate({32:"_"}) : y  
                 for x, y in tags.items()}
        if request.method == 'POST':
            if request.form.get('action') == 'archive':
                archive_file(api_key, api_url, hash)
            elif request.form.get('action') == 'delete':
                delete_file(api_key, api_url, hash)

        return render_template('archive-delete-show.html', image = image, next_images = next_images, nid = nid, current_id = intid, total_ids = total_ids, mime =  mime, meta = metadata, filesize = filesize, known_urls = known_urls, tags = tags)
    except IndexError:
        return redirect(url_for('index'))

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4242, debug=True)
