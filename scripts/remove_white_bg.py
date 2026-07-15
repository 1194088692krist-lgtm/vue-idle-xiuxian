from PIL import Image
import os
from collections import deque

def is_white(r, g, b, tolerance=20):
    return r > 255 - tolerance and g > 255 - tolerance and b > 255 - tolerance

def flood_fill_remove_white_bg(input_path, output_path, tolerance=20):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    data = list(img.getdata())
    pixels = [data[y * width + x] for y in range(height) for x in range(width)]
    
    visited = [[False for _ in range(width)] for _ in range(height)]
    queue = deque()
    
    for x in range(width):
        r, g, b, a = pixels[0 * width + x]
        if is_white(r, g, b, tolerance):
            queue.append((x, 0))
        r, g, b, a = pixels[(height - 1) * width + x]
        if is_white(r, g, b, tolerance):
            queue.append((x, height - 1))
    
    for y in range(height):
        r, g, b, a = pixels[y * width + 0]
        if is_white(r, g, b, tolerance):
            queue.append((0, y))
        r, g, b, a = pixels[y * width + (width - 1)]
        if is_white(r, g, b, tolerance):
            queue.append((width - 1, y))
    
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        if visited[y][x]:
            continue
        
        idx = y * width + x
        r, g, b, a = pixels[idx]
        
        if is_white(r, g, b, tolerance):
            visited[y][x] = True
            pixels[idx] = (r, g, b, 0)
            
            for dx, dy in directions:
                queue.append((x + dx, y + dy))
    
    new_data = []
    for y in range(height):
        for x in range(width):
            new_data.append(pixels[y * width + x])
    
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    icons_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "assets", "icons")
    
    if not os.path.exists(icons_dir):
        print(f"目录不存在: {icons_dir}")
        exit(1)
    
    png_files = [f for f in os.listdir(icons_dir) if f.endswith(".png")]
    
    print(f"找到 {len(png_files)} 个PNG图标文件")
    
    for png_file in png_files:
        input_path = os.path.join(icons_dir, png_file)
        output_path = input_path
        
        try:
            flood_fill_remove_white_bg(input_path, output_path)
            print(f"处理完成: {png_file}")
        except Exception as e:
            print(f"处理失败 {png_file}: {e}")
    
    print("所有图标处理完成！")
