import os
import sys

sys.path.append("..")
import re
import shlex
import subprocess
import platform
import utils

distDir = "/Users/hxjs/Desktop/hxjs/workspacek/client_project/assets/scripts/game/proto"
outputFile = "msg"
messageTypeFile = "message-type"

protoDir = "/Users/hxjs/Desktop/hxjs/protos"
reImport = re.compile(r'^import\s+"(.*\.proto)";$')
reContentStart = re.compile(r"^\s*(message|enum|//\s+cmd)\s+")
messageCodeFormat = re.compile(r"^\s*(//\s*cmd)+")
messageName = re.compile(r"^\s*(message)\s+")
messageCodes = ["0"]
messageNames = ["BaseRequest"]


def findImports(lines):
    imports: list[str] = []
    for line in lines:
        m = reImport.match(line.strip())
        if m:
            imports.append(m.group(1))
    return imports


def orderedProto(dir: str):
    files: dict[str, list[str]] = {}
    depends: dict[str, list[str]] = {}

    for file in os.listdir(dir):
        if os.path.splitext(file)[1] != ".proto":
            continue

        f = open(os.path.join(dir, file), "r", encoding="UTF-8")
        proto = f.readlines()  # 获取文件所有内容
        f.close()

        imports = findImports(proto)
        files[file] = imports
        for v in imports:
            l = depends.get(v)
            if not l:
                l = []
                depends[v] = l
            l.append(file)

    result: list[str] = []

    while len(files):
        for f in sorted(files):
            imports = files[f]
            if not len(imports):
                result.append(f)
                files.pop(f)
                l = depends.get(f)
                if l:
                    for v in l:
                        files[v].remove(f)

    return result


def writeToFile(filePath, content):
    parDir = os.path.dirname(filePath)
    if not os.path.exists(parDir):
        os.makedirs(parDir)

    fo = open(filePath, "wb")
    fo.write(content.encode("utf-8"))
    fo.close()


# 生成协议入口
# python3 gen.py /Users/hxjs/Desktop/hxjs/protos /Users/hxjs/Desktop/remote
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 3:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    protoDir = sys.argv[1]
    distDir = sys.argv[2]
    content = """syntax = "proto3";
package msg;
"""
    files = orderedProto(protoDir)
    for file in files:
        f = open(os.path.join(protoDir, file), "r", encoding="UTF-8")
        proto = f.readlines()  # 获取文件所有内容
        f.close()

        content += "\n"
        start = False
        messageCode = 0
        for line in proto:
            start = start or reContentStart.match(line)
            if start:
                content += line
            if messageCodeFormat.match(line):
                messageCode = line.split("cmd")[1].strip().split(" ")[0]
                messageCodes.append(messageCode)
            if messageCode and messageName.match(line):
                messageNames.append(
                    line[0 : line.find("{")].replace("message", "").strip()
                )
                messageCode = 0
                if len(messageCodes) != len(messageNames):
                    print("error:", messageCodes, messageNames)

    outProto = os.path.join(distDir, f"{outputFile}.proto")
    outTs = os.path.join(distDir, f"{outputFile}.ts")
    messageTypeTs = os.path.join(distDir, f"{messageTypeFile}.ts")
    writeToFile(outProto, content)

    shellCmd = f"pbjs --ts {outTs} {outProto}"
    print("cmd", shellCmd)
    if platform.system() == "Windows":
        os.system(shellCmd)
    else:
        subprocess.run(shlex.split(shellCmd))

    # 消息名称类
    messageTypeContent = """
export enum MessageType{{
    {content}
}}
"""
    messageTypeContentStr = ""
    # 替换接口 interface 为class 方便书写
    tsContent = utils.readFile(outTs).decode()
    for index, message in enumerate(messageNames):
        print(message, messageCodes[index])
        tsContent = tsContent.replace("interface " + message, "class " + message)
        messageTypeContentStr += message + "=" + messageCodes[index] + ",\n"
    writeToFile(outTs, tsContent)

    messageTypeContent = messageTypeContent.format(content=messageTypeContentStr)
    writeToFile(messageTypeTs, messageTypeContent)
