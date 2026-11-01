import os
import gzip


def xor_decrypt(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            with open(file_path, "rb") as file:
                encrypted_data = file.read()
                if encrypted_data[0:6] == b"lyqszp":
                    decrypt_data = bytes([byte ^ 0x70 for byte in encrypted_data])
                    with open(file_path, "wb") as file:
                        file.write(decrypt_data[6:])
                        print("正在解密文件", file.name)
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith("pkm"):
                file_path = os.path.join(root, file)
                with open(file_path, "rb") as file:
                    decompress = gzip.decompress(file.read())
                with open(file_path, "wb") as file:
                    file.write(decompress)
                    print("正在解压文件", file.name)


if __name__ == "__main__":
    path = r"/Users/hxjs/Downloads/jwdzg25165001/assets/res/raw-assets"
    xor_decrypt(path)
