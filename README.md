# Hydrus Archive/Delete  
A web based archive/delete filter for Hydrus  

# Dependencies  
hydrus-api  
flask  

# How to use
Just run `$ python server.py`  

By default the server runs on http://0.0.0.0:4242 , if you are on windows you might not be able to connect to 0.0.0.0.  
Try using 127.0.0.1, localhost, or the computers local ip.  

**You also might want to change the app.secret_key in the server.py file**

## Keybinds  
A - Archive  
S - Skip  
D - Delete  
Z - Go back to previous page  

## Swiping  
You can swipe in a direction instead of pressing the buttons or keybinds.  
Swipe right to archive  
Swipe left to delete  
Swipe up to skip  

## Todo  
* Better preloading images(?) 
* Advanced Options  
  * Custom threshold  
  * Change Keybindings  
  * Hide buttons  
  * Low tag/known URL's warning  
* Namespace colors and tag sorting  
* Better exception handling   