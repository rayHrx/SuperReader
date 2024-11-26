import requests
import os

def upload_file_to_gcp(file_path, upload_url):
    # Check if file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Open file in binary mode
    with open(file_path, 'rb') as file:
        # Prepare headers
        headers = {
            'Content-Type': 'application/pdf'  # Since it's a PDF file
        }
        
        # Upload file using PUT request
        response = requests.put(upload_url, data=file, headers=headers)
        
        # Check if upload was successful
        if response.status_code == 200:
            print("File uploaded successfully!")
            return True
        else:
            print(f"Upload failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False

# File path and upload URL
file_path = "/Users/linsun/Downloads/system_design.pdf"
upload_url = "https://storage.googleapis.com/superreader-book-bucket/7aaa2562-0079-45a2-82da-c932ef18160b?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=api-519%40superreader-442520.iam.gserviceaccount.com%2F20241126%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20241126T033157Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=3f3c31f467f5c0b2e1de651a7115916df05991d21f7f986b9318f3725d0410cd29513733c8ab74a3da3fd08091802b0570ecd848d1c04d1d1821cf65fc126070ab8b5ed8117697d30780c9f4c439d424d46dab64a439109f7fba6485326852d625e593fdfda22937e84f8ee7fdf116baced4e7fd14544338cad1e969ae3be2c66589b75627f3a820b8881aecca2682e7164ee48a0186c1331d54a53175d9a7e67118d3fdb0eef3e6df695eac9b4d642672b3192d276f899e0f22a98e1dfd6e8bd45930687e7cad43e7958d02b6b83b04691109230c2b304195838472f56fc8acefa396df6e891ba01108cbd47f5737f1f92ba07678e0a1805d83f96aa94cdfd6"

# Upload the file
try:
    upload_file_to_gcp(file_path, upload_url)
except Exception as e:
    print(f"An error occurred: {str(e)}")