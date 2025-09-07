from PIL import Image

# 512x512 完全透明PNGを生成
img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
img.save("plain.png")
print("plain.png を生成しました")