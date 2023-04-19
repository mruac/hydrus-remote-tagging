from flask import Flask, request, render_template, url_for, jsonify, session, redirect, make_response
import hydrus_api as hydrus
import json
import os
import secrets
import sqlite3 as sql

LEGACY_API_VERSION = 34

app = Flask(__name__)
app._static_folder = os.path.abspath("templates/static/")
app.secret_key = os.getenv('HRT_SECRET_KEY') or "cookiesonfire"

def search_files(api_key, api_url, search_tags, fileSort, fileOrder):
    cl = hydrus.Client(api_key, api_url)
    fids = cl.search_files(tags=search_tags, file_service_keys="my files",
                           tag_service_key="all known tags", 
                           file_sort_asc=fileOrder,
                           file_sort_type=fileSort
                           ) # FIXME: Fix the sort & order feature, it doesn't do this atm.
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

        return render_template('results.html', 
        tagrepo=get_services(api_key, api_url), 
        ids=total_ids, 
        tags=post_tags
        )
    except hydrus.InsufficientAccess:  # returns http://, not https://
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
            next_images.append(api_url+"/get_files/file?file_id=" +
                               str(int(fids[intid+i]))+"&Hydrus-Client-API-Access-Key="+api_key)
            i += 1
        metadata = json.loads(json.dumps(
            cl.get_file_metadata(file_ids=[iid])[0]))
        session['metadata'] = metadata
        session['api_version'] = cl.get_api_version()["version"]
        session['repos'] = get_services(api_key, api_url)
    
        if request.method == 'POST':
            if request.form.get('tagrepo') != None:
                session['selectedTagRepoKey'] = request.form.get('tagrepo')
        # prevent browser from loading cached page to force re-fetch tags when navigating back and forth
        response = make_response(render_template('show-file.html', 
        image=image, 
        next_images=next_images, 
        nid=nid, 
        current_id=id, 
        total_ids=total_ids,
        meta=metadata, 
        selectedServiceKey=session['selectedTagRepoKey'],
        repos=session['repos'],
        api_version = session['api_version']
        ))
        
        # HTTP 1.1.
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"  # HTTP 1.0.
        response.headers["Expires"] = "0"  # Proxies.
        return response

    except IndexError:
        return redirect(url_for('index', err='inaccessible'))
    except KeyError:  # expired session
        return redirect(url_for('index', err='expired_query'))
    except hydrus.MissingParameter:
        return redirect(url_for('index', err='expired_query'))
    except hydrus.ConnectionError:
        return redirect(url_for('index', err='dead'))
    except hydrus.APIError:
        return redirect(url_for('index', err='dead'))


@app.route('/updateTags', methods=['POST'])
def updateTags():
    data = request.get_json()
    tagsToAdd = data['add']
    tagsToDel = data['del']
    hash = data['hash']
    tag_repo_key = session['selectedTagRepoKey']
    if session['api_version'] > LEGACY_API_VERSION:
        file_tags = session['metadata']['tags'][tag_repo_key]["storage_tags"]
    else: 
        file_tags = session['metadata']['service_keys_to_statuses_to_tags'][tag_repo_key]

    if not session['appendTagIsSet']:
        try:
            if not all(tag in file_tags['0'] for tag in session['appendTag']):
                for tag in session['appendTag']:
                    if tag not in file_tags['0'] and tag not in tagsToAdd:
                        tagsToAdd.append(tag)
                        session['appendTagIsSet'] = True
        except KeyError:
            session['appendTagIsSet'] = True
            for tag in session['appendTag']:
                tagsToAdd.append(tag)

    listOfTags = {tag_repo_key: {"0": tagsToAdd, "1": tagsToDel}}
    cl = hydrus.Client(session['api_key'], session['api_url'])
    cl.add_tags([hash], service_keys_to_actions_to_tags=listOfTags)
    # listOfTags.update({"matches": matchedTags})
    return jsonify(listOfTags)  # updated lsit of tags

@app.route('/searchTags', methods=['GET'])
def searchTags():
    cl = hydrus.Client(session['api_key'], session['api_url'])
    response = cl._api_request("GET", "/add_tags/search_tags", params={"search": request.args.get('tag'), "tag_display_type": "display"}) #NOTE: create a PR to add the tag_display_type to the cl.search_tags() function
    return response.json()["tags"];

@app.route('/', methods=['GET'])
def index():
    if request.args.get('err') == "inaccessible":
        return render_template('index.html', error="Unreachable file - Please try again from the start.")
    elif request.args.get('err') == "expired_query":
        return render_template('index.html', error="Search query expired - Please try again.")
    elif request.args.get('err') == "dead":
        return render_template('index.html', error="Hydrus API offline. Please check and try again later.")
    else:
        return render_template('index.html')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8243, debug=True)
