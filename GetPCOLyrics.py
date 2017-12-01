import urllib2, base64, json, re, sys, os

username = ""
password = ""
base64string = base64.encodestring("%s:%s" % (username, password)).replace('\n', '')
debug = False

# Function
def getJSON(url):
  if debug:
    print "--debug-- " + url
  try:
    request = urllib2.Request(url)
    request.add_header("Authorization", "Basic %s" % base64string)
    result = urllib2.urlopen(request)
  except:
    print "Failed to contact Planning Center Online"
    exit()
  return json.loads(result.read())

# Function
def formatLyrics(str):
  str = str.strip()
  str = re.sub(r'\[.*?\]', "", str)
  str = re.sub(r'COLUMN_BREAK', "", str)
  str = re.sub(r'<hide>.*<\/hide>', "", str, 0, re.DOTALL)
  str = re.sub(r'\r\n', "\n", str)
  str = re.sub(r'\n\n\n+', "\n\n", str)
  str = re.sub(r'\n', "<br>", str)
  return str

# Main
if len(sys.argv) > 1:
  if sys.argv[1] == "debug":
    debug = True
  else:
    print "Invalid argument: " + sys.argv[1]
    exit()
print "Searching for next service..."
planTypes = getJSON("https://api.planningcenteronline.com/services/v2/service_types")
for planType in planTypes["data"]:
  if planType["attributes"]["name"] == "Sunday Service":
    plans = getJSON(planType["links"]["self"] + "/plans")
    services = getJSON(plans["links"]["self"] + "?filter=future")
    selection = 1
    if len(services) < 1:
      print "No services were found"
      exit()
    print "Found " + services["data"][0]["attributes"]["dates"] + " service"
    print "Searching for songs..."
    serviceItems = getJSON(services["data"][0]["links"]["self"] + "/items")
    printBlankLyrics = False
    lyrics = "<html>"
    songFound = False
    for serviceItem in serviceItems["data"]:
      if serviceItem["attributes"]["item_type"] == "song":
        songFound = True
        songItem = getJSON(serviceItem["links"]["self"])
        song = getJSON(songItem["data"]["links"]["song"])
        # Get song title
        songTitle = song["data"]["attributes"]["title"]
        print "Getting lyrics for " + songTitle
        lyrics += "<b>" + songTitle + "</b><br><br>"
        # Get copyright information
        author = song["data"]["attributes"]["author"]
        if author is not None:
          lyrics += "(" + author.strip()
          copyright = song["data"]["attributes"]["copyright"]
          if copyright is not None and copyright.strip() != "Unknown":
            lyrics += "/" + copyright.strip()
          lyrics += ")<br><br>"
        arrangement = getJSON(song["data"]["links"]["arrangements"])
        chart = arrangement["data"][0]["attributes"]["chord_chart"]
        if not chart and not printBlankLyrics:
          answer = raw_input("Warning: some songs do not have lyrics. Continue? [y/n]: ")
          if answer == 'n':
            exit();
          else:
            printBlankLyrics = True
        if chart:
          lyrics += formatLyrics(chart) + "<br><br>"
    lyrics += "</html>"
    if songFound:
      filename = "PCOLyrics.html"
      fo = open(filename, "w")
      fo.write(lyrics.encode('utf-8'))
      fo.close()
      print "Songs written to: " + os.path.abspath(filename)
    else:
      print "No songs were found for the selected service"