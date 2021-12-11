# Hydrus Remote Tagging
A web interface for tagging your hydrus files.

# Dependencies  
```
hydrus-api  
flask
Flask-Session
```

# How to use
Just run `$ python server.py`  

By default the server runs on http://0.0.0.0:8243, if you are on windows you might not be able to connect to `0.0.0.0`.  
Try using `127.0.0.1`, `localhost`, or the computers local ip.  

HRT uses a storage system to manage cookies instead of using the default 4KB session cookies to allow storing complex tag presentation rules. The location and configuration of the storage system can be set in `server.py`, near the top of the code. Configuration details can be found [here.](https://flask-session.readthedocs.io/en/latest/#configuration) By default, this uses the folder `./hrt_session`.

**You also might want to change the app.secret_key in the `server.py` file**

## Pages:
### Main
* Text inputs for `API URL`, `API key`, `search query`, `tag(s) to append for each tagged file`. Radio button to choose to search from `inbox` or `archive`. `Search` button to submit.
* Settings button for Tag Presentation:
  * Rules are editable when the `Modify` button is enabled. **Rules/Preferences are not _saved_ unless the `Save` button is pressed!**
  * Rules are applied top to bottom. For example, for all other tags that don't match, eg. unnamespaced tags, place the rule at the bottom.
  * Plain text mode - useful for bulk importing / exporting rules. Rules must be in this format: `["class-name","Python regex","#ffffff"]` per line.
### Results
Shows the number of files found for a search result for files in `my files` file repository. Option to choose a local tag repository to commit to for this session.
### Tagging page:
* File preview fills page.
* Sidebar:
  * Resizable, maintains same size and display state across pages.
  * Buttons to toggle the file metadata (known URLs & hash) and the sidebar.
  * Clicking on the headers except for `All Known Tags` will toggle the visibility of their contents.
  * List of tags for `All Known Tags`, where color is applied to each tag as per the rules set in tag presentation rules. Tags that are **bolded** and *italicised* indicates that the tag can be removed as they are committed to the selected local tag repository.
* Tag input field at the bottom and a `→` button on right.
  * Submitted tags are committed to the selected local tag repository for this session, or until the user initiates a new session from the main page.
  * User enters comma delimited list of tags into text field. Upon pressing `ENTER` or `→`, tags are commited/rescinded to/from the selected tag repository.
  * If `ENTER` or `→` is pressed with nothing in the text field, the next file is presented. Else, the text field is submitted.
  * If `ALT` or `🛈`/`X` is pressed while viewing a file, the sidebar is toggled.
* Notes:
  * Tags sent has whitespaces trimmed and converted to lowercase.

### Notes
* Files are tracked in current session to allow browser to navigate back and forth pages, but no further than the last presented file.
* If `Tag(s) to append for each tagged file` is set, then all files are tagged with this if changes are made. Handy for searching and spellchecking files tagged with HRT.
  * [Adding tagged files to a page](https://github.com/hydrusnetwork/hydrus/issues/350) in the Hydrus client is not possible via client API yet. The only option for this is via URL Import but this requires a valid url.
* **Siblings & Parents are not supported yet.** This will be implemented when the [Client API supports it](https://github.com/hydrusnetwork/hydrus/issues/921). Until then, HRT will only show tags _as they are_ in the DB, _before_  being siblinged and parents applied.
* To prevent abuse, remote tag repositories are not supported. Add the tags to a local tag repository and migrate them yourself when you are back at your Hydrus client.
* Tag autocomplete can be added, but at this current stage it is not feasible (fetch all files' metadata, collate tags). This feature will be looked into when this [issue](https://github.com/hydrusnetwork/hydrus/issues/958) is resolved.
* *Be sure to upvote the linked issues if you'd like for them to be added!*

Based off of [koto's archive-delete web app](https://gitgud.io/koto/hydrus-archive-delete), HRT improves my tagging workflow and so I share this to improve other's tagging workflow.
I do not take any responsibility for unintentional changes to files if this behaves unexpectedly, create an issue so that I can look into or fix the code yourself and let me know (or don't).