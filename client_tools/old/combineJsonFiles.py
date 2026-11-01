# -*- coding: utf-8 -*-
import xdrlib
import sys
import utils
import os
import string
import json
import demjson
import io
import codecs
reload(sys)
sys.setdefaultencoding('utf-8')

dirPath = "/Users/albert/svn/star_svn/star_client/HelloStars/tools/config/"
outPath = "/Users/albert/svn/star_svn/star_client/HelloStars/assets/resources/config/"

jsonFormat = demjson.decode('{"total_levels":150}')


def loadJson(jsonName):
    print "file:", dirPath+jsonName
    f = io.open(dirPath+jsonName, encoding='utf-8')
    jsonContent = json.load(f)
    return jsonContent


if __name__ == "__main__":
    print sys.argv
    if len(sys.argv) < 2:
        os.exit(1)
    for index in range(len(sys.argv)):
        if index > 0:
            fileName = sys.argv[index]
            content = loadJson(fileName)
            filepath, filename, extension = utils.getFileNameAndExtFromPath(
                fileName)
            jsonFormat[filename] = content
    # print "content:",jsonFormat
    with codecs.open(outPath+"config.json", "w", "utf-8") as f:
        f.write(demjson.encode(jsonFormat))
