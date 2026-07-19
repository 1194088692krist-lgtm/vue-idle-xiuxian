import urllib.parse, urllib.request, os

prompt = ("Chinese cultivation xiuxian mobile game app icon, "
          "dark navy background, glowing golden ornate border, "
          "mystical mountain and cloud silhouette, "
          "elegant golden chinese characters, "
          "premium high contrast app icon, centered composition, no text")
url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=" + urllib.parse.quote(prompt) + "&image_size=square_hd"
urllib.request.urlretrieve(url, "public/icon-source.jpg")
print("Downloaded:", os.path.getsize("public/icon-source.jpg"), "bytes")
