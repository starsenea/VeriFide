# VeriFide
Made by Rishikesh and Ethan

## What is VeriFide?
VeriFide is an on-the-go fact checking extension, which takes in information written by a user in Google Docs, and tells us if the sentence is true or false. If false, it returns the correct statement using Google Chrome's Built-in Prompt AI API.

### Future Plans
We are working on converting this to an automatic fact checker, which checks statements as written by the user. 

#### Preparation
* Clone this repository onto your desktop.
* You will need to create an OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com/welcome?inv=1&invt=AbhxWA&project=verifide).
* Once created, copy the Client ID and paste in the manifest.json folder under OAuth2.
* In Google Chrome Canary, go to the [Extensions Page](chrome://extensions/) and click Load Unpacked.
* Navigate to the cloned folder and click open.
* After that, you are good to go. Try writing something and in a Google Doc and have fun!

