from flask import Flask, request, render_template, url_for, jsonify, session, redirect
import hydrus
import base64
import json
import os
import secrets
import sqlite3 as sql

app = Flask(__name__)
app._static_folder = os.path.abspath("templates/static/")
app.secret_key = "lolicatgirls"

def search_files(api_key, api_url, search_tags):
    cl = hydrus.Client(api_key, api_url)
    fids = cl.search_files(search_tags, True)
    return fids

def add_tags(api_key, api_url, hash, tag):
    service = session['service']
    cl = hydrus.Client(api_key, api_url)
    cl.add_tags([hash], None, {service:{1:["hydrus-archive-delete:archive"]}})
    cl.add_tags([hash], None, {service:{1:["hydrus-archive-delete:delete"]}})
    cl.add_tags([hash], {service: [tag]})

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
        cur.execute("REPLACE INTO session (session_id, file_ids) VALUES (?,?)",(str(session_id), str(fids)) )
        con.commit()

def get_fids_from_sql():
    session_id = session['session_id']
    with sql.connect("session.db") as con:
        cur = con.cursor()
        cur.execute("SELECT file_ids FROM session WHERE session_id IS (?)", (str(session_id),))
        fids = cur.fetchone();
    return fids

@app.route('/archive-delete', methods=['GET', 'POST'])
def ad():
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
    clean_tags = ["-hydrus-archive-delete:archive","-hydrus-archive-delete:delete"]
    for tag in tags:
        clean_tags.append(tag.replace('_',' '))
    fids = search_files(api_key, api_url, clean_tags)
    total_ids = len(fids)
    save_sql(fids)
    return render_template('archive-delete.html', ids = total_ids, tags = post_tags)

@app.route('/archive-delete/<id>', methods=['GET', 'POST'])
def ads(id):
    try:
        api_key = session['api_key']
        api_url = session['api_url']
        cl = hydrus.Client(api_key)
        fids = get_fids_from_sql()
        fids = list(fids)[0].split(',')
        intid = int(id)
        iid = int(fids[intid-1])
        nid = str(int(id) + 1)
        total_ids = len(fids)
        image = api_url+"/get_files/file?file_id="+str(iid)+"&Hydrus-Client-API-Access-Key="+api_key
        if request.method == 'POST':
            hash = cl.file_metadata(file_ids=[iid],only_identifiers=True)[0]["hash"]
            if request.form.get('action') == 'archive':
                add_tags(api_key, api_url, hash, "hydrus-archive-delete:archive")
            elif request.form.get('action') == 'delete':
                add_tags(api_key, api_url, hash, "hydrus-archive-delete:delete")
        return render_template('archive-delete-show.html', image = image, nid = nid, current_id = intid, total_ids = total_ids)
    except IndexError:
        return redirect(url_for('index'))

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4242, debug=True)