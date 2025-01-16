# Hydrus Remote Tagging
A web interface for tagging your hydrus files.

# Dependencies  
```
python3.9+
hydrus-api  
flask
Flask-Session
```

# How to use
## Local Install
Just run 
```
python server.py
```  

## Docker

Build your Docker image named `hydrus-remote-tagging`
```
docker build -t hydrus-remote-tagging .\Dockerfile
```

Load the image into a container (Run the instance) and detach it from the CLI so that it runs in the background
```
docker run -d -p ${PORT}:8243 -e HRT_SECRET_KEY=<yoursecretkey> hydrus-remote-tagging
```

Replace `${PORT}` with your desired available port (eg. port `80` or `8080`), and `<yoursecretkey>` with your secret key for Python's Flask.
The instance should then be accessible at `http://localhost:${PORT}`

Omit the `-d` to make it run in the CLI.

# Changes
20250115:

* Tags now flex into the available space instead of taking up a new line each. Hopefully this will make viewing lots of tags easier instead of scrolling down frequently. Adjust sidebar width to fit more/squeeze out tags into the available space.
* Added a "tag recall" button. Re-submits the last submitted set of tags. Useful for a sequence of images (eg. a set) that need the same tags. It is a yellow button with a partial clock icon.
* Added a "fast tag input" button. Useful to enter tag(s) other than the "tag(s) to append for each file" option, but only on certain files. This can be set on the initial search page on `index.html`. It is a red button with a play icon in a circle.
* Added notes into the expandable additional information field.

## Pages:
### Main
* Inputs:
  * `API URL` - URL to the Hydrus client API
  * `API key` - Access key for the api
  * `search query` - search for files with tags here. Space seperated & replace spaces with underscore. System predicates supported.
  * `tag(s) to append for each tagged file` - Additional tags to add to all _tagged_ files.
  * **`[NEW]`** - `Tags to use as fast input` - Similar the previous field, but available as a button (red button with play icon inside circle) to be used on individual files. This button will enter the tag(s) entered here, and jump to the next file.
  * `Sort` - Sort found files in selected type.
  * `Order` - Order found files in ascending or descending order.
  * `Search` button to submit.
* Settings for Tag Presentation:
  * Rules are editable when the `Modify` button is enabled. **Rules/Preferences are not _saved_ unless the `Save` button is pressed!**
  * Rules are applied top to bottom. For example, for all other tags that don't match, eg. unnamespaced tags, place the rule at the bottom.
  * Plain text mode - useful for bulk importing / exporting rules. Rules must be in this format: `["class-name","JS regex","#ffffff"]` per line.
### Results
Shows the number of files found for a search result for files in `my files` file repository. Option to choose a local tag repository to commit to for this session.
### Tagging page:
* File preview fills page.
* Left Sidebar (Recent / Frequent tags)
  * Toggled by pressing `⭐` button.
  * Grey filled clock button toggles between _recently added tags_ and _most frequently added tags_ for the session.
  * **`[NEW]`**  Yellow partial clock button resubmits the last submitted tag(s).
  * **`[NEW]`**  Red play icon within circle button submits the "fast input" tag(s) and goes to the next file.
  * Resizable, maintains same size and display state across pages.

* Right Sidebar (File metadata):
  * Toggled by pressing metadata sidebar key (default `CTRL`) or `🛈` button.
  * Resizable, maintains same size and display state across pages.
  * Buttons to toggle the file metadata (hash, notes & known URLs) and the sidebar.
  * List of tags for `All Known Tags`, where color is applied to each tag as per the rules set in tag presentation rules. Tags that are **bolded** and *italicised* indicates that the tag can be removed as they are committed to the selected local tag repository.
* Tag input field at the bottom, and a green `→` or blue `📋` button on right.
  * Submit mode (green `→`)
    * Submitted tags are committed to the selected local tag repository for this session, or until the user initiates a new session from the main page.
    * User enters comma delimited list of tags into text field. Upon pressing `ENTER` or `→`, tags are commited/rescinded to/from the selected tag repository.
    * If `ENTER` or `→` is pressed with nothing in the text field, the next file is presented. Else, the text field is submitted.
  * Paste mode (blue 📋)
    * Any selected tags on visible sidebars activate this mode.
    * Tap on any tag to select or deselect a tag.
    * Press `ENTER` or `📋` button to paste selected tags into input field. This also exits Paste mode.
    * Clicking anywhere in the file viewer exits Paste mode.
    * Switching the left sidebar's mode clears any selected tag in that sidebar.
* Notes:
  * Tags sent has whitespaces trimmed and converted to lowercase.
  * Sidebars can be resized. Be careful not to resize over buttons when using small screens (eg. mobile).

### Notes
* Files are tracked in current session to allow browser to navigate back and forth pages, but no further than the last presented file.
* If `Tag(s) to append for each tagged file` is set, then all files are tagged with this if changes are made. Handy for searching and coming back to files tagged with HRT for future review.
  * [Adding tagged files to a page](https://github.com/hydrusnetwork/hydrus/issues/350) in the Hydrus client is not possible via client API yet. The only option for this is via URL Import but this requires an importable url.
* **Siblings & Parents are not supported yet.** This will be implemented when the [Client API supports it](https://github.com/hydrusnetwork/hydrus/issues/921). Until then, HRT will only show tags _as they are_ in the DB, _before_  being siblinged and parents applied.
* To prevent abuse, remote tag repositories are not supported. Add the tags to a local tag repository and migrate them yourself when you are back at your Hydrus client.
* Tag autocomplete can be added, but at this current stage it is not feasible (fetch all files' metadata, collate tags). This feature will be looked into when this [issue](https://github.com/hydrusnetwork/hydrus/issues/958) is resolved.
* *Be sure to upvote the linked issues if you'd like for them to be added!*

Based off of [koto's archive-delete web app](https://gitgud.io/koto/hydrus-archive-delete), HRT improves my tagging workflow and so I share this to improve other's tagging workflow.
I do not take any responsibility for unintentional changes to files if this behaves unexpectedly, create an issue so that I can look into or fix the code yourself and let me know (or don't).
