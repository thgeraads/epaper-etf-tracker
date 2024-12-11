import requests
from PIL import Image

# Configuration
mac = "78F6035637807501"   # Destination MAC address
dither = 0                 # Set dither to 1 if you're sending photos etc
apip = "192.168.68.109"   # IP address of your access point

# Path to the image you want to upload
image_path = "chart.png"  # Replace with your image's path

# Load the image from disk
image = Image.open(image_path)

# Ensure the image is in RGB mode
rgb_image = image.convert('RGB')

# Save the image as JPEG to ensure compatibility with the upload process
converted_image_path = "converted_image.jpg"
rgb_image.save(converted_image_path, 'JPEG', quality="maximum")

# Prepare the HTTP POST request
url = "http://" + apip + "/imgupload"
payload = {"dither": dither, "mac": mac}  # Additional POST parameters
files = {"file": open(converted_image_path, "rb")}  # File to be uploaded

# Send the HTTP POST request
response = requests.post(url, data=payload, files=files)

# Check the response status
if response.status_code == 200:
    print("Image uploaded successfully!")
else:
    print(f"Failed to upload the image. Status code: {response.status_code}, Response: {response.text}")
