# -*- coding: utf-8 -*-
import sys

sys.path.append("..")
import os
import utils
import base64


if __name__ == "__main__":
    lines = utils.readFileLines("test.txt")
    deLineStr = ""
    for line in lines:
        deLineStr += base64.b64decode(line).decode("utf-8") + "\n"
    utils.writeToFile("./test2.txt", deLineStr)
