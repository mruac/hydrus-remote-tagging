# Hydrus Remote Tagging
A web interface for tagging your hydrus files.

# Dependencies  
hydrus-api  
flask  

# How to use
Just run `$ python server.py`  

By default the server runs on http://0.0.0.0:8244 , if you are on windows you might not be able to connect to 0.0.0.0.  
Try using 127.0.0.1, localhost, or the computers local ip.  

**You also might want to change the app.secret_key in the server.py file**

### TODO:
* double click tag to remove
* highlight tags that are added in this current session [inverted color div]
  * Highlighted tags are removable
  * Limitations: API doesnt show which tags are parents and so parent tags cannot be removed unless the child tag can be identified. Therefore only tags added in the current session is possible.
* add support to remove tags from text input
  * parse text input
  * sort tags based on existing and not-existing
  * delete existing & add not-existing
* add support to add tags for all files modified (eg. add `tagged` so that remotely tagged files can be searched again for review)

### Pages:
##### Main
Text inputs for API URL, API key, search query. "Search" button.
##### Results
Shows the number of files found for a search result. Option to choose a tag repository to commit to for this session.
Local tag repositories currently supported.
##### Tagging page:
* File preview fills page.
* List of current tags on right.
  * The title of the current tag repository is shown at the top.
  * Tags and it's siblings / parents added by this tool are highlighted.
  * The list of tags are updated each time a user sends entered tags from the input field.
* File metadata on right. 
  * Both sidebars are hidden by default, revealed when user clicks on `tags` or `(i)` button or hovers over left/right sides of window.
* Tag input at bottom, drop down list on left side for `tag repository` to commit/rescind tag to/from & text field for the rest of the space. `→` button on right.
  * Selected tag repository changes the list of tags to show tags associated with selection.
    * If `All known tags` tag repository is selected, the list of tags update to show  `All known tags` and the selection is reverted back to the last selection.
    * User must change the selection back and forth to show the list of tags for last selection again without selecting `All known tags`
  * User enters comma delimited list of tags into text field. Upon pressing `ENTER` or `→`, tags are commited/rescinded to/from the selected tag repository.
  * If `ENTER` or `→` is pressed with nothing in the text field, the next file is presented.
  * If `TAB` or `🛈`/`⨉` is pressed while viewing a file, the list of tags sidebar is toggled.

### Notes
* Files are tracked in current session to allow browser to navigate back and forth pages, but no further than the last presented file.
* If {trackRemotelyTaggedWithTag} is `true`, then all files are tagged with {remotelytaggedTag} if changes are made. Else, all files are added to {defaultPageName} Hydrus page
  * Using {remotelytaggedTag} requires no extra permissions.
  * There is no way to create a new page with the name {defaultPageName} via client API yet. The only option for this is via URL Import but this requires a valid url.
* Siblings & Parents are not supported yet!

## Todo  
* Custom namespace colors
  * Settings in main page
  * "Class name", "Regex", "CSS color"
  * regex is used to match against tags as they are processed for display
  * tags are matched top to bottom. If a tag is matched again and already has been given a color, it will not apply.


