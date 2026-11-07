import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import re
import shutil
import subprocess
import tempfile

projectDir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
distDir = os.path.join(projectDir, "MajiangProject", "assets", "scripts", "game", "proto")
outputFile = "msg"
messageTypeFile = "message-type"

protoDir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "proto")
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


def readFile(filePath):
    with open(filePath, "rb") as file:
        return file.read()


# 生成协议入口
# python3 gen.py /Users/hxjs/Desktop/hxjs/protos /Users/hxjs/Desktop/remote
if __name__ == "__main__":
    if len(sys.argv) >= 2:
        protoDir = os.path.abspath(sys.argv[1])
    if len(sys.argv) >= 3:
        distDir = os.path.abspath(sys.argv[2])
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
    outJson = os.path.join(distDir, f"{outputFile}.json")
    messageTypeTs = os.path.join(distDir, f"{messageTypeFile}.ts")
    writeToFile(outProto, content)

    pbjs = shutil.which("pbjs")
    command = [pbjs, "-t", "json", "-o", outJson, outProto] if pbjs else [
        "npx", "--yes", "--package=protobufjs-cli", "--",
        "pbjs", "-t", "json", "-o", outJson, outProto
    ]
    print("cmd", " ".join(command))
    env = os.environ.copy()
    if not pbjs:
        env["npm_config_cache"] = os.path.join(tempfile.gettempdir(), "majiangai-npm-cache")
    subprocess.run(command, check=True, env=env)

    # 消息名称类
    messageTypeContent = """
export enum MessageType{{
    {content}
}}
"""
    messageTypeContentStr = ""
    for index, message in enumerate(messageNames):
        print(message, messageCodes[index])
        messageTypeContentStr += message + "=" + messageCodes[index] + ",\n"

    messageTypeContent = messageTypeContent.format(content=messageTypeContentStr)
    writeToFile(messageTypeTs, messageTypeContent)
