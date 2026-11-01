import subprocess
import os, sys
import platform

#!/usr/bin/env python
# -*- coding: UTF-8 -*-


colorRed = "\033[31m"
colorEnd = "\033[0m"

astcencPath = "astcenc"


system_name = platform.system()


# 文件到 https://github.com/ARM-software/astc-encoder/releases 下载
if system_name == "Windows":
    print("系统是Windows")
    currentPath = os.path.dirname(os.path.abspath(__file__))
    astcencPath = os.path.join(currentPath, "../astc/", "astcenc-avx2.exe")
elif system_name == "Darwin":
    print("系统是macOS")
    astcencPath = "astcenc"
elif system_name == "Linux":
    print("系统是Linux")
    astcencPath = "astcenc-avx2"
else:
    print(f"未知系统: {system_name}")


def processCovertASTC(
    resDir, targetDir, blockSize="5x4", suffix=[".png", ".jpg"], skipDirs=None
):
    if ".png" in suffix:
        allPngFiles, targetAstcFiles = get_convert_files(resDir, targetDir, ".png", skipdirs=skipDirs)

        print(
            "【开始转换 png 为astc】 " + str(len(allPngFiles)) + "个文件，请耐心等待..."
        )

        preSize = getFilesSize(allPngFiles)
        print(allPngFiles, targetAstcFiles)
        for source, target in zip(allPngFiles, targetAstcFiles):
            print(source, target)
            convert_astc(source, target)

        afterSize = getFilesSize(targetAstcFiles)

        bl = round(afterSize * 100 / preSize)
        print(
            "【png转换为astc完毕】"
            + str(round(preSize / 1024 / 1024, 2))
            + "M -> "
            + str(round(afterSize / 1024 / 1024, 2))
            + "M ,压缩率:"
            + colorRed
            + str(bl)
            + "%"
            + colorEnd
        )

    if ".jpg" in suffix:
        allJpgFiles, targetAstcFiles = get_convert_files(resDir, targetDir, ".jpg", skipdirs=skipDirs)

        print(
            "【开始转换 jpg 为astc】 " + str(len(allJpgFiles)) + "个文件，请耐心等待..."
        )

        preSize = getFilesSize(allJpgFiles)

        for source, target in zip(allJpgFiles, targetAstcFiles):
            convert_astc(source, target, blockSize)

        afterSize = getFilesSize(targetAstcFiles)

        bl = round(afterSize * 100 / preSize)
        print(
            "【jpg转换为astc完毕】"
            + str(round(preSize / 1024 / 1024, 2))
            + "M -> "
            + str(round(afterSize / 1024 / 1024, 2))
            + "M ,压缩率:"
            + colorRed
            + str(bl)
            + "%"
            + colorEnd
        )


def getFilesSize(files):
    # print("files:", files)
    size = 0
    for file in files:
        if file != "":
            size = size + os.path.getsize(file)
    if size == 0:
        size = 1
    return size


def get_convert_files(source_folder, target_folder, suffix=".png", skipdirs=None):
    source_files = []
    target_files = []
    if skipdirs is None:
        skipdirs = []

    # 遍历源文件夹中的所有文件和目录
    for subdir, dirs, files in os.walk(source_folder):
        # 检查当前目录是否在skipdirs列表中
        # print(subdir, dirs, files)
        if any(skipdir in subdir for skipdir in skipdirs):
            continue

        for file in files:
            # 检查文件扩展名是否为.png
            if (
                isinstance(suffix, str)
                and file.lower().endswith(suffix)
                or isinstance(suffix, list)
                and file.lower().endswith(tuple(suffix))
                or suffix is None
            ):
                # 获取源文件的完整路径
                source_file_path = os.path.join(subdir, file)
                # 构建目标文件路径
                relative_path = os.path.relpath(subdir, source_folder)
                if relative_path != ".":
                    target_dir_path = os.path.join(target_folder, relative_path)
                else:
                    target_dir_path = target_folder
                # 如果目标目录不存在，则创建它
                if not os.path.exists(target_dir_path):
                    os.makedirs(target_dir_path)
                # 设置目标文件的完整路径，将扩展名改为.astc
                target_file_path = os.path.join(target_dir_path, file[:-4] + ".astc")

                # # 调用convert_astc函数进行转换
                # convert_astc(source_file_path, target_file_path)
                source_files.append(source_file_path)
                target_files.append(target_file_path)

    return source_files, target_files


def convert_astc(
    png_file_path, astc_file_path, block_size="4x4", quality="exhaustive", threads=8
):
    # astcenc 命令行参数
    command = [
        astcencPath,
        "-cl",  # 压缩模式
        png_file_path,  # 输入文件
        astc_file_path,  # 输出文件
        block_size,  # 块大小 (例如: "4x4", "6x6", "8x8")
        f"-{quality}",  # 质量等级 (例如: "fast", "medium", "thorough")
        "-j",
        f"{threads}",  # 并发进程数
        # "-silent"         # 静默模式，不打印日志
    ]
    print("cmd:", command)
    # 调用 astcenc 命令行工具
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # 检查命令是否成功执行
    if result.returncode != 0:
        print("Error: ASTC conversion failed.")
        print(result.stderr.decode())
    else:
        print(f"Conversion successful: {png_file_path} -> {astc_file_path}")


# python3 convert_astc.py /Users/hxjs/Desktop/hxjs/inner/arts/npc /Users/hxjs/Desktop/output/hxjs/inner/arts/npc
if __name__ == "__main__":
    if len(sys.argv) == 3:
        # 指定相对路径
        print("start convert png to astc")
        processCovertASTC(sys.argv[1], sys.argv[2], ".png")
        # convert_astc(sys.argv[1], sys.argv[2])
