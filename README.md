# CasterTool
Local tool for trackmania casters!

# Install

1. Clone repo
2. copy `config-default.js` to `config.js`
3. fill in your ubisoft login infos for accessing trackmania api
4. run: `npm install`

# Usage

1. start game
2. run at console: `npm start`
3. http://localhost:8000/

Usually you wish to have Browser source at obs:
Set the resolution to match your output, eg. 1920x1080 or 1280x720 and the url to<br>
http://localhost:8000/game/dashboard
or<br>
http://localhost:8000/game/tmwt<br>
<br>
There is a route as well to get any map info, send mapUid as parameter<br>
http://localhost:8000/map?uid=

