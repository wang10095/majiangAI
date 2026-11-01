import subprocess
import os, sys
import platform

exifToolPath = "exiftool"


system_name = platform.system()

if system_name == "Windows":
    print("系统是Windows")
    currentPath = os.path.dirname(os.path.abspath(__file__))
    exifToolPath = os.path.join(currentPath, "../exif/", "exiftool.exe")
elif system_name == "Darwin":
    print("系统是macOS")
    exifToolPath = "exiftool"
elif system_name == "Linux":
    print("系统是Linux, 用不了")
    exifToolPath = ""
else:
    print(f"未知系统: {system_name}")

def remove_metadata(input_path):
    command = [exifToolPath, '-all=', '-overwrite_original', input_path]
    try:
        # 执行命令
        subprocess.run(command, check=True)
        print(f"Remove metadata successful: {input_path}")
    except Exception as e:
        print(f"Remove metadata failed: {input_path}")
        print(e)

def process_files_exif(folder_path):
    if not os.path.exists(folder_path):
        return
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            if file.lower().endswith((".jpg", ".png", ".jpeg", ".bmp", ".gif")):
                remove_metadata(file_path)

if __name__ == "__main__":
    # remove_metadata("C:/Users/WorkStation 10/Documents/axts1.png")
    process_files_exif("F:/Projects/cocos/client_project/assets")